/**
 * Controlador de la vista: Agenda general del asistente (SOLO LECTURA)
 * Archivo HTML: pages/private/asistente/agenda_general.html
 */
(function () {
  'use strict';

  const UI = window.MedicDateUI;
  const Filtros = window.MedicDateFiltros;
  const Service = window.AsistenteService;

  let estadoFiltros = Filtros.limpiarFiltros('asistente_agenda');
  let modalCitaCtrl = null;
  let medicosCargados = false;

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
    select.innerHTML = '<option value="">Todos</option>' +
      (medicos || []).map((m) => `<option value="${m.id_empleado}">${UI.esc(m.nombre)}</option>`).join('');
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
    tbody.innerHTML = citas.map((c) => `
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
    `).join('');
  }

  async function cargarAgenda() {
    const data = await Service.obtenerAgendaGeneral(estadoFiltros);
    if (data.usuario && data.usuario.nombre) {
      document.getElementById('topbarUsuario').textContent = `${data.usuario.nombre} · Asistente`;
      document.getElementById('topbarAvatar').textContent = UI.iniciales(data.usuario.nombre);
    }
    renderResumen(data.resumen || {});
    poblarSelectMedicos(data.medicos || []);
    renderTablaCitas(data.citas || []);
  }

  async function abrirDetalleCita(idCita) {
    try {
      const data = await Service.obtenerDetalleCitaAsistente(idCita);
      const c = data.cita;
      if (!c) return;

      document.getElementById('modalCitaTitulo').textContent = 'Detalle de la cita';
      document.getElementById('mcFechaHora').textContent = `${UI.fechaLarga(c.fecha)}, ${c.hora}`;
      document.getElementById('mcPaciente').textContent = c.paciente?.nombre || '—';
      document.getElementById('mcTelefono').textContent = c.paciente?.telefono || '—';
      document.getElementById('mcMedico').textContent = c.medico?.nombre || '—';
      document.getElementById('mcEspecialidad').textContent = c.especialidad || '—';
      document.getElementById('mcMotivo').textContent = c.motivo || '—';
      document.getElementById('mcEstado').innerHTML = UI.badgeEstado(c.estado, c.estado_etiqueta);

      document.querySelectorAll('#modalCita .solo-asistente').forEach((el) => el.classList.remove('oculto'));
      document.getElementById('mcSeccionDoctor').classList.add('oculto');
      document.getElementById('btnCerrarModalCita').className = 'btn btn-p';
      document.getElementById('btnGuardarNotas').classList.add('oculto');
      document.getElementById('btnMarcarAtendida').classList.add('oculto');

      modalCitaCtrl.backdrop.classList.add('on');
    } catch (error) {
      UI.toast(error.message || 'No se pudo cargar el detalle de la cita.');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await UI.inicializarLayoutPrivado({ rol: 'asistente', navActivo: 'agenda' });
    modalCitaCtrl = await UI.cargarModalCita();

    const inpFecha = document.getElementById('filtroFecha');
    const selMedico = document.getElementById('filtroMedico');
    const selEstado = document.getElementById('filtroEstado');
    const btnLimpiar = document.getElementById('btnLimpiarFiltros');

    inpFecha.addEventListener('change', () => {
      estadoFiltros.fecha = inpFecha.value;
      cargarAgenda();
    });

    selMedico.addEventListener('change', () => {
      estadoFiltros.id_medico = selMedico.value;
      cargarAgenda();
    });

    selEstado.addEventListener('change', () => {
      estadoFiltros.estado = selEstado.value;
      cargarAgenda();
    });

    btnLimpiar.addEventListener('click', () => {
      estadoFiltros = Filtros.limpiarFiltros('asistente_agenda');
      inpFecha.value = '';
      selMedico.value = '';
      selEstado.value = '';
      cargarAgenda();
    });

    document.getElementById('tbodyCitas').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ver-cita]');
      if (btn) {
        abrirDetalleCita(Number(btn.dataset.verCita));
      }
    });

    await cargarAgenda();
  });
})();
