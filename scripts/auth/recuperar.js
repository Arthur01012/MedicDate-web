(function inicializarRecuperarContrasena() {
    'use strict';

    // Solo navegación visual entre pasos, sin conectar a ninguna API todavía.
    const TEXTOS_PASO = {
        1: { paso: 'Paso 1 de 3', subtitulo: 'Escribe el correo de tu cuenta.' },
        2: { paso: 'Paso 2 de 3', subtitulo: 'Responde tu pregunta secreta.' },
        3: { paso: 'Paso 3 de 3', subtitulo: 'Crea una contraseña de al menos 8 caracteres.' }
    };

    const formPaso1 = document.getElementById('formPaso1');
    const formPaso2 = document.getElementById('formPaso2');
    const formPaso3 = document.getElementById('formPaso3');
    const formularios = [formPaso1, formPaso2, formPaso3];

    function irAlPaso(numero) {
        for (let i = 0; i < formularios.length; i++) {
            formularios[i].classList.toggle('d-none', i + 1 !== numero);
        }
        for (let n = 1; n <= 3; n++) {
            document.getElementById('barra' + n).classList.toggle('activo', n <= numero);
        }
        document.getElementById('pasoActual').textContent = TEXTOS_PASO[numero].paso;
        document.getElementById('pasoSubtitulo').textContent = TEXTOS_PASO[numero].subtitulo;
    }

    function manejarPaso1(evento) {
        evento.preventDefault();
        irAlPaso(2);
    }

    function manejarPaso2(evento) {
        evento.preventDefault();
        irAlPaso(3);
    }

    function manejarPaso3(evento) {
        evento.preventDefault();
        alert('Vista de diseño: aquí se guardaría la contraseña nueva.');
    }

    function verOcultarClave(idInput, boton) {
        const input = document.getElementById(idInput);
        const oculta = input.type === 'password';
        input.type = oculta ? 'text' : 'password';
        boton.textContent = oculta ? 'Ocultar' : 'Mostrar';
    }

    function manejarOjoNueva() {
        verOcultarClave('claveNueva', this);
    }

    function manejarOjoConfirmar() {
        verOcultarClave('claveConfirmar', this);
    }

    formPaso1.addEventListener('submit', manejarPaso1);
    formPaso2.addEventListener('submit', manejarPaso2);
    formPaso3.addEventListener('submit', manejarPaso3);
    document.getElementById('botonOjoNueva').addEventListener('click', manejarOjoNueva);
    document.getElementById('botonOjoConfirmar').addEventListener('click', manejarOjoConfirmar);
})();
