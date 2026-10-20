/* =====================================================
   EDUVERSO — Eda, asistente virtual con IA
   Chatbot de atención: responde preguntas frecuentes,
   orienta al usuario y lo guía por la plataforma.
   El widget se construye a sí mismo en cada página.
   ===================================================== */

/* ===== Estilos del widget ===== */
const estilosEda = document.createElement("style");
estilosEda.textContent = `
  .eda-burbuja {
    position: fixed;
    bottom: 22px;
    right: 22px;
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--violeta), var(--azul-profundo));
    color: #fff;
    font-size: 1.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 26px rgba(16, 43, 58, 0.38);
    z-index: 90;
    transition: transform 0.25s ease;
    animation: eda-pulso 2.6s infinite;
  }
  .eda-burbuja:hover { transform: scale(1.1); }
  @keyframes eda-pulso {
    0%, 100% { box-shadow: 0 10px 26px rgba(16, 43, 58, 0.38), 0 0 0 0 rgba(8, 127, 131, 0.42); }
    50% { box-shadow: 0 10px 26px rgba(16, 43, 58, 0.38), 0 0 0 14px rgba(8, 127, 131, 0); }
  }
  .eda-panel {
    position: fixed;
    bottom: 96px;
    right: 22px;
    width: min(380px, calc(100vw - 32px));
    height: min(520px, calc(100vh - 130px));
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 24px 60px rgba(16, 43, 58, 0.30);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 95;
    opacity: 0;
    transform: translateY(16px) scale(0.98);
    pointer-events: none;
    transition: all 0.28s ease;
  }
  .eda-panel.abierto {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }
  .eda-cabecera {
    background: linear-gradient(120deg, var(--azul-espacio), var(--violeta));
    color: #fff;
    padding: 0.9rem 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .eda-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
  }
  .eda-cabecera strong { font-family: var(--fuente-titulos); display: block; line-height: 1.2; }
  .eda-cabecera small { color: rgba(255,255,255,0.75); font-size: 0.75rem; }
  .eda-cerrar {
    margin-left: auto;
    background: rgba(255,255,255,0.12);
    color: #fff;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    font-size: 0.9rem;
  }
  .eda-mensajes {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    background: var(--fondo);
  }
  .eda-mensaje {
    max-width: 85%;
    padding: 0.65rem 0.95rem;
    border-radius: 14px;
    font-size: 0.9rem;
    line-height: 1.45;
    animation: eda-aparecer 0.25s ease;
  }
  @keyframes eda-aparecer {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .eda-mensaje.bot {
    background: #fff;
    border: 1px solid var(--borde);
    border-bottom-left-radius: 4px;
    align-self: flex-start;
  }
  .eda-mensaje.usuario {
    background: var(--violeta);
    color: #fff;
    border-bottom-right-radius: 4px;
    align-self: flex-end;
  }
  .eda-mensaje a { color: var(--violeta); font-weight: 700; text-decoration: underline; }
  .eda-mensaje.usuario a { color: #fff; }
  .eda-mensaje ul { margin: 0.4rem 0 0 1.1rem; list-style: disc; }
  .eda-curso-mini {
    display: block;
    background: var(--fondo);
    border: 1px solid var(--borde);
    border-radius: 10px;
    padding: 0.5rem 0.7rem;
    margin-top: 0.45rem;
    text-decoration: none !important;
  }
  .eda-curso-mini:hover { border-color: var(--violeta); }
  .eda-curso-mini small { color: var(--texto-suave); font-weight: 400; display: block; }
  .eda-escribiendo {
    display: inline-flex;
    gap: 4px;
    padding: 0.8rem 1rem;
  }
  .eda-escribiendo span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--violeta-claro);
    animation: eda-salto 1s infinite;
  }
  .eda-escribiendo span:nth-child(2) { animation-delay: 0.15s; }
  .eda-escribiendo span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes eda-salto {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-5px); }
  }
  .eda-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    padding: 0.6rem 1rem;
    background: var(--fondo);
    border-top: 1px solid var(--borde);
  }
  .eda-chip {
    background: #fff;
    border: 1.5px solid var(--violeta-claro);
    color: var(--violeta);
    border-radius: 999px;
    padding: 0.32rem 0.8rem;
    font-size: 0.78rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  .eda-chip:hover { background: var(--violeta); color: #fff; }
  .eda-burbuja .icono-svg { width: 30px; height: 30px; }
  .eda-avatar .icono-svg { width: 22px; height: 22px; }
  .eda-enviar .icono-svg { width: 18px; height: 18px; }
  .eda-mini-icono {
    display: inline-flex;
    color: var(--violeta);
    vertical-align: -0.15em;
    margin-right: 0.35rem;
  }
  .eda-mini-icono .icono-svg { width: 1.05em; height: 1.05em; }
  .eda-entrada {
    display: flex;
    gap: 0.5rem;
    padding: 0.7rem;
    background: #fff;
    border-top: 1px solid var(--borde);
  }
  .eda-entrada input {
    flex: 1;
    border: 2px solid var(--borde);
    border-radius: 999px;
    padding: 0.55rem 1rem;
    font-family: inherit;
    font-size: 0.9rem;
    outline: none;
  }
  .eda-entrada input:focus { border-color: var(--violeta); }
  .eda-enviar {
    background: var(--violeta);
    color: #fff;
    border-radius: 50%;
    width: 42px;
    height: 42px;
    font-size: 1rem;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }
  .eda-enviar:hover { background: var(--azul-profundo); }
`;
document.head.appendChild(estilosEda);

