/* Cliente HTTP de Eduverso. Las sesiones se mantienen en cookie HttpOnly. */
// El usuario pidió cerrar su sesión al recargar la página (Ctrl+R/F5).
// La cookie es HttpOnly: el cierre debe hacerse en el servidor antes de las demás llamadas API.
const navegacion = performance.getEntriesByType("navigation")[0];
const cierrePorRecarga = navegacion?.type === "reload"
  ? fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {})
  : Promise.resolve();

async function apiRequest(url, options = {}) {
  await cierrePorRecarga;
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response;
  try {
    response = await fetch(url, { ...options, headers, credentials: "same-origin", cache: "no-store" });
  } catch {
    const error = new Error("No hay conexión con el servidor de Eduverso. Inícialo con «npm start» y abre http://localhost:3000 (no uses Live Server ni abras el HTML directamente). Si ya está desplegado, revisa que el servicio Node esté activo.");
    error.code = "EDUVERSO_SERVER_OFFLINE";
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Error del servidor (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function apiPost(url, payload) {
  return apiRequest(url, { method: "POST", body: JSON.stringify(payload) });
}
