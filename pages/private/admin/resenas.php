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
    $id        = (int) ($_POST['id_resena'] ?? 0);
    $autor     = trim($_POST['nombre_autor'] ?? '');
    $estrellas = (int) ($_POST['estrellas'] ?? 0);
    $texto     = trim(str_replace("\r\n", "\n", $_POST['texto'] ?? ''));
    $publicada = isset($_POST['publicada']) ? 1 : 0;

    if ($autor === '' || $texto === '') {
        $error = 'Completa el nombre y el texto de la reseña.';
    } elseif ($estrellas < 1 || $estrellas > 5) {
        $error = 'Elige una calificación de 1 a 5 estrellas.';
    } elseif (mb_strlen($autor) > 100) {
        $error = 'El nombre puede tener máximo 100 caracteres.';
    } elseif (mb_strlen($texto) > 500) {
        $error = 'El texto puede tener máximo 500 caracteres.';
    }

    if ($error === '') {
        if ($id > 0) {
            $sql = $conexion->prepare("UPDATE resena SET nombre_autor = ?, estrellas = ?, texto = ?, publicada = ? WHERE id_resena = ?");
            $sql->bind_param('sisii', $autor, $estrellas, $texto, $publicada, $id);
        } else {
            $sql = $conexion->prepare("INSERT INTO resena (nombre_autor, estrellas, texto, publicada) VALUES (?, ?, ?, ?)");
            $sql->bind_param('sisi', $autor, $estrellas, $texto, $publicada);
        }
        $sql->execute();
        header('Location: resenas.php?ok=guardado');
        exit;
    }

    $abrirModal = true;
    $enviado = [
        'id_resena'    => $id,
        'nombre_autor' => $autor,
        'estrellas'    => $estrellas,
        'texto'        => $texto,
        'publicada'    => $publicada,
    ];
}

// ---------- Eliminar (la tabla resena no tiene columna "activo", se borra el renglón) ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['accion'] ?? '') === 'eliminar') {
    $id  = (int) ($_POST['id_resena'] ?? 0);
    $sql = $conexion->prepare("DELETE FROM resena WHERE id_resena = ?");
    $sql->bind_param('i', $id);
    $sql->execute();
    header('Location: resenas.php?ok=eliminado');
    exit;
}

// ---------- Datos de la pantalla ----------
$resenas = $conexion
    ->query("SELECT id_resena, nombre_autor, estrellas, texto, publicada FROM resena ORDER BY fecha_registro DESC, id_resena DESC")
    ->fetch_all(MYSQLI_ASSOC);

$editar = null;
if (isset($_GET['editar'])) {
    $sql      = $conexion->prepare("SELECT id_resena, nombre_autor, estrellas, texto, publicada FROM resena WHERE id_resena = ?");
    $idEditar = (int) $_GET['editar'];
    $sql->bind_param('i', $idEditar);
    $sql->execute();
    $editar = $sql->get_result()->fetch_assoc();
}

$eliminar = null;
if (isset($_GET['eliminar'])) {
    $sql        = $conexion->prepare("SELECT id_resena, nombre_autor FROM resena WHERE id_resena = ?");
    $idEliminar = (int) $_GET['eliminar'];
    $sql->bind_param('i', $idEliminar);
    $sql->execute();
    $eliminar = $sql->get_result()->fetch_assoc();
}

$conexion->close();

$activo = 'resenas';
$titulo = 'Reseñas';
$aviso  = [
    'guardado'  => 'La reseña se guardó.',
    'eliminado' => 'La reseña se eliminó.',
][$_GET['ok'] ?? ''] ?? '';

