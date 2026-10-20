/* =====================================================
   EDUVERSO — Catálogo de cursos
   Muestra todos los cursos disponibles en tarjetas.
   ===================================================== */

const gridCatalogo = document.getElementById("grid-catalogo");
const avisoSinResultados = document.getElementById("sin-resultados");

function mostrarCatalogo(cursos) {
  if (!gridCatalogo || !avisoSinResultados) return;

  gridCatalogo.innerHTML = "";

  if (cursos.length === 0) {
    avisoSinResultados.hidden = false;
    return;
  }

  avisoSinResultados.hidden = true;
  cursos.forEach(curso => gridCatalogo.appendChild(crearTarjetaCurso(curso)));
}

/* ===== Filtros por categoría y buscador ===== */

const campoBusqueda = document.getElementById("campo-busqueda");
const chipsContenedor = document.getElementById("chips-categorias");

let categoriaActiva = "Todos";
let textoBusqueda = "";

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function aplicarFiltros() {
  const cursos = obtenerCursos();
  const texto = normalizar(textoBusqueda.trim());

  const filtrados = cursos.filter(curso => {
    const coincideCategoria =
      categoriaActiva === "Todos" || curso.categoria === categoriaActiva;

    if (!coincideCategoria) return false;
    if (texto === "") return true;

    const contenido = normalizar(
      curso.nombre + " " +
      curso.descripcion + " " +
      curso.categoria + " " +
      curso.nivel + " " +
      (curso.etiquetas || []).join(" ")
    );
    return contenido.includes(texto);
  });

  mostrarCatalogo(filtrados);
}

function crearChips() {
  if (!chipsContenedor) return;

  const categorias = ["Todos", ...CATEGORIAS];

  categorias.forEach(categoria => {
    const chip = document.createElement("button");
    chip.className = "chip" + (categoria === "Todos" ? " activo" : "");
    chip.textContent = categoria;

    chip.addEventListener("click", () => {
      categoriaActiva = categoria;
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("activo"));
      chip.classList.add("activo");
      aplicarFiltros();
    });

    chipsContenedor.appendChild(chip);
  });
}

if (campoBusqueda) {
  campoBusqueda.addEventListener("input", () => {
    textoBusqueda = campoBusqueda.value;
    aplicarFiltros();
  });
}

crearChips();
aplicarFiltros();
DATOS_LISTOS.then(aplicarFiltros).catch(() => {
  if (avisoSinResultados) {
    avisoSinResultados.hidden = false;
    avisoSinResultados.textContent = "No pudimos conectar con Eduverso. Vuelve a intentarlo en unos momentos.";
  }
});
