/**
 * Utilidades compartidas de interfaz para los paneles privados de MedicDate Web.
 * Conectado directamente a https://medicdate.innego.net/web/apis/medicdate
 */
(function inicializarUiCommon(global) {
  'use strict';

  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const ENTIDADES_HTML = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };

  function reemplazarCaracterHtml(ch) {
    return ENTIDADES_HTML[ch];
  }

  function esc(valor) {
    return String(valor ?? '').replace(/[&<>"]/g, reemplazarCaracterHtml);
  }

  function iniciales(nombre) {
    const partes = String(nombre || 'U')
      .replace(/^(Dra?\.|Lic\.)\s*/i, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2);

    let resultado = '';
    for (let i = 0; i < partes.length; i++) {
      resultado += (partes[i][0] || '').toUpperCase();
    }
    return resultado || 'U';
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
    const clave = String(estado || etiqueta || '').toLowerCase();
    let cls = 'b-azul';
    let texto = 'Programada';

    if (['completada', 'atendida'].includes(clave)) {
      cls = 'b-ok';
      texto = 'Atendida';
    } else if (['cancelada', 'inasistencia'].includes(clave)) {
      cls = 'b-rojo';
      texto = 'Cancelada';
    } else {
      cls = 'b-azul';
      texto = 'Programada';
    }
    return `<span class="badge ${cls}">${esc(texto)}</span>`;
  }

  function ocultarToastActivo() {
    const el = document.getElementById('toast');
    if (el) {
      el.classList.remove('on');
    }
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
    el._timer = setTimeout(ocultarToastActivo, 2600);
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
    <aside class="lat">
      <a class="marca" href="../../../index.php" style="padding:4px 12px 16px"><i>+</i>MedicDate</a>
      <a data-nav="agenda" href="./agenda_general.html">Agenda general</a>
      <a data-nav="pacientes" href="./pacientes.html">Pacientes</a>
      <div class="tit">Cuenta</div>
      <a data-nav="cuenta" href="#cuenta">Mi cuenta</a>
    </aside>`;

  const FALLBACK_LATERAL_DOCTOR = `
    <aside class="lat">
      <a class="marca" href="../../../index.php" style="padding:4px 12px 16px"><i>+</i>MedicDate</a>
      <a data-nav="resumen" href="./resumen.html">Resumen</a>
      <a data-nav="agenda" href="./mi_agenda.html">Mi agenda</a>
      <a data-nav="pacientes" href="./mis_pasientes.html">Mis pacientes</a>
      <div class="tit">Cuenta</div>
      <a data-nav="cuenta" href="#cuenta">Mi cuenta</a>
    </aside>`;

  const FALLBACK_MODAL_CITA = `
    <div class="modal-backdrop" id="modalCita" role="dialog" aria-modal="true" aria-labelledby="modalCitaTitulo">
      <div class="mc">
        <h3 id="modalCitaTitulo">Detalle de la cita</h3>
        <div class="kv" id="modalCitaDatos">
          <b>Fecha</b><span id="mcFechaHora">—</span>
          <b>Paciente</b><span id="mcPaciente">—</span>
          <b>Teléfono</b><span id="mcTelefono">—</span>
          <b class="solo-asistente">Médico</b><span class="solo-asistente" id="mcMedico">—</span>
          <b class="solo-asistente">Especialidad</b><span class="solo-asistente" id="mcEspecialidad">—</span>
          <b>Motivo</b><span id="mcMotivo">—</span>
          <b>Estado</b><span id="mcEstado">—</span>
        </div>
        <div id="mcSeccionDoctor" class="oculto">
          <div class="campo" style="margin-top:16px">
            <label for="mcNotas">Notas de la consulta (solo las ves tú)</label>
            <textarea id="mcNotas" placeholder="Escribe aquí tus notas…"></textarea>
          </div>
          <p id="mcAvisoFecha" class="oculto" style="margin:0 0 12px;font-size:14px;color:var(--suave)">
            Podrás marcarla como atendida desde el día de la cita.
          </p>
        </div>
        <div class="pie">
          <button type="button" class="btn btn-p" id="btnCerrarModalCita">Cerrar</button>
          <button type="button" class="btn btn-o oculto" id="btnGuardarNotas">Guardar notas</button>
          <button type="button" class="btn btn-p oculto" id="btnMarcarAtendida">Marcar como atendida</button>
        </div>
      </div>
    </div>`;

  const FALLBACK_MODAL_PACIENTE = `
    <div class="modal-backdrop" id="modalPaciente" role="dialog" aria-modal="true" aria-labelledby="modalPacienteTitulo">
      <div class="mc">
        <h3 id="modalPacienteTitulo">Paciente</h3>
        <div class="kv" id="mpDatosKv"></div>
        <h4 id="mpTituloHistorial" style="margin:20px 0 8px">Citas</h4>
        <div id="mpListaCitas"></div>
        <div class="pie">
          <button type="button" class="btn btn-p" id="btnCerrarModalPaciente">Cerrar</button>
        </div>
      </div>
    </div>`;

  function cerrarModalAlHacerClickFondo(e) {
    if (e.target === this) {
      this.classList.remove('on');
    }
  }

  function manejarCerrarSesion() {
    global.MedicDateApi.cerrarSesion();
  }

  function abrirModalMiCuenta(sesion, rol) {
    let modal = document.getElementById('modalMiCuenta');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalMiCuenta';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
      modal.addEventListener('mousedown', cerrarModalAlHacerClickFondo);
    }

    const perfilApi = global.MedicDateApi.obtenerPerfilCargado() || {};
    const nombre = perfilApi.nombre || (sesion && sesion.nombre) || 'Usuario';
    const idUsuario = perfilApi.id_usuario || (sesion && sesion.id_usuario) || '—';
    const rolTexto = rol === 'medico' ? 'Médico' : 'Asistente';

    modal.innerHTML = `
      <div class="mc">
        <h3>Mi cuenta</h3>
        <div class="kv" style="margin-bottom:16px">
          <b>ID Usuario</b><span>${esc(idUsuario)}</span>
          <b>Nombre</b><span>${esc(nombre)}</span>
          <b>Perfil</b><span>${esc(rolTexto)}</span>
          ${perfilApi.especialidades ? `<b>Especialidad</b><span>${esc(perfilApi.especialidades)}</span>` : ''}
          ${perfilApi.cedula_profesional ? `<b>Cédula</b><span>${esc(perfilApi.cedula_profesional)}</span>` : ''}
        </div>
        <div class="pie">
          <button type="button" class="btn btn-p" onclick="document.getElementById('modalMiCuenta').classList.remove('on')">Cerrar</button>
        </div>
      </div>
    `;
    modal.classList.add('on');
  }

  async function inicializarLayoutPrivado({ rol, navActivo }) {
    const sesion = global.MedicDateApi.obtenerSesion(rol);
    if (!sesion) {
      global.location.replace('../../../login.php');
      return null;
    }

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

    if (slotLateral) {
      const linkCuenta = slotLateral.querySelector('[data-nav="cuenta"]');
      if (linkCuenta) {
        function manejarClickMiCuenta(e) {
          e.preventDefault();
          abrirModalMiCuenta(sesion, rol);
        }
        linkCuenta.addEventListener('click', manejarClickMiCuenta);
      }
    }

    const etiquetaRol = esDoctor ? 'Médico' : 'Asistente';
    const av = document.getElementById('topbarAvatar');
    const nom = document.getElementById('topbarUsuario');
    if (sesion && sesion.nombre) {
      if (av) av.textContent = iniciales(sesion.nombre);
      if (nom) nom.textContent = `${sesion.nombre} · ${etiquetaRol}`;
    }

    const btnSalir = document.getElementById('btnCerrarSesion');
    if (btnSalir) {
      btnSalir.addEventListener('click', manejarCerrarSesion);
    }

    return sesion;
  }

  async function cargarModalCita() {
    const slot = document.getElementById('slotModalCita');
    await cargarFragmento('../../../utils/ventana_descripcion_cita.html', slot, FALLBACK_MODAL_CITA);

    const backdrop = document.getElementById('modalCita');
    const btnCerrar = document.getElementById('btnCerrarModalCita');

    function cerrar() {
      if (backdrop) backdrop.classList.remove('on');
    }

    if (btnCerrar) btnCerrar.addEventListener('click', cerrar);
    if (backdrop) backdrop.addEventListener('mousedown', cerrarModalAlHacerClickFondo);

    return { backdrop, cerrar };
  }

  async function cargarModalPaciente() {
    const slot = document.getElementById('slotModalPaciente');
    await cargarFragmento('../../../utils/ventana_historial_paciente.html', slot, FALLBACK_MODAL_PACIENTE);

    const backdrop = document.getElementById('modalPaciente');
    const btnCerrar = document.getElementById('btnCerrarModalPaciente');

    function cerrar() {
      if (backdrop) backdrop.classList.remove('on');
    }

    if (btnCerrar) btnCerrar.addEventListener('click', cerrar);
    if (backdrop) backdrop.addEventListener('mousedown', cerrarModalAlHacerClickFondo);

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
