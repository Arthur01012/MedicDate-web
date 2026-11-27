<?php
require __DIR__ . '/../../../includes/guardia.php';
require __DIR__ . '/../../../../web/apis/medicdate/config/conexion.php';

if (!function_exists('e')) {
    function e($texto)
    {
        return htmlspecialchars((string) $texto);
    }
}

$conexion   = conectarBD();
$error      = '';
$abrirModal = false;
$enviado    = null;

// ---------- Guardar (agregar o editar) ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['accion'] ?? '') === 'guardar') {
    $id        = (int) ($_POST['id_pregunta'] ?? 0);
    $pregunta  = trim($_POST['pregunta'] ?? '');
    $respuesta = trim(str_replace("\r\n", "\n", $_POST['respuesta'] ?? ''));
    $ordenTxt  = trim($_POST['orden'] ?? '');

    if ($pregunta === '' || $respuesta === '') {
        $error = 'Completa la pregunta y la respuesta.';
    } elseif (mb_strlen($pregunta) > 200) {
        $error = 'La pregunta puede tener máximo 200 caracteres.';
    } elseif ($ordenTxt !== '' && (!ctype_digit($ordenTxt) || (int) $ordenTxt > 65535)) {
        $error = 'El orden debe ser un número entre 0 y 65535.';
    }

    if ($error === '') {
        if ($ordenTxt === '') {
            if ($id > 0) {
                // Al editar sin escribir orden, se conserva el que ya tenía
                $sql = $conexion->prepare("SELECT orden FROM pregunta_frecuente WHERE id_pregunta_frecuente = ?");
                $sql->bind_param('i', $id);
                $sql->execute();
                $actual = $sql->get_result()->fetch_assoc();
                $orden  = (int) ($actual['orden'] ?? 0);
            } else {
                // Al agregar sin escribir orden, va al final
                $maximo = $conexion->query("SELECT COALESCE(MAX(orden), 0) AS maximo FROM pregunta_frecuente WHERE activo = 1")->fetch_assoc();
                $orden  = min(65535, (int) $maximo['maximo'] + 1);
            }
        } else {
            $orden = (int) $ordenTxt;
        }

        if ($id > 0) {
            $sql = $conexion->prepare("UPDATE pregunta_frecuente SET pregunta = ?, respuesta = ?, orden = ? WHERE id_pregunta_frecuente = ?");
            $sql->bind_param('ssii', $pregunta, $respuesta, $orden, $id);
        } else {
            $sql = $conexion->prepare("INSERT INTO pregunta_frecuente (pregunta, respuesta, orden, activo) VALUES (?, ?, ?, 1)");
            $sql->bind_param('ssi', $pregunta, $respuesta, $orden);
        }
        $sql->execute();
        header('Location: faq.php?ok=guardado');
        exit;
    }

    $abrirModal = true;
    $enviado = [
        'id_pregunta' => $id,
        'pregunta'    => $pregunta,
        'respuesta'   => $respuesta,
        'orden'       => $ordenTxt,
    ];
}

// ---------- Eliminar (baja lógica: activo = 0) ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['accion'] ?? '') === 'eliminar') {
    $id  = (int) ($_POST['id_pregunta'] ?? 0);
    $sql = $conexion->prepare("UPDATE pregunta_frecuente SET activo = 0 WHERE id_pregunta_frecuente = ?");
    $sql->bind_param('i', $id);
    $sql->execute();
    header('Location: faq.php?ok=eliminado');
    exit;
}

// ---------- Datos de la pantalla ----------
$preguntas = $conexion
    ->query("SELECT id_pregunta_frecuente, pregunta, respuesta FROM pregunta_frecuente WHERE activo = 1 ORDER BY orden ASC, id_pregunta_frecuente ASC")
    ->fetch_all(MYSQLI_ASSOC);

$editar = null;
if (isset($_GET['editar'])) {
    $sql      = $conexion->prepare("SELECT id_pregunta_frecuente AS id_pregunta, pregunta, respuesta, orden FROM pregunta_frecuente WHERE id_pregunta_frecuente = ? AND activo = 1");
    $idEditar = (int) $_GET['editar'];
    $sql->bind_param('i', $idEditar);
    $sql->execute();
    $editar = $sql->get_result()->fetch_assoc();
}

$eliminar = null;
if (isset($_GET['eliminar'])) {
    $sql        = $conexion->prepare("SELECT id_pregunta_frecuente AS id_pregunta, pregunta FROM pregunta_frecuente WHERE id_pregunta_frecuente = ? AND activo = 1");
    $idEliminar = (int) $_GET['eliminar'];
    $sql->bind_param('i', $idEliminar);
    $sql->execute();
    $eliminar = $sql->get_result()->fetch_assoc();
}

