/**
 * Controlador de la vista: Resumen del médico
 * Archivo HTML: pages/private/doctor/resumen.html
 */
(function inicializarDoctorResumen() {
  'use strict';

  const UI = window.MedicDateUI;
  const Service = window.DoctorService;

  let modalCitaCtrl = null;
  let citaActivaId = null;

  function renderSaludo(medico) {
    if (!medico) return;
    document.getElementById('saludoDoctor').textContent = `Hola, ${medico.nombre}`;
    document.getElementById('subtituloDoctor').textContent =
      `${medico.especialidades || 'Medicina General'} · Atiendes ${medico.dias_atencion || 'Lun a Vie'}, de ${medico.horario || '08:00 a 14:00'}`;

    document.getElementById('topbarUsuario').textContent = `${medico.nombre} · Médico`;
    document.getElementById('topbarAvatar').textContent = UI.iniciales(medico.nombre);
  }

  function renderMetricas(r) {
    document.getElementById('kpiHoy').textContent = r.citas_hoy ?? 0;
    document.getElementById('kpiPorAtender').textContent = r.por_atender_hoy ?? 0;
    document.getElementById('kpiAtendidasHoy').textContent = r.atendidas_hoy ?? 0;
    document.getElementById('kpiProximos7').textContent = r.proximos_7_dias ?? 0;
    document.getElementById('kpiPacientes').textContent = r.pacientes ?? 0;
  }

  function renderSiguienteCita(sig) {
    const box = document.getElementById('boxSiguienteCita');
    if (!sig) {
      box.innerHTML = '<p class="vacio">No tienes citas pendientes.</p>';
      return;
    }

    box.innerHTML = `
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        <div class="ic g">${UI.esc(UI.iniciales(sig.paciente))}</div>
        <div style="flex:1;min-width:180px">
          <b style="font-size:17px">${UI.esc(sig.paciente)}</b>
          <div style="color:var(--suave);font-size:14px">${UI.fechaCorta(sig.fecha)} · ${UI.esc(sig.hora)}</div>
          <div style="margin-top:4px">${UI.esc(sig.motivo)}</div>
        </div>
        <button type="button" class="btn btn-p btn-s" data-abrir-cita="${sig.id_cita}">Abrir cita</button>
      </div>
    `;
  }

  function renderGrafica(dias) {
    const cont = document.getElementById('grafica7Dias');
    if (!dias || dias.length === 0) {
      cont.innerHTML = '';
      return;
    }

    let mx = 1;
    for (let i = 0; i < dias.length; i++) {
      const total = dias[i].total || 0;
      if (total > mx) mx = total;
    }

    let html = '';
    for (let i = 0; i < dias.length; i++) {
      const d = dias[i];
      const altura = Math.max(4, Math.round(((d.total || 0) / mx) * 80));
      const bg = d.es_hoy ? 'var(--azul)' : 'var(--azul-claro)';
      const diaTexto = UI.fechaCorta(d.fecha).split(' ')[0];
      html += `
        <div style="flex:1;text-align:center">
          <div style="font-size:13px;font-weight:700">${d.total || 0}</div>
          <div style="height:${altura}px;background:${bg};border-radius:6px 6px 0 0;margin-top:4px"></div>
          <div style="font-size:12px;color:var(--suave);margin-top:4px">${UI.esc(diaTexto)}</div>
        </div>
      `;
    }
    cont.innerHTML = html;
  }

  function renderAgendaHoy(citas) {
    const tbody = document.getElementById('tbodyAgendaHoy');
    const vacio = document.getElementById('estadoVacioHoy');

    if (!citas || citas.length === 0) {
      tbody.innerHTML = '';
      vacio.textContent = 'No tienes citas para hoy.';
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

  async function cargarResumen() {
    const data = await Service.obtenerResumenMedico();
    renderSaludo(data.medico);
    renderMetricas(data.resumen || {});
    renderSiguienteCita(data.siguiente_cita);
    renderGrafica(data.grafica_7_dias || []);
    renderAgendaHoy(data.agenda_hoy || []);
  }

  async function abrirModalCitaMedico(idCita) {
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
      await cargarResumen();
    } catch (error) {
      UI.toast(error.message || 'No se pudieron guardar los cambios.');
    }
  }

  function manejarGuardarNotas() {
    guardarCita(false);
  }

  function manejarMarcarAtendida() {
    guardarCita(true);
  }

  function manejarClickDocumento(e) {
    const btn = e.target.closest('[data-abrir-cita]');
    if (btn) {
      abrirModalCitaMedico(Number(btn.dataset.abrirCita));
    }
  }

  async function inicializarVista() {
    const sesion = await UI.inicializarLayoutPrivado({ rol: 'medico', navActivo: 'resumen' });
    if (!sesion) return;
    modalCitaCtrl = await UI.cargarModalCita();

    document.getElementById('btnGuardarNotas').addEventListener('click', manejarGuardarNotas);
    document.getElementById('btnMarcarAtendida').addEventListener('click', manejarMarcarAtendida);
    document.addEventListener('click', manejarClickDocumento);

    await cargarResumen();
  }

  document.addEventListener('DOMContentLoaded', inicializarVista);
})();
