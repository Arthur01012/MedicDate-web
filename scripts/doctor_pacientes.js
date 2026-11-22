/**
 * Controlador de la vista: Mis pacientes del médico
 * Archivo HTML: pages/private/doctor/mis_pasientes.html
 */
(function () {
  'use strict';

  const UI = window.MedicDateUI;
  const Filtros = window.MedicDateFiltros;
  const Service = window.DoctorService;

  let listaPacientes = [];
  let modalPacienteCtrl = null;
  let pacienteActivoId = null;

  function renderTabla(pacientes) {
    const tbody = document.getElementById('tbodyMisPacientes');
    const vacio = document.getElementById('estadoVacio');

    if (!pacientes || pacientes.length === 0) {
      tbody.innerHTML = '';
      vacio.textContent = 'No se encontraron pacientes.';
      vacio.classList.remove('oculto');
      return;
    }

    vacio.classList.add('oculto');
    tbody.innerHTML = pacientes.map((p) => `
      <tr>
        <td>
          <b>${UI.esc(p.nombre)}</b>
          ${p.alergias ? `<div style="font-size:12px; color:var(--rojo);">Alergias: ${UI.esc(p.alergias)}</div>` : ''}
        </td>
        <td>${p.edad !== null && p.edad !== undefined ? `${p.edad} años` : '—'}</td>
        <td>${p.total_citas ?? 0}</td>
        <td>${p.ultima_consulta ? UI.fechaCorta(p.ultima_consulta) : '—'}</td>
        <td>${p.proxima_cita_fecha ? `${UI.fechaCorta(p.proxima_cita_fecha)} ${UI.esc(p.proxima_cita_hora || '')}` : '—'}</td>
        <td class="acc">
          <button type="button" class="btn btn-o btn-s" data-ver-historial="${p.id_paciente}">Ver historial</button>
        </td>
      </tr>
    `).join('');
  }

  async function cargarPacientes(busqueda = '') {
    const tbody = document.getElementById('tbodyMisPacientes');
    const vacio = document.getElementById('estadoVacio');
    const alerta = document.getElementById('alertaError');

    alerta.classList.add('oculto');
    vacio.textContent = 'Cargando tus pacientes...';
    vacio.classList.remove('oculto');
    tbody.innerHTML = '';

    try {
      const data = await Service.obtenerMisPacientes(busqueda);
      if (data.medico && data.medico.nombre) {
        document.getElementById('topbarUsuario').textContent = `${data.medico.nombre} · Médico`;
        document.getElementById('topbarAvatar').textContent = UI.iniciales(data.medico.nombre);
      }
      listaPacientes = data.pacientes || [];
      renderTabla(listaPacientes);
    } catch (error) {
      vacio.textContent = 'No se pudo cargar la lista de pacientes.';
      alerta.textContent = error.message || 'Error al consultar la API de pacientes del médico.';
      alerta.classList.remove('oculto');
    }
  }

  async function abrirHistorialPaciente(idPaciente) {
    try {
      const data = await Service.obtenerHistorialPacienteMedico(idPaciente);
      const p = data.paciente;
      const historial = data.historial || [];
      if (!p) return;

      pacienteActivoId = p.id_paciente;

      document.getElementById('modalPacienteTitulo').textContent = p.nombre || 'Paciente';
      document.getElementById('mpEdad').textContent = p.edad !== null && p.edad !== undefined ? `${p.edad} años` : '—';
      document.getElementById('mpTelefono').textContent = p.telefono || '—';
      document.getElementById('mpCorreo').textContent = p.correo || '—';

      document.getElementById('mpSeccionDoctor').classList.remove('oculto');
      document.getElementById('mpAlergias').value = p.alergias || '';
      document.getElementById('mpNotasMedicas').value = p.notas_medicas || '';
      document.getElementById('mpTituloHistorial').textContent = 'Historial de citas contigo';

      const lista = document.getElementById('mpListaCitas');
      if (historial.length === 0) {
        lista.innerHTML = '<p class="vacio" style="padding: 12px 0;">Sin citas registradas contigo.</p>';
      } else {
        lista.innerHTML = historial.map((c) => `
          <div class="hist-item">
            <div class="hist-top">
              <b>${UI.fechaCorta(c.fecha)} · ${UI.esc(c.hora)}</b>
              ${UI.badgeEstado(c.estado, c.estado_etiqueta)}
            </div>
            <div class="hist-motivo">${UI.esc(c.motivo)}</div>
            ${c.notas_internas ? `<div class="hist-notas">${UI.esc(c.notas_internas)}</div>` : ''}
          </div>
        `).join('');
      }

      modalPacienteCtrl.backdrop.classList.add('on');
    } catch (error) {
      UI.toast(error.message || 'No se pudo cargar el historial del paciente.');
    }
  }

  async function guardarExpedientePaciente() {
    if (!pacienteActivoId) return;
    const alergias = document.getElementById('mpAlergias').value.trim();
    const notasMedicas = document.getElementById('mpNotasMedicas').value.trim();

    try {
      const resp = await Service.actualizarExpedientePaciente(pacienteActivoId, alergias, notasMedicas);
      UI.toast(resp.mensaje || 'Alergias y notas guardadas.');
      await cargarPacientes(document.getElementById('inputBuscarMisPacientes').value);
    } catch (error) {
      UI.toast(error.message || 'No se pudo actualizar el expediente.');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await UI.inicializarLayoutPrivado({ rol: 'medico', navActivo: 'pacientes' });
    modalPacienteCtrl = await UI.cargarModalPaciente();

    const inpBuscar = document.getElementById('inputBuscarMisPacientes');
    const btnLimpiar = document.getElementById('btnLimpiarBusquedaDoc');

    inpBuscar.addEventListener('input', () => {
      const filtrados = Filtros.buscarPacienteMedico(listaPacientes, inpBuscar.value);
      renderTabla(filtrados);
    });

    btnLimpiar.addEventListener('click', () => {
      inpBuscar.value = '';
      renderTabla(listaPacientes);
      inpBuscar.focus();
    });

    document.getElementById('tbodyMisPacientes').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ver-historial]');
      if (btn) {
        abrirHistorialPaciente(Number(btn.dataset.verHistorial));
      }
    });

    document.getElementById('btnGuardarExpedientePaciente').addEventListener('click', guardarExpedientePaciente);

    await cargarPacientes();
  });
})();
