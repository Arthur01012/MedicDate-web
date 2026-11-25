<?php
require __DIR__ . '/../web/apis/medicdate/config/conexion.php';

$conexion = conectarBD();
$resultado = $conexion->query("SELECT titulo, texto, boton_texto, enlace, imagen_ruta, color_fondo FROM hero_slide WHERE activo = 1 ORDER BY orden ASC");
$slides = $resultado->fetch_all(MYSQLI_ASSOC);
$conexion->close();

$title  = 'MedicDate | Centro Médico Sagrado Corazón';
$pagina = 'inicio';
require __DIR__ . '/includes/head.php';
require __DIR__ . '/includes/header.php';
?>

    <main class="flex-grow-1">

        <section class="hero-full">
            <div id="carruselHero" class="carousel slide hero-carrusel<?= count($slides) <= 1 ? ' una-sola' : '' ?>"
                aria-label="Novedades del centro médico"
                <?= count($slides) > 1 ? 'data-bs-ride="carousel" data-bs-interval="6000" data-bs-pause="hover"' : '' ?>>

                <div class="carousel-indicators">
                    <?php foreach ($slides as $i => $slide): ?>
                        <button type="button" data-bs-target="#carruselHero" data-bs-slide-to="<?= $i ?>"
                                <?= $i === 0 ? 'class="active" aria-current="true"' : '' ?>
                                aria-label="Diapositiva <?= $i + 1 ?>"></button>
                    <?php endforeach; ?>
                </div>

                <div class="carousel-inner">
                    <?php foreach ($slides as $i => $slide): ?>
                        <div class="carousel-item hero-slide<?= $i === 0 ? ' active' : '' ?>"
                            style="--imagen: url('<?= htmlspecialchars($baseSitio . $slide['imagen_ruta']) ?>'); background-color: <?= htmlspecialchars($slide['color_fondo'] ?: '#0B4A82') ?>">
                            <div class="contenedor">
                                <div class="hero-contenido d-flex flex-column gap-3">
                                    <?php if ($i === 0): ?>
                                        <h1 class="hero-titulo m-0"><?= htmlspecialchars($slide['titulo']) ?></h1>
                                    <?php else: ?>
                                        <h2 class="hero-titulo m-0"><?= htmlspecialchars($slide['titulo']) ?></h2>
                                    <?php endif; ?>

                                    <?php if (!empty($slide['texto'])): ?>
                                        <p class="hero-texto m-0"><?= htmlspecialchars($slide['texto']) ?></p>
                                    <?php endif; ?>

                                    <?php if (!empty($slide['boton_texto']) && !empty($slide['enlace'])): ?>
                                        <a class="btn btn-primary btn-grande px-4 align-self-start" href="<?= htmlspecialchars($slide['enlace']) ?>">
                                            <?= htmlspecialchars($slide['boton_texto']) ?>
                                        </a>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>

                <button class="carousel-control-prev" type="button" data-bs-target="#carruselHero" data-bs-slide="prev" aria-label="Anterior">
                    <span class="flecha"><i class="bi bi-chevron-left"></i></span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#carruselHero" data-bs-slide="next" aria-label="Siguiente">
                    <span class="flecha"><i class="bi bi-chevron-right"></i></span>
                </button>
            </div>
        </section>

        <section class="contenedor py-5" id="servicios">
            <div class="mb-4">
                <h2 class="seccion-titulo m-0">Nuestros servicios</h2>
                <p class="seccion-texto m-0 mt-2">Atención médica para toda la familia, con citas que reservas desde tu celular.</p>
            </div>
            <div class="row g-3">
                <div class="col-sm-6 col-lg-4">
                    <div class="servicio">
                        <span class="servicio-icono"><i class="bi bi-clipboard2-pulse"></i></span>
                        <h3>Medicina general</h3>
                        <p>Consulta, revisión y seguimiento de tu salud, además de recetas y certificados médicos.</p>
                    </div>
                </div>
                <div class="col-sm-6 col-lg-4">
                    <div class="servicio">
                        <span class="servicio-icono"><i class="bi bi-emoji-smile"></i></span>
                        <h3>Pediatría</h3>
                        <p>Control del niño sano, vacunas y atención de enfermedades comunes en la infancia.</p>
                    </div>
                </div>
                <div class="col-sm-6 col-lg-4">
                    <div class="servicio">
                        <span class="servicio-icono"><i class="bi bi-heart-pulse"></i></span>
                        <h3>Cardiología</h3>
                        <p>Revisión del corazón, control de la presión arterial y estudios cardiológicos.</p>
                    </div>
                </div>
                <div class="col-sm-6 col-lg-4">
                    <div class="servicio">
                        <span class="servicio-icono"><i class="bi bi-gender-female"></i></span>
                        <h3>Ginecología</h3>
                        <p>Control prenatal, planificación familiar y revisiones preventivas.</p>
                    </div>
                </div>
                <div class="col-sm-6 col-lg-4">
                    <div class="servicio">
                        <span class="servicio-icono"><i class="bi bi-shield-plus"></i></span>
                        <h3>Odontología</h3>
                        <p>Limpieza, revisión dental y tratamiento de caries para toda la familia.</p>
                    </div>
                </div>
                <div class="col-sm-6 col-lg-4">
                    <div class="servicio">
                        <span class="servicio-icono"><i class="bi bi-droplet-half"></i></span>
                        <h3>Laboratorio clínico</h3>
                        <p>Análisis de sangre y orina, con resultados entregados en el mismo centro.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="seccion-tonal py-5" id="medicos">
            <div class="contenedor">
                <div class="mb-4">
                    <h2 class="seccion-titulo m-0">Nuestros médicos</h2>
                    <p class="seccion-texto m-0 mt-2">Profesionales con experiencia que te atienden con calidez.</p>
                </div>
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="medico">
                            <span class="avatar avatar-grande">LM</span>
                            <h3>Dra. Laura Méndez</h3>
                            <span class="medico-esp">Medicina general</span>
                            <p>Más de 10 años de experiencia en atención familiar y medicina preventiva.</p>
                            <span class="dias-chip"><i class="bi bi-calendar-check"></i> Lunes a viernes</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="medico">
                            <span class="avatar avatar-grande">JR</span>
                            <h3>Dr. José Rodríguez</h3>
                            <span class="medico-esp">Cardiología</span>
                            <p>Especialista en el cuidado del corazón y el control de la presión arterial.</p>
                            <span class="dias-chip"><i class="bi bi-calendar-check"></i> Martes, jueves y sábado</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="medico">
                            <span class="avatar avatar-grande">AT</span>
                            <h3>Dra. Ana Torres</h3>
                            <span class="medico-esp">Pediatría</span>
                            <p>Atiende a bebés, niños y adolescentes con un trato paciente y cercano.</p>
                            <span class="dias-chip"><i class="bi bi-calendar-check"></i> Lunes, miércoles y viernes</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="seccion-tonal py-5" id="resenas">
            <div class="contenedor">
                <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
                    <div>
                        <h2 class="seccion-titulo m-0">Lo que dicen nuestros pacientes</h2>
                        <p class="seccion-texto m-0 mt-2">Opiniones de quienes ya se atendieron en el centro.</p>
                    </div>
                    <div class="calificacion">
                        <strong>4.4</strong>
                        <span>
                            <span class="estrellas" aria-label="4.4 de 5 estrellas">★★★★☆</span>
                            <small class="d-block">Promedio en Google (19 opiniones)</small>
                        </span>
                    </div>
                </div>
                <div class="row g-3">
                    <div class="col-md-4">
                        <figure class="resena">
                            <span class="estrellas" aria-label="5 de 5 estrellas">★★★★★</span>
                            <blockquote>Reservé mi cita desde el celular en un minuto y me atendieron a la hora. Muy buen trato.</blockquote>
                            <figcaption><span class="avatar">MG</span><span><strong>María G.</strong><small>Medicina general</small></span></figcaption>
                        </figure>
                    </div>
                    <div class="col-md-4">
                        <figure class="resena">
                            <span class="estrellas" aria-label="5 de 5 estrellas">★★★★★</span>
                            <blockquote>La doctora fue muy paciente con mi hijo y nos explicó todo con claridad. Lo recomiendo.</blockquote>
                            <figcaption><span class="avatar">CR</span><span><strong>Carlos R.</strong><small>Pediatría</small></span></figcaption>
                        </figure>
                    </div>
                    <div class="col-md-4">
                        <figure class="resena">
                            <span class="estrellas" aria-label="4 de 5 estrellas">★★★★☆</span>
                            <blockquote>Instalaciones limpias y personal amable. Ya no tengo que llamar para saber si hay lugar.</blockquote>
                            <figcaption><span class="avatar">SH</span><span><strong>Sofía H.</strong><small>Cardiología</small></span></figcaption>
                        </figure>
                    </div>
                </div>
            </div>
        </section>

        <section class="contenedor py-5" id="ubicacion">
            <div class="mb-4">
                <h2 class="seccion-titulo m-0">Contacto y ubicación</h2>
                <p class="seccion-texto m-0 mt-2">Visítanos o escríbenos, con gusto te ayudamos.</p>
            </div>
            <div class="row g-3">
                <div class="col-lg-5">
                    <div class="tarjeta-contacto justify-content-center">
                        <div class="dato-contacto"><span class="servicio-icono"><i class="bi bi-geo-alt"></i></span><span><strong>Dirección</strong>A un lado de maderería "El Pino", Adolfo López Mateos S/N, Tepoxtequito, 43000 Huejutla de Reyes, Hgo.</span></div>
                        <div class="dato-contacto"><span class="servicio-icono"><i class="bi bi-telephone"></i></span><span><strong>Teléfono</strong><a href="tel:+527717293074">771 729 3074</a></span></div>
                        <div class="dato-contacto"><span class="servicio-icono"><i class="bi bi-clock"></i></span><span><strong>Horario</strong>Abierto las 24 horas, todos los días</span></div>
                    </div>
                </div>
                <div class="col-lg-7">
                    <!-- Ubicación real del centro (coordenadas de Google Maps) -->
                    <iframe class="mapa" title="Mapa de ubicación del centro médico" loading="lazy"
                        src="https://maps.google.com/maps?q=21.1522847,-98.3973462&z=17&output=embed"></iframe>
                </div>
            </div>
        </section>
    </main>

    <footer class="pie">
    <div class="contenedor pt-4 pb-3">
        <div class="row g-4 justify-content-between">
            <div class="col-md-4">
                <a class="d-flex align-items-center gap-2 mb-2" href="index.php" style="min-height: 0">
                    <img src="img/logo.svg" width="36" height="36" alt="MedicDate">
                    <span class="logo-texto" style="font-size: 18px">MedicDate</span>
                </a>
                <p class="m-0" style="font-size: 14px; color: var(--texto-suave)">Centro Médico Sagrado Corazón. Gestión de citas médicas.</p>
            </div>
            <div class="col-6 col-md-auto">
                <h2>Explorar</h2>
                <a href="index.php">Inicio</a>
                <a href="especialidades.html">Especialidades</a>
                <a href="medicos.html">Médicos</a>
                <a href="servicios.html">Servicios</a>
            </div>
            <div class="col-6 col-md-auto">
                <h2>Información</h2>
                <a href="nosotros.html">Quiénes somos</a>
                <a href="consejos.html">Consejos y noticias</a>
                <a href="faq.html">Preguntas frecuentes</a>
                <a href="aviso.html">Aviso de privacidad</a>
            </div>
            <div class="col-12 col-md-4">
                <h2>Contacto</h2>
                <span class="dato">A un lado de maderería "El Pino", Adolfo López Mateos S/N, Tepoxtequito, 43000 Huejutla de Reyes, Hgo.</span>
                <span class="dato"><a href="tel:+527717293074">771 729 3074</a></span>
                <span class="dato">Abierto las 24 horas, todos los días</span>
            </div>
            <div class="col-6 col-md-auto">
                <h2>Personal</h2>
                <a class="destacado" href="login.php">Acceso del personal</a>
            </div>
        </div>
    </div>
    <div class="contenedor pie-final">© 2026 Centro Médico Sagrado Corazón · MedicDate</div>
</footer>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>