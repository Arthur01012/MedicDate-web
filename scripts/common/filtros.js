/**
 * Funciones de búsqueda y filtrado del lado cliente para Asistente y Médico.
 * Complementan a los módulos PHP en utils/filtros/.
 */
(function inicializarFiltros(global) {
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

    const resultado = [];
    for (let i = 0; i < pacientes.length; i++) {
      const p = pacientes[i];
      const texto = normalizarTexto(`${p.nombre || ''} ${p.correo || ''} ${p.telefono || ''}`);
      if (texto.includes(q)) {
        resultado.push(p);
      }
    }
    return resultado;
  }

  function buscarPacienteMedico(pacientes, termino) {
    const q = normalizarTexto(termino);
    if (!q) return [...pacientes];

    const resultado = [];
    for (let i = 0; i < pacientes.length; i++) {
      const p = pacientes[i];
      const texto = normalizarTexto(`${p.nombre || ''} ${p.correo || ''} ${p.telefono || ''} ${p.alergias || ''}`);
      if (texto.includes(q)) {
        resultado.push(p);
      }
    }
    return resultado;
  }

  function filtrarCitasLapso(citas, lapso = 'hoy', fechaExacta = '') {
    const resultado = [];

    if (fechaExacta) {
      for (let i = 0; i < citas.length; i++) {
        if (citas[i].fecha === fechaExacta) {
          resultado.push(citas[i]);
        }
      }
      return resultado;
    }

    const hoy = fechaHoyIso(0);
    const finSemana = fechaHoyIso(6);
    const mesActual = hoy.slice(0, 7);
    const lapsoNormalizado = String(lapso || 'todas').toLowerCase();

    if (lapsoNormalizado !== 'hoy' && lapsoNormalizado !== 'semana' && lapsoNormalizado !== 'mes') {
      return [...citas];
    }

    for (let i = 0; i < citas.length; i++) {
      const c = citas[i];
      if (lapsoNormalizado === 'hoy' && c.fecha === hoy) {
        resultado.push(c);
      } else if (lapsoNormalizado === 'semana' && c.fecha >= hoy && c.fecha <= finSemana) {
        resultado.push(c);
      } else if (lapsoNormalizado === 'mes' && String(c.fecha || '').startsWith(mesActual)) {
        resultado.push(c);
      }
    }
    return resultado;
  }

  function filtrarPorEstado(citas, estado = '') {
    const est = String(estado || '').toLowerCase().trim();
    if (!est || est === 'todos') return [...citas];

    const resultado = [];
    for (let i = 0; i < citas.length; i++) {
      const c = citas[i];
      const actual = String(c.estado || '').toLowerCase();
      let coincide = false;

      if (est === 'programada') {
        coincide = ['pendiente', 'confirmada', 'en_progreso'].includes(actual);
      } else if (est === 'atendida') {
        coincide = actual === 'completada';
      } else {
        coincide = actual === est;
      }

      if (coincide) {
        resultado.push(c);
      }
    }
    return resultado;
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
