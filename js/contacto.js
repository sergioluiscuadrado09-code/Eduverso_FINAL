/* =====================================================
   EDUVERSO — Formulario de contacto
   Valida los datos y registra cada solicitud para que
   el equipo la gestione desde el panel de administración.
   ===================================================== */

const formulario = document.getElementById("formulario-contacto");
const estadoFormulario = document.getElementById("estado-formulario");
const selectorCurso = document.getElementById("curso");

/* ===== Llena el selector con los cursos del catálogo ===== */
function llenarSelectorCursos() {
  if (!selectorCurso) return;

  const cursos = obtenerCursos();
  selectorCurso.innerHTML = '<option value="">Aún no lo tengo claro</option>';

  cursos.forEach(curso => {
    const opcion = document.createElement("option");
    opcion.value = curso.nombre;
    opcion.textContent = curso.nombre;
    selectorCurso.appendChild(opcion);
  });

  // Si llega desde una tarjeta "Me interesa", preselecciona el curso
  const parametros = new URLSearchParams(window.location.search);
  const cursoElegido = parametros.get("curso");
  const existeOpcion = Array.from(selectorCurso.options).some(opcion => opcion.value === cursoElegido);
  if (cursoElegido && existeOpcion) {
    selectorCurso.value = cursoElegido;
    const motivo = document.getElementById("motivo");
    if (motivo) motivo.value = "Información de un curso";
  }
}

/* ===== Validación y envío ===== */
function mostrarEstado(texto, tipo) {
  if (!estadoFormulario) return;
  estadoFormulario.textContent = texto;
  estadoFormulario.className = "mensaje-estado " + tipo;
}

if (formulario && estadoFormulario && selectorCurso) {
  formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const motivo = document.getElementById("motivo").value;
    const curso = selectorCurso.value;
    const mensaje = document.getElementById("mensaje").value.trim();

    // Validaciones básicas
    if (nombre.length < 3) {
      mostrarEstado("Escribe tu nombre completo (mínimo 3 letras).", "error");
      return;
    }
    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!patronCorreo.test(correo)) {
      mostrarEstado("Escribe un correo electrónico válido.", "error");
      return;
    }
    if (motivo === "") {
      mostrarEstado("Selecciona el motivo de tu mensaje.", "error");
      return;
    }
    if (mensaje.length < 10) {
      mostrarEstado("Cuéntanos un poco más en tu mensaje (mínimo 10 caracteres).", "error");
      return;
    }

    const botonEnviar = formulario.querySelector('[type="submit"]');
    botonEnviar.disabled = true;
    botonEnviar.textContent = "Enviando…";
    try {
      await apiPost("/api/inquiries", { name: nombre, email: correo, phone: telefono, reason: motivo, course: curso, message: mensaje });
      formulario.reset();
      mostrarEstado(`¡Gracias, ${nombre.split(" ")[0]}! Tu mensaje quedó guardado. Te responderemos al correo ${correo}.`, "exito");
    } catch (error) { mostrarEstado(error.message, "error"); }
    finally {
      botonEnviar.disabled = false;
      botonEnviar.innerHTML = '<span data-icono="enviar"></span>Enviar mensaje';
      botonEnviar.querySelector("[data-icono]").innerHTML = ICONOS.enviar;
    }
  });
}

llenarSelectorCursos();
DATOS_LISTOS.then(llenarSelectorCursos).catch(() => {});
