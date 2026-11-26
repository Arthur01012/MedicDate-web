/**
 * Configuración centralizada de APIs web conectada directamente a:
 *   https://medicdate.innego.net/web/apis/medicdate
 * Sin credenciales almacenadas en el cliente; toda la información del perfil,
 * agenda y pacientes proviene en tiempo real de la API y la base de datos.
 */
(function (global) {
  'use strict';

  const DEFAULT_API_BASE = 'https://medicdate.innego.net/web/apis/medicdate';
  const CLAVE_SESION = 'usuario';

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

  function normalizarSesion(datos) {
    if (!datos || typeof datos !== 'object') {
      return null;
    }

    const origenUsuario = (datos.usuario && typeof datos.usuario === 'object')
      ? datos.usuario
      : datos;
    const origenSesion = (datos.sesion && typeof datos.sesion === 'object')
      ? datos.sesion
      : {};

    const idUsuario = Number(origenUsuario.id_usuario ?? datos.id_usuario);
    const rolCrudo = origenUsuario.rol ?? datos.rol ??
      (Array.isArray(origenUsuario.roles) ? origenUsuario.roles[0] : (Array.isArray(datos.roles) ? datos.roles[0] : ''));
    const rol = String(rolCrudo || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!Number.isInteger(idUsuario) || idUsuario <= 0 || !rol) {
      return null;
    }

    const idEmpleadoRaw = origenUsuario.id_empleado ?? datos.id_empleado;
    const idEmpleado = idEmpleadoRaw !== null && idEmpleadoRaw !== undefined && idEmpleadoRaw !== ''
      ? Number(idEmpleadoRaw)
      : null;

    return {
      id_usuario: idUsuario,
      id_empleado: Number.isInteger(idEmpleado) && idEmpleado > 0 ? idEmpleado : null,
      id_sesion: origenUsuario.id_sesion || origenSesion.id_sesion || datos.id_sesion || null,
      token: origenUsuario.token || origenSesion.token || datos.token || null,
      nombre: String(origenUsuario.nombre ?? datos.nombre ?? '').trim(),
      correo: String(origenUsuario.correo ?? datos.correo ?? '').trim().toLowerCase(),
      rol
    };
  }

  function guardarSesion(datos) {
    const sesionNormalizada = normalizarSesion(datos);
    if (!sesionNormalizada) {
      const err = new Error('Los datos de sesión recibidos no son válidos.');
      err.codigo = 'SESION_INVALIDA';
      throw err;
    }

    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesionNormalizada));
    } catch (_) {
      const err = new Error('No se pudo guardar la sesión en el navegador.');
      err.codigo = 'ERROR_ALMACENAMIENTO';
      throw err;
    }

    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch (_) {
      // Ignorar si localStorage no está disponible
    }

    const verificada = obtenerSesion();
    if (!verificada || verificada.id_usuario !== sesionNormalizada.id_usuario || verificada.rol !== sesionNormalizada.rol) {
      const err = new Error('No se pudo verificar la sesión guardada.');
      err.codigo = 'ERROR_ALMACENAMIENTO';
      throw err;
    }

    perfilActual = { ...verificada };
    return verificada;
  }

  function obtenerSesion(rolEsperado) {
    // Leer sesión activa desde sessionStorage o localStorage si existe
    let raw = null;
    try {
      raw = sessionStorage.getItem(CLAVE_SESION);
    } catch (_) {
      raw = null;
    }

    if (!raw) {
      try {
        raw = localStorage.getItem(CLAVE_SESION);
      } catch (_) {
        raw = null;
      }
    }

    if (!raw) {
      return null;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      return null;
    }

    const sesion = normalizarSesion(parsed);
    if (!sesion) {
      return null;
    }

    if (rolEsperado) {
      const rolRequerido = String(rolEsperado).trim().toLowerCase();
      const rolValido = sesion.rol === rolRequerido ||
        (rolRequerido === 'asistente' && sesion.rol === 'administrador');
      if (!rolValido) {
        return null;
      }
    }

    return sesion;
  }

  function registrarPerfilCargado(datosPerfil) {
    if (datosPerfil && typeof datosPerfil === 'object') {
      perfilActual = { ...perfilActual, ...datosPerfil };
    }
  }

  function obtenerPerfilCargado() {
    return perfilActual;
  }

  function limpiarSesion() {
    perfilActual = null;
    try {
      sessionStorage.removeItem(CLAVE_SESION);
    } catch (_) {
      // Ignorar
    }
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch (_) {
      // Ignorar
    }
  }

  function cerrarSesion(rutaLogin = '../../../login.php') {
    limpiarSesion();
    global.location.href = rutaLogin;
  }

  function construirQuery(params) {
    const qs = new URLSearchParams();
    const entradas = Object.entries(params || {});
    for (let i = 0; i < entradas.length; i++) {
      const clave = entradas[i][0];
      const valor = entradas[i][1];
      if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
        qs.set(clave, String(valor).trim());
      }
    }
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
    guardarSesion,
    obtenerSesion,
    registrarPerfilCargado,
    obtenerPerfilCargado,
    limpiarSesion,
    cerrarSesion,
    peticionApi
  };
})(window);
