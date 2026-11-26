/**
 * Controlador de la vista: Agenda general del asistente (SOLO LECTURA)
 * Archivo HTML: pages/private/asistente/agenda_general.html
 */
(function inicializarAsistenteAgenda() {
  'use strict';

  const UI = window.MedicDateUI;
  const Filtros = window.MedicDateFiltros;
  const Service = window.AsistenteService;

  let estadoFiltros = Filtros.limpiarFiltros('asistente_agenda');
  let modalCitaCtrl = null;
  let medicosCargados = false;
  let solicitudAgendaId = 0;
  let inpFecha = null;
  let selMedico = null;
  let selEstado = null;

  function renderResumen(resumen) {
    document.getElementById('kpiCitasHoy').textContent = resumen.citas_hoy ?? 0;
    document.getElementById('kpiProgramadas').textContent = resumen.programadas ?? 0;
    document.getElementById('kpiPacientes').textContent = resumen.pacientes ?? 0;
    document.getElementById('kpiMedicos').textContent = resumen.medicos ?? 0;
  }

  function poblarSelectMedicos(medicos) {
    if (medicosCargados) return;
    const select = document.getElementById('filtroMedico');
    if (!select) return;
    const valorActual = select.value;
    const lista = medicos || [];
    let opciones = '<option value="">Todos</option>';

    for (let i = 0; i < lista.length; i++) {
      const m = lista[i];
      opciones += `<option value="${m.id_empleado}">${UI.esc(m.nombre)}</option>`;
    }

    select.innerHTML = opciones;
    select.value = valorActual;
    medicosCargados = true;
  }

  function renderTablaCitas(citas) {
    const tbody = document.getElementById('tbodyCitas');
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
        <td>${UI.esc(c.paciente)}</td>
        <td>${UI.esc(c.medico)}</td>
        <td>${UI.esc(c.especialidad)}</td>
        <td>${UI.badgeEstado(c.estado, c.estado_etiqueta)}</td>
        <td class="acc">
          <button type="button" class="btn btn-o btn-s" data-ver-cita="${c.id_cita}">Ver</button>
        </td>
      </tr>
    `;
    }
    tbody.innerHTML = html;
  }

  async function cargarAgenda() {
    const idActual = ++solicitudAgendaId;
    try {
      const data = await Service.obtenerAgendaGeneral(estadoFiltros);
      if (idActual !== solicitudAgendaId) return;

      if (data.usuario && data.usuario.nombre) {
        document.getElementById('topbarUsuario').textContent = `${data.usuario.nombre} · Asistente`;
        document.getElementById('topbarAvatar').textContent = UI.iniciales(data.usuario.nombre);
      }
      renderResumen(data.resumen || {});
      poblarSelectMedicos(data.medicos || []);
      renderTablaCitas(data.citas || []);
    } catch (error) {
      if (idActual !== solicitudAgendaId) return;
      if (UI.manejarErrorApi(error, 'No se pudo cargar la agenda general.')) return;
      const tbody = document.getElementById('tbodyCitas');
      const vacio = document.getElementById('estadoVacio');
      if (tbody) tbody.innerHTML = '';
      if (vacio) {
        vacio.textContent = error.message || 'No se pudo cargar la agenda general.';
        vacio.classList.remove('oculto');
      }
    }
  }

  async function abrirDetalleCita(idCita) {
    try {
      const data = await Service.obtenerDetalleCitaAsistente(idCita);
      const c = data.cita;
      if (!c) return;

      document.getElementById('modalCitaTitulo').textContent = 'Detalle de la cita';
      document.getElementById('mcFechaHora').textContent = `${UI.fechaLarga(c.fecha)}, ${c.hora}`;
      document.getElementById('mcPaciente').textContent = (c.paciente && c.paciente.nombre) || '—';
      document.getElementById('mcTelefono').textContent = (c.paciente && c.paciente.telefono) || '—';
      document.getElementById('mcMedico').textContent = (c.medico && c.medico.nombre) || '—';
      document.getElementById('mcEspecialidad').textContent = c.especialidad || '—';
      document.getElementById('mcMotivo').textContent = c.motivo || '—';
      document.getElementById('mcEstado').innerHTML = UI.badgeEstado(c.estado, c.estado_etiqueta);

      const camposAsistente = document.querySelectorAll('#modalCita .solo-asistente');
      for (let i = 0; i < camposAsistente.length; i++) {
        camposAsistente[i].classList.remove('oculto');
      }

      document.getElementById('mcSeccionDoctor').classList.add('oculto');
      document.getElementById('btnCerrarModalCita').className = 'btn btn-p';
      document.getElementById('btnGuardarNotas').classList.add('oculto');
      document.getElementById('btnMarcarAtendida').classList.add('oculto');

      modalCitaCtrl.backdrop.classList.add('on');
    } catch (error) {
      UI.manejarErrorApi(error, 'No se pudo cargar el detalle de la cita.');
    }
  }

  function manejarCambioFecha() {
    estadoFiltros.fecha = inpFecha.value;
    cargarAgenda();
  }

  function manejarCambioMedico() {
    estadoFiltros.id_medico = selMedico.value;
    cargarAgenda();
  }

  function manejarCambioEstado() {
    estadoFiltros.estado = selEstado.value;
    cargarAgenda();
  }

  function manejarLimpiarFiltros() {
    estadoFiltros = Filtros.limpiarFiltros('asistente_agenda');
    inpFecha.value = '';
    selMedico.value = '';
    selEstado.value = '';
    cargarAgenda();
  }

  function manejarClickTablaCitas(e) {
    const btn = e.target.closest('[data-ver-cita]');
    if (btn) {
      abrirDetalleCita(Number(btn.dataset.verCita));
    }
  }

  async function inicializarVista() {
    const sesion = await UI.inicializarLayoutPrivado({ rol: 'asistente', navActivo: 'agenda' });
    if (!sesion) return;
    modalCitaCtrl = await UI.cargarModalCita();

    inpFecha = document.getElementById('filtroFecha');
    selMedico = document.getElementById('filtroMedico');
    selEstado = document.getElementById('filtroEstado');
    const btnLimpiar = document.getElementById('btnLimpiarFiltros');

    inpFecha.addEventListener('change', manejarCambioFecha);
    selMedico.addEventListener('change', manejarCambioMedico);
    selEstado.addEventListener('change', manejarCambioEstado);
    btnLimpiar.addEventListener('click', manejarLimpiarFiltros);
    document.getElementById('tbodyCitas').addEventListener('click', manejarClickTablaCitas);

    await cargarAgenda();
  }

  document.addEventListener('DOMContentLoaded', inicializarVista);
})();
