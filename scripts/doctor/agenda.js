/**
 * Controlador de la vista: Mi agenda del médico
 * Archivo HTML: pages/private/doctor/mi_agenda.html
 */
(function inicializarDoctorAgenda() {
  'use strict';

  const UI = window.MedicDateUI;
  const Filtros = window.MedicDateFiltros;
  const Service = window.DoctorService;

  let estadoFiltros = Filtros.limpiarFiltros('doctor_agenda');
  let modalCitaCtrl = null;
  let citaActivaId = null;
  let esCargaInicial = true;
  let solicitudAgendaId = 0;
  let selEstado = null;

  function actualizarBotonesLapso() {
    const botones = document.querySelectorAll('[data-lapso]');
    for (let i = 0; i < botones.length; i++) {
      const activo = botones[i].dataset.lapso === estadoFiltros.lapso;
      botones[i].classList.toggle('on', activo);
    }
  }

  function renderTabla(citas) {
    const tbody = document.getElementById('tbodyMiAgenda');
    const vacio = document.getElementById('estadoVacio');

    if (!citas || citas.length === 0) {
      tbody.innerHTML = '';
      vacio.textContent = 'No hay citas con esos filtros.';
      vacio.classList.remove('oculto');
      return;
    }

    vacio.classList.add('oculto');
    let html = '';
    for (let i = 0; i < citas.length; i++) {
      const c = citas[i];
      html += `
      <tr>
        <td>${UI.fechaCorta(c.fecha)}</td>
        <td>${UI.esc(c.hora)}</td>
        <td><b>${UI.esc(c.paciente)}</b></td>
        <td>${UI.esc(c.motivo)}</td>
        <td>${UI.badgeEstado(c.estado, c.estado_etiqueta)}</td>
        <td class="acc">
          <button type="button" class="btn btn-o btn-s" data-abrir-cita="${c.id_cita}">Abrir</button>
        </td>
      </tr>
    `;
    }
    tbody.innerHTML = html;
  }

  async function cargarAgenda() {
    const idActual = ++solicitudAgendaId;
    actualizarBotonesLapso();
    try {
      let data = await Service.obtenerAgendaMedico(estadoFiltros);
      if (idActual !== solicitudAgendaId) return;

      // Si en la primera carga el día de hoy no tiene citas en la BD, mostrar "Próximos 7 días"
      if (esCargaInicial) {
        esCargaInicial = false;
        if (estadoFiltros.lapso === 'hoy' && (!data.citas || data.citas.length === 0)) {
          estadoFiltros.lapso = 'semana';
          actualizarBotonesLapso();
          data = await Service.obtenerAgendaMedico(estadoFiltros);
          if (idActual !== solicitudAgendaId) return;
        }
      }

      if (data.medico && data.medico.nombre) {
        document.getElementById('topbarUsuario').textContent = `${data.medico.nombre} · Médico`;
        document.getElementById('topbarAvatar').textContent = UI.iniciales(data.medico.nombre);
      }
      renderTabla(data.citas || []);
    } catch (error) {
      if (idActual !== solicitudAgendaId) return;
      esCargaInicial = false;
      if (UI.manejarErrorApi(error, 'No se pudo cargar tu agenda.')) return;
      const tbody = document.getElementById('tbodyMiAgenda');
      const vacio = document.getElementById('estadoVacio');
      if (tbody) tbody.innerHTML = '';
      if (vacio) {
        vacio.textContent = error.message || 'No se pudo cargar tu agenda.';
        vacio.classList.remove('oculto');
      }
    }
  }

  async function abrirModalCita(idCita) {
    try {
      const data = await Service.obtenerDetalleCitaMedico(idCita);
      const c = data.cita;
      if (!c) return;
      citaActivaId = c.id_cita;

      document.getElementById('modalCitaTitulo').textContent = `Cita de ${(c.paciente && c.paciente.nombre) || ''}`;
      document.getElementById('mcFechaHora').textContent = `${UI.fechaLarga(c.fecha)}, ${c.hora}`;
      document.getElementById('mcPaciente').textContent = c.paciente && c.paciente.edad != null
        ? `${c.paciente.nombre} · ${c.paciente.edad} años`
        : ((c.paciente && c.paciente.nombre) || '—');
      document.getElementById('mcTelefono').textContent = (c.paciente && c.paciente.telefono) || '—';
      document.getElementById('mcMotivo').textContent = c.motivo || '—';
      document.getElementById('mcEstado').innerHTML = UI.badgeEstado(c.estado, c.estado_etiqueta);

      const camposAsistente = document.querySelectorAll('#modalCita .solo-asistente');
      for (let i = 0; i < camposAsistente.length; i++) {
        camposAsistente[i].classList.add('oculto');
      }

      document.getElementById('mcSeccionDoctor').classList.remove('oculto');
      document.getElementById('btnCerrarModalCita').className = 'btn btn-o';

      const txtNotas = document.getElementById('mcNotas');
      txtNotas.value = c.notas_internas || '';
      txtNotas.disabled = !c.puede_editar_notas;

      const btnGuardar = document.getElementById('btnGuardarNotas');
      const btnAtender = document.getElementById('btnMarcarAtendida');
      const avisoFecha = document.getElementById('mcAvisoFecha');

      btnGuardar.classList.toggle('oculto', !c.puede_editar_notas);
      btnAtender.classList.toggle('oculto', !c.puede_marcar_atendida);

      const estClave = String(c.estado || c.estado_etiqueta || '').toLowerCase();
      const esProgramada = ['pendiente', 'confirmada', 'en_progreso', 'programada'].includes(estClave);
      avisoFecha.classList.toggle('oculto', !(esProgramada && !c.puede_marcar_atendida));

      modalCitaCtrl.backdrop.classList.add('on');
    } catch (error) {
      UI.manejarErrorApi(error, 'No se pudo cargar el detalle de la cita.');
    }
  }

  async function guardarCita(marcarAtendida) {
    if (!citaActivaId) return;
    const notas = document.getElementById('mcNotas').value.trim();
    const btnGuardar = document.getElementById('btnGuardarNotas');
    const btnAtender = document.getElementById('btnMarcarAtendida');

    if (btnGuardar) btnGuardar.disabled = true;
    if (btnAtender) btnAtender.disabled = true;

    try {
      const resp = await Service.guardarNotasCita(citaActivaId, notas, marcarAtendida);
      modalCitaCtrl.cerrar();
      UI.toast(resp.mensaje || (marcarAtendida ? 'Cita marcada como atendida.' : 'Notas guardadas.'));
      await cargarAgenda();
    } catch (error) {
      UI.manejarErrorApi(error, 'No se pudieron guardar los cambios.');
    } finally {
      if (btnGuardar) btnGuardar.disabled = false;
      if (btnAtender) btnAtender.disabled = false;
    }
  }

  function manejarClickLapso() {
    estadoFiltros.lapso = this.dataset.lapso;
    cargarAgenda();
  }

  function manejarCambioEstado() {
    estadoFiltros.estado = selEstado.value;
    cargarAgenda();
  }

  function manejarClickTablaAgenda(e) {
    const btn = e.target.closest('[data-abrir-cita]');
    if (btn) {
      abrirModalCita(Number(btn.dataset.abrirCita));
    }
  }

  function manejarGuardarNotas() {
    guardarCita(false);
  }

  function manejarMarcarAtendida() {
    guardarCita(true);
  }

  async function inicializarVista() {
    const sesion = await UI.inicializarLayoutPrivado({ rol: 'medico', navActivo: 'agenda' });
    if (!sesion) return;
    modalCitaCtrl = await UI.cargarModalCita();

    selEstado = document.getElementById('filtroEstadoDoc');

    const botonesLapso = document.querySelectorAll('[data-lapso]');
    for (let i = 0; i < botonesLapso.length; i++) {
      botonesLapso[i].addEventListener('click', manejarClickLapso);
    }

    selEstado.addEventListener('change', manejarCambioEstado);
    document.getElementById('tbodyMiAgenda').addEventListener('click', manejarClickTablaAgenda);
    document.getElementById('btnGuardarNotas').addEventListener('click', manejarGuardarNotas);
    document.getElementById('btnMarcarAtendida').addEventListener('click', manejarMarcarAtendida);

    await cargarAgenda();
  }

  document.addEventListener('DOMContentLoaded', inicializarVista);
})();