$conexion->close();

$activo = 'faq';
$titulo = 'Preguntas frecuentes';
$aviso  = [
    'guardado'  => 'La pregunta se guardó.',
    'eliminado' => 'La pregunta se eliminó.',
][$_GET['ok'] ?? ''] ?? '';

$form = $enviado ?? $editar ?? [
    'id_pregunta' => 0,
    'pregunta'    => '',
    'respuesta'   => '',
    'orden'       => '',
];
$total = count($preguntas);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedicDate | Preguntas frecuentes</title>
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
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap">
                    <strong><?= $total ?> <?= $total === 1 ? 'registro' : 'registros' ?></strong>
                    <a class="btn btn-p btn-s" href="faq.php#modalPregunta">+ Agregar pregunta</a>
                </div>

                <div class="tw">
                    <table>
                        <thead>
                            <tr>
                                <th>Pregunta</th>
                                <th>Respuesta</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($preguntas as $fila): ?>
                                <tr>
                                    <td><?= e($fila['pregunta']) ?></td>
                                    <td><?= e(mb_strimwidth($fila['respuesta'], 0, 110, '…')) ?></td>
                                    <td class="acc">
                                        <a class="btn btn-o btn-s" href="faq.php?editar=<?= (int) $fila['id_pregunta_frecuente'] ?>#modalPregunta">Editar</a>
                                        <a class="btn btn-r btn-s" href="faq.php?eliminar=<?= (int) $fila['id_pregunta_frecuente'] ?>#modalEliminar">Eliminar</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php if ($total === 0): ?>
                        <div class="vacio">Todavía no hay preguntas registradas.</div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Ventana: agregar / editar pregunta -->
    <div class="modal-backdrop<?= $abrirModal ? ' on' : '' ?>" id="modalPregunta" role="dialog" aria-modal="true" aria-labelledby="modalPreguntaTitulo">
        <div class="mc">
            <h3 id="modalPreguntaTitulo"><?= (int) $form['id_pregunta'] > 0 ? 'Editar pregunta' : 'Agregar pregunta' ?></h3>

            <?php if ($error !== ''): ?>
                <div style="background:#F6D5D2;color:#5F130E;border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:14px"><?= e($error) ?></div>
            <?php endif; ?>

            <form method="post" action="faq.php">
                <input type="hidden" name="accion" value="guardar">
                <input type="hidden" name="id_pregunta" value="<?= (int) $form['id_pregunta'] ?>">

                <div class="campo">
                    <label for="faqPregunta">Pregunta *</label>
                    <input id="faqPregunta" name="pregunta" type="text" maxlength="200" value="<?= e($form['pregunta']) ?>" placeholder="¿Cuál es el horario de atención?" required>
                </div>
                <div class="campo">
                    <label for="faqRespuesta">Respuesta *</label>
                    <textarea id="faqRespuesta" name="respuesta" rows="5" required><?= e($form['respuesta']) ?></textarea>
                </div>
                <div class="campo">
                    <label for="faqOrden">Orden (opcional)</label>
                    <input id="faqOrden" name="orden" type="number" min="0" max="65535" value="<?= e($form['orden']) ?>" placeholder="Vacío = al final de la lista">
                </div>

                <div class="pie">
                    <a class="btn btn-o" href="faq.php">Cancelar</a>
                    <button type="submit" class="btn btn-p">Guardar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Ventana: confirmar eliminación -->
    <?php if ($eliminar): ?>
        <div class="modal-backdrop" id="modalEliminar" role="dialog" aria-modal="true" aria-labelledby="modalEliminarTitulo">
            <div class="mc" style="max-width:420px">
                <h3 id="modalEliminarTitulo">Eliminar pregunta</h3>
                <p style="color:var(--suave)">
                    ¿Seguro que quieres eliminar <strong>"<?= e($eliminar['pregunta']) ?>"</strong>?
                    Dejará de mostrarse en el portal.
                </p>
                <form method="post" action="faq.php">
                    <input type="hidden" name="accion" value="eliminar">
                    <input type="hidden" name="id_pregunta" value="<?= (int) $eliminar['id_pregunta'] ?>">
                    <div class="pie">
                        <a class="btn btn-o" href="faq.php">Cancelar</a>
                        <button type="submit" class="btn btn-r">Eliminar</button>
                    </div>
                </form>
            </div>
        </div>
    <?php endif; ?>
</body>
</html>
