const DESTINO_POR_ROL = {
    administrador: "pages/private/admin/panel.html",
    asistente: "pages/private/asistente/agenda_general.html",
    medico: "pages/private/doctor/resumen.html"
};

const formLogin = document.getElementById("formLogin");
const txtCorreo = document.getElementById("usuario");
const txtClave = document.getElementById("clave");
const botonOjo = document.getElementById("botonOjo");
const mensajeError = document.getElementById("mensajeError");

function mostrarError(titulo, detalle) {
    document.getElementById("errorTitulo").textContent = titulo;
    document.getElementById("errorDetalle").textContent = detalle;
    mensajeError.classList.remove("d-none");
}

async function iniciarSesion(evento) {
    evento.preventDefault();
    const correo = txtCorreo.value.trim().toLowerCase();
    const clave = txtClave.value;

    if (correo === "" || clave === "") {
        mostrarError("Escribe tu correo y contraseña.", "");
        return;
    }

    try {
        await AuthService.iniciarSesion(correo, clave);
        const sesion = MedicDateApi.obtenerSesion();

        if (!sesion || !DESTINO_POR_ROL[sesion.rol]) {
            MedicDateApi.limpiarSesion();
            mostrarError("No se pudo iniciar sesión.", "Tu cuenta no tiene un perfil válido asignado.");
            return;
        }

        window.location.href = DESTINO_POR_ROL[sesion.rol];
    } catch (error) {
        if (error.datos) {
            mostrarError(error.datos.mensaje || "No se pudo iniciar sesión.", "");
        } else if (error.codigo === "SESION_INVALIDA" || error.codigo === "ERROR_ALMACENAMIENTO") {
            mostrarError("No se pudo iniciar sesión.", error.message);
        } else {
            mostrarError("No se pudo iniciar sesión.", "Revisa tu conexión e inténtalo de nuevo.");
        }
    }
}

function verOcultarClave() {
    const oculta = txtClave.type === "password";
    txtClave.type = oculta ? "text" : "password";
    botonOjo.textContent = oculta ? "Ocultar" : "Mostrar";
}

formLogin.addEventListener("submit", iniciarSesion);
botonOjo.addEventListener("click", verOcultarClave);
