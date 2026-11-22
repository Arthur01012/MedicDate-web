/**
 * Utilidades compartidas de interfaz para los paneles privados de MedicDate Web.
 */
(function (global) {
  'use strict';

  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  function esc(valor) {
    return String(valor ?? '').replace(/[&<>"]/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[ch]));
  }

  function iniciales(nombre) {
    return String(nombre || 'U')
      .replace(/^(Dra?\.|Lic\.)\s*/i, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => (p[0] || '').toUpperCase())
      .join('') || 'U';
  }

  function fechaCorta(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return esc(iso);
    return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
  }

  function fechaLarga(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return esc(iso);
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  }

  function badgeEstado(estado, etiqueta) {
    const clave = String(estado || '').toLowerCase();
    const clases = {
      pendiente: 'b-ambar',
      confirmada: 'b-azul',
      en_progreso: 'b-azul',
      completada: 'b-ok',
      atendida: 'b-ok',
      cancelada: 'b-rojo',
      inasistencia: 'b-gris'
    };
    const etiquetas = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      en_progreso: 'En progreso',
      completada: 'Atendida',
      atendida: 'Atendida',
      cancelada: 'Cancelada',
      inasistencia: 'Inasistencia'
    };
    const cls = clases[clave] || 'b-gris';
    const texto = etiqueta || etiquetas[clave] || clave || '—';
    return `<span class="badge ${cls}">${esc(texto)}</span>`;
  }

  function toast(mensaje) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = mensaje;
    el.classList.add('on');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('on'), 2800);
  }

  async function cargarFragmento(rutaRelativa, contenedor, fallbackHtml) {
    if (!contenedor) return;
    try {
      const resp = await fetch(rutaRelativa, { cache: 'no-store' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      contenedor.innerHTML = await resp.text();
    } catch (_) {
      contenedor.innerHTML = fallbackHtml;
    }
  }

  const FALLBACK_LATERAL_ASISTENTE = `
    <aside class="lat" aria-label="Menú lateral del asistente">
      <a class="marca" href="../../../index.html"><i>+</i><span>MedicDate</span></a>
      <div class="tit">Asistente</div>
      <a class="nav-item" data-nav="agenda" href="./agenda_general.html">Agenda general</a>
      <a class="nav-item" data-nav="pacientes" href="./pacientes.html">Pacientes</a>
      <div class="tit">Acceso rápido</div>
      <a class="nav-item" href="../../../index.html">Portal público</a>
    </aside>`;

  const FALLBACK_LATERAL_DOCTOR = `
    <aside class="lat" aria-label="Menú lateral del médico">
      <a class="marca" href="../../../index.html"><i>+</i><span>MedicDate</span></a>
      <div class="tit">Médico</div>
      <a class="nav-item" data-nav="resumen" href="./resumen.html">Resumen</a>
      <a class="nav-item" data-nav="agenda" href="./mi_agenda.html">Mi agenda</a>
      <a class="nav-item" data-nav="pacientes" href="./mis_pasientes.html">Mis pacientes</a>
      <div class="tit">Acceso rápido</div>
      <a class="nav-item" href="../../../index.html">Portal público</a>
    </aside>`;

  const FALLBACK_MODAL_CITA = `
    <div class="modal-backdrop" id="modalCita" role="dialog" aria-modal="true" aria-labelledby="modalCitaTitulo">
      <div class="mc">
        <h3 id="modalCitaTitulo">Detalle de la cita</h3>
        <div class="kv" id="modalCitaDatos">
          <b>Fecha y hora</b><span id="mcFechaHora">—</span>
          <b>Paciente</b><span id="mcPaciente">—</span>
          <b>Teléfono</b><span id="mcTelefono">—</span>
          <b class="solo-asistente">Médico</b><span class="solo-asistente" id="mcMedico">—</span>
          <b class="solo-asistente">Especialidad</b><span class="solo-asistente" id="mcEspecialidad">—</span>
          <b>Tipo de atención</b><span id="mcTipoAtencion">—</span>
          <b>Consultorio</b><span id="mcConsultorio">—</span>
          <b>Motivo</b><span id="mcMotivo">—</span>
          <b>Estado</b><span id="mcEstado">—</span>
        </div>
        <div id="mcSeccionDoctor" class="oculto">
          <div id="mcAlergiasWrap" class="caja-alergias oculto">
            <strong>Alergias registradas:</strong> <span id="mcAlergias"></span>
          </div>
          <div class="campo" style="margin-top: 16px;">
            <label for="mcNotas">Notas internas de la consulta (solo las ves tú)</label>
            <textarea id="mcNotas" placeholder="Escribe aquí tus notas clínicas de esta consulta..."></textarea>
          </div>
          <p id="mcAvisoFecha" class="oculto" style="margin: 0 0 12px; font-size: 14px; color: var(--suave);">
            Podrás marcar esta cita como atendida a partir de la fecha programada.
          </p>
        </div>
        <div class="pie">
          <button type="button" class="btn btn-o" id="btnCerrarModalCita">Cerrar</button>
          <button type="button" class="btn btn-o oculto" id="btnGuardarNotas">Guardar notas</button>
          <button type="button" class="btn btn-p oculto" id="btnMarcarAtendida">Marcar como atendida</button>
        </div>
      </div>
    </div>`;

  const FALLBACK_MODAL_PACIENTE = `
    <div class="modal-backdrop" id="modalPaciente" role="dialog" aria-modal="true" aria-labelledby="modalPacienteTitulo">
      <div class="mc">
        <h3 id="modalPacienteTitulo">Ficha del paciente</h3>
        <div class="kv">
          <b>Edad</b><span id="mpEdad">—</span>
          <b>Teléfono</b><span id="mpTelefono">—</span>
          <b>Correo</b><span id="mpCorreo">—</span>
        </div>
        <div id="mpSeccionDoctor" class="oculto" style="margin-top: 16px;">
          <div class="campo">
            <label for="mpAlergias">Alergias</label>
            <input id="mpAlergias" type="text" placeholder="Ej. Penicilina, polen (o Ninguna)">
          </div>
          <div class="campo">
            <label for="mpNotasMedicas">Notas médicas generales</label>
            <textarea id="mpNotasMedicas" placeholder="Antecedentes relevantes o notas generales del paciente..."></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
            <button type="button" class="btn btn-o btn-s" id="btnGuardarExpedientePaciente">Guardar alergias y notas</button>
          </div>
        </div>
        <h4 id="mpTituloHistorial" style="margin: 20px 0 10px;">Citas</h4>
        <div id="mpListaCitas"></div>
        <div class="pie">
          <button type="button" class="btn btn-p" id="btnCerrarModalPaciente">Cerrar</button>
        </div>
      </div>
    </div>`;

  async function inicializarLayoutPrivado({ rol, navActivo }) {
    const slotLateral = document.getElementById('slotLateral');
    const esDoctor = rol === 'medico';
    const rutaLateral = esDoctor
      ? '../../../ui/lateral_panel_doctor.html'
      : '../../../ui/lateral_panel_asistente.html';

    await cargarFragmento(
      rutaLateral,
      slotLateral,
      esDoctor ? FALLBACK_LATERAL_DOCTOR : FALLBACK_LATERAL_ASISTENTE
    );

    if (slotLateral && navActivo) {
      const enlaceActivo = slotLateral.querySelector(`[data-nav="${navActivo}"]`);
      if (enlaceActivo) enlaceActivo.classList.add('on');
    }

    const sesion = global.MedicDateApi.obtenerSesion(rol);
    const etiquetaRol = esDoctor ? 'Médico' : 'Asistente';
    const av = document.getElementById('topbarAvatar');
    const nom = document.getElementById('topbarUsuario');
    if (av && sesion) av.textContent = iniciales(sesion.nombre);
    if (nom && sesion) nom.textContent = `${sesion.nombre} · ${etiquetaRol}`;

    const btnSalir = document.getElementById('btnCerrarSesion');
    if (btnSalir) {
      btnSalir.addEventListener('click', () => global.MedicDateApi.cerrarSesion());
    }

    return sesion;
  }

  async function cargarModalCita() {
    const slot = document.getElementById('slotModalCita');
    await cargarFragmento('../../../utils/ventana_descripcion_cita.html', slot, FALLBACK_MODAL_CITA);

    const backdrop = document.getElementById('modalCita');
    const btnCerrar = document.getElementById('btnCerrarModalCita');
    const cerrar = () => backdrop && backdrop.classList.remove('on');

    if (btnCerrar) btnCerrar.addEventListener('click', cerrar);
    if (backdrop) {
      backdrop.addEventListener('mousedown', (e) => {
        if (e.target === backdrop) cerrar();
      });
    }
    return { backdrop, cerrar };
  }

  async function cargarModalPaciente() {
    const slot = document.getElementById('slotModalPaciente');
    await cargarFragmento('../../../utils/ventana_historial_paciente.html', slot, FALLBACK_MODAL_PACIENTE);

    const backdrop = document.getElementById('modalPaciente');
    const btnCerrar = document.getElementById('btnCerrarModalPaciente');
    const cerrar = () => backdrop && backdrop.classList.remove('on');

    if (btnCerrar) btnCerrar.addEventListener('click', cerrar);
    if (backdrop) {
      backdrop.addEventListener('mousedown', (e) => {
        if (e.target === backdrop) cerrar();
      });
    }
    return { backdrop, cerrar };
  }

  global.MedicDateUI = {
    esc,
    iniciales,
    fechaCorta,
    fechaLarga,
    badgeEstado,
    toast,
    inicializarLayoutPrivado,
    cargarModalCita,
    cargarModalPaciente
  };
})(window);
