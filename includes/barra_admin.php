<?php
$nombreUsuario = $_SESSION['nombre'] ?? 'Administrador';
$partes        = preg_split('/\s+/', trim($nombreUsuario));
$iniciales     = strtoupper(mb_substr($partes[0], 0, 1) . (isset($partes[1]) ? mb_substr($partes[1], 0, 1) : ''));
?>
<div class="bar">
    <h1><?= htmlspecialchars($titulo) ?></h1>
    <div class="u">
        <a style="display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit" href="./cuenta.html">
            <span class="av"><?= htmlspecialchars($iniciales) ?></span>
            <span><?= htmlspecialchars($nombreUsuario) ?> · Administrador</span>
        </a>
        <a class="btn btn-o btn-s" href="../../../index.php">Ver portal</a>
        <a class="btn btn-o btn-s" href="../../../logout.php">Cerrar sesión</a>
    </div>
</div>
