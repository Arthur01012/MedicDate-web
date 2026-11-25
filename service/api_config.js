/**
 * Configuración centralizada de APIs web conectada directamente a:
 *   https://medicdate.innego.net/web/apis/medicdate
 * Sin credenciales almacenadas en el cliente; toda la información del perfil,
 * agenda y pacientes proviene en tiempo real de la API y la base de datos.
 */
(function (global) {
  'use strict';

  const DEFAULT_API_BASE = 'https://medicdate.innego.net/web/apis/medicdate';

  // IDs de rol por defecto en la BD cuando se accede sin sesión previa iniciada
  const ID_USUARIO_POR_ROL = {
    administrador: 1,
    medico: 2,
    asistente: 4
  };

  let perfilActual = null;

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
    // Leer sesión activa de sessionStorage o localStorage si existe
    let sesion = null;
    try {
      const raw = sessionStorage.getItem('usuario') || localStorage.getItem('usuario');
      if (raw) {
        sesion = JSON.parse(raw);
      }
    } catch (_) {
      sesion = null;
    }

    const idPorDefecto = ID_USUARIO_POR_ROL[rolEsperado] || ID_USUARIO_POR_ROL.asistente;

    if (sesion && typeof sesion === 'object') {
      const rol = String(sesion.rol || '').toLowerCase();
      if (!rolEsperado || rol === rolEsperado || (rolEsperado === 'asistente' && rol === 'administrador')) {
        return {
          id_usuario: Number(sesion.id_usuario) || idPorDefecto,
          id_empleado: sesion.id_empleado ? Number(sesion.id_empleado) : null,
          id_sesion: sesion.id_sesion || null,
          token: sesion.token || null,
          nombre: sesion.nombre || '',
          correo: sesion.correo || '',
          rol: rol || rolEsperado || ''
        };
      }
    }

    // Sin credenciales guardadas: enviar únicamente el id_usuario del rol para que la API cargue de la BD
    return {
      id_usuario: idPorDefecto,
      rol: rolEsperado || ''
    };
  }

  function registrarPerfilCargado(datosPerfil) {
    if (datosPerfil && typeof datosPerfil === 'object') {
      perfilActual = { ...perfilActual, ...datosPerfil };
    }
  }

  function obtenerPerfilCargado() {
    return perfilActual;
  }

  function cerrarSesion() {
    try {
      sessionStorage.removeItem('usuario');
      localStorage.removeItem('usuario');
    } catch (_) {
      // Ignorar
    }
    global.location.href = '../../../login.php';
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
      if (sesion.correo) {
        paramsConAuth.correo_acceso = sesion.correo;
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

    if (json && (json.usuario || json.medico)) {
      registrarPerfilCargado(json.usuario || json.medico);
    }

    return json;
  }

  global.MedicDateApi = {
    obtenerApiBase,
    obtenerSesion,
    registrarPerfilCargado,
    obtenerPerfilCargado,
    cerrarSesion,
    peticionApi
  };
})(window);