/* ===== Estructura del widget ===== */
const widgetEda = document.createElement("div");
widgetEda.innerHTML = `
  <button class="eda-burbuja" id="eda-burbuja" aria-label="Abrir asistente virtual">${ICONOS.bot}</button>
  <div class="eda-panel" id="eda-panel" role="dialog" aria-label="Asistente virtual Eda">
    <div class="eda-cabecera">
      <span class="eda-avatar">${ICONOS.bot}</span>
      <div>
        <strong>Eda</strong>
        <small>Asistente virtual de Eduverso · con IA</small>
      </div>
      <button class="eda-cerrar" id="eda-cerrar" aria-label="Cerrar chat">✕</button>
    </div>
    <div class="eda-mensajes" id="eda-mensajes"></div>
    <div class="eda-chips" id="eda-chips"></div>
    <form class="eda-entrada" id="eda-formulario">
      <input type="text" id="eda-texto" placeholder="Escribe tu pregunta..." autocomplete="off">
      <button type="submit" class="eda-enviar" aria-label="Enviar mensaje">${ICONOS.enviar}</button>
    </form>
  </div>
`;
document.body.appendChild(widgetEda);

const burbujaEda = document.getElementById("eda-burbuja");
const panelEda = document.getElementById("eda-panel");
const cerrarEda = document.getElementById("eda-cerrar");
const mensajesEda = document.getElementById("eda-mensajes");
const chipsEda = document.getElementById("eda-chips");
const formularioEda = document.getElementById("eda-formulario");
const textoEda = document.getElementById("eda-texto");

let edaYaSaludo = false;

/* ===== Utilidades ===== */
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function agregarMensaje(html, tipo) {
  const mensaje = document.createElement("div");
  mensaje.className = "eda-mensaje " + tipo;
  if (tipo === "usuario") mensaje.textContent = html;
  else mensaje.innerHTML = html;
  mensajesEda.appendChild(mensaje);
  mensajesEda.scrollTop = mensajesEda.scrollHeight;
}

function responderConEscritura(html, siguientesChips) {
  const indicador = document.createElement("div");
  indicador.className = "eda-mensaje bot eda-escribiendo";
  indicador.innerHTML = "<span></span><span></span><span></span>";
  mensajesEda.appendChild(indicador);
  mensajesEda.scrollTop = mensajesEda.scrollHeight;

  setTimeout(() => {
    indicador.remove();
    agregarMensaje(html, "bot");
    if (siguientesChips) mostrarChips(siguientesChips);
  }, 650);
}

function mostrarChips(opciones) {
  chipsEda.innerHTML = "";
  opciones.forEach(opcion => {
    const chip = document.createElement("button");
    chip.className = "eda-chip";
    chip.textContent = opcion;
    chip.addEventListener("click", () => enviarMensajeUsuario(opcion));
    chipsEda.appendChild(chip);
  });
}

const CHIPS_INICIO = [
  "Ver cursos",
  "Recomiéndame un curso",
  "Precios",
  "¿Cómo me inscribo?"
];

/* ===== Cerebro de Eda: intenciones y respuestas ===== */
function contieneAlguna(texto, palabras) {
  return palabras.some(palabra => texto.includes(palabra));
}

/* ===== Recomendador de cursos =====
   Compara las palabras del usuario con el nombre, la
   categoría, la descripción y las etiquetas de cada curso,
   y le da un puntaje a cada coincidencia. */
