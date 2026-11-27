<?php
require __DIR__ . '/../web/apis/medicdate/config/conexion.php';

if (!function_exists('e')) {
    function e($texto)
    {
        return htmlspecialchars((string) $texto);
    }
}

$conexion = conectarBD();
$aviso = $conexion
    ->query("SELECT texto, fecha_actualizacion FROM aviso_legal WHERE id_aviso = 1")
    ->fetch_assoc();
$conexion->close();

// Los párrafos se separan con una línea en blanco
$parrafos = [];
if ($aviso && trim($aviso['texto']) !== '') {
    $parrafos = preg_split('/(?:\r?\n){2,}/', trim($aviso['texto']));
}

$title  = 'Aviso de privacidad | MedicDate';
$pagina = 'aviso';
require __DIR__ . '/includes/head.php';
?>
<link href="styles/faq_aviso.css" rel="stylesheet">
<?php require __DIR__ . '/includes/header.php'; ?>

<main class="flex-grow-1">

    <section class="info-banda">
        <div class="contenedor">
            <h1>Aviso de privacidad</h1>
            <p>Cómo cuidamos tus datos personales.</p>
        </div>
    </section>

    <section class="contenedor py-5">
        <?php if (count($parrafos) === 0): ?>
            <p class="info-aviso m-0">El aviso de privacidad no está disponible por el momento.</p>
        <?php else: ?>
            <div class="aviso-tarjeta">
                <?php foreach ($parrafos as $parrafo): ?>
                    <p><?= nl2br(e(trim($parrafo))) ?></p>
                <?php endforeach; ?>
            </div>
            <p class="aviso-fecha">Última actualización: <?= e(date('d/m/Y', strtotime($aviso['fecha_actualizacion']))) ?></p>
        <?php endif; ?>
    </section>

</main>

<?php require __DIR__ . '/includes/pie_esp.php'; ?>
