/**
 * Servicio del perfil Médico
 * Consume:
 *  - apisWeb/priv_doc/resumen.php
 *  - apisWeb/priv_doc/cargar_agenda_doc.php
 *  - apisWeb/priv_doc/notas_cita.php
 *  - apisWeb/priv_doc/cargar_pacientes.php
 */
(function (global) {
  'use strict';

  function sesionMedico() {
    return global.MedicDateApi.obtenerSesion('medico');
  }

  async function obtenerResumenMedico() {
    return global.MedicDateApi.peticionApi('priv_doc/resumen.php', {
      metodo: 'GET',
      sesion: sesionMedico()
    });
  }

  async function obtenerAgendaMedico(filtros = {}) {
    return global.MedicDateApi.peticionApi('priv_doc/cargar_agenda_doc.php', {
      metodo: 'GET',
      sesion: sesionMedico(),
      params: {
        lapso: filtros.lapso || 'hoy',
        fecha: filtros.fecha || '',
        estado: filtros.estado || ''
      }
    });
  }

  async function obtenerDetalleCitaMedico(idCita) {
    return global.MedicDateApi.peticionApi('priv_doc/cargar_agenda_doc.php', {
      metodo: 'GET',
      sesion: sesionMedico(),
      params: { id_cita: idCita }
    });
  }

  async function guardarNotasCita(idCita, notasInternas, marcarAtendida = false) {
    return global.MedicDateApi.peticionApi('priv_doc/notas_cita.php', {
      metodo: 'POST',
      sesion: sesionMedico(),
      cuerpo: {
        id_cita: idCita,
        notas_internas: notasInternas,
        marcar_atendida: Boolean(marcarAtendida)
      }
    });
  }

  async function obtenerMisPacientes(busqueda = '') {
    return global.MedicDateApi.peticionApi('priv_doc/cargar_pacientes.php', {
      metodo: 'GET',
      sesion: sesionMedico(),
      params: { busqueda }
    });
  }

  async function obtenerHistorialPacienteMedico(idPaciente) {
    return global.MedicDateApi.peticionApi('priv_doc/cargar_pacientes.php', {
      metodo: 'GET',
      sesion: sesionMedico(),
      params: { id_paciente: idPaciente }
    });
  }

  async function actualizarExpedientePaciente(idPaciente, alergias, notasMedicas) {
    return global.MedicDateApi.peticionApi('priv_doc/cargar_pacientes.php', {
      metodo: 'POST',
      sesion: sesionMedico(),
      cuerpo: {
        id_paciente: idPaciente,
        alergias,
        notas_medicas: notasMedicas
      }
    });
  }

  global.DoctorService = {
    obtenerResumenMedico,
    obtenerAgendaMedico,
    obtenerDetalleCitaMedico,
    guardarNotasCita,
    obtenerMisPacientes,
    obtenerHistorialPacienteMedico,
    actualizarExpedientePaciente
  };
})(window);
