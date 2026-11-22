/**
 * Controlador de la vista: Resumen del médico
 * Archivo HTML: pages/private/doctor/resumen.html
 */
(function () {
  'use strict';

  const UI = window.MedicDateUI;
  const Service = window.DoctorService;

  let modalCitaCtrl = null;
  let citaActivaId = null;

  function renderSaludo(medico) {
    if (!medico) return;
    document.getElementById('saludoDoctor').textContent = `Hola, ${medico.nombre}`;
    document.getElementById('subtituloDoctor').textContent =
      `${medico.especialidades || 'Medicina general'} · Atiendes ${medico.dias_atencion || 'según horario'}, de ${medico.horario || 'por definir'}`;

    document.getElementById('topbarUsuario').textContent = `${medico.nombre} · Médico`;
    document.getElementById('topbarAvatar').textContent = UI.iniciales(medico.nombre);
  }

  function renderMetricas(r) {
    document.getElementById('kpiHoy').textContent = r.citas_hoy ?? 0;
    document.getElementById('kpiPorAtender').textContent = r.por_atender_hoy ?? 0;
    document.getElementById('kpiAtendidasHoy').textContent = r.atendidas_hoy ?? 0;
    document.getElementById('kpiProximos7').textContent = r.proximos_7_dias ?? 0;
    document.getElementById('kpiTotalMes').textContent = r.total_mes ?? 0;
    document.getElementById('kpiPendientesMes').textContent = r.pendientes_mes ?? 0;
    document.getElementById('kpiPacientes').textContent = r.pacientes ?? 0;
  }

  function renderSiguienteCita(sig) {
    const box = document.getElementById('boxSiguienteCita');
    if (!sig) {
      box.innerHTML = '<p class="vacio" style="padding: 16px 0;">No tienes citas pendientes.</p>';
      return;
    }

    box.innerHTML = `
      <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap;">
        <div class="ic g">${UI.esc(UI.iniciales(sig.paciente))}</div>
        <div style="flex:1; min-width:180px;">
          <b style="font-size:17px;">${UI.esc(sig.paciente)}</b>
          <div style="color:var(--suave); font-size:14px;">${UI.fechaCorta(sig.fecha)} · ${UI.esc(sig.hora)}</div>
          <div style="margin-top:4px;">${UI.esc(sig.motivo)}</div>
        </div>
        <button type="button" class="btn btn-p btn-s" data-abrir-cita="${sig.id_cita}">Abrir cita</button>
      </div>
    `;
  }

  function renderGrafica(dias) {
    const cont = document.getElementById('grafica7Dias');
    if (!dias || dias.length === 0) {
      cont.innerHTML = '<p class="vacio">Sin datos para mostrar.</p>';
      return;
    }
    const max = Math.max(1, ...dias.map((d) => d.total || 0));
    cont.innerHTML = dias.map((d) => {
      const altura = Math.max(6, Math.round(((d.total || 0) / max) * 82));
      const color = d.es_hoy ? 'var(--azul)' : 'var(--azul-claro)';
      return `
        <div class="grafica-col">
          <div class="grafica-num">${d.total || 0}</div>
          <div class="grafica-barra" style="height:${altura}px; background:${color};"></div>
          <div class="grafica-dia">${UI.esc(d.dia)}</div>
        </div>
      `;
    }).join('');
  }

  function renderAgendaHoy(citas) {
    const tbody = document.getElementById('tbodyAgendaHoy');
    const vacio = document.getElementById('estadoVacioHoy');

    if (!citas || citas.length === 0) {
      tbody.innerHTML = '';
      vacio.textContent = 'No tienes citas programadas para hoy.';
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

  async function cargarResumen() {
    const alerta = document.getElementById('alertaError');
    alerta.classList.add('oculto');

    try {
      const data = await Service.obtenerResumenMedico();
      renderSaludo(data.medico);
      renderMetricas(data.resumen || {});
      renderSiguienteCita(data.siguiente_cita);
      renderGrafica(data.grafica_7_dias || []);
      renderAgendaHoy(data.agenda_hoy || []);
    } catch (error) {
      alerta.textContent = error.message || 'No se pudo cargar el resumen del médico.';
      alerta.classList.remove('oculto');
    }
  }

  async function abrirModalCitaMedico(idCita) {
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
      await cargarResumen();
    } catch (error) {
      UI.toast(error.message || 'No se pudieron guardar los cambios.');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await UI.inicializarLayoutPrivado({ rol: 'medico', navActivo: 'resumen' });
    modalCitaCtrl = await UI.cargarModalCita();

    document.getElementById('btnGuardarNotas').addEventListener('click', () => guardarCita(false));
    document.getElementById('btnMarcarAtendida').addEventListener('click', () => guardarCita(true));

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-abrir-cita]');
      if (btn) {
        abrirModalCitaMedico(Number(btn.dataset.abrirCita));
      }
    });

    await cargarResumen();
  });
})();
