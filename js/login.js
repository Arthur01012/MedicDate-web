
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
        const respuesta = await AuthService.iniciarSesion(correo, clave);
        const usuario = respuesta.usuario;

        // Guardamos lo que devuelve la API (id_usuario, id_empleado, nombre, correo, rol)
        sessionStorage.setItem("usuario", JSON.stringify(usuario));
        window.location.href = DESTINO_POR_ROL[usuario.rol];
    } catch (error) {
        if (error.datos) {
            mostrarError(error.datos.mensaje || "No se pudo iniciar sesión.", "");
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
