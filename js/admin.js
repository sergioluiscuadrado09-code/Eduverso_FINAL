/* Panel protegido. La autorización y los cambios se validan en server.js. */
const vistaLogin = document.getElementById("vista-login");
const vistaPanel = document.getElementById("vista-panel");
const formularioLogin = document.getElementById("formulario-login");
const estadoLogin = document.getElementById("estado-login");
const tablaCursos = document.getElementById("tabla-cursos");
const tablaMensajes = document.getElementById("tabla-mensajes");
const tablaClientes = document.getElementById("tabla-clientes");
const formularioCurso = document.getElementById("formulario-curso");
let resumenAdmin = null;

function mostrarEstadoAdmin(elemento, texto, tipo = "") {
  elemento.textContent = texto;
  elemento.className = `mensaje-estado ${tipo}`.trim();
}

function formatoFecha(fecha) {
  return new Date(fecha).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

function renderCursos() {
  tablaCursos.replaceChildren();
  const cursos = obtenerCursos();
  if (!cursos.length) { tablaCursos.innerHTML = '<tr><td colspan="5" class="vacio">Todavía no hay cursos. Usa el formulario para crear el primero.</td></tr>'; return; }
  cursos.forEach(curso => {
    const row = document.createElement("tr");
    row.innerHTML = `<td><span class="icono-tabla">${obtenerIconoCurso(curso)}</span><strong>${escaparHTML(curso.nombre)}</strong></td><td>${escaparHTML(curso.categoria)}</td><td>${escaparHTML(curso.nivel)}</td><td>${escaparHTML(formatearPrecio(curso.precio))}</td><td><div class="acciones"><button class="btn-mini editar" data-accion="editar" data-id="${curso.id}">Editar</button><button class="btn-mini eliminar" data-accion="eliminar" data-id="${curso.id}">Eliminar</button></div></td>`;
    tablaCursos.appendChild(row);
  });
}

function renderSolicitudes() {
  tablaMensajes.replaceChildren();
  const solicitudes = resumenAdmin?.inquiries || [];
  if (!solicitudes.length) { tablaMensajes.innerHTML = '<tr><td colspan="6" class="vacio">Las solicitudes de contacto aparecerán aquí.</td></tr>'; return; }
  solicitudes.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${escaparHTML(formatoFecha(item.createdAt))}</td><td><strong>${escaparHTML(item.name)}</strong><br><small><a href="mailto:${encodeURIComponent(item.email)}">${escaparHTML(item.email)}</a></small><br><small>Tel: ${escaparHTML(item.phone)}</small></td><td>${escaparHTML(item.reason)}<br><small>Curso: ${escaparHTML(item.course)}</small></td><td>${escaparHTML(item.message)}</td><td><span class="etiqueta-estado ${item.status}">${item.status === "nuevo" ? "Nuevo" : "Atendido"}</span></td><td><div class="acciones">${item.status === "nuevo" ? `<button class="btn-mini atender" data-accion="atender" data-id="${escaparHTML(item.id)}">Atender</button>` : ""}<button class="btn-mini eliminar" data-accion="eliminar" data-id="${escaparHTML(item.id)}">Eliminar</button></div></td>`;
    tablaMensajes.appendChild(row);
  });
}

function renderClientes() {
  tablaClientes.replaceChildren();
  const clients = resumenAdmin?.users || [];
  if (!clients.length) { tablaClientes.innerHTML = '<tr><td colspan="4" class="vacio">Aún no hay cuentas de clientes.</td></tr>'; return; }
  clients.forEach(client => {
    const row = document.createElement("tr");
    const enrollments = resumenAdmin.enrollments.filter(item => item.userId === client.id);
    row.innerHTML = `<td><strong>${escaparHTML(client.name)}</strong></td><td><a href="mailto:${encodeURIComponent(client.email)}">${escaparHTML(client.email)}</a></td><td>${escaparHTML(formatoFecha(client.createdAt))}</td><td>${enrollments.length}${enrollments.length ? `<br><small>${escaparHTML(enrollments.map(item => item.courseName).join(", "))}</small>` : ""}</td>`;
    tablaClientes.appendChild(row);
  });
}

async function actualizarPanel() {
  await DATOS_LISTOS;
  resumenAdmin = await apiRequest("/api/admin/overview");
  const stats = resumenAdmin.stats;
  document.getElementById("est-cursos").textContent = stats.courses;
  document.getElementById("est-gratis").textContent = obtenerCursos().filter(item => !item.precio).length;
  document.getElementById("est-mensajes").textContent = stats.inquiries;
  document.getElementById("est-nuevos").textContent = stats.pending;
  document.getElementById("est-clientes").textContent = stats.users;
  document.getElementById("est-inscripciones").textContent = stats.enrollments;
  renderCursos(); renderSolicitudes(); renderClientes();
}

function llenarCategorias() {
  const select = document.getElementById("curso-categoria");
  if (select.options.length) return;
  CATEGORIAS.forEach(categoria => { const option = document.createElement("option"); option.value = categoria; option.textContent = categoria; select.appendChild(option); });
}

function resetCurso() {
  formularioCurso.reset();
  document.getElementById("curso-id").value = "";
  document.getElementById("titulo-formulario-curso").textContent = "Agregar nuevo curso";
  document.getElementById("boton-cancelar-edicion").hidden = true;
}

function editarCurso(curso) {
  document.getElementById("curso-id").value = curso.id;
  document.getElementById("curso-nombre").value = curso.nombre;
  document.getElementById("curso-categoria").value = curso.categoria;
  document.getElementById("curso-nivel").value = curso.nivel;
  document.getElementById("curso-duracion").value = curso.duracion;
  document.getElementById("curso-precio").value = curso.precio;
  document.getElementById("curso-modalidad").value = curso.modalidad;
  document.getElementById("curso-descripcion").value = curso.descripcion;
  document.getElementById("titulo-formulario-curso").textContent = `Editando: ${curso.nombre}`;
  document.getElementById("boton-cancelar-edicion").hidden = false;
  formularioCurso.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function actualizarSesion() {
  const { user } = await apiRequest("/api/auth/me");
  if (!user || user.role !== "admin") { vistaLogin.hidden = false; vistaPanel.hidden = true; return; }
  vistaLogin.hidden = true; vistaPanel.hidden = false;
  llenarCategorias();
  if (user.mustChangePassword) {
    document.querySelector('[data-panel="panel-seguridad"]').click();
    mostrarEstadoAdmin(document.getElementById("estado-clave-admin"), "Antes de continuar, reemplaza la contraseña inicial por una contraseña segura.", "error");
    return;
  }
  await actualizarPanel();
}

formularioLogin.addEventListener("submit", async event => {
  event.preventDefault();
  const button = formularioLogin.querySelector('[type="submit"]');
  button.disabled = true; button.textContent = "Verificando…";
  try {
    const { user } = await apiPost("/api/auth/login", { email: document.getElementById("usuario").value.trim(), password: document.getElementById("clave").value });
    if (user.role !== "admin") throw new Error("Esta cuenta es de cliente. Usa Mi cuenta para entrar.");
    formularioLogin.reset();
    mostrarEstadoAdmin(estadoLogin, "", "");
    await actualizarSesion();
  } catch (error) { mostrarEstadoAdmin(estadoLogin, error.message, "error"); }
  finally { button.disabled = false; button.textContent = "Ingresar"; }
});

document.getElementById("boton-salir").addEventListener("click", async () => {
  await apiPost("/api/auth/logout", {});
  vistaPanel.hidden = true; vistaLogin.hidden = false;
});

document.querySelectorAll(".pestana").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".pestana").forEach(item => item.classList.toggle("activa", item === tab));
  document.querySelectorAll(".panel-seccion").forEach(panel => panel.classList.toggle("visible", panel.id === tab.dataset.panel));
}));

document.getElementById("boton-cancelar-edicion").addEventListener("click", resetCurso);

formularioCurso.addEventListener("submit", async event => {
  event.preventDefault();
  const name = document.getElementById("curso-nombre").value.trim();
  const description = document.getElementById("curso-descripcion").value.trim();
  if (name.length < 3 || description.length < 10) { mostrarEstadoAdmin(document.getElementById("estado-curso"), "Revisa el nombre y la descripción.", "error"); return; }
  const category = document.getElementById("curso-categoria").value;
  const id = document.getElementById("curso-id").value;
  const course = { id: id ? Number(id) : Date.now(), nombre: name, categoria: category, nivel: document.getElementById("curso-nivel").value, duracion: document.getElementById("curso-duracion").value.trim() || "Por definir", precio: Number(document.getElementById("curso-precio").value) || 0, modalidad: document.getElementById("curso-modalidad").value, icono: ICONO_POR_CATEGORIA[category] || "libro", descripcion, etiquetas: name.toLowerCase().split(/\s+/) };
  const button = document.getElementById("boton-guardar-curso"); button.disabled = true;
  try {
    const courses = obtenerCursos();
    const next = id ? courses.map(item => item.id === Number(id) ? { ...item, ...course } : item) : [...courses, course];
    await guardarCursos(next);
    resetCurso(); await actualizarPanel();
    mostrarEstadoAdmin(document.getElementById("estado-curso"), id ? "Curso actualizado." : "Curso publicado en el catálogo.", "exito");
  } catch (error) { mostrarEstadoAdmin(document.getElementById("estado-curso"), error.message, "error"); }
  finally { button.disabled = false; }
});

tablaCursos.addEventListener("click", async event => {
  const button = event.target.closest("button[data-accion]"); if (!button) return;
  const course = obtenerCursos().find(item => item.id === Number(button.dataset.id)); if (!course) return;
  if (button.dataset.accion === "editar") { editarCurso(course); return; }
  if (!confirm(`¿Eliminar “${course.nombre}” del catálogo?`)) return;
  try { await guardarCursos(obtenerCursos().filter(item => item.id !== course.id)); await actualizarPanel(); }
  catch (error) { alert(error.message); }
});

tablaMensajes.addEventListener("click", async event => {
  const button = event.target.closest("button[data-accion]"); if (!button) return;
  const id = button.dataset.id;
  try {
    if (button.dataset.accion === "eliminar") {
      if (!confirm("¿Eliminar esta solicitud guardada?")) return;
      await apiRequest(`/api/admin/inquiries/${encodeURIComponent(id)}`, { method: "DELETE" });
    } else await apiRequest(`/api/admin/inquiries/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: "atendido" }) });
    await actualizarPanel();
  } catch (error) { alert(error.message); }
});

document.getElementById("formulario-clave-admin").addEventListener("submit", async event => {
  event.preventDefault();
  const status = document.getElementById("estado-clave-admin");
  try {
    await apiPost("/api/admin/password", { currentPassword: document.getElementById("clave-actual").value, newPassword: document.getElementById("clave-nueva").value });
    event.target.reset();
    mostrarEstadoAdmin(status, "Contraseña actualizada correctamente.", "exito");
    await actualizarSesion();
  } catch (error) { mostrarEstadoAdmin(status, error.message, "error"); }
});

apiRequest("/api/auth/me").then(({ user }) => {
  if (user?.role === "admin") return actualizarSesion();
  if (user) { vistaLogin.hidden = false; mostrarEstadoAdmin(estadoLogin, "Iniciaste sesión como cliente. Entra desde Mi cuenta.", "error"); }
}).catch(error => {
  if (error.code === "EDUVERSO_SERVER_OFFLINE") mostrarEstadoAdmin(estadoLogin, error.message, "error");
});
