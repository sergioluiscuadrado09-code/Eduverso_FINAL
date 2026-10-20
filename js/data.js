/* =====================================================
   EDUVERSO — Datos base del catálogo educativo
   El catálogo se carga y guarda mediante la API del servidor.
   ===================================================== */

const CURSOS_BASE = [
  {
    id: 1,
    nombre: "Programación desde Cero",
    categoria: "Tecnología",
    nivel: "Principiante",
    duracion: "8 semanas",
    precio: 0,
    modalidad: "Virtual · A tu ritmo",
    icono: "codigo",
    descripcion: "Aprende lógica de programación y da tus primeros pasos en el mundo del código, sin necesidad de experiencia previa.",
    etiquetas: ["programacion", "codigo", "logica", "python", "tecnologia", "computacion"]
  },
  {
    id: 2,
    nombre: "Desarrollo Web con HTML y CSS",
    categoria: "Tecnología",
    nivel: "Principiante",
    duracion: "6 semanas",
    precio: 60000,
    modalidad: "Virtual · En vivo",
    icono: "monitor",
    descripcion: "Crea tus primeras páginas web desde cero y publícalas en internet con HTML, CSS y buenas prácticas de diseño.",
    etiquetas: ["web", "html", "css", "paginas", "diseno web", "internet", "programacion"]
  },
  {
    id: 3,
    nombre: "Inglés para la Vida Diaria",
    categoria: "Idiomas",
    nivel: "Principiante",
    duracion: "12 semanas",
    precio: 80000,
    modalidad: "Virtual · En vivo",
    icono: "idioma",
    descripcion: "Comunícate en inglés en situaciones cotidianas: saludos, compras, viajes y conversaciones básicas de trabajo.",
    etiquetas: ["ingles", "idiomas", "conversacion", "viajar", "trabajo"]
  },
  {
    id: 4,
    nombre: "Matemáticas sin Miedo",
    categoria: "Ciencias",
    nivel: "Todos los niveles",
    duracion: "10 semanas",
    precio: 0,
    modalidad: "Virtual · A tu ritmo",
    icono: "calculadora",
    descripcion: "Refuerza las bases de matemáticas con explicaciones sencillas y ejercicios prácticos para perderle el miedo a los números.",
    etiquetas: ["matematicas", "numeros", "ciencias", "refuerzo", "colegio", "algebra"]
  },
  {
    id: 5,
    nombre: "Diseño Gráfico con Herramientas Libres",
    categoria: "Arte y Diseño",
    nivel: "Intermedio",
    duracion: "8 semanas",
    precio: 70000,
    modalidad: "Virtual · En vivo",
    icono: "paleta",
    descripcion: "Domina herramientas gratuitas como Canva, GIMP e Inkscape para crear piezas gráficas profesionales.",
    etiquetas: ["diseno", "grafico", "arte", "canva", "creatividad", "publicidad"]
  },
  {
    id: 6,
    nombre: "Emprendimiento Digital",
    categoria: "Negocios",
    nivel: "Principiante",
    duracion: "6 semanas",
    precio: 90000,
    modalidad: "Virtual · En vivo",
    icono: "cohete",
    descripcion: "Convierte tu idea en un negocio real: marca, redes sociales, ventas por internet y primeros clientes.",
    etiquetas: ["emprendimiento", "negocio", "ventas", "marketing", "empresa", "digital"]
  },
  {
    id: 7,
    nombre: "Robótica para Jóvenes",
    categoria: "Tecnología",
    nivel: "Principiante",
    duracion: "8 semanas",
    precio: 100000,
    modalidad: "Virtual · En vivo",
    icono: "bot",
    descripcion: "Explora el mundo de la robótica y la electrónica con proyectos divertidos que combinan creatividad y tecnología.",
    etiquetas: ["robotica", "electronica", "arduino", "tecnologia", "jovenes", "ciencia"]
  },
  {
    id: 8,
    nombre: "Fotografía con tu Celular",
    categoria: "Arte y Diseño",
    nivel: "Principiante",
    duracion: "4 semanas",
    precio: 0,
    modalidad: "Virtual · A tu ritmo",
    icono: "camara",
    descripcion: "Aprende composición, luz y edición para tomar fotos increíbles solo con tu teléfono celular.",
    etiquetas: ["fotografia", "celular", "arte", "edicion", "redes sociales", "creatividad"]
  },
  {
    id: 9,
    nombre: "Finanzas Personales",
    categoria: "Negocios",
    nivel: "Todos los niveles",
    duracion: "5 semanas",
    precio: 50000,
    modalidad: "Virtual · A tu ritmo",
    icono: "moneda",
    descripcion: "Organiza tu dinero, aprende a ahorrar, salir de deudas y planear tus metas financieras paso a paso.",
    etiquetas: ["finanzas", "dinero", "ahorro", "presupuesto", "economia", "negocios"]
  },
  {
    id: 10,
    nombre: "Lectura y Escritura Creativa",
    categoria: "Desarrollo Personal",
    nivel: "Todos los niveles",
    duracion: "6 semanas",
    precio: 0,
    modalidad: "Virtual · A tu ritmo",
    icono: "libro",
    descripcion: "Despierta tu imaginación: aprende a escribir cuentos, poemas y textos que conecten con las personas.",
    etiquetas: ["lectura", "escritura", "cuentos", "creatividad", "literatura", "redaccion"]
  },
  {
    id: 11,
    nombre: "Excel y Hojas de Cálculo",
    categoria: "Tecnología",
    nivel: "Intermedio",
    duracion: "5 semanas",
    precio: 60000,
    modalidad: "Virtual · En vivo",
    icono: "tabla",
    descripcion: "Domina fórmulas, tablas dinámicas y gráficos para organizar información y destacar en cualquier trabajo.",
    etiquetas: ["excel", "hojas de calculo", "oficina", "datos", "trabajo", "tablas"]
  },
  {
    id: 12,
    nombre: "Hablar en Público sin Nervios",
    categoria: "Desarrollo Personal",
    nivel: "Todos los niveles",
    duracion: "4 semanas",
    precio: 45000,
    modalidad: "Virtual · En vivo",
    icono: "microfono",
    descripcion: "Gana confianza para presentar tus ideas: técnicas de voz, lenguaje corporal y manejo del miedo escénico.",
    etiquetas: ["hablar en publico", "comunicacion", "confianza", "presentaciones", "liderazgo"]
  }
];

const CATEGORIAS = [
  "Tecnología",
  "Idiomas",
  "Arte y Diseño",
  "Negocios",
  "Ciencias",
  "Desarrollo Personal"
];

/* ===== Acceso a los datos del servidor ===== */
let cursosCache = CURSOS_BASE;
let mensajesCache = [];

const DATOS_LISTOS = apiRequest("/api/courses")
  .then(cursos => { cursosCache = cursos; return cursos; })
  .catch(error => { console.error("No se pudo cargar el catálogo del servidor.", error); throw error; });

function obtenerCursos() {
  return cursosCache;
}

function guardarCursos(cursos) {
  cursosCache = cursos;
  return apiRequest("/api/admin/courses", { method: "PUT", body: JSON.stringify({ courses: cursos }) })
    .then(result => { cursosCache = result.courses; return result.courses; });
}

function obtenerMensajes() {
  return mensajesCache;
}

function guardarMensajes(mensajes) {
  mensajesCache = mensajes;
  return Promise.resolve(mensajes);
}

function formatearPrecio(precio) {
  if (!precio || precio === 0) return "Gratis";
  return "$" + precio.toLocaleString("es-CO") + " COP";
}
