/* =====================================================
   EDUVERSO — Lógica compartida del sitio
   Menú móvil, tarjetas de curso y cursos destacados.
   ===================================================== */

/* ===== Menú de navegación en móviles ===== */
const botonMenu = document.getElementById("nav-toggle");
const listaEnlaces = document.getElementById("nav-links");

function alternarMenu() {
  if (!botonMenu || !listaEnlaces) return;

  const abierto = listaEnlaces.classList.toggle("abierto");
  botonMenu.textContent = abierto ? "✕" : "☰";
  botonMenu.setAttribute("aria-expanded", String(abierto));
  botonMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
}

if (botonMenu && listaEnlaces) {
  botonMenu.addEventListener("click", alternarMenu);
  listaEnlaces.querySelectorAll("a").forEach(enlace => {
    enlace.addEventListener("click", () => {
      if (window.innerWidth <= 640) alternarMenu();
    });
  });
}

/* ===== Tarjeta de curso (compartida por inicio y catálogo) ===== */
function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[caracter]);
}

function crearTarjetaCurso(curso) {
  const tonos = ["tono-1", "tono-2", "tono-3", "tono-4"];
  const tono = tonos[curso.id % tonos.length];
  const esGratis = !curso.precio || curso.precio === 0;

  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta-curso";
  tarjeta.innerHTML = `
    <div class="curso-portada ${tono}">${obtenerIconoCurso(curso)}</div>
    <div class="curso-cuerpo">
      <span class="curso-categoria">${escaparHTML(curso.categoria)}</span>
      <h3>${escaparHTML(curso.nombre)}</h3>
      <p class="curso-descripcion">${escaparHTML(curso.descripcion)}</p>
      <div class="curso-detalles">
        <span>${ICONOS.nivel} ${escaparHTML(curso.nivel)}</span>
        <span>${ICONOS.reloj} ${escaparHTML(curso.duracion)}</span>
        <span>${ICONOS.monitor} ${escaparHTML(curso.modalidad)}</span>
      </div>
      <div class="curso-pie">
        <span class="curso-precio ${esGratis ? "gratis" : ""}">${escaparHTML(formatearPrecio(curso.precio))}</span>
        <a class="btn-curso" href="cuenta.html?curso=${encodeURIComponent(curso.id)}">Solicitar cupo</a>
      </div>
    </div>
  `;
  return tarjeta;
}

/* ===== Cursos destacados en la página de inicio ===== */
function mostrarDestacados() {
  const contenedor = document.getElementById("cursos-destacados");
  if (!contenedor) return;

  const cursos = obtenerCursos();
  const destacados = cursos.slice(0, 3);

  contenedor.innerHTML = "";
  destacados.forEach(curso => contenedor.appendChild(crearTarjetaCurso(curso)));

  // Actualiza las estadísticas del hero con datos reales
  const statCursos = document.getElementById("stat-cursos");
  const statGratis = document.getElementById("stat-gratis");
  if (statCursos) statCursos.textContent = cursos.length + "+";
  if (statGratis) statGratis.textContent = cursos.filter(c => !c.precio).length;
}

mostrarDestacados();
DATOS_LISTOS.then(mostrarDestacados).catch(() => {
  const contenedor = document.getElementById("cursos-destacados");
  if (contenedor) contenedor.innerHTML = '<p class="sin-resultados">No pudimos conectar con Eduverso. Vuelve a intentarlo en unos momentos.</p>';
});
