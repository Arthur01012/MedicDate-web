/**
 * Utilidades compartidas de interfaz para los paneles privados de MedicDate Web.
 * Idéntico al flujo y diseño de MedicDate web _ Prototipo funcional con 3 perfiles.html
 * con las credenciales reales de Credenciales_Prueba_MedicDate.md.
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
    const clave = String(etiqueta || estado || '').toLowerCase();
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
    el._timer = setTimeout(() => el.classList.remove('on'), 2600);
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
      <a class="marca" href="../../../index.html" style="padding:4px 12px 16px"><i>+</i>MedicDate</a>
      <a data-nav="agenda" href="./agenda_general.html">Agenda general</a>
      <a data-nav="pacientes" href="./pacientes.html">Pacientes</a>
      <div class="tit">Cuenta</div>
      <a data-nav="cuenta" href="#cuenta">Mi cuenta</a>
    </aside>`;

  const FALLBACK_LATERAL_DOCTOR = `
    <aside class="lat">
      <a class="marca" href="../../../index.html" style="padding:4px 12px 16px"><i>+</i>MedicDate</a>
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

  function inyectarBarraDemo(sesionActual) {
    if (document.getElementById('demo')) return;
    const barra = document.createElement('div');
    barra.id = 'demo';
    barra.innerHTML = `
      <div class="cont">
        <b>Cuentas BD (Prueba123!)</b>
        <span>Selecciona un perfil de la base de datos:</span>
        <button type="button" data-demo-cuenta="asistente">Asistente: Luna Aurora Reyes</button>
        <button type="button" data-demo-cuenta="medico1">Médico 1: Dr. José Rodríguez</button>
        <button type="button" data-demo-cuenta="medico2">Médica 2: Dra. Sofía Flores</button>
        <button type="button" id="btnRestablecerDatosDemo">Restablecer datos</button>
      </div>
    `;
    document.body.insertBefore(barra, document.body.firstChild);

    barra.querySelectorAll('[data-demo-cuenta]').forEach((btn) => {
      const clave = btn.dataset.demoCuenta;
      const cuenta = global.MedicDateApi.CUENTAS_BD[clave];
      if (sesionActual && cuenta && Number(sesionActual.id_usuario) === Number(cuenta.id_usuario)) {
        btn.classList.add('on');
      }
      btn.addEventListener('click', () => {
        const nueva = global.MedicDateApi.activarCuentaDemo(clave);
        if (!nueva) return;
        const enCarpetaAsistente = global.location.pathname.includes('/asistente/');
        if (nueva.rol === 'asistente') {
          global.location.href = enCarpetaAsistente ? './agenda_general.html' : '../asistente/agenda_general.html';
        } else {
          global.location.href = enCarpetaAsistente ? '../doctor/resumen.html' : './resumen.html';
        }
      });
    });

    const btnReset = document.getElementById('btnRestablecerDatosDemo');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        global.MedicDateApi.restablecerBDLocal();
        toast('Datos restablecidos.');
        setTimeout(() => global.location.reload(), 350);
      });
    }
  }

  function abrirModalMiCuenta(sesion) {
    let modal = document.getElementById('modalMiCuenta');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalMiCuenta';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
      modal.addEventListener('mousedown', (e) => {
        if (e.target === modal) modal.classList.remove('on');
      });
    }

    const rolTexto = sesion.rol === 'medico' ? 'Médico' : 'Asistente';
    modal.innerHTML = `
      <div class="mc">
        <h3>Mi cuenta</h3>
        <div class="kv" style="margin-bottom:16px">
          <b>Nombre</b><span>${esc(sesion.nombre)}</span>
          <b>Correo</b><span>${esc(sesion.correo)}</span>
          <b>Perfil</b><span>${esc(rolTexto)}</span>
          <b>Pregunta secreta</b><span>${esc(sesion.pregunta || '¿Cuál es el nombre de tu primera mascota?')}</span>
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
    inyectarBarraDemo(sesion);

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
        linkCuenta.addEventListener('click', (e) => {
          e.preventDefault();
          abrirModalMiCuenta(sesion);
        });
      }
    }

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
