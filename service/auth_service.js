/**
 * Servicio de acceso del personal
 * Consume:
 * auth/login.php
 */
(function (global) {
  'use strict';

  async function iniciarSesion(correo, clave) {
    return global.MedicDateApi.peticionApi('auth/login.php', {
      metodo: 'POST',
      cuerpo: { correo, clave }
    });
  }

  global.AuthService = {
    iniciarSesion
  };
})(window);
