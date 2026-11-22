/**
 * Configuración centralizada de APIs web conectada directamente a:
 *   https://medicdate.innego.net/web/apis/medicdate
 * Usa las credenciales reales de la base de datos (ver Credenciales_Prueba_MedicDate.md).
 */
(function (global) {
  'use strict';

  const DEFAULT_API_BASE = 'https://medicdate.innego.net/web/apis/medicdate';

  

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
      // Ignorar
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
      const correo = String(sesion.correo || '').toLowerCase();
      if (correo === 'elena.cruz@centromedico.com' || correo === 'luna.reyes.asistente@example.test') {
        sesion = { ...CUENTAS_BD.asistente };
      } else if (correo === 'jose.rodriguez@centromedico.com' || correo === 'jose.rodriguez.doc@example.test') {
        sesion = { ...CUENTAS_BD.medico1 };
      } else if (correo === 'sofia.flores.doc@medicdate.com') {
        sesion = { ...CUENTAS_BD.medico2 };
      }

      const rol = String(sesion.rol || '').toLowerCase();
      if (!rolEsperado || rol === rolEsperado || (rolEsperado === 'asistente' && rol === 'administrador')) {
        const base = rol === 'medico'
          ? (Number(sesion.id_usuario) === 3 ? CUENTAS_BD.medico2 : CUENTAS_BD.medico1)
          : CUENTAS_BD.asistente;
        return {
          ...base,
          ...sesion,
          id_usuario: Number(sesion.id_usuario) || base.id_usuario,
          id_empleado: base.id_empleado,
          nombre: sesion.nombre || base.nombre,
          correo: sesion.correo || base.correo,
          rol: rol || rolEsperado
        };
      }
    }

    const predeterminada = rolEsperado === 'medico' ? CUENTAS_BD.medico1 : CUENTAS_BD.asistente;
    try {
      sessionStorage.setItem('usuario', JSON.stringify(predeterminada));
    } catch (_) {
      // Ignorar
    }
    return { ...predeterminada };
  }

  function activarCuentaDemo(claveCuenta) {
    const cuenta = CUENTAS_BD[claveCuenta];
    if (!cuenta) return null;
    try {
      sessionStorage.setItem('usuario', JSON.stringify(cuenta));
      localStorage.setItem('usuario', JSON.stringify(cuenta));
    } catch (_) {
      // Ignorar
    }
    return { ...cuenta };
  }

  function cerrarSesion() {
    try {
      sessionStorage.removeItem('usuario');
      localStorage.removeItem('usuario');
    } catch (_) {
      // Ignorar
    }
    global.location.href = '../../../login.html';
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

    // Importante: no enviar encabezados personalizados en GET (como Cache-Control)
    // para evitar que el navegador bloquee la petición por preflight CORS.
    const headers = {
      'Accept': 'application/json'
    };

    if (sesion) {
      if (sesion.token) {
        headers['Authorization'] = 'Bearer ' + sesion.token;
      }
      if (sesion.id_sesion) {
        paramsConAuth.id_sesion = sesion.id_sesion;
      }
      if (sesion.id_usuario) {
        paramsConAuth.id_usuario = sesion.id_usuario;
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
      fetchOpts.body = JSON.stringify({ ...paramsConAuth, ...(cuerpo || {}) });
    }

    const respuesta = await fetch(url, fetchOpts);
    const texto = await respuesta.text();
    let json = null;

    try {
      json = texto ? JSON.parse(texto) : {};
    } catch (_) {
      throw new Error('La API devolvió una respuesta inválida desde ' + url);
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
    CUENTAS_BD,
    obtenerApiBase,
    obtenerSesion,
    activarCuentaDemo,
    cerrarSesion,
    peticionApi
  };
})(window);
