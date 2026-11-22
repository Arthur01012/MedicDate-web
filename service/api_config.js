/**
 * Configuración centralizada de APIs web y manejo de sesión para MedicDate Web.
 * Las APIs externas viven en: medicDateApis/apisWeb/
 * Ruta desplegada de referencia (ver apisWeb/config/conexion.php):
 *   https://medicdate.innego.net/web/apis/medicdate
 */
(function (global) {
  'use strict';

  const DEFAULT_API_BASE = 'https://medicdate.innego.net/web/apis/medicdate';

  // Usuarios de prueba predeterminados (ver Credenciales_Prueba_MedicDate.md)
  // Se usan solo como respaldo de desarrollo cuando todavía no hay sesión guardada desde login.
  const SESION_DEV_POR_ROL = {
    asistente: {
      id_usuario: 4,
      id_empleado: 3,
      nombre: 'Luna Aurora Reyes Morales',
      correo: 'luna.reyes.asistente@example.test',
      rol: 'asistente'
    },
    medico: {
      id_usuario: 2,
      id_empleado: 1,
      nombre: 'Dr. José Manuel Rodríguez López',
      correo: 'jose.rodriguez.doc@example.test',
      rol: 'medico'
    }
  };

  function obtenerApiBase() {
    if (global.MEDICDATE_API_BASE) {
      return String(global.MEDICDATE_API_BASE).replace(/\/+$/, '');
    }
    try {
      const guardada = localStorage.getItem('medicdate_api_base');
      if (guardada && guardada.trim() !== '') {
        return guardada.trim().replace(/\/+$/, '');
      }
    } catch (_) {
      // Ignorar si el almacenamiento está restringido
    }
    return DEFAULT_API_BASE;
  }

  function obtenerSesion(rolEsperado) {
    let sesion = null;
    try {
      const raw = sessionStorage.getItem('usuario') || localStorage.getItem('usuario');
      if (raw) {
        sesion = JSON.parse(raw);
      }
    } catch (_) {
      sesion = null;
    }

    if (sesion && typeof sesion === 'object') {
      const rol = String(sesion.rol || '').toLowerCase();
      if (!rolEsperado || rol === rolEsperado || (rolEsperado === 'asistente' && rol === 'administrador')) {
        return {
          id_usuario: sesion.id_usuario || (SESION_DEV_POR_ROL[rolEsperado]?.id_usuario ?? null),
          id_empleado: sesion.id_empleado || sesion.medicoId || (SESION_DEV_POR_ROL[rolEsperado]?.id_empleado ?? null),
          id_sesion: sesion.id_sesion || null,
          token: sesion.token || null,
          nombre: sesion.nombre || SESION_DEV_POR_ROL[rolEsperado]?.nombre || 'Usuario',
          correo: sesion.correo || '',
          rol: rol || rolEsperado || ''
        };
      }
    }

    if (rolEsperado && SESION_DEV_POR_ROL[rolEsperado]) {
      return { ...SESION_DEV_POR_ROL[rolEsperado], esRespaldoDev: true };
    }
    return null;
  }

  function cerrarSesion() {
    try {
      sessionStorage.removeItem('usuario');
      localStorage.removeItem('usuario');
    } catch (_) {
      // Ignorar
    }
    global.location.href = '../../../index.html';
  }

  function construirQuery(params) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([clave, valor]) => {
      if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
        qs.set(clave, String(valor).trim());
      }
    });
    const texto = qs.toString();
    return texto ? '?' + texto : '';
  }

  async function peticionApi(rutaRelativa, opciones = {}) {
    const {
      metodo = 'GET',
      params = {},
      cuerpo = null,
      sesion = null
    } = opciones;

    const base = obtenerApiBase();
    const ruta = String(rutaRelativa).replace(/^\/+/, '');
    const paramsConAuth = { ...params };

    const headers = {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };

    if (sesion) {
      if (sesion.token) {
        headers['Authorization'] = 'Bearer ' + sesion.token;
        headers['X-Session-Token'] = sesion.token;
      } else if (sesion.id_sesion) {
        paramsConAuth.id_sesion = sesion.id_sesion;
      } else if (sesion.id_usuario) {
        paramsConAuth.id_usuario = sesion.id_usuario;
      }
      if (sesion.rol === 'medico' && sesion.id_empleado) {
        paramsConAuth.id_empleado = sesion.id_empleado;
      }
    }

    let url = `${base}/${ruta}`;
    const fetchOpts = {
      method: metodo,
      headers,
      cache: 'no-store'
    };

    if (metodo === 'GET') {
      url += construirQuery(paramsConAuth);
    } else {
      headers['Content-Type'] = 'application/json; charset=UTF-8';
      const payload = { ...paramsConAuth, ...(cuerpo || {}) };
      fetchOpts.body = JSON.stringify(payload);
    }

    const respuesta = await fetch(url, fetchOpts);
    const texto = await respuesta.text();
    let json = null;

    try {
      json = texto ? JSON.parse(texto) : {};
    } catch (_) {
      throw new Error('La API devolvió una respuesta inválida.');
    }

    if (!respuesta.ok || (json && json.exito === false)) {
      const err = new Error((json && json.mensaje) || `Error HTTP ${respuesta.status}`);
      err.status = respuesta.status;
      err.codigo = json && json.codigo ? json.codigo : 'ERROR_API';
      err.datos = json;
      throw err;
    }

    return json;
  }

  global.MedicDateApi = {
    obtenerApiBase,
    obtenerSesion,
    cerrarSesion,
    peticionApi
  };
})(window);
