<?php
declare(strict_types=1);

/**
 * Utilidad de filtro: búsqueda de pacientes para el perfil Asistente.
 * Filtra una lista de pacientes por nombre, correo o teléfono (insensible a mayúsculas y acentos).
 */

function normalizarTextoFiltro(?string $texto): string
{
    $valor = mb_strtolower(trim((string) $texto), 'UTF-8');
    $reemplazos = [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n'
    ];
    return strtr($valor, $reemplazos);
}

/**
 * @param array<int, array<string, mixed>> $pacientes
 * @param string $termino
 * @return array<int, array<string, mixed>>
 */
function buscarPacienteAsistente(array $pacientes, string $termino): array
{
    $consulta = normalizarTextoFiltro($termino);
    if ($consulta === '') {
        return array_values($pacientes);
    }

    $resultado = [];
    foreach ($pacientes as $paciente) {
        $objetivo = normalizarTextoFiltro(
            ($paciente['nombre'] ?? '') . ' ' .
            ($paciente['correo'] ?? '') . ' ' .
            ($paciente['telefono'] ?? '')
        );
        if (str_contains($objetivo, $consulta)) {
            $resultado[] = $paciente;
        }
    }

    return $resultado;
}
