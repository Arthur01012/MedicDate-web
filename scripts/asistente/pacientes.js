/**
 * Controlador de la vista: Pacientes del asistente (SOLO LECTURA)
 * Archivo HTML: pages/private/asistente/pacientes.html
 */
(function inicializarAsistentePacientes() {
  'use strict';

  const UI = window.MedicDateUI;
  const Filtros = window.MedicDateFiltros;
  const Service = window.AsistenteService;

  let todosLosPacientes = [];
  let modalPacienteCtrl = null;
  let inpBuscar = null;

  function renderTabla(pacientes) {
    const tbody = document.getElementById('tbodyPacientes');
    const vacio = document.getElementById('estadoVacio');

    if (!pacientes || pacientes.length === 0) {
      tbody.innerHTML = '';
      vacio.textContent = 'No se encontraron pacientes.';
      vacio.classList.remove('oculto');
      return;
    }

    vacio.classList.add('oculto');
    let html = '';
    for (let i = 0; i < pacientes.length; i++) {
      const p = pacientes[i];
      html += `
      <tr>
        <td><b>${UI.esc(p.nombre)}</b></td>
        <td>${UI.esc(p.correo)}</td>
        <td>${UI.esc(p.telefono)}</td>
        <td>${p.edad !== null && p.edad !== undefined ? `${p.edad} años` : '—'}</td>
        <td class="acc">
          <button type="button" class="btn btn-o btn-s" data-ver-ficha="${p.id_paciente}">Ver ficha</button>
        </td>
      </tr>
    `;
    }
    tbody.innerHTML = html;
  }

  async function cargarPacientes() {
    try {
      const data = await Service.obtenerPacientesAsistente('');
      if (data.usuario && data.usuario.nombre) {
        document.getElementById('topbarUsuario').textContent = `${data.usuario.nombre} · Asistente`;
        document.getElementById('topbarAvatar').textContent = UI.iniciales(data.usuario.nombre);
      }
      todosLosPacientes = data.pacientes || [];
      renderTabla(todosLosPacientes);
    } catch (error) {
      if (UI.manejarErrorApi(error, 'No se pudieron cargar los pacientes.')) return;
      const tbody = document.getElementById('tbodyPacientes');
      const vacio = document.getElementById('estadoVacio');
      if (tbody) tbody.innerHTML = '';
      if (vacio) {
        vacio.textContent = error.message || 'No se pudieron cargar los pacientes.';
        vacio.classList.remove('oculto');
      }
    }
  }

  async function abrirFichaPaciente(idPaciente) {
    try {
      const data = await Service.obtenerFichaPacienteAsistente(idPaciente);
      const p = data.paciente;
      const citas = data.citas || [];
      if (!p) return;

      document.getElementById('modalPacienteTitulo').textContent = p.nombre || 'Paciente';
      document.getElementById('mpDatosKv').innerHTML = `
        <b>Correo</b><span>${UI.esc(p.correo || '—')}</span>
        <b>Teléfono</b><span>${UI.esc(p.telefono || '—')}</span>
        <b>Edad</b><span>${p.edad !== null && p.edad !== undefined ? `${p.edad} años` : '—'}</span>
      `;
      document.getElementById('mpTituloHistorial').textContent = 'Citas';

      const lista = document.getElementById('mpListaCitas');
      if (citas.length === 0) {
        lista.innerHTML = '<p class="vacio" style="padding:8px 0">Sin citas.</p>';
      } else {
        let filasCitas = '';
        for (let i = 0; i < citas.length; i++) {
          const c = citas[i];
          filasCitas += `
                <tr>
                  <td>${UI.fechaCorta(c.fecha)} ${UI.esc(c.hora)}</td>
                  <td>${UI.esc(c.medico)}</td>
                  <td>${UI.badgeEstado(c.estado, c.estado_etiqueta)}</td>
                </tr>
              `;
        }
        lista.innerHTML = `
          <table>
            <tbody>
              ${filasCitas}
            </tbody>
          </table>
        `;
      }

      modalPacienteCtrl.backdrop.classList.add('on');
    } catch (error) {
      UI.manejarErrorApi(error, 'No se pudo cargar la ficha del paciente.');
    }
  }

  function manejarBusquedaPaciente() {
    const filtrados = Filtros.buscarPaciente(todosLosPacientes, inpBuscar.value);
    renderTabla(filtrados);
  }

  function manejarClickTablaPacientes(e) {
    const btn = e.target.closest('[data-ver-ficha]');
    if (btn) {
      abrirFichaPaciente(Number(btn.dataset.verFicha));
    }
  }

  async function inicializarVista() {
    const sesion = await UI.inicializarLayoutPrivado({ rol: 'asistente', navActivo: 'pacientes' });
    if (!sesion) return;
    modalPacienteCtrl = await UI.cargarModalPaciente();

    inpBuscar = document.getElementById('inputBuscarPaciente');
    inpBuscar.addEventListener('input', manejarBusquedaPaciente);
    document.getElementById('tbodyPacientes').addEventListener('click', manejarClickTablaPacientes);

    await cargarPacientes();
  }

  document.addEventListener('DOMContentLoaded', inicializarVista);
})();
