// Datos del carrusel del hero.
// Los usan la página de inicio (para mostrarlas) y el CRUD de imágenes (para editarlas).
// Se guardan en localStorage; después se cambian por llamadas a la API.

const CLAVE_HERO = "heroSlides";
const MAX_IMAGENES = 6;

// Imágenes con las que arranca el carrusel
const heroOriginal = [
    {
        id: 1,
        imagen: "img/hero-1.svg",
        titulo: "Atención médica, mejor organizada.",
        texto: "Conoce nuestras especialidades y a los médicos que te atienden. Reserva tus citas desde la app móvil, sin llamar a recepción.",
        boton: "Ver servicios",
        enlace: "#servicios"
    },
    {
        id: 2,
        imagen: "img/hero-2.svg",
        titulo: "Cuidamos a toda tu familia.",
        texto: "Desde el control del niño sano hasta la revisión del corazón, tenemos la especialidad que necesitas en un solo lugar.",
        boton: "Ver médicos",
        enlace: "#medicos"
    },
    {
        id: 3,
        imagen: "img/hero-3.svg",
        titulo: "Abiertos las 24 horas.",
        texto: "Atendemos todos los días del año. Elige el momento que mejor se acomode a ti.",
        boton: "Ver horarios",
        enlace: "#horario"
    }
];

// Lee las imágenes guardadas (si no hay, usa las originales)
function leerHero() {
    const guardado = localStorage.getItem(CLAVE_HERO);
    if (guardado) {
        try {
            return JSON.parse(guardado);
        } catch (error) {
            // si el dato está dañado, se usan las originales
        }
    }
    return heroOriginal.map(function (slide) { return Object.assign({}, slide); });
}

function guardarHero(lista) {
    localStorage.setItem(CLAVE_HERO, JSON.stringify(lista));
}
