<?php
require __DIR__ . '/../../../includes/guardia.php';
require __DIR__ . '/../../../../web/apis/medicdate/config/conexion.php';

function e($texto)
{
    return htmlspecialchars((string) $texto);
}

$conexion = conectarBD();
$error    = '';

// Guardar (agregar o editar)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['accion'] ?? '') === 'guardar') {
    $id         = (int) ($_POST['id_slide'] ?? 0);
    $titulo     = trim($_POST['titulo'] ?? '');
    $texto      = trim($_POST['texto'] ?? '');
    $botonTexto = trim($_POST['boton_texto'] ?? '');
    $enlace     = trim($_POST['enlace'] ?? '');
    $colorFondo = $_POST['color_fondo'] ?? '#004085';
    $orden      = (int) ($_POST['orden'] ?? 1);
    $activoSlide = isset($_POST['activo']) ? 1 : 0;
    $imagenRuta = $_POST['imagen_actual'] ?? '';

    if ($titulo === '') {
        $error = 'Escribe el título.';
    }

    // Subir imagen (al editar es opcional)
    if ($error === '' && !empty($_FILES['imagen']['name'])) {
        $extension = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));

        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
            $error = 'La imagen debe ser JPG, PNG o WEBP.';
        } elseif ($_FILES['imagen']['size'] > 5 * 1024 * 1024) {
            $error = 'La imagen pesa más de 5 MB.';
        } else {
            $carpeta = __DIR__ . '/../../../img/hero/';
            if (!is_dir($carpeta)) {
                mkdir($carpeta, 0755, true);
            }
            $nombre = 'hero_' . time() . '.' . $extension;
            if (move_uploaded_file($_FILES['imagen']['tmp_name'], $carpeta . $nombre)) {
                $imagenRuta = 'img/hero/' . $nombre;
            } else {
                $error = 'No se pudo guardar la imagen.';
            }
        }
    }

    if ($error === '' && $imagenRuta === '') {
        $error = 'Elige una imagen.';
    }

    if ($error === '') {
        if ($id > 0) {
            $sql = $conexion->prepare(
                "UPDATE hero_slide
                SET titulo = ?, texto = ?, boton_texto = ?, enlace = ?, imagen_ruta = ?, color_fondo = ?, orden = ?, activo = ?
                WHERE id_slide = ?"
            );
            $sql->bind_param('ssssssiii', $titulo, $texto, $botonTexto, $enlace, $imagenRuta, $colorFondo, $orden, $activoSlide, $id);
        } else {
            $sql = $conexion->prepare(
                "INSERT INTO hero_slide (titulo, texto, boton_texto, enlace, imagen_ruta, color_fondo, orden, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $sql->bind_param('ssssssii', $titulo, $texto, $botonTexto, $enlace, $imagenRuta, $colorFondo, $orden, $activoSlide);
        }
        $sql->execute();
        header('Location: hero.php?ok=guardado');
        exit;
    }
}

// Eliminar
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['accion'] ?? '') === 'eliminar') {
    $id  = (int) ($_POST['id_slide'] ?? 0);
    $sql = $conexion->prepare("DELETE FROM hero_slide WHERE id_slide = ?");
    $sql->bind_param('i', $id);
    $sql->execute();
    header('Location: hero.php?ok=eliminado');
    exit;
}

// Datos de la pantalla
$slides = $conexion->query("SELECT * FROM hero_slide ORDER BY orden ASC")->fetch_all(MYSQLI_ASSOC);

// Si viene ?editar=ID, el formulario se llena con ese registro
$editar = null;
if (isset($_GET['editar'])) {
    $sql      = $conexion->prepare("SELECT * FROM hero_slide WHERE id_slide = ?");
    $idEditar = (int) $_GET['editar'];
    $sql->bind_param('i', $idEditar);
    $sql->execute();
    $editar = $sql->get_result()->fetch_assoc();
}

// Si viene ?eliminar=ID, se pide la confirmación
$eliminar = null;
if (isset($_GET['eliminar'])) {
    $sql        = $conexion->prepare("SELECT id_slide, titulo FROM hero_slide WHERE id_slide = ?");
    $idEliminar = (int) $_GET['eliminar'];
    $sql->bind_param('i', $idEliminar);
    $sql->execute();
    $eliminar = $sql->get_result()->fetch_assoc();
}

$conexion->close();

$activo = 'hero';
$titulo = 'Imágenes del hero';
$aviso  = ['guardado' => 'La imagen se guardó.', 'eliminado' => 'La imagen se eliminó.'][$_GET['ok'] ?? ''] ?? '';

