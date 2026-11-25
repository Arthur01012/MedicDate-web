<?php
declare(strict_types=1);

/**
 * Utilidad de filtro: filtrar citas por estado.
 * Admite estados exactos de BD ('pendiente', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'inasistencia')
 * así como alias amigables ('programada', 'atendida').
 */

/**
 * @param array<int, array<string, mixed>> $citas
 * @param string $estado
 * @return array<int, array<string, mixed>>
 */
function filtrarCitasPorEstado(array $citas, string $estado = ''): array
{
    $objetivo = strtolower(trim($estado));
    if ($objetivo === '' || $objetivo === 'todos') {
        return array_values($citas);
    }

    $resultado = [];
    foreach ($citas as $cita) {
        $estadoCita = strtolower((string) ($cita['estado'] ?? ''));

        if ($objetivo === 'programada') {
            $coincide = in_array($estadoCita, ['pendiente', 'confirmada', 'en_progreso'], true);
        } elseif ($objetivo === 'atendida') {
            $coincide = $estadoCita === 'completada';
        } else {
            $coincide = $estadoCita === $objetivo;
        }

        if ($coincide) {
            $resultado[] = $cita;
        }
    }

    return $resultado;
}
