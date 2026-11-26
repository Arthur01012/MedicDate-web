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
$abrirModal = false;   // true cuando hay un error y el formulario debe seguir abierto
$enviado    = null;    // lo que el usuario escribió, para no perderlo si hay error

// ---------- Guardar (agregar o editar) ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['accion'] ?? '') === 'guardar') {
    $id          = (int) ($_POST['id_especialidad'] ?? 0);
    $nombre      = trim($_POST['nombre'] ?? '');
    $resumen     = trim($_POST['resumen'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');

    if ($nombre === '' || $resumen === '' || $descripcion === '') {
        $error = 'Completa el nombre, el resumen y el detalle.';
    } elseif (mb_strlen($nombre) > 100) {
        $error = 'El nombre puede tener máximo 100 caracteres.';
    } elseif (mb_strlen($resumen) > 200) {
        $error = 'El resumen puede tener máximo 200 caracteres.';
    }

    if ($error === '') {
        // ¿Ya existe otra especialidad con ese nombre? (la BD no permite nombres repetidos)
        $sql = $conexion->prepare("SELECT id_especialidad, activo FROM especialidad WHERE nombre = ? AND id_especialidad <> ?");
        $sql->bind_param('si', $nombre, $id);
        $sql->execute();
        $repetida = $sql->get_result()->fetch_assoc();

        if ($repetida && (int) $repetida['activo'] === 1) {
            $error = 'Ya existe una especialidad con ese nombre.';
        } elseif ($repetida && $id > 0) {
            $error = 'Hay una especialidad eliminada con ese nombre. Usa otro nombre.';
        } elseif ($repetida) {
            // Se agrega una que había sido eliminada: se vuelve a activar con los datos nuevos
            $idRepetida = (int) $repetida['id_especialidad'];
            $sql = $conexion->prepare("UPDATE especialidad SET resumen = ?, descripcion = ?, activo = 1 WHERE id_especialidad = ?");
            $sql->bind_param('ssi', $resumen, $descripcion, $idRepetida);
            $sql->execute();
            header('Location: especialidades.php?ok=guardado');
            exit;
        } elseif ($id > 0) {
            $sql = $conexion->prepare("UPDATE especialidad SET nombre = ?, resumen = ?, descripcion = ? WHERE id_especialidad = ?");
            $sql->bind_param('sssi', $nombre, $resumen, $descripcion, $id);
            $sql->execute();
            header('Location: especialidades.php?ok=guardado');
            exit;
        } else {
            $sql = $conexion->prepare("INSERT INTO especialidad (nombre, resumen, descripcion, activo) VALUES (?, ?, ?, 1)");
            $sql->bind_param('sss', $nombre, $resumen, $descripcion);
            $sql->execute();
            header('Location: especialidades.php?ok=guardado');
            exit;
        }
    }

    // Hubo error: el formulario se queda abierto con lo que se escribió
    $abrirModal = true;
    $enviado = [
        'id_especialidad' => $id,
        'nombre'          => $nombre,
        'resumen'         => $resumen,
        'descripcion'     => $descripcion,
    ];
}

// ---------- Eliminar (baja lógica: activo = 0) ----------
// No se borra el renglón porque médicos y tipos de atención dependen de él.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['accion'] ?? '') === 'eliminar') {
    $id  = (int) ($_POST['id_especialidad'] ?? 0);
    $sql = $conexion->prepare("UPDATE especialidad SET activo = 0 WHERE id_especialidad = ?");
    $sql->bind_param('i', $id);
    $sql->execute();
    header('Location: especialidades.php?ok=eliminado');
    exit;
}

// ---------- Datos de la pantalla ----------
$especialidades = $conexion
    ->query("SELECT id_especialidad, nombre, resumen FROM especialidad WHERE activo = 1 ORDER BY nombre ASC")
    ->fetch_all(MYSQLI_ASSOC);

// Si viene ?editar=ID, el formulario se llena con ese registro
$editar = null;
if (isset($_GET['editar'])) {
    $sql      = $conexion->prepare("SELECT id_especialidad, nombre, resumen, descripcion FROM especialidad WHERE id_especialidad = ? AND activo = 1");
    $idEditar = (int) $_GET['editar'];
    $sql->bind_param('i', $idEditar);
    $sql->execute();
    $editar = $sql->get_result()->fetch_assoc();
}

// Si viene ?eliminar=ID, se pide la confirmación (con cuántos médicos la usan)
$eliminar = null;
if (isset($_GET['eliminar'])) {
    $sql = $conexion->prepare(
        "SELECT e.id_especialidad, e.nombre,
                (SELECT COUNT(*) FROM doctor_especialidad de WHERE de.id_especialidad = e.id_especialidad) AS medicos
        FROM especialidad e
        WHERE e.id_especialidad = ? AND e.activo = 1"
    );
    $idEliminar = (int) $_GET['eliminar'];
    $sql->bind_param('i', $idEliminar);
    $sql->execute();
    $eliminar = $sql->get_result()->fetch_assoc();
}