function recomendarCursos(textoUsuario) {
  const cursos = obtenerCursos();
  const palabras = normalizarTexto(textoUsuario)
    .split(/[^a-z0-9ñ]+/)
    .filter(palabra => palabra.length > 3);

  const puntuados = cursos.map(curso => {
    const nombre = normalizarTexto(curso.nombre);
    const categoria = normalizarTexto(curso.categoria);
    const descripcion = normalizarTexto(curso.descripcion);
    const etiquetas = normalizarTexto((curso.etiquetas || []).join(" "));

    let puntaje = 0;
    palabras.forEach(palabra => {
      if (nombre.includes(palabra)) puntaje += 4;
      if (etiquetas.includes(palabra)) puntaje += 3;
      if (categoria.includes(palabra)) puntaje += 2;
      if (descripcion.includes(palabra)) puntaje += 1;
    });
    return { curso, puntaje };
  });

  return puntuados
    .filter(resultado => resultado.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, 3)
    .map(resultado => resultado.curso);
}

function tarjetaMiniCurso(curso) {
  return `
    <a class="eda-curso-mini" href="contacto.html?curso=${encodeURIComponent(curso.nombre)}">
      <span class="eda-mini-icono">${obtenerIconoCurso(curso)}</span><strong>${escaparHTML(curso.nombre)}</strong>
      <small>${escaparHTML(curso.categoria)} · ${escaparHTML(curso.nivel)} · ${escaparHTML(formatearPrecio(curso.precio))}</small>
    </a>`;
}

function responderRecomendacion(textoUsuario) {
  const recomendados = recomendarCursos(textoUsuario);

  if (recomendados.length === 0) {
    return {
      html: `Con gusto te ayudo a elegir. Cuéntame qué te gustaría aprender o qué temas te llaman la atención. Por ejemplo: <em>"quiero aprender programación"</em> o <em>"me gusta el arte"</em>. También puedes elegir un área:`,
      chips: ["Tecnología", "Idiomas", "Arte y Diseño", "Negocios"]
    };
  }

  const tarjetas = recomendados.map(tarjetaMiniCurso).join("");
  return {
    html: `Según lo que me cuentas, estos cursos son ideales para ti:${tarjetas}<br>Toca el que te guste para pedir información, o mira el <a href="catalogo.html">catálogo completo</a>.`,
    chips: ["¿Cómo me inscribo?", "Precios", "Ver cursos"]
  };
}

