/**
 * Servicio del perfil Asistente (SOLO LECTURA)
 * Consume:
 *  - apisWeb/apis_asist/agenda_general.php
 *  - apisWeb/apis_asist/ficha_pacientes.php
 */
(function (global) {
  'use strict';

  function sesionAsistente() {
    const sesion = global.MedicDateApi.obtenerSesion('asistente');
    if (!sesion) {
      const err = new Error('No hay una sesión activa válida para el perfil de asistente.');
      err.codigo = 'SESION_REQUERIDA';
      throw err;
    }
    return sesion;
  }

  async function obtenerAgendaGeneral(filtros = {}) {
    return global.MedicDateApi.peticionApi('apis_asist/agenda_general.php', {
      metodo: 'GET',
      sesion: sesionAsistente(),
      params: {
        fecha: filtros.fecha || '',
        id_medico: filtros.id_medico || '',
        estado: filtros.estado || '',
        lapso: filtros.lapso || ''
      }
    });
  }

  async function obtenerDetalleCitaAsistente(idCita) {
    return global.MedicDateApi.peticionApi('apis_asist/agenda_general.php', {
      metodo: 'GET',
      sesion: sesionAsistente(),
      params: { id_cita: idCita }
    });
  }

  async function obtenerPacientesAsistente(busqueda = '') {
    return global.MedicDateApi.peticionApi('apis_asist/ficha_pacientes.php', {
      metodo: 'GET',
      sesion: sesionAsistente(),
      params: { busqueda }
    });
  }

  async function obtenerFichaPacienteAsistente(idPaciente) {
    return global.MedicDateApi.peticionApi('apis_asist/ficha_pacientes.php', {
      metodo: 'GET',
      sesion: sesionAsistente(),
      params: { id_paciente: idPaciente }
    });
  }

  global.AsistenteService = {
    obtenerAgendaGeneral,
    obtenerDetalleCitaAsistente,
    obtenerPacientesAsistente,
    obtenerFichaPacienteAsistente
  };
})(window);
