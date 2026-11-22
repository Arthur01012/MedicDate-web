/**
 * Controlador de la vista: Mi agenda del médico
 * Archivo HTML: pages/private/doctor/mi_agenda.html
 */
(function () {
  'use strict';

  const UI = window.MedicDateUI;
  const Filtros = window.MedicDateFiltros;
  const Service = window.DoctorService;

  let estadoFiltros = Filtros.limpiarFiltros('doctor_agenda');
  let modalCitaCtrl = null;
  let citaActivaId = null;

  function actualizarBotonesLapso() {
    document.querySelectorAll('[data-lapso]').forEach((btn) => {
      const activo = btn.dataset.lapso === estadoFiltros.lapso;
      btn.classList.toggle('on', activo);
    });
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
    tbody.innerHTML = citas.map((c) => `
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
    `).join('');
  }

  async function cargarAgenda() {
    actualizarBotonesLapso();
    const data = await Service.obtenerAgendaMedico(estadoFiltros);
    if (data.medico && data.medico.nombre) {
      document.getElementById('topbarUsuario').textContent = `${data.medico.nombre} · Médico`;
      document.getElementById('topbarAvatar').textContent = UI.iniciales(data.medico.nombre);
    }
    renderTabla(data.citas || []);
  }

  async function abrirModalCita(idCita) {
    try {
      const data = await Service.obtenerDetalleCitaMedico(idCita);
      const c = data.cita;
      if (!c) return;
      citaActivaId = c.id_cita;

      document.getElementById('modalCitaTitulo').textContent = `Cita de ${c.paciente?.nombre || ''}`;
      document.getElementById('mcFechaHora').textContent = `${UI.fechaLarga(c.fecha)}, ${c.hora}`;
      document.getElementById('mcPaciente').textContent = c.paciente?.edad != null
        ? `${c.paciente.nombre} · ${c.paciente.edad} años`
        : (c.paciente?.nombre || '—');
      document.getElementById('mcTelefono').textContent = c.paciente?.telefono || '—';
      document.getElementById('mcMotivo').textContent = c.motivo || '—';
      document.getElementById('mcEstado').innerHTML = UI.badgeEstado(c.estado, c.estado_etiqueta);

      document.querySelectorAll('#modalCita .solo-asistente').forEach((el) => el.classList.add('oculto'));
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

      const estEtiqueta = String(c.estado_etiqueta || c.estado || '');
      avisoFecha.classList.toggle('oculto', !(estEtiqueta === 'Programada' && !c.puede_marcar_atendida));

      modalCitaCtrl.backdrop.classList.add('on');
    } catch (error) {
      UI.toast(error.message || 'No se pudo cargar el detalle de la cita.');
    }
  }

  async function guardarCita(marcarAtendida) {
    if (!citaActivaId) return;
    const notas = document.getElementById('mcNotas').value.trim();

    try {
      const resp = await Service.guardarNotasCita(citaActivaId, notas, marcarAtendida);
      modalCitaCtrl.cerrar();
      UI.toast(resp.mensaje || (marcarAtendida ? 'Cita marcada como atendida.' : 'Notas guardadas.'));
      await cargarAgenda();
    } catch (error) {
      UI.toast(error.message || 'No se pudieron guardar los cambios.');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await UI.inicializarLayoutPrivado({ rol: 'medico', navActivo: 'agenda' });
    modalCitaCtrl = await UI.cargarModalCita();

    const selEstado = document.getElementById('filtroEstadoDoc');

    document.querySelectorAll('[data-lapso]').forEach((btn) => {
      btn.addEventListener('click', () => {
        estadoFiltros.lapso = btn.dataset.lapso;
        cargarAgenda();
      });
    });

    selEstado.addEventListener('change', () => {
      estadoFiltros.estado = selEstado.value;
      cargarAgenda();
    });

    document.getElementById('tbodyMiAgenda').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-abrir-cita]');
      if (btn) {
        abrirModalCita(Number(btn.dataset.abrirCita));
      }
    });

    document.getElementById('btnGuardarNotas').addEventListener('click', () => guardarCita(false));
    document.getElementById('btnMarcarAtendida').addEventListener('click', () => guardarCita(true));

    await cargarAgenda();
  });
})();
