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
        <td><b>${UI.esc(p.nombre)}</b></td>
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

  async function cargarPacientes() {
    const data = await Service.obtenerMisPacientes('');
    if (data.medico && data.medico.nombre) {
      document.getElementById('topbarUsuario').textContent = `${data.medico.nombre} · Médico`;
      document.getElementById('topbarAvatar').textContent = UI.iniciales(data.medico.nombre);
    }
    listaPacientes = data.pacientes || [];
    renderTabla(listaPacientes);
  }

  async function abrirHistorialPaciente(idPaciente) {
    try {
      const data = await Service.obtenerHistorialPacienteMedico(idPaciente);
      const p = data.paciente;
      const historial = data.historial || [];
      if (!p) return;

      document.getElementById('modalPacienteTitulo').textContent = p.nombre || 'Paciente';
      document.getElementById('mpDatosKv').innerHTML = `
        <b>Edad</b><span>${p.edad !== null && p.edad !== undefined ? `${p.edad} años` : '—'}</span>
        <b>Teléfono</b><span>${UI.esc(p.telefono || '—')}</span>
        <b>Correo</b><span>${UI.esc(p.correo || '—')}</span>
        ${p.alergias ? `<b>Alergias</b><span>${UI.esc(p.alergias)}</span>` : ''}
      `;
      document.getElementById('mpTituloHistorial').textContent = 'Historial contigo';

      const lista = document.getElementById('mpListaCitas');
      if (historial.length === 0) {
        lista.innerHTML = '<p class="vacio" style="padding:8px 0">Sin citas registradas contigo.</p>';
      } else {
        lista.innerHTML = historial.map((c) => `
          <div style="padding:10px 0;border-top:1px solid var(--linea)">
            <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
              <b>${UI.fechaCorta(c.fecha)} · ${UI.esc(c.hora)}</b>
              ${UI.badgeEstado(c.estado, c.estado_etiqueta)}
            </div>
            <div style="color:var(--suave);font-size:14px">${UI.esc(c.motivo)}</div>
            ${c.notas_internas ? `<div style="margin-top:4px;font-size:14px">${UI.esc(c.notas_internas)}</div>` : ''}
          </div>
        `).join('');
      }

      modalPacienteCtrl.backdrop.classList.add('on');
    } catch (error) {
      UI.toast(error.message || 'No se pudo cargar el historial del paciente.');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await UI.inicializarLayoutPrivado({ rol: 'medico', navActivo: 'pacientes' });
    modalPacienteCtrl = await UI.cargarModalPaciente();

    const inpBuscar = document.getElementById('inputBuscarMisPacientes');
    inpBuscar.addEventListener('input', () => {
      const filtrados = Filtros.buscarPacienteMedico(listaPacientes, inpBuscar.value);
      renderTabla(filtrados);
    });

    document.getElementById('tbodyMisPacientes').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ver-historial]');
      if (btn) {
        abrirHistorialPaciente(Number(btn.dataset.verHistorial));
      }
    });

    await cargarPacientes();
  });
})();
