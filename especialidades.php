<?php
require __DIR__ . '/../web/apis/medicdate/config/conexion.php';

if (!function_exists('e')) {
    function e($texto)
    {
        return htmlspecialchars((string) $texto);
    }
}

// Solo se muestran las especialidades activas
$conexion = conectarBD();
$especialidades = $conexion
    ->query("SELECT id_especialidad, nombre, resumen FROM especialidad WHERE activo = 1 ORDER BY nombre ASC")
    ->fetch_all(MYSQLI_ASSOC);
$conexion->close();

$title  = 'Especialidades | MedicDate';
$pagina = 'especialidades';
require __DIR__ . '/includes/head.php';
?>
<link href="styles/especialidades.css" rel="stylesheet">
<?php require __DIR__ . '/includes/header.php'; ?>

<main class="flex-grow-1">

    <section class="esp-banda">
        <div class="contenedor">
            <h1>Especialidades</h1>
            <p>Elige la especialidad que necesitas y conoce a los médicos que la atienden.</p>
        </div>
    </section>

    <section class="contenedor py-5">
        <?php if (count($especialidades) === 0): ?>
            <p class="esp-aviso m-0">Por el momento no hay especialidades publicadas.</p>
        <?php else: ?>
            <div class="row g-4">
                <?php foreach ($especialidades as $esp): ?>
                    <div class="col-md-6 col-lg-4">
                        <a class="esp-tarjeta" href="especialidad.php?id=<?= (int) $esp['id_especialidad'] ?>">
                            <span class="esp-inicial" aria-hidden="true"><?= e(mb_strtoupper(mb_substr($esp['nombre'], 0, 1))) ?></span>
                            <h2><?= e($esp['nombre']) ?></h2>
                            <p><?= e($esp['resumen']) ?></p>
                            <span class="esp-ver">Ver detalle →</span>
                        </a>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </section>

</main>

<?php require __DIR__ . '/includes/pie_esp.php'; ?>
