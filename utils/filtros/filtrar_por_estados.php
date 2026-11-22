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

    return array_values(array_filter($citas, static function (array $cita) use ($objetivo): bool {
        $estadoCita = strtolower((string) ($cita['estado'] ?? ''));

        if ($objetivo === 'programada') {
            return in_array($estadoCita, ['pendiente', 'confirmada', 'en_progreso'], true);
        }
        if ($objetivo === 'atendida') {
            return $estadoCita === 'completada';
        }
        return $estadoCita === $objetivo;
    }));
}
