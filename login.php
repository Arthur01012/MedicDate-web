<?php
$title  = 'Acceso del personal | MedicDate';
$pagina = 'login';
require __DIR__ . '/includes/head.php';
require __DIR__ . '/includes/header.php';
?>

<main class="flex-grow-1 d-flex">
    <div class="row g-0 flex-grow-1 w-100 m-0">

        <!-- Lado azul -->
        <div class="col-lg-6 d-none d-lg-flex login-lado">
            <span class="circulo" style="right: -120px; top: -120px; width: 360px; height: 360px"></span>
            <span class="circulo" style="left: -90px; bottom: 90px; width: 260px; height: 260px"></span>

            <div class="position-relative d-flex flex-column gap-4" style="max-width: 460px">
                <div class="d-flex flex-column gap-3">
                    <h1 class="m-0">Atención las 24 horas, bien organizada.</h1>
                    <p class="m-0 claro" style="font-size: 17px; line-height: 1.55">Acceso para el personal del Centro Médico Sagrado Corazón, en Huejutla de Reyes, Hidalgo.</p>
                </div>
                <ul class="list-unstyled m-0 d-flex flex-column gap-3">
                    <li class="d-flex align-items-center gap-3">
                        <i class="bi bi-check-lg"></i>
                        <span>Agenda del día, de lunes a domingo</span>
                    </li>
                    <li class="d-flex align-items-center gap-3">
                        <i class="bi bi-check-lg"></i>
                        <span>Pacientes y citas</span>
                    </li>
                    <li class="d-flex align-items-center gap-3">
                        <i class="bi bi-check-lg"></i>
                        <span>Contenido del portal siempre actualizado</span>
                    </li>
                </ul>
            </div>

            <span class="position-relative claro" style="font-size: 14px">© 2026 Centro Médico Sagrado Corazón · Huejutla de Reyes, Hgo.</span>
        </div>

        <!-- Formulario -->
        <div class="col-lg-6 d-flex align-items-center justify-content-center login-fondo p-4">
            <div class="login-tarjeta d-flex flex-column gap-4">
                <div class="d-flex flex-column gap-2">
                    <h2 class="m-0 fw-bold" style="font-size: 28px">Iniciar sesión</h2>
                    <p class="m-0" style="color: var(--texto-suave)">Escribe tu correo y contraseña.</p>
                </div>

                <!-- Mensaje de error (se muestra desde login.js) -->
                <div id="mensajeError" class="alert alert-danger m-0 d-none" role="alert">
                    <strong id="errorTitulo"></strong>
                    <div id="errorDetalle" style="font-size: 14px"></div>
                </div>

                <form id="formLogin" class="d-flex flex-column gap-3" novalidate>
                    <div>
                        <label class="form-label" for="usuario">Correo</label>
                        <input class="form-control" style="height: 52px" id="usuario" type="email" autocomplete="username" placeholder="nombre@centromedico.com">
                    </div>
                    <div>
                        <label class="form-label" for="clave">Contraseña</label>
                        <div class="position-relative">
                            <input class="form-control pe-5" style="height: 52px" id="clave" type="password" autocomplete="current-password">
                            <button class="boton-ojo" id="botonOjo" type="button">Mostrar</button>
                        </div>
                    </div>
                    <div class="text-end">
                        <a class="fw-medium text-decoration-none" href="recuperar.html">¿Olvidaste tu contraseña?</a>
                    </div>
                    <div class="d-flex flex-column gap-1">
                        <button class="btn btn-primary btn-grande" type="submit">Entrar</button>
                        <a class="btn btn-link btn-grande" style="color: var(--texto-suave); height: 48px" href="index.php">&larr; Volver al portal</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</main>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="service/api_config.js"></script>
<script src="service/auth_service.js"></script>
<script src="js/login.js"></script>
</body>
</html>