function generarRespuesta(textoUsuario) {
  const texto = normalizarTexto(textoUsuario);
  const cursos = obtenerCursos();

  // Saludo
  if (contieneAlguna(texto, ["hola", "buenas", "buenos dias", "buenas tardes", "hey", "saludos"])) {
    return {
      html: "¡Hola! Soy <strong>Eda</strong>, la asistente virtual de Eduverso. Puedo contarte sobre nuestros cursos, precios, inscripciones o <strong>recomendarte un curso a tu medida</strong>. ¿En qué te ayudo?",
      chips: CHIPS_INICIO
    };
  }

  // Agradecimiento / despedida
  if (contieneAlguna(texto, ["gracias", "chao", "adios", "hasta luego", "nos vemos"])) {
    return {
      html: "¡Con mucho gusto! Recuerda que aquí estaré cuando me necesites. Éxitos en tu aprendizaje.",
      chips: CHIPS_INICIO
    };
  }

  // Recomendación de cursos (se revisa antes que el catálogo
  // porque frases como "recomiéndame un curso" incluyen "curso")
  if (
    contieneAlguna(texto, [
      "recomiend", "recomienda", "sugiere", "sugerencia", "no se que",
      "que curso", "cual curso", "aprender", "me gusta", "me interesa",
      "quiero estudiar", "me llama la atencion"
    ]) ||
    contieneAlguna(texto, CATEGORIAS.map(normalizarTexto))
  ) {
    return responderRecomendacion(textoUsuario);
  }

  // Catálogo / cursos
  if (contieneAlguna(texto, ["ver cursos", "cursos", "catalogo", "que ofrecen", "que ensenan", "oferta"])) {
    const categorias = CATEGORIAS.map(c => `<li>${c}</li>`).join("");
    return {
      html: `Tenemos <strong>${cursos.length} cursos</strong> en estas áreas:<ul>${categorias}</ul>Explóralos todos en el <a href="catalogo.html">catálogo</a> o pídeme una recomendación.`,
      chips: ["Recomiéndame un curso", "Precios", "¿Dan certificado?"]
    };
  }

  // Precios / gratis
  if (contieneAlguna(texto, ["precio", "precios", "costo", "cuanto vale", "cuanto cuesta", "gratis", "gratuito", "pagar"])) {
    const gratuitos = cursos.filter(c => !c.precio);
    const listaGratis = gratuitos.map(c => `<li>${c.nombre}</li>`).join("");
    return {
      html: `Nuestros cursos van desde <strong>gratis</strong> hasta $100.000 COP. De hecho, tenemos <strong>${gratuitos.length} cursos gratuitos</strong>:<ul>${listaGratis}</ul>¿Te interesa alguno? Escríbenos por el <a href="contacto.html">formulario de contacto</a>.`,
      chips: ["¿Cómo me inscribo?", "Recomiéndame un curso"]
    };
  }

  // Inscripción
  if (contieneAlguna(texto, ["inscri", "matricul", "registr", "como empiezo", "como inicio", "empezar", "apuntarme"])) {
    return {
      html: `Inscribirte es muy fácil:<ul><li>1. Explora el <a href="catalogo.html">catálogo</a> y elige tu curso.</li><li>2. Llena el <a href="contacto.html">formulario de contacto</a> con el curso que te interesa.</li><li>3. Nuestro equipo te escribe para confirmar tu cupo.</li></ul>Así de simple.`,
      chips: ["Ver cursos", "Precios"]
    };
  }

  // Horarios / modalidad
  if (contieneAlguna(texto, ["horario", "modalidad", "virtual", "presencial", "en vivo", "a mi ritmo", "cuando"])) {
    return {
      html: `Todos nuestros cursos son <strong>100% virtuales</strong> y tienen dos modalidades:<ul><li><strong>En vivo:</strong> clases con profesor en horarios de tarde y fin de semana.</li><li><strong>A tu ritmo:</strong> estudias cuando quieras, sin horarios fijos.</li></ul>La modalidad aparece en la tarjeta de cada curso del <a href="catalogo.html">catálogo</a>.`,
      chips: ["Ver cursos", "¿Cómo me inscribo?"]
    };
  }

  // Certificado
  if (contieneAlguna(texto, ["certificado", "certifica", "diploma", "constancia", "titulo"])) {
    return {
      html: `Sí. Al completar cualquiera de nuestros cursos recibes una <strong>constancia de participación digital</strong> que puedes compartir en tu hoja de vida o redes profesionales.`,
      chips: ["Ver cursos", "¿Cómo me inscribo?"]
    };
  }

  // Contacto humano
  if (contieneAlguna(texto, ["contacto", "telefono", "whatsapp", "correo", "email", "hablar con alguien", "asesor", "humano"])) {
    return {
      html: `Puedes hablar con nuestro equipo por estos medios:<ul><li>Correo: hola@eduverso.edu.co</li><li>WhatsApp: +57 300 123 4567</li><li><a href="contacto.html">Formulario de contacto</a></li></ul>Atendemos de lunes a viernes, 8:00 a.m. a 6:00 p.m.`,
      chips: CHIPS_INICIO
    };
  }

  // Sobre Eduverso / sobre Eda
  if (contieneAlguna(texto, ["quien eres", "que eres", "eduverso", "que es esto", "ayuda", "que puedes hacer"])) {
    return {
      html: `Soy <strong>Eda</strong>, la asistente con inteligencia artificial de <strong>Eduverso</strong>: una plataforma que acerca el conocimiento a todas las personas, sin importar su edad, ubicación o nivel de formación. Puedo:<ul><li>Contarte sobre los cursos y sus precios</li><li>Explicarte cómo inscribirte</li><li>Recomendarte un curso según tus intereses</li></ul>`,
      chips: CHIPS_INICIO
    };
  }

  // Sin coincidencias
  return {
    html: `Esa no me la sé todavía, pero puedo ayudarte con los cursos, precios, inscripciones o recomendarte algo según lo que te guste aprender. Intenta con una de estas opciones:`,
    chips: CHIPS_INICIO
  };
}

/* ===== Flujo de conversación ===== */
function enviarMensajeUsuario(texto) {
  if (!texto.trim()) return;
  agregarMensaje(texto, "usuario");
  chipsEda.innerHTML = "";
  const respuesta = generarRespuesta(texto);
  responderConEscritura(respuesta.html, respuesta.chips);
}

formularioEda.addEventListener("submit", evento => {
  evento.preventDefault();
  enviarMensajeUsuario(textoEda.value);
  textoEda.value = "";
});

function abrirChatEda() {
  panelEda.classList.add("abierto");
  textoEda.focus();
  if (!edaYaSaludo) {
    edaYaSaludo = true;
    responderConEscritura(
      "¡Hola! Soy <strong>Eda</strong>, tu guía en este universo de conocimiento. Pregúntame lo que quieras o elige una opción:",
      CHIPS_INICIO
    );
  }
}

burbujaEda.addEventListener("click", () => {
  if (panelEda.classList.contains("abierto")) {
    panelEda.classList.remove("abierto");
  } else {
    abrirChatEda();
  }
});

cerrarEda.addEventListener("click", () => panelEda.classList.remove("abierto"));

/* Botones de la página que abren el chat */
["btn-hero-chat", "btn-cta-chat"].forEach(id => {
  const boton = document.getElementById(id);
  if (boton) boton.addEventListener("click", abrirChatEda);
});
