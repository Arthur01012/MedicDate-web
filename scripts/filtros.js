/**
 * Funciones de búsqueda y filtrado del lado cliente para Asistente y Médico.
 * Complementan a los módulos PHP en utils/filtros/.
 */
(function (global) {
  'use strict';

  function normalizarTexto(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function fechaHoyIso(diasExtra = 0) {
    const d = new Date();
    d.setDate(d.getDate() + diasExtra);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function buscarPaciente(pacientes, termino) {
    const q = normalizarTexto(termino);
    if (!q) return [...pacientes];
    return pacientes.filter((p) => {
      const texto = normalizarTexto(`${p.nombre || ''} ${p.correo || ''} ${p.telefono || ''}`);
      return texto.includes(q);
    });
  }

  function buscarPacienteMedico(pacientes, termino) {
    const q = normalizarTexto(termino);
    if (!q) return [...pacientes];
    return pacientes.filter((p) => {
      const texto = normalizarTexto(`${p.nombre || ''} ${p.correo || ''} ${p.telefono || ''} ${p.alergias || ''}`);
      return texto.includes(q);
    });
  }

  function filtrarCitasLapso(citas, lapso = 'hoy', fechaExacta = '') {
    if (fechaExacta) {
      return citas.filter((c) => c.fecha === fechaExacta);
    }
    const hoy = fechaHoyIso(0);
    const finSemana = fechaHoyIso(6);
    const mesActual = hoy.slice(0, 7);

    switch (String(lapso || 'todas').toLowerCase()) {
      case 'hoy':
        return citas.filter((c) => c.fecha === hoy);
      case 'semana':
        return citas.filter((c) => c.fecha >= hoy && c.fecha <= finSemana);
      case 'mes':
        return citas.filter((c) => String(c.fecha || '').startsWith(mesActual));
      default:
        return [...citas];
    }
  }

  function filtrarPorEstado(citas, estado = '') {
    const est = String(estado || '').toLowerCase().trim();
    if (!est || est === 'todos') return [...citas];

    return citas.filter((c) => {
      const actual = String(c.estado || '').toLowerCase();
      if (est === 'programada') {
        return ['pendiente', 'confirmada', 'en_progreso'].includes(actual);
      }
      if (est === 'atendida') {
        return actual === 'completada';
      }
      return actual === est;
    });
  }

  function limpiarFiltros(contexto) {
    if (contexto === 'asistente_pacientes' || contexto === 'doctor_pacientes') {
      return { busqueda: '' };
    }
    if (contexto === 'doctor_agenda') {
      return { lapso: 'hoy', fecha: '', estado: '' };
    }
    return { fecha: '', id_medico: '', estado: '' };
  }

  global.MedicDateFiltros = {
    normalizarTexto,
    fechaHoyIso,
    buscarPaciente,
    buscarPacienteMedico,
    filtrarCitasLapso,
    filtrarPorEstado,
    limpiarFiltros
  };
})(window);
