// Acceso del personal
// Por ahora las cuentas son de ejemplo; despues se cambian por la consulta a la API.
const usuarios = [
    { correo: "elena.cruz@centromedico.com", clave: "Asistente123*", nombre: "Elena Cruz", rol: "asistente", activa: true, destino: "hero-imagenes.html" },
    { correo: "jose.rodriguez@centromedico.com", clave: "Medico123*", nombre: "José Rodríguez", rol: "medico", activa: true, destino: "mi-agenda.html" }
];

const formLogin = document.getElementById("formLogin");
const txtCorreo = document.getElementById("usuario");
const txtClave = document.getElementById("clave");
const chkRecordar = document.getElementById("recordar");
const botonOjo = document.getElementById("botonOjo");
const mensajeError = document.getElementById("mensajeError");

function mostrarError(titulo, detalle) {
    document.getElementById("errorTitulo").textContent = titulo;
    document.getElementById("errorDetalle").textContent = detalle;
    mensajeError.classList.remove("d-none");
}

function iniciarSesion(evento) {
    evento.preventDefault();
    const correo = txtCorreo.value.trim().toLowerCase();
    const clave = txtClave.value;

    if (correo === "" || clave === "") {
        mostrarError("Escribe tu correo y contraseña.", "");
        return;
    }

    const usuario = usuarios.find(u => u.correo === correo && u.clave === clave && u.activa);
    if (!usuario) {
        mostrarError("Correo o contraseña incorrectos.", "Revisa los datos e inténtalo de nuevo. Si tu cuenta está desactivada, contacta al administrador.");
        return;
    }

    // Guardamos solo lo necesario; con "Mantener sesión" se queda aunque se cierre el navegador
    const almacen = chkRecordar.checked ? localStorage : sessionStorage;
    almacen.setItem("usuario", JSON.stringify({ nombre: usuario.nombre, rol: usuario.rol }));
    window.location.href = usuario.destino;
}

function verOcultarClave() {
    const oculta = txtClave.type === "password";
    txtClave.type = oculta ? "text" : "password";
    botonOjo.textContent = oculta ? "Ocultar" : "Mostrar";
}

formLogin.addEventListener("submit", iniciarSesion);
botonOjo.addEventListener("click", verOcultarClave);
