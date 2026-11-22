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
      const activo = !estadoFiltros.fecha && btn.dataset.lapso === estadoFiltros.lapso;
      btn.classList.toggle('on', activo);
      btn.setAttribute('aria-pressed', String(activo));
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
    const tbody = document.getElementById('tbodyMiAgenda');
    const vacio = document.getElementById('estadoVacio');
    const alerta = document.getElementById('alertaError');

    alerta.classList.add('oculto');
    vacio.textContent = 'Cargando tu agenda...';
    vacio.classList.remove('oculto');
    tbody.innerHTML = '';
    actualizarBotonesLapso();

    try {
      const data = await Service.obtenerAgendaMedico(estadoFiltros);
      if (data.medico && data.medico.nombre) {
        document.getElementById('topbarUsuario').textContent = `${data.medico.nombre} · Médico`;
        document.getElementById('topbarAvatar').textContent = UI.iniciales(data.medico.nombre);
      }
      renderTabla(data.citas || []);
    } catch (error) {
      vacio.textContent = 'No se pudo cargar tu agenda.';
      alerta.textContent = error.message || 'Error al consultar la API de agenda del médico.';
      alerta.classList.remove('oculto');
    }
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
      document.getElementById('mcTipoAtencion').textContent = c.tipo_atencion || '—';
      document.getElementById('mcConsultorio').textContent = c.consultorio || '—';
      document.getElementById('mcMotivo').textContent = c.motivo || '—';
      document.getElementById('mcEstado').innerHTML = UI.badgeEstado(c.estado, c.estado_etiqueta);

      document.querySelectorAll('#modalCita .solo-asistente').forEach((el) => el.classList.add('oculto'));
      document.getElementById('mcSeccionDoctor').classList.remove('oculto');

      const alergiasWrap = document.getElementById('mcAlergiasWrap');
      if (c.paciente?.alergias) {
        document.getElementById('mcAlergias').textContent = c.paciente.alergias;
        alergiasWrap.classList.remove('oculto');
      } else {
        alergiasWrap.classList.add('oculto');
      }

      const txtNotas = document.getElementById('mcNotas');
      txtNotas.value = c.notas_internas || '';
      txtNotas.disabled = !c.puede_editar_notas;

      const btnGuardar = document.getElementById('btnGuardarNotas');
      const btnAtender = document.getElementById('btnMarcarAtendida');
      const avisoFecha = document.getElementById('mcAvisoFecha');

      btnGuardar.classList.toggle('oculto', !c.puede_editar_notas);
      btnAtender.classList.toggle('oculto', !c.puede_marcar_atendida);

      const esProgramada = ['pendiente', 'confirmada', 'en_progreso'].includes(c.estado);
      avisoFecha.classList.toggle('oculto', !(esProgramada && !c.puede_marcar_atendida));

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
      UI.toast(resp.mensaje || 'Cambios guardados.');
      await cargarAgenda();
    } catch (error) {
      UI.toast(error.message || 'No se pudieron guardar los cambios.');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await UI.inicializarLayoutPrivado({ rol: 'medico', navActivo: 'agenda' });
    modalCitaCtrl = await UI.cargarModalCita();

    const inpFecha = document.getElementById('filtroFechaDoc');
    const selEstado = document.getElementById('filtroEstadoDoc');
    const btnLimpiar = document.getElementById('btnLimpiarFiltrosDoc');

    document.querySelectorAll('[data-lapso]').forEach((btn) => {
      btn.addEventListener('click', () => {
        estadoFiltros.lapso = btn.dataset.lapso;
        estadoFiltros.fecha = '';
        inpFecha.value = '';
        cargarAgenda();
      });
    });

    inpFecha.addEventListener('change', () => {
      estadoFiltros.fecha = inpFecha.value;
      cargarAgenda();
    });

    selEstado.addEventListener('change', () => {
      estadoFiltros.estado = selEstado.value;
      cargarAgenda();
    });

    btnLimpiar.addEventListener('click', () => {
      estadoFiltros = Filtros.limpiarFiltros('doctor_agenda');
      inpFecha.value = '';
      selEstado.value = '';
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
