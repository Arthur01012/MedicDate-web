// Arma el carrusel del hero con las imágenes que se administran en "Imágenes del hero"

const carrusel = document.getElementById("carruselHero");
const contenedorSlides = document.getElementById("slidesHero");
const contenedorPuntos = document.getElementById("puntosHero");

let slides = leerHero();
if (slides.length === 0) {
    slides = heroOriginal;
}

slides.forEach(function (slide, i) {
    // Diapositiva
    const item = document.createElement("div");
    item.className = "carousel-item hero-slide" + (i === 0 ? " active" : "");
    // La ruta se completa con la dirección de la página, para que la imagen cargue desde el CSS
    const direccionImagen = new URL(slide.imagen, document.baseURI).href;
    item.style.setProperty("--imagen", 'url("' + direccionImagen + '")');

    const caja = document.createElement("div");
    caja.className = "contenedor";

    const contenido = document.createElement("div");
    contenido.className = "hero-contenido d-flex flex-column gap-3";

    // El primer título es el principal de la página (h1)
    const titulo = document.createElement(i === 0 ? "h1" : "h2");
    titulo.className = "hero-titulo m-0";
    titulo.textContent = slide.titulo;
    contenido.appendChild(titulo);

    if (slide.texto) {
        const texto = document.createElement("p");
        texto.className = "hero-texto m-0";
        texto.textContent = slide.texto;
        contenido.appendChild(texto);
    }

    if (slide.boton && slide.enlace) {
        const boton = document.createElement("a");
        boton.className = "btn btn-primary btn-grande px-4 align-self-start";
        boton.href = slide.enlace;
        boton.textContent = slide.boton;
        contenido.appendChild(boton);
    }

    caja.appendChild(contenido);
    item.appendChild(caja);
    contenedorSlides.appendChild(item);

    // Punto indicador
    const punto = document.createElement("button");
    punto.type = "button";
    punto.dataset.bsTarget = "#carruselHero";
    punto.dataset.bsSlideTo = i;
    punto.setAttribute("aria-label", "Diapositiva " + (i + 1));
    if (i === 0) {
        punto.className = "active";
        punto.setAttribute("aria-current", "true");
    }
    contenedorPuntos.appendChild(punto);
});

// Con una sola imagen no hacen falta flechas ni puntos, ni que se mueva
if (slides.length > 1) {
    new bootstrap.Carousel(carrusel, { interval: 6000, ride: "carousel", pause: "hover" });
} else {
    carrusel.classList.add("una-sola");
}
