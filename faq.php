<?php
require __DIR__ . '/../web/apis/medicdate/config/conexion.php';

if (!function_exists('e')) {
    function e($texto)
    {
        return htmlspecialchars((string) $texto);
    }
}

// Solo preguntas activas, en el orden que define el administrador
$conexion  = conectarBD();
$preguntas = $conexion
    ->query("SELECT pregunta, respuesta FROM pregunta_frecuente WHERE activo = 1 ORDER BY orden ASC, id_pregunta_frecuente ASC")
    ->fetch_all(MYSQLI_ASSOC);
$conexion->close();

$title  = 'Preguntas frecuentes | MedicDate';
$pagina = 'faq';
require __DIR__ . '/includes/head.php';
?>
<link href="styles/faq_aviso.css" rel="stylesheet">
<?php require __DIR__ . '/includes/header.php'; ?>

<main class="flex-grow-1">

    <section class="info-banda">
        <div class="contenedor">
            <h1>Preguntas frecuentes</h1>
            <p>Resolvemos las dudas más comunes de nuestros pacientes.</p>
        </div>
    </section>

    <section class="contenedor py-5">
        <?php if (count($preguntas) === 0): ?>
            <p class="info-aviso m-0">Por el momento no hay preguntas publicadas.</p>
        <?php else: ?>
            <div class="faq-lista">
                <?php foreach ($preguntas as $fila): ?>
                    <details class="faq-item">
                        <summary>
                            <span><?= e($fila['pregunta']) ?></span>
                            <span class="faq-mas" aria-hidden="true"></span>
                        </summary>
                        <p class="faq-respuesta"><?= nl2br(e($fila['respuesta'])) ?></p>
                    </details>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </section>

</main>

<?php require __DIR__ . '/includes/pie_esp.php'; ?>
