<?php
declare(strict_types=1);

/**
 * Utilidad de filtro: búsqueda de pacientes atendidos para el perfil Médico.
 * Filtra por nombre, correo, teléfono o alergias.
 */

require_once __DIR__ . '/buscar_paciente.php';

/**
 * @param array<int, array<string, mixed>> $pacientes
 * @param string $termino
 * @return array<int, array<string, mixed>>
 */
function buscarPacienteMedico(array $pacientes, string $termino): array
{
    $consulta = normalizarTextoFiltro($termino);
    if ($consulta === '') {
        return array_values($pacientes);
    }

    return array_values(array_filter($pacientes, static function (array $paciente) use ($consulta): bool {
        $objetivo = normalizarTextoFiltro(
            ($paciente['nombre'] ?? '') . ' ' .
            ($paciente['correo'] ?? '') . ' ' .
            ($paciente['telefono'] ?? '') . ' ' .
            ($paciente['alergias'] ?? '')
        );
        return str_contains($objetivo, $consulta);
    }));
}
