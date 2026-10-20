const vistaCuentaAcceso = document.getElementById("cuenta-acceso");
const vistaCuentaPanel = document.getElementById("cuenta-panel");
const loginCuenta = document.getElementById("form-cuenta-login");
const registroCuenta = document.getElementById("form-cuenta-registro");
const estadoLoginCuenta = document.getElementById("estado-login-cuenta");
const estadoRegistroCuenta = document.getElementById("estado-registro");
let cursoSolicitudIntentada = false;

function estadoCuenta(elemento, texto, tipo = "") {
  elemento.textContent = texto;
  elemento.className = `mensaje-estado ${tipo}`.trim();
}

document.querySelectorAll(".cuenta-tab").forEach(tab => tab.addEventListener("click", () => {
  const modoRegistro = tab.dataset.vista === "registro";
  document.querySelectorAll(".cuenta-tab").forEach(item => {
    const activo = item === tab;
    item.classList.toggle("activa", activo);
    item.setAttribute("aria-selected", String(activo));
  });
  loginCuenta.hidden = modoRegistro;
  registroCuenta.hidden = !modoRegistro;
}));

async function mostrarMiCuenta(user) {
  vistaCuentaAcceso.hidden = Boolean(user);
  vistaCuentaPanel.hidden = !user;
  if (!user) return;
  document.getElementById("cuenta-bienvenida").textContent = `¡Hola, ${user.name.split(" ")[0]}!`;
  if (user.role === "client" && cursoSolicitado && !cursoSolicitudIntentada) {
    cursoSolicitudIntentada = true;
    try {
      const result = await apiPost("/api/enrollments", { courseId: Number(cursoSolicitado) });
      estadoCuenta(document.getElementById("estado-inscripcion"), `Listo: guardamos tu solicitud para “${result.enrollment.courseName}”.`, "exito");
    } catch (error) {
      estadoCuenta(document.getElementById("estado-inscripcion"), error.status === 409 ? "Ya tienes una solicitud para este curso." : error.message, error.status === 409 ? "exito" : "error");
    }
  }
  const contenedor = document.getElementById("cuenta-inscripciones");
  contenedor.innerHTML = "<p class='cuenta-vacio'>Cargando tus solicitudes…</p>";
  try {
    const inscripciones = await apiRequest("/api/enrollments");
    contenedor.replaceChildren();
    if (!inscripciones.length) {
      contenedor.innerHTML = '<div class="cuenta-vacio"><span class="vacio-icono">✦</span><strong>Aún no tienes inscripciones</strong><p>Explora el catálogo y pide cupo en el curso que más te guste.</p><a href="catalogo.html">Ver cursos →</a></div>';
      return;
    }
    inscripciones.forEach(inscripcion => {
      const tarjeta = document.createElement("article");
      tarjeta.className = "cuenta-inscripcion";
      const fecha = new Date(inscripcion.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
      tarjeta.innerHTML = `<span class="inscripcion-icono">✦</span><div><strong></strong><small>Solicitud ${fecha}</small></div><span class="inscripcion-estado"></span>`;
      tarjeta.querySelector("strong").textContent = inscripcion.courseName;
      tarjeta.querySelector(".inscripcion-estado").textContent = inscripcion.status;
      contenedor.appendChild(tarjeta);
    });
  } catch (error) {
    contenedor.innerHTML = `<p class="cuenta-vacio" role="alert">${escaparHTML(error.message)}</p>`;
  }
}

loginCuenta.addEventListener("submit", async event => {
  event.preventDefault();
  const button = loginCuenta.querySelector("button[type=submit]");
  button.disabled = true; button.textContent = "Verificando…";
  try {
    const result = await apiPost("/api/auth/login", { email: document.getElementById("login-correo").value.trim(), password: document.getElementById("login-clave").value });
    if (result.user.role === "admin") { window.location.href = "admin.html"; return; }
    loginCuenta.reset();
    await mostrarMiCuenta(result.user);
  } catch (error) { estadoCuenta(estadoLoginCuenta, error.message, "error"); }
  finally { button.disabled = false; button.textContent = "Iniciar sesión"; }
});

registroCuenta.addEventListener("submit", async event => {
  event.preventDefault();
  const button = registroCuenta.querySelector("button[type=submit]");
  button.disabled = true; button.textContent = "Creando tu cuenta…";
  try {
    const result = await apiPost("/api/auth/register", { name: document.getElementById("registro-nombre").value.trim(), email: document.getElementById("registro-correo").value.trim(), password: document.getElementById("registro-clave").value });
    registroCuenta.reset();
    await mostrarMiCuenta(result.user);
  } catch (error) { estadoCuenta(estadoRegistroCuenta, error.message, "error"); }
  finally { button.disabled = false; button.textContent = "Crear cuenta"; }
});

document.getElementById("cuenta-salir").addEventListener("click", async () => {
  await apiPost("/api/auth/logout", {});
  await mostrarMiCuenta(null);
});

apiRequest("/api/auth/me").then(({ user }) => {
  if (user?.role === "admin") window.location.replace("admin.html");
  else mostrarMiCuenta(user);
}).catch(error => {
  if (error.code === "EDUVERSO_SERVER_OFFLINE") estadoCuenta(estadoLoginCuenta, error.message, "error");
});

const cursoSolicitado = new URLSearchParams(window.location.search).get("curso");
const vistaInicial = new URLSearchParams(window.location.search).get("vista");
if (cursoSolicitado || vistaInicial === "login") {
  document.querySelector('[data-vista="login"]').click();
}
if (cursoSolicitado) {
  const intro = loginCuenta.querySelector("p");
  intro.textContent = "Inicia sesión para guardar tu solicitud y seguirla desde aquí.";
}
if (vistaInicial === "registro") document.querySelector('[data-vista="registro"]').click();
