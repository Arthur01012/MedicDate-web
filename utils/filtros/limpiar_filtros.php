<?php
declare(strict_types=1);

/**
 * Utilidad de filtro: restablecer todos los filtros a su estado inicial.
 */

/**
 * @param string $contexto 'asistente_agenda' | 'asistente_pacientes' | 'doctor_agenda' | 'doctor_pacientes'
 * @return array<string, mixed>
 */
function limpiarFiltros(string $contexto = 'asistente_agenda'): array
{
    return match ($contexto) {
        'asistente_pacientes', 'doctor_pacientes' => [
            'busqueda' => ''
        ],
        'doctor_agenda' => [
            'lapso' => 'hoy',
            'fecha' => '',
            'estado' => ''
        ],
        default => [
            'fecha' => '',
            'id_medico' => '',
            'estado' => ''
        ]
    };
}
