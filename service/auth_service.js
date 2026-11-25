/**
 * Servicio de acceso del personal
 * Consume:
 * auth/login.php
 */
(function (global) {
  'use strict';

  async function iniciarSesion(correo, clave) {
    const respuesta = await global.MedicDateApi.peticionApi('auth/login.php', {
      metodo: 'POST',
      cuerpo: { correo, clave }
    });

    const sesion = global.MedicDateApi.guardarSesion(respuesta);
    return {
      ...respuesta,
      sesion,
      usuario: respuesta.usuario ? { ...respuesta.usuario, ...sesion } : sesion
    };
  }

  global.AuthService = {
    iniciarSesion
  };
})(window);
