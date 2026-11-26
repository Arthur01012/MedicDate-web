<?php
require __DIR__ . '/../web/apis/medicdate/config/conexion.php';

if (!function_exists('e')) {
    function e($texto)
    {
        return htmlspecialchars((string) $texto);
    }
}

// Convierte [1,2,3,5] en "Lun a Mié y Vie"
function textoDias(array $dias)
{
    $nombres = [1 => 'Lun', 2 => 'Mar', 3 => 'Mié', 4 => 'Jue', 5 => 'Vie', 6 => 'Sáb', 7 => 'Dom'];
    $dias = array_values(array_unique($dias));
    sort($dias);

    // Agrupa los días que van seguidos
    $tramos = [];
    $inicio = $previo = $dias[0];
    foreach (array_slice($dias, 1) as $dia) {
        if ($dia === $previo + 1) {
            $previo = $dia;
            continue;
        }
        $tramos[] = [$inicio, $previo];
        $inicio = $previo = $dia;
    }
    $tramos[] = [$inicio, $previo];

    $partes = [];
    foreach ($tramos as $tramo) {
        if ($tramo[1] - $tramo[0] >= 2) {
            $partes[] = $nombres[$tramo[0]] . ' a ' . $nombres[$tramo[1]];
        } else {
            for ($d = $tramo[0]; $d <= $tramo[1]; $d++) {
                $partes[] = $nombres[$d];
            }
        }
    }

    if (count($partes) > 1) {
        $ultimo = array_pop($partes);
        return implode(', ', $partes) . ' y ' . $ultimo;
    }
    return $partes[0];
}

$id = (int) ($_GET['id'] ?? 0);
$conexion = conectarBD();

// Especialidad (debe existir y estar activa)
$sql = $conexion->prepare("SELECT id_especialidad, nombre, resumen, descripcion FROM especialidad WHERE id_especialidad = ? AND activo = 1");
$sql->bind_param('i', $id);
$sql->execute();
$esp = $sql->get_result()->fetch_assoc();

$medicos  = [];
$horarios = [];

if ($esp) {
    // Médicos activos y publicados que atienden esta especialidad
    $sql = $conexion->prepare(
        "SELECT d.id_empleado, p.nombres, p.apellido_paterno, p.apellido_materno, d.descripcion_publica
        FROM doctor_especialidad de
        JOIN doctor d   ON d.id_empleado = de.id_empleado AND d.publicado = 1
        JOIN empleado em ON em.id_empleado = d.id_empleado AND em.estado = 'activo'
        JOIN persona p  ON p.id_persona = em.id_persona
        WHERE de.id_especialidad = ?
        ORDER BY p.apellido_paterno, p.nombres"
    );
    $sql->bind_param('i', $id);
    $sql->execute();
    $medicos = $sql->get_result()->fetch_all(MYSQLI_ASSOC);

    // Horarios vigentes de esos médicos
    if (count($medicos) > 0) {
        $ids = implode(',', array_map('intval', array_column($medicos, 'id_empleado')));
        $resultado = $conexion->query(
            "SELECT id_empleado, dia_semana,
                    TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
                    TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin
            FROM horario_atencion
            WHERE activo = 1
              AND vigencia_desde <= CURDATE()
              AND (vigencia_hasta IS NULL OR vigencia_hasta >= CURDATE())
              AND id_empleado IN ($ids)
            ORDER BY id_empleado, hora_inicio, dia_semana"
        );
        // $horarios[id_empleado]["09:00|17:00"] = [1,2,3,4,5]
        foreach ($resultado->fetch_all(MYSQLI_ASSOC) as $fila) {
            $clave = $fila['hora_inicio'] . '|' . $fila['hora_fin'];
            $horarios[(int) $fila['id_empleado']][$clave][] = (int) $fila['dia_semana'];
        }
    }
}
$conexion->close();

if (!$esp) {
    http_response_code(404);
}

$title  = ($esp ? $esp['nombre'] : 'Especialidad no encontrada') . ' | MedicDate';
$pagina = 'especialidades';
require __DIR__ . '/includes/head.php';
?>
<link href="styles/especialidades.css" rel="stylesheet">
<?php require __DIR__ . '/includes/header.php'; ?>

<main class="flex-grow-1">

<?php if (!$esp): ?>

    <section class="esp-banda">
        <div class="contenedor">
            <h1>Especialidad no encontrada</h1>
            <p>Es posible que ya no esté disponible.</p>
        </div>
    </section>
    <section class="contenedor py-5">
        <a class="esp-volver" href="especialidades.php">← Todas las especialidades</a>
    </section>

<?php else: ?>

    <section class="esp-banda">
        <div class="contenedor">
            <h1><?= e($esp['nombre']) ?></h1>
            <?php if (!empty($esp['resumen'])): ?>
                <p><?= e($esp['resumen']) ?></p>
            <?php endif; ?>
        </div>
    </section>

    <section class="contenedor py-5">
        <a class="esp-volver" href="especialidades.php">← Todas las especialidades</a>

        <?php if (!empty($esp['descripcion'])): ?>
            <p class="esp-detalle mt-3"><?= e($esp['descripcion']) ?></p>
        <?php endif; ?>

        <h2 class="seccion-titulo mt-5 mb-4">Médicos de esta especialidad</h2>

        <?php if (count($medicos) === 0): ?>
            <p class="esp-aviso m-0">Por ahora no hay médicos publicados en esta especialidad.</p>
        <?php else: ?>
            <div class="row g-4">
                <?php foreach ($medicos as $medico):
                    $nombreCompleto = trim($medico['nombres'] . ' ' . $medico['apellido_paterno'] . ' ' . ($medico['apellido_materno'] ?? ''));
                    $iniciales = mb_strtoupper(
                        mb_substr(trim($medico['nombres']), 0, 1) . mb_substr(trim($medico['apellido_paterno']), 0, 1)
                    );
                    $gruposHorario = $horarios[(int) $medico['id_empleado']] ?? [];
                ?>
                    <div class="col-md-6 col-lg-4">
                        <div class="medico">
                            <span class="avatar avatar-grande"><?= e($iniciales) ?></span>
                            <h3><?= e($nombreCompleto) ?></h3>
                            <span class="medico-esp"><?= e($esp['nombre']) ?></span>
                            <?php if (!empty($medico['descripcion_publica'])): ?>
                                <p><?= e($medico['descripcion_publica']) ?></p>
                            <?php endif; ?>
                            <div class="esp-horarios">
                                <?php if (count($gruposHorario) === 0): ?>
                                    <span class="dias-chip"><i class="bi bi-calendar-check"></i> Horario por confirmar</span>
                                <?php else: ?>
                                    <?php foreach ($gruposHorario as $clave => $dias):
                                        [$desde, $hasta] = explode('|', $clave);
                                    ?>
                                        <span class="dias-chip"><i class="bi bi-calendar-check"></i> <?= e(textoDias($dias)) ?> · <?= e($desde) ?> – <?= e($hasta) ?></span>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            <p class="seccion-texto mt-4 mb-0">Las citas se reservan desde la app móvil de MedicDate.</p>
        <?php endif; ?>
    </section>

<?php endif; ?>

</main>

<?php require __DIR__ . '/includes/pie_esp.php'; ?>
