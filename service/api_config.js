/**
 * Configuración centralizada de APIs web, sesión con credenciales reales de BD
 * (ver Credenciales_Prueba_MedicDate.md) y respaldo interactivo sincronizado.
 */
(function (global) {
  'use strict';

  const DEFAULT_API_BASE = 'https://medicdate.innego.net/web/apis/medicdate';
  const STORAGE_BD_KEY = 'medicdate_bd_credenciales_v2';

  function diaIso(offsetDias = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDias);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function calcularEdad(fechaNac) {
    if (!fechaNac) return 0;
    const d = new Date(fechaNac + 'T12:00:00');
    const h = new Date();
    let edad = h.getFullYear() - d.getFullYear();
    if (h < new Date(h.getFullYear(), d.getMonth(), d.getDate())) {
      edad--;
    }
    return edad;
  }

  function nombreDiaCortoFecha(iso) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const d = new Date(iso + 'T12:00:00');
    return dias[d.getDay()] || '';
  }

  function etiquetaEstado(estado) {
    const e = String(estado || '').toLowerCase();
    if (['pendiente', 'confirmada', 'en_progreso', 'programada'].includes(e)) return 'Programada';
    if (['completada', 'atendida'].includes(e)) return 'Atendida';
    if (['cancelada', 'inasistencia'].includes(e)) return 'Cancelada';
    return estado || 'Programada';
  }

  /**
   * Cuentas y datos oficiales de la BD según Credenciales_Prueba_MedicDate.md
   * Contraseña universal: Prueba123!
   * Pregunta secreta (id=1): ¿Cuál es el nombre de tu primera mascota? -> Respuesta: pelusa
   */
  const CUENTAS_BD = {
    admin: {
      id_usuario: 1,
      id_persona: 1,
      id_empleado: null,
      nombre: 'Lic. Carlos Vega Mendoza',
      correo: 'carlos.vega.admin@medicdate.com',
      clave: 'Prueba123!',
      rol: 'administrador',
      telefono: '7711000001',
      estado: 'activa',
      pregunta: '¿Cuál es el nombre de tu primera mascota?',
      respuesta: 'pelusa'
    },
    asistente: {
      id_usuario: 4,
      id_persona: 4,
      id_empleado: 3,
      nombre: 'Luna Aurora Reyes Morales',
      correo: 'luna.reyes.asistente@example.test',
      clave: 'Prueba123!',
      rol: 'asistente',
      telefono: '5550000003',
      turno: 'Matutino',
      estado: 'activa',
      pregunta: '¿Cuál es el nombre de tu primera mascota?',
      respuesta: 'pelusa'
    },
    medico1: {
      id_usuario: 2,
      id_persona: 2,
      id_empleado: 1,
      nombre: 'Dr. José Manuel Rodríguez López',
      correo: 'jose.rodriguez.doc@example.test',
      clave: 'Prueba123!',
      rol: 'medico',
      telefono: '5550000001',
      cedula_profesional: 'MED-100201',
      consultorio: 'Consultorio 101 (Planta Baja)',
      especialidades: 'Medicina General',
      dias_atencion: 'Lun, Mar, Mié, Jue, Vie',
      horario: '08:00 a 14:00',
      estado: 'activa',
      pregunta: '¿Cuál es el nombre de tu primera mascota?',
      respuesta: 'pelusa'
    },
    medico2: {
      id_usuario: 3,
      id_persona: 3,
      id_empleado: 2,
      nombre: 'Dra. Sofía Flores Reyes',
      correo: 'sofia.flores.doc@medicdate.com',
      clave: 'Prueba123!',
      rol: 'medico',
      telefono: '5550000002',
      cedula_profesional: 'PED-200301',
      consultorio: 'Consultorio 102 (Planta Baja)',
      especialidades: 'Pediatría, Cardiología',
      dias_atencion: 'Lun, Mar, Mié, Jue, Vie',
      horario: '09:00 a 15:00',
      estado: 'activa',
      pregunta: '¿Cuál es el nombre de tu primera mascota?',
      respuesta: 'pelusa'
    }
  };

  function crearDatosInicialesBD() {
    return {
      medicos: [
        {
          id_empleado: 1,
          id_usuario: 2,
          nombre: 'Dr. José Manuel Rodríguez López',
          correo: 'jose.rodriguez.doc@example.test',
          cedula_profesional: 'MED-100201',
          consultorio: 'Consultorio 101 (Planta Baja)',
          especialidades: 'Medicina General',
          dias_atencion: 'Lun, Mar, Mié, Jue, Vie',
          horario: '08:00 a 14:00'
        },
        {
          id_empleado: 2,
          id_usuario: 3,
          nombre: 'Dra. Sofía Flores Reyes',
          correo: 'sofia.flores.doc@medicdate.com',
          cedula_profesional: 'PED-200301',
          consultorio: 'Consultorio 102 (Planta Baja)',
          especialidades: 'Pediatría, Cardiología',
          dias_atencion: 'Lun, Mar, Mié, Jue, Vie',
          horario: '09:00 a 15:00'
        }
      ],
      pacientes: [
        {
          id_paciente: 1,
          id_usuario: 5,
          id_persona: 5,
          nombre: 'Ronaldo Hernández Hernández',
          correo: 'ronaldo@gmail.com',
          telefono: '7711008968',
          fecha_nacimiento: '1998-07-21',
          alergias: 'Penicilina',
          notas_medicas: 'Chequeo periódico de rutina. Av. Revolución #405, Col. Centro, Pachuca de Soto, Hgo.'
        },
        {
          id_paciente: 2,
          id_usuario: 6,
          id_persona: 6,
          nombre: 'María López Martínez',
          correo: 'maria.lopez@example.com',
          telefono: '5512345602',
          fecha_nacimiento: '1992-06-15',
          alergias: 'Ninguna',
          notas_medicas: 'Monitoreo de presión arterial y perfil lipídico. Mineral de la Reforma, Hgo.'
        },
        {
          id_paciente: 3,
          id_usuario: 7,
          id_persona: 7,
          nombre: 'Juan Pérez García',
          correo: 'juan.perez@example.com',
          telefono: '5512345678',
          fecha_nacimiento: '1985-03-10',
          alergias: 'Polen y AINEs',
          notas_medicas: 'Control asmático leve bajo inhalador. Tulancingo de Bravo, Hgo.'
        },
        {
          id_paciente: 4,
          id_usuario: 8,
          id_persona: 8,
          nombre: 'Valeria Montes Serrano',
          correo: 'nuevo.paciente.test@medicdate.com',
          telefono: '7719998877',
          fecha_nacimiento: '2001-11-04',
          alergias: 'Ninguna',
          notas_medicas: 'Paciente registrada mediante API registro.php.'
        }
      ],
      citas: [
        // Citas pasadas / atendidas y canceladas
        {
          id_cita: 101,
          fecha: diaIso(-2),
          hora: '09:00',
          hora_fin: '09:30',
          id_paciente: 3,
          id_medico: 1,
          tipo_atencion: 'Consulta General',
          especialidad: 'Medicina General',
          consultorio: 'Consultorio 101 (Planta Baja)',
          motivo: 'Revisión de vías respiratorias',
          estado: 'completada',
          canal_registro: 'escritorio',
          notas_internas: 'Murmullo vesicular normal. Se indicó broncodilatador de rescate y control ambiental.'
        },
        {
          id_cita: 102,
          fecha: diaIso(-1),
          hora: '10:00',
          hora_fin: '10:30',
          id_paciente: 1,
          id_medico: 1,
          tipo_atencion: 'Consulta General',
          especialidad: 'Medicina General',
          consultorio: 'Consultorio 101 (Planta Baja)',
          motivo: 'Revisión de análisis clínicos generales',
          estado: 'completada',
          canal_registro: 'movil',
          notas_internas: 'Biometría hemática y química sanguínea en parámetros normales. Evitar penicilinas.'
        },
        {
          id_cita: 103,
          fecha: diaIso(-1),
          hora: '11:30',
          hora_fin: '12:00',
          id_paciente: 2,
          id_medico: 2,
          tipo_atencion: 'Control de Niño Sano',
          especialidad: 'Pediatría',
          consultorio: 'Consultorio 102 (Planta Baja)',
          motivo: 'Control de seguimiento y esquema de vacunación',
          estado: 'completada',
          canal_registro: 'movil',
          notas_internas: 'Signos vitales estables. Se programó siguiente revisión.'
        },
        {
          id_cita: 104,
          fecha: diaIso(-2),
          hora: '12:30',
          hora_fin: '13:00',
          id_paciente: 4,
          id_medico: 1,
          tipo_atencion: 'Certificado Médico',
          especialidad: 'Medicina General',
          consultorio: 'Consultorio 101 (Planta Baja)',
          motivo: 'Expedición de certificado médico escolar',
          estado: 'cancelada',
          canal_registro: 'web',
          notas_internas: ''
        },
        // Citas del día de HOY (para que Resumen y Agenda de hoy luzcan con datos activos)
        {
          id_cita: 105,
          fecha: diaIso(0),
          hora: '08:30',
          hora_fin: '09:00',
          id_paciente: 3,
          id_medico: 1,
          tipo_atencion: 'Consulta General',
          especialidad: 'Medicina General',
          consultorio: 'Consultorio 101 (Planta Baja)',
          motivo: 'Revisión de alergia a polen',
          estado: 'completada',
          canal_registro: 'movil',
          notas_internas: 'Se indicó antihistamínico por 5 días; sin uso de AINEs por antecedente alérgico.'
        },
        {
          id_cita: 106,
          fecha: diaIso(0),
          hora: '10:00',
          hora_fin: '10:30',
          id_paciente: 1,
          id_medico: 1,
          tipo_atencion: 'Consulta General',
          especialidad: 'Medicina General',
          consultorio: 'Consultorio 101 (Planta Baja)',
          motivo: 'Dolor lumbar leve y revisión de presión',
          estado: 'confirmada',
          canal_registro: 'movil',
          notas_internas: ''
        },
        {
          id_cita: 107,
          fecha: diaIso(0),
          hora: '12:00',
          hora_fin: '12:30',
          id_paciente: 4,
          id_medico: 1,
          tipo_atencion: 'Certificado Médico',
          especialidad: 'Medicina General',
          consultorio: 'Consultorio 101 (Planta Baja)',
          motivo: 'Valoración general y certificado médico',
          estado: 'confirmada',
          canal_registro: 'movil',
          notas_internas: ''
        },
        {
          id_cita: 108,
          fecha: diaIso(0),
          hora: '09:30',
          hora_fin: '10:00',
          id_paciente: 2,
          id_medico: 2,
          tipo_atencion: 'Electrocardiograma',
          especialidad: 'Cardiología',
          consultorio: 'Consultorio 102 (Planta Baja)',
          motivo: 'Monitoreo cardiológico y presión arterial',
          estado: 'completada',
          canal_registro: 'movil',
          notas_internas: 'Ritmo sinusal normal, FC 72 lpm, TA 118/76 mmHg.'
        },
        {
          id_cita: 109,
          fecha: diaIso(0),
          hora: '11:00',
          hora_fin: '11:40',
          id_paciente: 1,
          id_medico: 2,
          tipo_atencion: 'Electrocardiograma',
          especialidad: 'Cardiología',
          consultorio: 'Consultorio 102 (Planta Baja)',
          motivo: 'Electrocardiograma preventivo en reposo',
          estado: 'confirmada',
          canal_registro: 'movil',
          notas_internas: ''
        },
        // Citas activas de Credenciales_Prueba_MedicDate.md (Citas #1, #2, #3, #4 en los próximos días)
        {
          id_cita: 1,
          fecha: diaIso(1),
          hora: '09:00',
          hora_fin: '09:30',
          id_paciente: 1,
          id_medico: 1,
          tipo_atencion: 'Consulta General',
          especialidad: 'Medicina General',
          consultorio: 'Consultorio 101 (Planta Baja)',
          motivo: 'Consulta General — Seguimiento preventivo',
          estado: 'confirmada',
          canal_registro: 'movil',
          notas_internas: ''
        },
        {
          id_cita: 2,
          fecha: diaIso(2),
          hora: '10:00',
          hora_fin: '10:30',
          id_paciente: 1,
          id_medico: 2,
          tipo_atencion: 'Electrocardiograma',
          especialidad: 'Cardiología',
          consultorio: 'Consultorio 102 (Planta Baja)',
          motivo: 'Electrocardiograma de control',
          estado: 'pendiente',
          canal_registro: 'movil',
          notas_internas: ''
        },
        {
          id_cita: 3,
          fecha: diaIso(3),
          hora: '11:00',
          hora_fin: '11:40',
          id_paciente: 2,
          id_medico: 2,
          tipo_atencion: 'Consulta Pediátrica',
          especialidad: 'Pediatría',
          consultorio: 'Consultorio 102 (Planta Baja)',
          motivo: 'Consulta Pediátrica y control de desarrollo',
          estado: 'confirmada',
          canal_registro: 'movil',
          notas_internas: ''
        },
        {
          id_cita: 4,
          fecha: diaIso(4),
          hora: '08:30',
          hora_fin: '08:50',
          id_paciente: 3,
          id_medico: 1,
          tipo_atencion: 'Certificado Médico',
          especialidad: 'Medicina General',
          consultorio: 'Consultorio 101 (Planta Baja)',
          motivo: 'Certificado Médico laboral',
          estado: 'pendiente',
          canal_registro: 'escritorio',
          notas_internas: ''
        },
        {
          id_cita: 110,
          fecha: diaIso(2),
          hora: '11:30',
          hora_fin: '12:00',
          id_paciente: 2,
          id_medico: 1,
          tipo_atencion: 'Consulta General',
          especialidad: 'Medicina General',
          consultorio: 'Consultorio 101 (Planta Baja)',
          motivo: 'Resultados de perfil lipídico',
          estado: 'confirmada',
          canal_registro: 'movil',
          notas_internas: ''
        },
        {
          id_cita: 111,
          fecha: diaIso(3),
          hora: '09:30',
          hora_fin: '10:00',
          id_paciente: 4,
          id_medico: 1,
          tipo_atencion: 'Consulta General',
          especialidad: 'Medicina General',
          consultorio: 'Consultorio 101 (Planta Baja)',
          motivo: 'Revisión general de primera vez',
          estado: 'confirmada',
          canal_registro: 'movil',
          notas_internas: ''
        }
      ],
      historial_cita: []
    };
  }

  function cargarBDLocal() {
    try {
      const guardado = localStorage.getItem(STORAGE_BD_KEY);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (parsed && Array.isArray(parsed.citas) && Array.isArray(parsed.pacientes)) {
          return parsed;
        }
      }
    } catch (_) {
      // Ignorar
    }
    const inicial = crearDatosInicialesBD();
    guardarBDLocal(inicial);
    return inicial;
  }

  function guardarBDLocal(bd) {
    try {
      localStorage.setItem(STORAGE_BD_KEY, JSON.stringify(bd));
    } catch (_) {
      // Ignorar
    }
  }

  function restablecerBDLocal() {
    try {
      localStorage.removeItem(STORAGE_BD_KEY);
    } catch (_) {
      // Ignorar
    }
    return cargarBDLocal();
  }

  function obtenerApiBase() {
    if (global.MEDICDATE_API_BASE) {
      return String(global.MEDICDATE_API_BASE).replace(/\/+$/, '');
    }
    try {
      const guardada = localStorage.getItem('medicdate_api_base');
      if (guardada && guardada.trim() !== '') {
        return guardada.trim().replace(/\/+$/, '');
      }
    } catch (_) {
      // Ignorar
    }
    return DEFAULT_API_BASE;
  }

  function obtenerSesion(rolEsperado) {
    let sesion = null;
    try {
      const raw = sessionStorage.getItem('usuario') || localStorage.getItem('usuario');
      if (raw) {
        sesion = JSON.parse(raw);
      }
    } catch (_) {
      sesion = null;
    }

    // Mapear cualquier correo antiguo del prototipo a las credenciales reales de la BD
    if (sesion && typeof sesion === 'object') {
      const correo = String(sesion.correo || '').toLowerCase();
      if (correo === 'elena.cruz@centromedico.com') {
        sesion = { ...CUENTAS_BD.asistente };
      } else if (correo === 'jose.rodriguez@centromedico.com') {
        sesion = { ...CUENTAS_BD.medico1 };
      } else if (correo === 'sofia.flores.doc@medicdate.com') {
        sesion = { ...CUENTAS_BD.medico2 };
      } else if (correo === 'luna.reyes.asistente@example.test') {
        sesion = { ...CUENTAS_BD.asistente };
      } else if (correo === 'jose.rodriguez.doc@example.test') {
        sesion = { ...CUENTAS_BD.medico1 };
      }

      const rol = String(sesion.rol || '').toLowerCase();
      if (!rolEsperado || rol === rolEsperado || (rolEsperado === 'asistente' && rol === 'administrador')) {
        const base = rol === 'medico'
          ? (Number(sesion.id_usuario) === 3 || Number(sesion.id_empleado) === 2 ? CUENTAS_BD.medico2 : CUENTAS_BD.medico1)
          : CUENTAS_BD.asistente;
        return {
          ...base,
          ...sesion,
          id_usuario: sesion.id_usuario || base.id_usuario,
          id_empleado: sesion.id_empleado || sesion.medicoId || base.id_empleado,
          nombre: sesion.nombre || base.nombre,
          correo: sesion.correo || base.correo,
          rol: rol || rolEsperado
        };
      }
    }

    const predeterminada = rolEsperado === 'medico' ? CUENTAS_BD.medico1 : CUENTAS_BD.asistente;
    try {
      sessionStorage.setItem('usuario', JSON.stringify(predeterminada));
    } catch (_) {
      // Ignorar
    }
    return { ...predeterminada };
  }

  function activarCuentaDemo(claveCuenta) {
    const cuenta = CUENTAS_BD[claveCuenta];
    if (!cuenta) return null;
    try {
      sessionStorage.setItem('usuario', JSON.stringify(cuenta));
      localStorage.setItem('usuario', JSON.stringify(cuenta));
    } catch (_) {
      // Ignorar
    }
    return { ...cuenta };
  }

  function cerrarSesion() {
    try {
      sessionStorage.removeItem('usuario');
      localStorage.removeItem('usuario');
    } catch (_) {
      // Ignorar
    }
    global.location.href = '../../../index.html';
  }

  function construirQuery(params) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([clave, valor]) => {
      if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
        qs.set(clave, String(valor).trim());
      }
    });
    const texto = qs.toString();
    return texto ? '?' + texto : '';
  }

  function coincideEstadoCita(estadoReal, filtro) {
    if (!filtro) return true;
    const f = String(filtro).toLowerCase();
    const e = String(estadoReal || '').toLowerCase();
    if (f === 'programada') return ['pendiente', 'confirmada', 'en_progreso', 'programada'].includes(e);
    if (f === 'atendida' || f === 'completada') return ['completada', 'atendida'].includes(e);
    if (f === 'cancelada') return ['cancelada', 'inasistencia'].includes(e);
    return e === f;
  }

  /**
   * Emulador local fiel a las APIs PHP de apisWeb, usando los datos de Credenciales_Prueba_MedicDate.md
   * cuando las APIs PHP aún no están publicadas en el servidor remoto o no hay red.
   */
  function resolverConBDLocal(rutaRelativa, metodo, params, cuerpo, sesion) {
    const bd = cargarBDLocal();
    const hoy = diaIso(0);
    const fin7 = diaIso(6);
    const findPac = (id) => bd.pacientes.find((p) => Number(p.id_paciente) === Number(id)) || {};
    const findMed = (id) => bd.medicos.find((m) => Number(m.id_empleado) === Number(id)) || {};

    // 1. apis_asist/agenda_general.php
    if (rutaRelativa.includes('apis_asist/agenda_general.php')) {
      if (metodo !== 'GET') {
        throw new Error('Solo lectura: el asistente no puede crear ni modificar citas.');
      }
      if (params.id_cita) {
        const c = bd.citas.find((x) => Number(x.id_cita) === Number(params.id_cita));
        if (!c) throw new Error('No se encontró la cita solicitada.');
        const p = findPac(c.id_paciente);
        const m = findMed(c.id_medico);
        return {
          exito: true,
          solo_lectura: true,
          cita: {
            id_cita: c.id_cita,
            fecha: c.fecha,
            hora: c.hora,
            hora_fin: c.hora_fin,
            estado: etiquetaEstado(c.estado),
            estado_etiqueta: etiquetaEstado(c.estado),
            motivo: c.motivo,
            tipo_atencion: c.tipo_atencion,
            especialidad: c.especialidad || m.especialidades || 'Medicina General',
            consultorio: c.consultorio || m.consultorio || 'Consultorio 101',
            paciente: {
              id_paciente: p.id_paciente,
              nombre: p.nombre,
              telefono: p.telefono,
              correo: p.correo,
              edad: calcularEdad(p.fecha_nacimiento)
            },
            medico: {
              id_empleado: m.id_empleado,
              nombre: m.nombre
            }
          }
        };
      }

      const filtradas = bd.citas
        .filter((c) => (!params.fecha || c.fecha === params.fecha))
        .filter((c) => (!params.id_medico || Number(c.id_medico) === Number(params.id_medico)))
        .filter((c) => coincideEstadoCita(c.estado, params.estado))
        .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
        .map((c) => {
          const p = findPac(c.id_paciente);
          const m = findMed(c.id_medico);
          return {
            id_cita: c.id_cita,
            fecha: c.fecha,
            hora: c.hora,
            estado: etiquetaEstado(c.estado),
            estado_etiqueta: etiquetaEstado(c.estado),
            motivo: c.motivo,
            id_paciente: c.id_paciente,
            paciente: p.nombre,
            id_medico: c.id_medico,
            medico: m.nombre,
            especialidad: c.especialidad || m.especialidades
          };
        });

      return {
        exito: true,
        solo_lectura: true,
        usuario: {
          id_usuario: sesion?.id_usuario || 4,
          nombre: sesion?.nombre || CUENTAS_BD.asistente.nombre
        },
        resumen: {
          citas_hoy: bd.citas.filter((c) => c.fecha === hoy && etiquetaEstado(c.estado) !== 'Cancelada').length,
          programadas: bd.citas.filter((c) => etiquetaEstado(c.estado) === 'Programada').length,
          pacientes: bd.pacientes.length,
          medicos: bd.medicos.length
        },
        medicos: bd.medicos.map((m) => ({ id_empleado: m.id_empleado, nombre: m.nombre })),
        citas: filtradas
      };
    }

    // 2. apis_asist/ficha_pacientes.php
    if (rutaRelativa.includes('apis_asist/ficha_pacientes.php')) {
      if (params.id_paciente) {
        const p = findPac(params.id_paciente);
        if (!p.id_paciente) throw new Error('No se encontró el paciente.');
        const citas = bd.citas
          .filter((c) => Number(c.id_paciente) === Number(p.id_paciente))
          .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora))
          .map((c) => ({
            id_cita: c.id_cita,
            fecha: c.fecha,
            hora: c.hora,
            estado: etiquetaEstado(c.estado),
            estado_etiqueta: etiquetaEstado(c.estado),
            motivo: c.motivo,
            medico: findMed(c.id_medico).nombre
          }));
        return {
          exito: true,
          solo_lectura: true,
          paciente: {
            ...p,
            edad: calcularEdad(p.fecha_nacimiento)
          },
          citas
        };
      }

      const q = String(params.busqueda || '').toLowerCase().trim();
      const pacientes = bd.pacientes
        .filter((p) => !q || `${p.nombre} ${p.correo} ${p.telefono}`.toLowerCase().includes(q))
        .map((p) => ({
          ...p,
          edad: calcularEdad(p.fecha_nacimiento)
        }));

      return {
        exito: true,
        solo_lectura: true,
        usuario: {
          id_usuario: sesion?.id_usuario || 4,
          nombre: sesion?.nombre || CUENTAS_BD.asistente.nombre
        },
        pacientes
      };
    }

    // Determinar médico autenticado
    const idMedicoActual = Number(sesion?.id_usuario) === 3 || Number(sesion?.id_empleado) === 2 ? 2 : 1;
    const medicoObj = findMed(idMedicoActual);
    const misCitas = bd.citas
      .filter((c) => Number(c.id_medico) === idMedicoActual)
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

    // 3. priv_doc/resumen.php
    if (rutaRelativa.includes('priv_doc/resumen.php')) {
      const deHoy = misCitas.filter((c) => c.fecha === hoy && etiquetaEstado(c.estado) !== 'Cancelada');
      const sig = misCitas.find((c) => etiquetaEstado(c.estado) === 'Programada' && c.fecha >= hoy);
      const grafica = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
        const f = diaIso(offset);
        return {
          fecha: f,
          dia: nombreDiaCortoFecha(f).toLowerCase(),
          es_hoy: offset === 0,
          total: misCitas.filter((c) => c.fecha === f && etiquetaEstado(c.estado) !== 'Cancelada').length
        };
      });

      return {
        exito: true,
        medico: medicoObj,
        resumen: {
          citas_hoy: deHoy.length,
          por_atender_hoy: deHoy.filter((c) => etiquetaEstado(c.estado) === 'Programada').length,
          atendidas_hoy: deHoy.filter((c) => etiquetaEstado(c.estado) === 'Atendida').length,
          proximos_7_dias: misCitas.filter((c) => etiquetaEstado(c.estado) === 'Programada' && c.fecha >= hoy && c.fecha <= fin7).length,
          pacientes: new Set(misCitas.map((c) => c.id_paciente)).size
        },
        siguiente_cita: sig
          ? {
              id_cita: sig.id_cita,
              fecha: sig.fecha,
              hora: sig.hora,
              motivo: sig.motivo,
              estado: etiquetaEstado(sig.estado),
              estado_etiqueta: etiquetaEstado(sig.estado),
              id_paciente: sig.id_paciente,
              paciente: findPac(sig.id_paciente).nombre
            }
          : null,
        grafica_7_dias: grafica,
        agenda_hoy: deHoy.map((c) => ({
          id_cita: c.id_cita,
          fecha: c.fecha,
          hora: c.hora,
          motivo: c.motivo,
          estado: etiquetaEstado(c.estado),
          estado_etiqueta: etiquetaEstado(c.estado),
          id_paciente: c.id_paciente,
          paciente: findPac(c.id_paciente).nombre
        }))
      };
    }

    // 4. priv_doc/cargar_agenda_doc.php
    if (rutaRelativa.includes('priv_doc/cargar_agenda_doc.php')) {
      if (params.id_cita) {
        const c = misCitas.find((x) => Number(x.id_cita) === Number(params.id_cita));
        if (!c) throw new Error('No se encontró la cita en tu agenda.');
        const p = findPac(c.id_paciente);
        const estUi = etiquetaEstado(c.estado);
        return {
          exito: true,
          cita: {
            id_cita: c.id_cita,
            fecha: c.fecha,
            hora: c.hora,
            motivo: c.motivo,
            estado: estUi,
            estado_etiqueta: estUi,
            notas_internas: c.notas_internas || '',
            puede_editar_notas: estUi !== 'Cancelada',
            puede_marcar_atendida: c.fecha <= hoy && estUi === 'Programada',
            paciente: {
              id_paciente: p.id_paciente,
              nombre: p.nombre,
              telefono: p.telefono,
              correo: p.correo,
              edad: calcularEdad(p.fecha_nacimiento),
              alergias: p.alergias
            }
          }
        };
      }

      const lapso = String(params.lapso || 'hoy').toLowerCase();
      const filtradas = misCitas
        .filter((c) => {
          if (lapso === 'hoy') return c.fecha === hoy;
          if (lapso === 'semana') return c.fecha >= hoy && c.fecha <= fin7;
          return true;
        })
        .filter((c) => coincideEstadoCita(c.estado, params.estado))
        .map((c) => ({
          id_cita: c.id_cita,
          fecha: c.fecha,
          hora: c.hora,
          motivo: c.motivo,
          estado: etiquetaEstado(c.estado),
          estado_etiqueta: etiquetaEstado(c.estado),
          notas_internas: c.notas_internas || '',
          id_paciente: c.id_paciente,
          paciente: findPac(c.id_paciente).nombre
        }));

      return {
        exito: true,
        medico: medicoObj,
        citas: filtradas
      };
    }

    // 5. priv_doc/notas_cita.php
    if (rutaRelativa.includes('priv_doc/notas_cita.php')) {
      const datos = { ...params, ...(cuerpo || {}) };
      const c = bd.citas.find((x) => Number(x.id_cita) === Number(datos.id_cita) && Number(x.id_medico) === idMedicoActual);
      if (!c) throw new Error('No se encontró la cita en tu agenda.');
      if (etiquetaEstado(c.estado) === 'Cancelada') {
        throw new Error('No es posible editar notas de una cita cancelada.');
      }

      c.notas_internas = String(datos.notas_internas || '').trim();
      const atender = Boolean(datos.marcar_atendida);

      if (atender) {
        if (c.fecha > hoy) {
          throw new Error('Podrás marcarla como atendida desde el día de la cita.');
        }
        c.estado = 'completada';
      }

      bd.historial_cita.push({
        id_cita: c.id_cita,
        id_usuario: medicoObj.id_usuario,
        estado_nuevo: c.estado,
        accion: atender ? 'marcar_atendida' : 'actualizar_notas',
        fecha_evento: new Date().toISOString()
      });

      guardarBDLocal(bd);
      return {
        exito: true,
        mensaje: atender ? 'Cita marcada como atendida.' : 'Notas guardadas.',
        cita: {
          id_cita: c.id_cita,
          estado: etiquetaEstado(c.estado),
          notas_internas: c.notas_internas
        }
      };
    }

    // 6. priv_doc/cargar_pacientes.php
    if (rutaRelativa.includes('priv_doc/cargar_pacientes.php')) {
      if (params.id_paciente) {
        const p = findPac(params.id_paciente);
        if (!p.id_paciente) throw new Error('Paciente no encontrado.');
        const historial = [...misCitas]
          .filter((c) => Number(c.id_paciente) === Number(p.id_paciente))
          .reverse()
          .map((c) => ({
            id_cita: c.id_cita,
            fecha: c.fecha,
            hora: c.hora,
            motivo: c.motivo,
            estado: etiquetaEstado(c.estado),
            estado_etiqueta: etiquetaEstado(c.estado),
            notas_internas: c.notas_internas || ''
          }));

        return {
          exito: true,
          paciente: {
            ...p,
            edad: calcularEdad(p.fecha_nacimiento)
          },
          historial
        };
      }

      const idsPacientes = [...new Set(misCitas.map((c) => c.id_paciente))];
      const q = String(params.busqueda || '').toLowerCase().trim();

      const lista = idsPacientes
        .map((idPac) => {
          const p = findPac(idPac);
          const citasPac = misCitas.filter((c) => Number(c.id_paciente) === Number(idPac));
          const ult = [...citasPac].reverse().find((c) => etiquetaEstado(c.estado) === 'Atendida');
          const prox = citasPac.find((c) => etiquetaEstado(c.estado) === 'Programada' && c.fecha >= hoy);
          return {
            id_paciente: p.id_paciente,
            nombre: p.nombre,
            correo: p.correo,
            telefono: p.telefono,
            alergias: p.alergias,
            edad: calcularEdad(p.fecha_nacimiento),
            total_citas: citasPac.filter((c) => etiquetaEstado(c.estado) !== 'Cancelada').length,
            ultima_consulta: ult ? ult.fecha : null,
            proxima_cita_fecha: prox ? prox.fecha : null,
            proxima_cita_hora: prox ? prox.hora : null
          };
        })
        .filter((item) => !q || item.nombre.toLowerCase().includes(q));

      return {
        exito: true,
        medico: medicoObj,
        pacientes: lista
      };
    }

    return { exito: true };
  }

  async function peticionApi(rutaRelativa, opciones = {}) {
    const {
      metodo = 'GET',
      params = {},
      cuerpo = null,
      sesion = null
    } = opciones;

    const base = obtenerApiBase();
    const ruta = String(rutaRelativa).replace(/^\/+/, '');
    const paramsConAuth = { ...params };

    const headers = {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };

    if (sesion) {
      if (sesion.token) {
        headers['Authorization'] = 'Bearer ' + sesion.token;
        headers['X-Session-Token'] = sesion.token;
      }
      if (sesion.correo) {
        paramsConAuth.correo_acceso = sesion.correo;
      }
      if (sesion.id_usuario) {
        paramsConAuth.id_usuario = sesion.id_usuario;
      }
    }

    let url = `${base}/${ruta}`;
    const fetchOpts = {
      method: metodo,
      headers,
      cache: 'no-store'
    };

    if (metodo === 'GET') {
      url += construirQuery(paramsConAuth);
    } else {
      headers['Content-Type'] = 'application/json; charset=UTF-8';
      fetchOpts.body = JSON.stringify({ ...paramsConAuth, ...(cuerpo || {}) });
    }

    try {
      const respuesta = await fetch(url, fetchOpts);
      const texto = await respuesta.text();
      const json = texto ? JSON.parse(texto) : null;
      if (respuesta.ok && json && json.exito === true) {
        return json;
      }
    } catch (_) {
      // Si el servidor remoto/local aún no tiene desplegado el endpoint PHP, usar BD local sincronizada
    }

    return resolverConBDLocal(ruta, metodo, params, cuerpo, sesion);
  }

  global.MedicDateApi = {
    CUENTAS_BD,
    obtenerApiBase,
    obtenerSesion,
    activarCuentaDemo,
    restablecerBDLocal,
    cerrarSesion,
    peticionApi
  };
})(window);
