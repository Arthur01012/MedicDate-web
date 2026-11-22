/**
 * Controlador de la vista: Pacientes del asistente (SOLO LECTURA)
 * Archivo HTML: pages/private/asistente/pacientes.html
 */
(function () {
  'use strict';

  const UI = window.MedicDateUI;
  const Filtros = window.MedicDateFiltros;
  const Service = window.AsistenteService;

  let todosLosPacientes = [];
  let modalPacienteCtrl = null;

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
    tbody.innerHTML = pacientes.map((p) => `
      <tr>
        <td><b>${UI.esc(p.nombre)}</b></td>
        <td>${UI.esc(p.correo)}</td>
        <td>${UI.esc(p.telefono)}</td>
        <td>${p.edad !== null && p.edad !== undefined ? `${p.edad} años` : '—'}</td>
        <td class="acc">
          <button type="button" class="btn btn-o btn-s" data-ver-ficha="${p.id_paciente}">Ver ficha</button>
        </td>
      </tr>
    `).join('');
  }

  async function cargarPacientes(busqueda = '') {
    const tbody = document.getElementById('tbodyPacientes');
    const vacio = document.getElementById('estadoVacio');
    const alerta = document.getElementById('alertaError');

    alerta.classList.add('oculto');
    vacio.textContent = 'Cargando pacientes...';
    vacio.classList.remove('oculto');
    tbody.innerHTML = '';

    try {
      const data = await Service.obtenerPacientesAsistente(busqueda);
      if (data.usuario && data.usuario.nombre) {
        document.getElementById('topbarUsuario').textContent = `${data.usuario.nombre} · Asistente`;
        document.getElementById('topbarAvatar').textContent = UI.iniciales(data.usuario.nombre);
      }
      todosLosPacientes = data.pacientes || [];
      renderTabla(todosLosPacientes);
    } catch (error) {
      vacio.textContent = 'No se pudo cargar la lista de pacientes.';
      alerta.textContent = error.message || 'Error al consultar la API de pacientes.';
      alerta.classList.remove('oculto');
    }
  }

  async function abrirFichaPaciente(idPaciente) {
    try {
      const data = await Service.obtenerFichaPacienteAsistente(idPaciente);
      const p = data.paciente;
      const citas = data.citas || [];
      if (!p) return;

      document.getElementById('modalPacienteTitulo').textContent = p.nombre || 'Ficha del paciente';
      document.getElementById('mpEdad').textContent = p.edad !== null && p.edad !== undefined ? `${p.edad} años` : '—';
      document.getElementById('mpTelefono').textContent = p.telefono || '—';
      document.getElementById('mpCorreo').textContent = p.correo || '—';

      // Asistente: ocultar sección médica (alergias/notas)
      document.getElementById('mpSeccionDoctor').classList.add('oculto');
      document.getElementById('mpTituloHistorial').textContent = 'Citas registradas';

      const lista = document.getElementById('mpListaCitas');
      if (citas.length === 0) {
        lista.innerHTML = '<p class="vacio" style="padding: 12px 0;">Sin citas registradas.</p>';
      } else {
        lista.innerHTML = `
          <div class="tw">
            <table>
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Médico</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${citas.map((c) => `
                  <tr>
                    <td>${UI.fechaCorta(c.fecha)} ${UI.esc(c.hora)}</td>
                    <td>${UI.esc(c.medico)}</td>
                    <td>${UI.badgeEstado(c.estado, c.estado_etiqueta)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      modalPacienteCtrl.backdrop.classList.add('on');
    } catch (error) {
      UI.toast(error.message || 'No se pudo cargar la ficha del paciente.');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await UI.inicializarLayoutPrivado({ rol: 'asistente', navActivo: 'pacientes' });
    modalPacienteCtrl = await UI.cargarModalPaciente();

    const inpBuscar = document.getElementById('inputBuscarPaciente');
    const btnLimpiar = document.getElementById('btnLimpiarBusqueda');

    inpBuscar.addEventListener('input', () => {
      const filtrados = Filtros.buscarPaciente(todosLosPacientes, inpBuscar.value);
      renderTabla(filtrados);
    });

    btnLimpiar.addEventListener('click', () => {
      inpBuscar.value = '';
      renderTabla(todosLosPacientes);
      inpBuscar.focus();
    });

    document.getElementById('tbodyPacientes').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ver-ficha]');
      if (btn) {
        abrirFichaPaciente(Number(btn.dataset.verFicha));
      }
    });

    await cargarPacientes();
  });
})();
