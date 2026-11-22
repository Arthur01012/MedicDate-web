// Imágenes del hero (CRUD de la parte privada)
// Las imágenes se guardan en el navegador; después se cambian por llamadas a la API.

// ----- Sesión: solo entra el asistente -----
const sesionGuardada = sessionStorage.getItem("usuario") || localStorage.getItem("usuario");
const sesion = sesionGuardada ? JSON.parse(sesionGuardada) : null;
if (!sesion || sesion.rol !== "asistente") {
    window.location.href = "login.html";
}

// ----- Datos -----
let imagenes = leerHero();
let idEditando = null;      // null = estamos agregando
let idEliminar = null;
let imagenActual = "";      // imagen que se va a guardar (la actual o la nueva)

// ----- Elementos de la página -----
const listaImagenes = document.getElementById("listaImagenes");
const sinImagenes = document.getElementById("sinImagenes");
const aviso = document.getElementById("aviso");

const formImagen = document.getElementById("formImagen");
const tituloFormulario = document.getElementById("tituloFormulario");
const campoImagen = document.getElementById("campoImagen");
const vistaPrevia = document.getElementById("vistaPrevia");
const notaImagen = document.getElementById("notaImagen");
const campoTitulo = document.getElementById("campoTitulo");
const campoTexto = document.getElementById("campoTexto");
const campoBoton = document.getElementById("campoBoton");
const campoEnlace = document.getElementById("campoEnlace");
const errorFormulario = document.getElementById("errorFormulario");
const botonGuardar = document.getElementById("botonGuardar");
const botonCancelar = document.getElementById("botonCancelar");

const modalEliminar = new bootstrap.Modal(document.getElementById("modalEliminar"));

// ----- Datos del usuario en el menú -----
function mostrarUsuario() {
    if (!sesion) return;
    const iniciales = sesion.nombre.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
    document.getElementById("avatarUsuario").textContent = iniciales;
    document.getElementById("nombreUsuario").textContent = sesion.nombre;
    document.getElementById("rolUsuario").textContent = "Asistente";
}

function cerrarSesion() {
    sessionStorage.removeItem("usuario");
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

// ----- Avisos y errores -----
function mostrarAviso(mensaje) {
    aviso.textContent = mensaje;
    aviso.classList.remove("d-none");
}

function mostrarError(mensaje) {
    errorFormulario.textContent = mensaje;
    errorFormulario.classList.remove("d-none");
}

function limpiarMensajes() {
    aviso.classList.add("d-none");
    errorFormulario.classList.add("d-none");
}

// ----- Leer (lista) -----
function mostrarImagenes() {
    listaImagenes.innerHTML = "";
    sinImagenes.classList.toggle("d-none", imagenes.length > 0);

    imagenes.forEach(function (img, posicion) {
        const fila = document.createElement("div");
        fila.className = "imagen-item";

        const miniatura = document.createElement("img");
        miniatura.className = "imagen-mini";
        miniatura.src = img.imagen;
        miniatura.alt = "";

        const info = document.createElement("div");
        info.className = "imagen-info";
        const orden = document.createElement("span");
        orden.className = "imagen-orden";
        orden.textContent = "Imagen " + (posicion + 1);
        const titulo = document.createElement("strong");
        titulo.textContent = img.titulo;
        const texto = document.createElement("span");
        texto.textContent = img.texto || "Sin descripción";
        info.append(orden, titulo, texto);

        const acciones = document.createElement("div");
        acciones.className = "d-flex flex-column";
        acciones.append(crearBoton("Editar", "editar", img.id, ""), crearBoton("Eliminar", "eliminar", img.id, "text-danger"));

        fila.append(miniatura, info, acciones);
        listaImagenes.appendChild(fila);
    });
}

function crearBoton(texto, accion, id, extra) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn btn-link btn-sm " + extra;
    boton.textContent = texto;
    boton.dataset.accion = accion;
    boton.dataset.id = id;
    return boton;
}

// ----- Imagen: validar, reducir y mostrar vista previa -----
// La imagen se reduce a 1600 px de ancho para que ocupe poco espacio en el navegador
function procesarImagen(archivo) {
    return new Promise(function (resolver, rechazar) {
        const lector = new FileReader();
        lector.onerror = function () { rechazar(); };
        lector.onload = function () {
            const foto = new Image();
            foto.onerror = function () { rechazar(); };
            foto.onload = function () {
                const ancho = Math.min(foto.width, 1600);
                const alto = Math.round(foto.height * ancho / foto.width);
                const lienzo = document.createElement("canvas");
                lienzo.width = ancho;
                lienzo.height = alto;
                lienzo.getContext("2d").drawImage(foto, 0, 0, ancho, alto);
                resolver(lienzo.toDataURL("image/jpeg", 0.82));
            };
            foto.src = lector.result;
        };
        lector.readAsDataURL(archivo);
    });
}

function mostrarVistaPrevia(origen) {
    if (origen) {
        vistaPrevia.src = origen;
        vistaPrevia.classList.remove("d-none");
    } else {
        vistaPrevia.removeAttribute("src");
        vistaPrevia.classList.add("d-none");
    }
}

