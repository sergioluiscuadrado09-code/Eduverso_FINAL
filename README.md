# Eduverso

Plataforma educativa en español con catálogo de cursos, chatbot de orientación, contacto, cuentas de clientes y administración privada.

## Funcionalidades

- Registro e inicio de sesión con correo y contraseña.
- Contraseñas de clientes y administración cifradas con scrypt; la base JSON solo guarda hashes y sales, nunca contraseñas en texto.
- Sesiones de servidor en cookie `HttpOnly` y `SameSite=Strict`, con permisos diferentes para cliente y administrador.
- Solicitudes de cupo asociadas a la cuenta del estudiante.
- Contacto, cuentas, cursos, inscripciones y estados guardados en el archivo JSON del servidor.
- Panel privado para cursos, solicitudes, clientes, métricas y cambio de contraseña.
- Catálogo y asistente Eda conectados a los cursos almacenados.
- API integrada en Node.js sin dependencias de terceros.

## Ejecutar localmente

Requiere Node.js 20 o posterior. En Windows puedes ejecutar `INICIAR-EDUVERSO.bat`, mantener abierta la ventana que aparece y abrir `http://localhost:3000`. También puedes iniciar el servidor desde la terminal:

```bash
npm start
```

Abre `http://localhost:3000`. La base de datos se crea en `data/eduverso.json` con los 12 cursos iniciales y la cuenta administrativa. No abras los HTML directamente con `file://`: las pantallas necesitan el servidor para usar la API y compartir datos.

Para configurar el primer administrador antes del primer inicio, copia `.env.example` a `.env` y usa valores privados. PowerShell permite arrancar el servidor así:

```powershell
$env:ADMIN_EMAIL = "admin@tu-dominio.com"
$env:ADMIN_PASSWORD = "UnaClaveInicialPrivada2026!"
$env:DATA_FILE = ".\data\eduverso.json"
npm start
```

El administrador debe reemplazar la contraseña inicial desde la pestaña **Seguridad** antes de usar el resto del panel. Las cuentas de cliente se crean desde **Mi cuenta**; el cliente queda conectado automáticamente después del registro.

## Despliegue con datos persistentes

GitHub Pages solo publica archivos estáticos: no ejecuta la API ni conserva cambios del servidor. Para esta versión full stack, publica el proyecto como un **Web Service de Node.js** y añade un disco persistente en el proveedor. El archivo JSON debe vivir dentro del punto de montaje persistente.

El archivo `render.yaml` deja preparada la configuración de Render. En el servicio, define los secretos `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el panel del proveedor; usa una contraseña inicial privada. Confirma que el disco esté montado en `/opt/render/project/src/data` y que `DATA_FILE` apunte a `/opt/render/project/src/data/eduverso.json`. La ruta de salud es `/api/health`.

Tras desplegar, abre la URL HTTPS del servicio, inicia sesión en **Admin**, cambia la contraseña y luego crea una cuenta de cliente de prueba. Descarga copias de seguridad periódicas del archivo JSON. Si se elimina el disco o el archivo de datos, los registros no se pueden recuperar desde el código fuente.

## Credenciales iniciales locales

Si no se configuran variables de entorno antes de crear el archivo de datos:

| Rol | Correo | Contraseña inicial |
|---|---|---|
| Administrador | `admin@eduverso.edu.co` | `EduversoAdmin2026!` |

El administrador cambia esta clave al primer ingreso. No reutilices la contraseña de ejemplo en una publicación pública; establece `ADMIN_EMAIL` y `ADMIN_PASSWORD` privados antes del primer arranque del servicio. Cada cliente elige su correo y contraseña al registrarse.

## Estructura

```text
eduverso/
├── server.js                 # API, autenticación, permisos y servidor web
├── render.yaml               # Servicio Node y disco persistente
├── data/eduverso.json        # Base de datos local (excluida de Git)
├── index.html                # Inicio
├── catalogo.html             # Catálogo
├── cuenta.html               # Registro, sesión e inscripciones del cliente
├── contacto.html             # Formulario guardado en el servidor
├── admin.html                # Panel protegido
├── css/styles.css            # Identidad visual y responsive
└── js/                       # API, páginas, autenticación y Eda
```
