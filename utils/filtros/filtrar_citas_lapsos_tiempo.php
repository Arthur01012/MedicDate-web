<?php
declare(strict_types=1);

/**
 * Utilidad de filtro: filtrar citas por lapso de tiempo (hoy, semana, mes, todas)
 * o por una fecha exacta (YYYY-MM-DD).
 */

/**
 * @param array<int, array<string, mixed>> $citas
 * @param string $lapso 'hoy' | 'semana' | 'mes' | 'todas'
 * @param string|null $fechaExacta Formato YYYY-MM-DD
 * @return array<int, array<string, mixed>>
 */
function filtrarCitasPorLapso(array $citas, string $lapso = 'hoy', ?string $fechaExacta = null): array
{
    $hoy = new DateTimeImmutable('today');
    $hoyIso = $hoy->format('Y-m-d');
    $finSemanaIso = $hoy->modify('+6 days')->format('Y-m-d');
    $mesActual = $hoy->format('Y-m');

    $resultado = [];
    $lapsoNormalizado = strtolower($lapso);

    foreach ($citas as $cita) {
        $fechaCita = (string) ($cita['fecha'] ?? '');
        if ($fechaCita === '') {
            continue;
        }

        if ($fechaExacta !== null && $fechaExacta !== '') {
            if ($fechaCita === $fechaExacta) {
                $resultado[] = $cita;
            }
            continue;
        }

        $coincide = match ($lapsoNormalizado) {
            'hoy' => $fechaCita === $hoyIso,
            'semana' => $fechaCita >= $hoyIso && $fechaCita <= $finSemanaIso,
            'mes' => str_starts_with($fechaCita, $mesActual),
            default => true,
        };

        if ($coincide) {
            $resultado[] = $cita;
        }
    }

    return $resultado;
}