async function elegirImagen() {
    errorFormulario.classList.add("d-none");
    const archivo = campoImagen.files[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
        campoImagen.value = "";
        mostrarError("El archivo debe ser una imagen (JPG, PNG o WebP).");
        return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
        campoImagen.value = "";
        mostrarError("La imagen pesa más de 5 MB. Elige una más ligera.");
        return;
    }
    try {
        imagenActual = await procesarImagen(archivo);
        mostrarVistaPrevia(imagenActual);
    } catch (error) {
        campoImagen.value = "";
        mostrarError("No se pudo leer la imagen. Prueba con otra.");
    }
}

// ----- Formulario: modo agregar / modo editar -----
function prepararAgregar() {
    idEditando = null;
    imagenActual = "";
    formImagen.reset();
    mostrarVistaPrevia("");
    tituloFormulario.textContent = "Nueva imagen";
    botonGuardar.textContent = "Agregar imagen";
    botonCancelar.classList.add("d-none");
    notaImagen.classList.add("d-none");
    errorFormulario.classList.add("d-none");
}

function prepararEditar(id) {
    const img = imagenes.find(function (i) { return i.id === id; });
    if (!img) return;
    limpiarMensajes();
    idEditando = id;
    imagenActual = img.imagen;
    campoImagen.value = "";
    campoTitulo.value = img.titulo;
    campoTexto.value = img.texto || "";
    campoBoton.value = img.boton || "";
    campoEnlace.value = img.enlace || "#servicios";
    mostrarVistaPrevia(img.imagen);
    tituloFormulario.textContent = "Editar imagen";
    botonGuardar.textContent = "Guardar cambios";
    botonCancelar.classList.remove("d-none");
    notaImagen.classList.remove("d-none");
    formImagen.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ----- Validar -----
function validar() {
    if (!imagenActual) return "Elige una imagen.";
    if (campoTitulo.value.trim() === "") return "Escribe un título.";
    if (idEditando === null && imagenes.length >= MAX_IMAGENES) {
        return "Ya hay " + MAX_IMAGENES + " imágenes. Elimina una para agregar otra.";
    }
    return "";
}

// ----- Crear y actualizar -----
function guardarImagen(evento) {
    evento.preventDefault();
    limpiarMensajes();

    const mensaje = validar();
    if (mensaje) {
        mostrarError(mensaje);
        return;
    }

    // Sin texto en el botón, no se muestra botón
    const textoBoton = campoBoton.value.trim();
    const datos = {
        imagen: imagenActual,
        titulo: campoTitulo.value.trim(),
        texto: campoTexto.value.trim(),
        boton: textoBoton,
        enlace: textoBoton ? campoEnlace.value : ""
    };

    const copia = imagenes.map(function (i) { return Object.assign({}, i); });
    let aviso1;
    if (idEditando === null) {
        const nuevoId = copia.reduce(function (mayor, i) { return Math.max(mayor, i.id); }, 0) + 1;
        copia.push(Object.assign({ id: nuevoId }, datos));
        aviso1 = "Imagen agregada al carrusel.";
    } else {
        const destino = copia.find(function (i) { return i.id === idEditando; });
        Object.assign(destino, datos);
        aviso1 = "Se guardaron los cambios de la imagen.";
    }

    try {
        guardarHero(copia);
    } catch (error) {
        mostrarError("No hay espacio para guardar la imagen. Usa una más pequeña o elimina otra.");
        return;
    }

    imagenes = copia;
    mostrarImagenes();
    prepararAgregar();
    mostrarAviso(aviso1);
}

// ----- Eliminar -----
function pedirEliminar(id) {
    const img = imagenes.find(function (i) { return i.id === id; });
    if (!img) return;
    idEliminar = id;
    document.getElementById("imagenEliminar").src = img.imagen;
    document.getElementById("tituloEliminar").textContent = "¿Eliminar «" + img.titulo + "»?";
    modalEliminar.show();
}

function confirmarEliminar() {
    const copia = imagenes.filter(function (i) { return i.id !== idEliminar; });
    guardarHero(copia);
    imagenes = copia;
    if (idEditando === idEliminar) prepararAgregar();
    mostrarImagenes();
    modalEliminar.hide();
    mostrarAviso("Imagen eliminada del carrusel.");
}

// ----- Eventos -----
listaImagenes.addEventListener("click", function (evento) {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;
    const id = Number(boton.dataset.id);
    if (boton.dataset.accion === "editar") prepararEditar(id);
    if (boton.dataset.accion === "eliminar") pedirEliminar(id);
});

campoImagen.addEventListener("change", elegirImagen);
formImagen.addEventListener("submit", guardarImagen);
botonCancelar.addEventListener("click", prepararAgregar);
document.getElementById("botonConfirmarEliminar").addEventListener("click", confirmarEliminar);
document.getElementById("botonCerrarSesion").addEventListener("click", cerrarSesion);

mostrarUsuario();
mostrarImagenes();