// Valores del formulario: vacíos para agregar, o los del registro al editar
$form = $editar ?? [
    'id_slide'    => 0,
    'titulo'      => '',
    'texto'       => '',
    'boton_texto' => '',
    'enlace'      => '',
    'imagen_ruta' => '',
    'color_fondo' => '#004085',
    'orden'       => count($slides) + 1,
    'activo'      => 1,
];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedicDate | Imágenes del hero</title>
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

            <?php if ($error !== ''): ?>
                <div class="panel" style="background:#F6D5D2;color:#5F130E"><?= e($error) ?></div>
            <?php endif; ?>

            <div class="panel">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <p style="margin:0;color:var(--suave)">Estas son las imágenes que se muestran en el carrusel del portal público, en el orden indicado.</p>
                    <a class="btn btn-p btn-s" href="hero.php#modalSlide">+ Agregar imagen</a>
                </div>

                <div class="tw">
                    <table>
                        <thead>
                            <tr>
                                <th>Orden</th>
                                <th>Color</th>
                                <th>Título</th>
                                <th>Texto</th>
                                <th>Botón</th>
                                <th>Enlace</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($slides as $slide): ?>
                                <tr>
                                    <td><?= (int) $slide['orden'] ?></td>
                                    <td><span class="miniatura" style="background:<?= e($slide['color_fondo']) ?>"></span></td>
                                    <td><?= e($slide['titulo']) ?></td>
                                    <td><?= e($slide['texto']) ?></td>
                                    <td><?= e($slide['boton_texto']) ?></td>
                                    <td><?= e($slide['enlace']) ?></td>
                                    <td>
                                        <?php if ($slide['activo']): ?>
                                            <span class="badge b-ok">Activo</span>
                                        <?php else: ?>
                                            <span class="badge b-gris">Oculto</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="acc">
                                        <a class="btn btn-o btn-s" href="hero.php?editar=<?= (int) $slide['id_slide'] ?>#modalSlide">Editar</a>
                                        <a class="btn btn-r btn-s" href="hero.php?eliminar=<?= (int) $slide['id_slide'] ?>#modalEliminar">Eliminar</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php if (count($slides) === 0): ?>
                        <div class="vacio">Todavía no hay imágenes en el carrusel.</div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Ventana: agregar / editar imagen del hero -->
    <div class="modal-backdrop" id="modalSlide" role="dialog" aria-modal="true" aria-labelledby="modalSlideTitulo">
        <div class="mc">
            <h3 id="modalSlideTitulo"><?= $editar ? 'Editar imagen del hero' : 'Agregar imagen del hero' ?></h3>

            <form method="post" action="hero.php" enctype="multipart/form-data">
                <input type="hidden" name="accion" value="guardar">
                <input type="hidden" name="id_slide" value="<?= (int) $form['id_slide'] ?>">
                <input type="hidden" name="imagen_actual" value="<?= e($form['imagen_ruta']) ?>">

                <div class="campo">
                    <label for="slideTitulo">Título</label>
                    <input id="slideTitulo" name="titulo" type="text" maxlength="80" value="<?= e($form['titulo']) ?>" placeholder="Cuidamos de tu Salud" required>
                </div>
                <div class="campo">
                    <label for="slideTexto">Texto</label>
                    <textarea id="slideTexto" name="texto" maxlength="255" placeholder="Atención médica integral con tecnología avanzada..."><?= e($form['texto']) ?></textarea>
                </div>
                <div class="campo">
                    <label for="slideBoton">Texto del botón</label>
                    <input id="slideBoton" name="boton_texto" type="text" maxlength="30" value="<?= e($form['boton_texto']) ?>" placeholder="Agendar Cita">
                </div>
                <div class="campo">
                    <label for="slideEnlace">Enlace</label>
                    <input id="slideEnlace" name="enlace" type="text" maxlength="120" value="<?= e($form['enlace']) ?>" placeholder="#servicios">
                </div>
                <div class="campo">
                    <label for="slideImagen">Imagen (JPG, PNG o WEBP, máximo 5 MB)</label>
                    <input id="slideImagen" name="imagen" type="file" accept="image/jpeg,image/png,image/webp">
                    <?php if ($form['imagen_ruta'] !== ''): ?>
                        <small style="color:var(--suave)">Imagen actual: <?= e($form['imagen_ruta']) ?>. Si no eliges otra, se conserva.</small>
                    <?php endif; ?>
                </div>
                <div style="display:flex;gap:16px">
                    <div class="campo" style="flex:1">
                        <label for="slideColor">Color de fondo</label>
                        <input id="slideColor" name="color_fondo" type="color" value="<?= e($form['color_fondo']) ?>" style="height:44px;padding:4px">
                    </div>
                    <div class="campo" style="flex:1">
                        <label for="slideOrden">Orden</label>
                        <input id="slideOrden" name="orden" type="number" min="1" value="<?= (int) $form['orden'] ?>">
                    </div>
                </div>
                <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--suave);margin-bottom:8px">
                    <input name="activo" type="checkbox" <?= $form['activo'] ? 'checked' : '' ?>>
                    Mostrar en el carrusel
                </label>

                <div class="pie">
                    <a class="btn btn-o" href="hero.php">Cancelar</a>
                    <button type="submit" class="btn btn-p"><?= $editar ? 'Guardar cambios' : 'Guardar' ?></button>
                </div>
            </form>
        </div>
    </div>

    <!-- Ventana: confirmar eliminación -->
    <?php if ($eliminar): ?>
        <div class="modal-backdrop" id="modalEliminar" role="dialog" aria-modal="true" aria-labelledby="modalEliminarTitulo">
            <div class="mc" style="max-width:420px">
                <h3 id="modalEliminarTitulo">Eliminar imagen del hero</h3>
                <p style="color:var(--suave)">
                    ¿Seguro que quieres eliminar <strong>"<?= e($eliminar['titulo']) ?>"</strong> del carrusel?
                    No se puede deshacer.
                </p>
                <form method="post" action="hero.php">
                    <input type="hidden" name="accion" value="eliminar">
                    <input type="hidden" name="id_slide" value="<?= (int) $eliminar['id_slide'] ?>">
                    <div class="pie">
                        <a class="btn btn-o" href="hero.php">Cancelar</a>
                        <button type="submit" class="btn btn-r">Eliminar</button>
                    </div>
                </form>
            </div>
        </div>
    <?php endif; ?>
</body>
</html>