$form = $enviado ?? $editar ?? [
    'id_resena'    => 0,
    'nombre_autor' => '',
    'estrellas'    => 5,
    'texto'        => '',
    'publicada'    => 1,
];
$total = count($resenas);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedicDate | Reseñas</title>
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
                <p style="margin:0 0 16px;color:var(--suave)">Solo se muestran en el Inicio las reseñas marcadas como publicadas (las 3 más recientes).</p>

                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap">
                    <strong><?= $total ?> <?= $total === 1 ? 'registro' : 'registros' ?></strong>
                    <a class="btn btn-p btn-s" href="resenas.php#modalResena">+ Agregar reseña</a>
                </div>

                <div class="tw">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Calificación</th>
                                <th>Texto</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($resenas as $fila): ?>
                                <tr>
                                    <td><?= e($fila['nombre_autor']) ?></td>
                                    <td>
                                        <span style="color:#B26A00;letter-spacing:2px;white-space:nowrap" aria-label="<?= (int) $fila['estrellas'] ?> de 5 estrellas"><?= str_repeat('★', (int) $fila['estrellas']) . str_repeat('☆', 5 - (int) $fila['estrellas']) ?></span>
                                    </td>
                                    <td><?= e(mb_strimwidth($fila['texto'], 0, 110, '…')) ?></td>
                                    <td>
                                        <?php if ((int) $fila['publicada'] === 1): ?>
                                            <span class="badge b-ok">Publicada</span>
                                        <?php else: ?>
                                            <span class="badge b-gris">Oculta</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="acc">
                                        <a class="btn btn-o btn-s" href="resenas.php?editar=<?= (int) $fila['id_resena'] ?>#modalResena">Editar</a>
                                        <a class="btn btn-r btn-s" href="resenas.php?eliminar=<?= (int) $fila['id_resena'] ?>#modalEliminar">Eliminar</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php if ($total === 0): ?>
                        <div class="vacio">Todavía no hay reseñas registradas.</div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Ventana: agregar / editar reseña -->
    <div class="modal-backdrop<?= $abrirModal ? ' on' : '' ?>" id="modalResena" role="dialog" aria-modal="true" aria-labelledby="modalResenaTitulo">
        <div class="mc">
            <h3 id="modalResenaTitulo"><?= (int) $form['id_resena'] > 0 ? 'Editar reseña' : 'Agregar reseña' ?></h3>

            <?php if ($error !== ''): ?>
                <div style="background:#F6D5D2;color:#5F130E;border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:14px"><?= e($error) ?></div>
            <?php endif; ?>

            <form method="post" action="resenas.php">
                <input type="hidden" name="accion" value="guardar">
                <input type="hidden" name="id_resena" value="<?= (int) $form['id_resena'] ?>">

                <div class="campo">
                    <label for="resNombre">Nombre *</label>
                    <input id="resNombre" name="nombre_autor" type="text" maxlength="100" value="<?= e($form['nombre_autor']) ?>" placeholder="María G." required>
                </div>
                <div class="campo">
                    <label for="resEstrellas">Calificación *</label>
                    <select id="resEstrellas" name="estrellas" required>
                        <?php for ($n = 5; $n >= 1; $n--): ?>
                            <option value="<?= $n ?>"<?= (int) $form['estrellas'] === $n ? ' selected' : '' ?>><?= $n ?> <?= $n === 1 ? 'estrella' : 'estrellas' ?></option>
                        <?php endfor; ?>
                    </select>
                </div>
                <div class="campo">
                    <label for="resTexto">Texto *</label>
                    <textarea id="resTexto" name="texto" rows="4" maxlength="500" required><?= e($form['texto']) ?></textarea>
                </div>
                <label style="display:flex;align-items:center;gap:10px;margin-bottom:16px;font-size:14px">
                    <input type="checkbox" name="publicada" value="1" style="width:18px;height:18px"<?= (int) $form['publicada'] === 1 ? ' checked' : '' ?>>
                    Publicar en el Inicio
                </label>

                <div class="pie">
                    <a class="btn btn-o" href="resenas.php">Cancelar</a>
                    <button type="submit" class="btn btn-p">Guardar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Ventana: confirmar eliminación -->
    <?php if ($eliminar): ?>
        <div class="modal-backdrop" id="modalEliminar" role="dialog" aria-modal="true" aria-labelledby="modalEliminarTitulo">
            <div class="mc" style="max-width:420px">
                <h3 id="modalEliminarTitulo">Eliminar reseña</h3>
                <p style="color:var(--suave)">
                    ¿Seguro que quieres eliminar la reseña de <strong>"<?= e($eliminar['nombre_autor']) ?>"</strong>?
                    Esta acción no se puede deshacer. Si solo quieres quitarla del Inicio, edítala y desmarca "Publicar en el Inicio".
                </p>
                <form method="post" action="resenas.php">
                    <input type="hidden" name="accion" value="eliminar">
                    <input type="hidden" name="id_resena" value="<?= (int) $eliminar['id_resena'] ?>">
                    <div class="pie">
                        <a class="btn btn-o" href="resenas.php">Cancelar</a>
                        <button type="submit" class="btn btn-r">Eliminar</button>
                    </div>
                </form>
            </div>
        </div>
    <?php endif; ?>
</body>
</html>
