"use strict";

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");
const { promisify } = require("node:util");

try {
  const envFile = require("node:fs").readFileSync(path.join(__dirname, ".env"), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const scrypt = promisify(crypto.scrypt);
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const DB_FILE = path.resolve(process.env.DATA_FILE || path.join(ROOT, "data", "eduverso.json"));
if (process.env.NODE_ENV === "production" && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12 || !/[A-Za-z]/.test(process.env.ADMIN_PASSWORD) || !/[0-9]/.test(process.env.ADMIN_PASSWORD))) {
  throw new Error("En producción configura ADMIN_EMAIL y una ADMIN_PASSWORD privada de al menos 12 caracteres con letras y números.");
}
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@eduverso.edu.co").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "EduversoAdmin2026!";
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const sessions = new Map();
const attempts = new Map();

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon"
};

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders });
  res.end(JSON.stringify(body));
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
}

function readCookie(req, name) {
  const cookies = req.headers.cookie || "";
  const pair = cookies.split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : "";
}

function setSessionCookie(req, res, token) {
  const secure = req.socket.encrypted || req.headers["x-forwarded-proto"] === "https";
  res.setHeader("Set-Cookie", `eduverso_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL / 1000}${secure ? "; Secure" : ""}`);
}

function clearSessionCookie(req, res) {
  const secure = req.socket.encrypted || req.headers["x-forwarded-proto"] === "https";
  res.setHeader("Set-Cookie", `eduverso_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`);
}

async function loadDatabase() {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const db = { users: [], courses: await seedCourses(), inquiries: [], enrollments: [] };
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = (await scrypt(ADMIN_PASSWORD, salt, 64)).toString("hex");
    db.users.push({ id: crypto.randomUUID(), name: "Administración Eduverso", email: ADMIN_EMAIL, role: "admin", salt, passwordHash: hash, mustChangePassword: true, createdAt: new Date().toISOString() });
    await saveDatabase(db);
    return db;
  }
}

async function seedCourses() {
  const source = await fs.readFile(path.join(ROOT, "js", "data.js"), "utf8");
  const match = source.match(/const CURSOS_BASE\s*=\s*(\[[\s\S]*?\]);\s*\n\s*const CATEGORIAS/);
  if (!match) throw new Error("No se pudo leer el catálogo inicial de cursos.");
  return vm.runInNewContext(`(${match[1]})`, Object.create(null), { timeout: 500 });
}

