<?php
require __DIR__ . '/../../../includes/guardia.php';
require __DIR__ . '/../../../../web/apis/medicdate/config/conexion.php';

if (!function_exists('e')) {
    function e($texto)
    {
        return htmlspecialchars((string) $texto);
    }
}

$conexion = conectarBD();
$error    = '';
$enviado  = null;

// ---------- Guardar ----------
// Solo existe un aviso (id_aviso = 1): si no hay renglón se crea, si ya existe se actualiza.
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $texto = trim(str_replace("\r\n", "\n", $_POST['texto'] ?? ''));

    if ($texto === '') {
        $error = 'Escribe el texto del aviso de privacidad.';
    } elseif (mb_strlen($texto) > 20000) {
        $error = 'El aviso puede tener máximo 20,000 caracteres.';
    }

    if ($error === '') {
        $sql = $conexion->prepare("INSERT INTO aviso_legal (id_aviso, texto) VALUES (1, ?) ON DUPLICATE KEY UPDATE texto = VALUES(texto)");
        $sql->bind_param('s', $texto);
        $sql->execute();
        header('Location: aviso.php?ok=guardado');
        exit;
    }
    $enviado = $texto;
}

// ---------- Datos de la pantalla ----------
$actual = $conexion
    ->query("SELECT texto, fecha_actualizacion FROM aviso_legal WHERE id_aviso = 1")
    ->fetch_assoc();
$conexion->close();

$activo = 'aviso';
$titulo = 'Aviso de privacidad';
$aviso  = ($_GET['ok'] ?? '') === 'guardado' ? 'El aviso de privacidad se guardó y ya está publicado.' : '';
$textoForm = $enviado ?? ($actual['texto'] ?? '');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedicDate | Aviso de privacidad</title>
    <link rel="stylesheet" href="../../../styles/panel_privado.css">
</head>
<body>
    <div class="priv">
        <?php require __DIR__ . '/../../../includes/menu_admin.php'; ?>

        <div class="pc">
            <?php require __DIR__ . '/../../../includes/barra_admin.php'; ?>

            <?php if ($aviso !== ''): ?>
                <div class="panel" style="background:#CDE9D6;color:#0B3D22"><?= e($aviso) ?></div>
            <?php endif; ?>

            <div class="panel">
                <p style="margin:0 0 16px;color:var(--suave)">Separa los párrafos con una línea en blanco. Se publica en la página Aviso de privacidad.</p>

                <?php if ($error !== ''): ?>
                    <div style="background:#F6D5D2;color:#5F130E;border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:14px"><?= e($error) ?></div>
                <?php endif; ?>

                <form method="post" action="aviso.php">
                    <div class="campo">
                        <label for="avisoTexto">Texto del aviso</label>
                        <textarea id="avisoTexto" name="texto" rows="14" required><?= e($textoForm) ?></textarea>
                    </div>

                    <?php if ($actual): ?>
                        <p style="margin:0 0 16px;font-size:13px;color:var(--suave)">Última actualización: <?= e(date('d/m/Y H:i', strtotime($actual['fecha_actualizacion']))) ?></p>
                    <?php endif; ?>

                    <div style="display:flex;gap:12px;flex-wrap:wrap">
                        <button type="submit" class="btn btn-p">Guardar cambios</button>
                        <a class="btn btn-o" href="../../../aviso.php" target="_blank" rel="noopener">Ver en el portal</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