$conexion->close();

$activo = 'especialidades';   // marca la opción del menú lateral
$titulo = 'Especialidades';   // título de la barra superior
$aviso  = [
    'guardado'  => 'La especialidad se guardó.',
    'eliminado' => 'La especialidad se eliminó.',
][$_GET['ok'] ?? ''] ?? '';

// Valores del formulario: lo escrito (si hubo error), el registro (al editar) o vacío (al agregar)
$form = $enviado ?? $editar ?? [
    'id_especialidad' => 0,
    'nombre'          => '',
    'resumen'         => '',
    'descripcion'     => '',
];
$modalAbierto = $abrirModal;
$total = count($especialidades);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MedicDate | Especialidades</title>
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
                    <a class="btn btn-p btn-s" href="especialidades.php#modalEspecialidad">+ Agregar especialidad</a>
                </div>

                <div class="tw">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Resumen</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($especialidades as $esp): ?>
                                <tr>
                                    <td><?= e($esp['nombre']) ?></td>
                                    <td><?= e($esp['resumen']) ?></td>
                                    <td class="acc">
                                        <a class="btn btn-o btn-s" href="especialidades.php?editar=<?= (int) $esp['id_especialidad'] ?>#modalEspecialidad">Editar</a>
                                        <a class="btn btn-r btn-s" href="especialidades.php?eliminar=<?= (int) $esp['id_especialidad'] ?>#modalEliminar">Eliminar</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php if ($total === 0): ?>
                        <div class="vacio">Todavía no hay especialidades registradas.</div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Ventana: agregar / editar especialidad -->
    <div class="modal-backdrop<?= $modalAbierto ? ' on' : '' ?>" id="modalEspecialidad" role="dialog" aria-modal="true" aria-labelledby="modalEspTitulo">
        <div class="mc">
            <h3 id="modalEspTitulo"><?= (int) $form['id_especialidad'] > 0 ? 'Editar especialidad' : 'Agregar especialidad' ?></h3>

            <?php if ($error !== ''): ?>
                <div style="background:#F6D5D2;color:#5F130E;border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:14px"><?= e($error) ?></div>
            <?php endif; ?>

            <form method="post" action="especialidades.php">
                <input type="hidden" name="accion" value="guardar">
                <input type="hidden" name="id_especialidad" value="<?= (int) $form['id_especialidad'] ?>">

                <div class="campo">
                    <label for="espNombre">Nombre *</label>
                    <input id="espNombre" name="nombre" type="text" maxlength="100" value="<?= e($form['nombre']) ?>" placeholder="Medicina general" required>
                </div>
                <div class="campo">
                    <label for="espResumen">Resumen *</label>
                    <input id="espResumen" name="resumen" type="text" maxlength="200" value="<?= e($form['resumen']) ?>" placeholder="Primer contacto y atención integral." required>
                </div>
                <div class="campo">
                    <label for="espDetalle">Detalle *</label>
                    <textarea id="espDetalle" name="descripcion" rows="5" required><?= e($form['descripcion']) ?></textarea>
                </div>

                <div class="pie">
                    <a class="btn btn-o" href="especialidades.php">Cancelar</a>
                    <button type="submit" class="btn btn-p">Guardar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Ventana: confirmar eliminación -->
    <?php if ($eliminar): ?>
        <div class="modal-backdrop" id="modalEliminar" role="dialog" aria-modal="true" aria-labelledby="modalEliminarTitulo">
            <div class="mc" style="max-width:420px">
                <h3 id="modalEliminarTitulo">Eliminar especialidad</h3>
                <p style="color:var(--suave)">
                    ¿Seguro que quieres eliminar <strong>"<?= e($eliminar['nombre']) ?>"</strong>?
                    Dejará de mostrarse en el portal.
                </p>
                <?php if ((int) $eliminar['medicos'] > 0): ?>
                    <p style="color:var(--suave)">
                        Tiene <strong><?= (int) $eliminar['medicos'] ?></strong>
                        <?= (int) $eliminar['medicos'] === 1 ? 'médico asignado' : 'médicos asignados' ?>.
                    </p>
                <?php endif; ?>
                <form method="post" action="especialidades.php">
                    <input type="hidden" name="accion" value="eliminar">
                    <input type="hidden" name="id_especialidad" value="<?= (int) $eliminar['id_especialidad'] ?>">
                    <div class="pie">
                        <a class="btn btn-o" href="especialidades.php">Cancelar</a>
                        <button type="submit" class="btn btn-r">Eliminar</button>
                    </div>
                </form>
            </div>
        </div>
    <?php endif; ?>
</body>
</html>