let writeQueue = Promise.resolve();
function saveDatabase(db) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    const temporary = `${DB_FILE}.${process.pid}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(db, null, 2), { mode: 0o600 });
    await fs.rename(temporary, DB_FILE);
  });
  return writeQueue;
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw Object.assign(new Error("La solicitud es demasiado grande."), { status: 413 });
  }
  if (!body) return {};
  try { return JSON.parse(body); }
  catch { throw Object.assign(new Error("El cuerpo debe ser JSON válido."), { status: 400 }); }
}

function clean(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: Boolean(user.mustChangePassword), createdAt: user.createdAt };
}

function rateLimit(req, res) {
  const now = Date.now();
  const key = `${req.socket.remoteAddress}:${(req.url || "").split("?")[0]}`;
  const entry = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  if (now > entry.until) { entry.count = 0; entry.until = now + 15 * 60 * 1000; }
  entry.count++;
  attempts.set(key, entry);
  if (entry.count > 30) {
    json(res, 429, { error: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo." }, { "Retry-After": "900" });
    return true;
  }
  return false;
}

async function currentUser(req, db) {
  const token = readCookie(req, "eduverso_session");
  if (!token) return null;
  const key = crypto.createHash("sha256").update(token).digest("hex");
  const session = sessions.get(key);
  if (!session || session.expires < Date.now()) { sessions.delete(key); return null; }
  return db.users.find(user => user.id === session.userId) || null;
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; }
  catch { return false; }
}

function validateCourse(course) {
  const name = clean(course?.nombre, 120);
  const description = clean(course?.descripcion, 2000);
  const price = Number(course?.precio);
  if (name.length < 3 || description.length < 10 || !Number.isFinite(price) || price < 0) return null;
  return {
    id: Number.isSafeInteger(Number(course.id)) && Number(course.id) > 0 ? Number(course.id) : Date.now(),
    nombre: name, categoria: clean(course.categoria, 80), nivel: clean(course.nivel, 60),
    duracion: clean(course.duracion, 80), precio: Math.round(price), modalidad: clean(course.modalidad, 100),
    icono: clean(course.icono, 40), descripcion,
    etiquetas: Array.isArray(course.etiquetas) ? course.etiquetas.slice(0, 24).map(tag => clean(tag, 40)) : []
  };
}

async function handleApi(req, res, url) {
  const db = await loadDatabase();
  const method = req.method;
  const route = url.pathname;

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && !sameOrigin(req)) return json(res, 403, { error: "Origen de solicitud no permitido." });

  if (method === "GET" && route === "/api/health") return json(res, 200, { status: "ok", storage: "json" });
  if (method === "GET" && route === "/api/courses") return json(res, 200, db.courses);

  if (method === "GET" && route === "/api/auth/me") {
    const user = await currentUser(req, db);
    return json(res, 200, { user: user ? publicUser(user) : null });
  }

  if (method === "POST" && ["/api/auth/register", "/api/auth/login"].includes(route)) {
    if (rateLimit(req, res)) return;
    const body = await readBody(req);
    const email = clean(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(res, 400, { error: "Escribe un correo electrónico válido." });
    let user;
    if (route.endsWith("register")) {
      const name = clean(body.name, 100);
      if (name.length < 2) return json(res, 400, { error: "Escribe tu nombre completo." });
      if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return json(res, 400, { error: "La contraseña debe tener al menos 10 caracteres e incluir una letra y un número." });
      if (db.users.some(item => item.email === email)) return json(res, 409, { error: "Ya existe una cuenta con ese correo. Inicia sesión." });
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = (await scrypt(password, salt, 64)).toString("hex");
      user = { id: crypto.randomUUID(), name, email, role: "client", salt, passwordHash, mustChangePassword: false, createdAt: new Date().toISOString() };
      db.users.push(user);
      await saveDatabase(db);
    } else {
      user = db.users.find(item => item.email === email);
      if (!user) return json(res, 401, { error: "Correo o contraseña incorrectos." });
      const attempted = (await scrypt(password, user.salt, 64)).toString("hex");
      const a = Buffer.from(attempted, "hex");
      const b = Buffer.from(user.passwordHash, "hex");
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return json(res, 401, { error: "Correo o contraseña incorrectos." });
    }
    const token = crypto.randomBytes(32).toString("base64url");
    const key = crypto.createHash("sha256").update(token).digest("hex");
    sessions.set(key, { userId: user.id, expires: Date.now() + SESSION_TTL });
    setSessionCookie(req, res, token);
    return json(res, route.endsWith("register") ? 201 : 200, { user: publicUser(user) });
  }

  if (method === "POST" && route === "/api/auth/logout") {
    const token = readCookie(req, "eduverso_session");
    if (token) sessions.delete(crypto.createHash("sha256").update(token).digest("hex"));
    clearSessionCookie(req, res);
    return json(res, 200, { ok: true });
  }

  if (method === "POST" && route === "/api/inquiries") {
    const body = await readBody(req);
    const name = clean(body.name, 100), email = clean(body.email, 254).toLowerCase();
    const message = clean(body.message, 3000), reason = clean(body.reason, 120);
    if (name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 10 || !reason) return json(res, 400, { error: "Revisa tu nombre, correo, motivo y mensaje." });
    const inquiry = { id: crypto.randomUUID(), name, email, phone: clean(body.phone, 40) || "No indicado", reason, course: clean(body.course, 120) || "Sin definir", message, status: "nuevo", createdAt: new Date().toISOString() };
    db.inquiries.unshift(inquiry);
    await saveDatabase(db);
    return json(res, 201, { ok: true, inquiry: { id: inquiry.id } });
  }

  const user = await currentUser(req, db);
  if (method === "GET" && route === "/api/enrollments") {
    if (!user) return json(res, 401, { error: "Inicia sesión para ver tus cursos." });
    return json(res, 200, db.enrollments.filter(item => item.userId === user.id));
  }

  if (method === "POST" && route === "/api/enrollments") {
    if (!user) return json(res, 401, { error: "Inicia sesión para solicitar una inscripción." });
    const body = await readBody(req);
    const courseId = Number(body.courseId);
    const course = db.courses.find(item => item.id === courseId);
    if (!course) return json(res, 404, { error: "No encontramos ese curso." });
    if (db.enrollments.some(item => item.userId === user.id && item.courseId === courseId)) return json(res, 409, { error: "Ya tienes una solicitud para este curso." });
    const enrollment = { id: crypto.randomUUID(), userId: user.id, courseId, courseName: course.nombre, status: "solicitada", createdAt: new Date().toISOString() };
    db.enrollments.unshift(enrollment);
    await saveDatabase(db);
    return json(res, 201, { enrollment });
  }

  if (user?.role !== "admin") return json(res, user ? 403 : 401, { error: user ? "Esta sección es solo para administración." : "Inicia sesión para continuar." });
  if (user.mustChangePassword && !(method === "POST" && route === "/api/admin/password")) return json(res, 428, { error: "Por seguridad, cambia primero la contraseña inicial." });

  if (method === "GET" && route === "/api/admin/overview") {
    return json(res, 200, {
      stats: { users: db.users.filter(item => item.role === "client").length, courses: db.courses.length, inquiries: db.inquiries.length, pending: db.inquiries.filter(item => item.status === "nuevo").length, enrollments: db.enrollments.length },
      users: db.users.filter(item => item.role === "client").map(publicUser), inquiries: db.inquiries, enrollments: db.enrollments
    });
  }

  if (method === "PUT" && route === "/api/admin/courses") {
    const body = await readBody(req);
    if (!Array.isArray(body.courses) || body.courses.length > 500) return json(res, 400, { error: "Lista de cursos inválida." });
    const courses = body.courses.map(validateCourse);
    if (courses.some(course => !course) || new Set(courses.map(course => course.id)).size !== courses.length) return json(res, 400, { error: "Revisa los datos y evita identificadores duplicados." });
    db.courses = courses;
    await saveDatabase(db);
    return json(res, 200, { courses: db.courses });
  }

  const inquiryMatch = route.match(/^\/api\/admin\/inquiries\/([^/]+)$/);
  if (inquiryMatch && method === "PATCH") {
    const body = await readBody(req);
    const inquiry = db.inquiries.find(item => item.id === inquiryMatch[1]);
    if (!inquiry) return json(res, 404, { error: "No encontramos esa solicitud." });
    if (!["nuevo", "atendido"].includes(body.status)) return json(res, 400, { error: "Estado inválido." });
    inquiry.status = body.status;
    await saveDatabase(db);
    return json(res, 200, { inquiry });
  }
  if (inquiryMatch && method === "DELETE") {
    const before = db.inquiries.length;
    db.inquiries = db.inquiries.filter(item => item.id !== inquiryMatch[1]);
    if (before === db.inquiries.length) return json(res, 404, { error: "No encontramos esa solicitud." });
    await saveDatabase(db);
    return json(res, 200, { ok: true });
  }

  if (method === "POST" && route === "/api/admin/password") {
    const body = await readBody(req);
    const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const next = typeof body.newPassword === "string" ? body.newPassword : "";
    const currentHash = Buffer.from((await scrypt(current, user.salt, 64)).toString("hex"), "hex");
    const savedHash = Buffer.from(user.passwordHash, "hex");
    if (currentHash.length !== savedHash.length || !crypto.timingSafeEqual(currentHash, savedHash)) return json(res, 401, { error: "La contraseña actual no coincide." });
    if (next.length < 12 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) return json(res, 400, { error: "Usa al menos 12 caracteres, con letras y números." });
    user.salt = crypto.randomBytes(16).toString("hex");
    user.passwordHash = (await scrypt(next, user.salt, 64)).toString("hex");
    user.mustChangePassword = false;
    await saveDatabase(db);
    return json(res, 200, { user: publicUser(user) });
  }

  return json(res, 404, { error: "Ruta no encontrada." });
}

async function serveStatic(req, res, url) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch { res.writeHead(400); res.end("Solicitud inválida"); return; }
  if (pathname === "/") pathname = "/index.html";
  const publicPages = new Set(["/index.html", "/catalogo.html", "/contacto.html", "/cuenta.html", "/admin.html"]);
  if (!publicPages.has(pathname) && !pathname.startsWith("/css/") && !pathname.startsWith("/js/")) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("No encontramos esta página."); return;
  }
  const target = path.resolve(ROOT, `.${pathname}`);
  if (!target.startsWith(`${ROOT}${path.sep}`)) { res.writeHead(403); res.end("Prohibido"); return; }
  try {
    const stat = await fs.stat(target);
    if (!stat.isFile()) throw Object.assign(new Error(), { code: "ENOENT" });
    const content = await fs.readFile(target);
    res.writeHead(200, { "Content-Type": CONTENT_TYPES[path.extname(target)] || "application/octet-stream", "Cache-Control": path.extname(target) === ".html" ? "no-cache" : "public, max-age=3600" });
    res.end(content);
  } catch (error) {
    if (error.code === "ENOENT") { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("No encontramos esta página."); return; }
    throw error;
  }
}

let apiRequestQueue = Promise.resolve();
const server = http.createServer(async (req, res) => {
  setSecurityHeaders(res);
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      const pending = apiRequestQueue.then(() => handleApi(req, res, url));
      apiRequestQueue = pending.catch(() => {});
      await pending;
    }
    else if (req.method === "GET" || req.method === "HEAD") await serveStatic(req, res, url);
    else json(res, 405, { error: "Método no permitido." }, { Allow: "GET, HEAD" });
  } catch (error) {
    console.error("Error procesando solicitud:", error);
    if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : "Ocurrió un error interno. Intenta de nuevo." });
    else res.destroy();
  }
});

server.listen(PORT, HOST, () => console.log(`Eduverso disponible en http://localhost:${PORT}`));
