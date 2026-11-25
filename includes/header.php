<header>
    <nav class="navbar navbar-expand-md container-fluid px-4 py-3">
        <a class="navbar-brand d-flex align-items-center gap-2" href="index.php">
            <img src="img/logo.svg" width="40" height="40" alt="MedicDate">
            <span class="logo-texto">MedicDate</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal" aria-controls="menuPrincipal" aria-expanded="false" aria-label="Mostrar menú">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse justify-content-end" id="menuPrincipal">
            <ul class="navbar-nav align-items-md-center gap-1">
                <li class="nav-item"><a class="nav-link<?= $pagina === 'inicio' ? ' active' : '' ?>" href="index.php"<?= $pagina === 'inicio' ? ' aria-current="page"' : '' ?>>Inicio</a></li>
                <li class="nav-item"><a class="nav-link" href="especialidades.html">Especialidades</a></li>
                <li class="nav-item"><a class="nav-link" href="servicios.html">Servicios</a></li>
                <li class="nav-item"><a class="nav-link" href="nosotros.html">Quiénes somos</a></li>
                <li class="nav-item"><a class="nav-link" href="consejos.html">Consejos y noticias</a></li>
                <li class="nav-item ms-md-2"><a class="btn btn-outline-primary d-flex align-items-center" style="height: 44px" href="login.php">Acceso del personal</a></li>
            </ul>
        </div>
    </nav>
</header>
