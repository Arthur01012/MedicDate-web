<?php
session_start();

if (empty($_SESSION['id_usuario']) || ($_SESSION['rol'] ?? '') !== 'administrador') {
    header('Location: ../../../login.php');
    exit;
}
