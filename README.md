# Academic Management Web

Frontend Vue 3 para una aplicacion de gestion academica. La interfaz consume una API real para estudiantes, matriculas, pagos, asignaturas, notas, certificados e indicadores.

El objetivo del proyecto es que pueda levantarse de forma reproducible en cualquier maquina y que sea migrable a nube sin cambiar codigo fuente: la URL de la API, autenticacion y rol inicial se configuran por variables de entorno.

## Requisitos

- Node.js `^22.18.0` o `>=24.12.0`, segun `package.json`.
- npm 10 o superior.
- API backend disponible y accesible desde el navegador.

## Configuracion

1. Instala dependencias:

```sh
npm install
```

2. Crea el archivo de entorno:

```sh
cp .env.example .env
```

3. Ajusta la URL del backend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_AUTH_REQUIRED=false
VITE_DEFAULT_USER_NAME=Suany D. Medina
VITE_DEFAULT_USER_ROLE=admin
```

Para nube, cambia `VITE_API_BASE_URL` por la URL publica del backend, por ejemplo `https://api.mi-dominio.com/api`.

## Scripts

```sh
npm run dev
```

Levanta el entorno local con Vite.

```sh
npm run build
```

Genera el build de produccion en `dist/`.

```sh
npm run preview
```

Sirve localmente el build generado para validarlo antes de publicar.

```sh
npm run lint
```

Ejecuta las reglas de lint del proyecto.

## Variables de entorno

- `VITE_API_BASE_URL`: URL base de la API. Todas las llamadas salen desde `src/services/api.js`.
- `VITE_AUTH_REQUIRED`: cuando vale `true`, la app exige token guardado en `localStorage`.
- `VITE_DEFAULT_USER_NAME`: nombre mostrado en el encabezado cuando no hay login conectado.
- `VITE_DEFAULT_USER_ROLE`: rol inicial para desarrollo o demos. Roles soportados: `admin`, `academic`, `finance`, `teacher`, `student`.

## Roles y rutas

Las rutas estan protegidas en `src/router/index.js`.

- `admin`: acceso completo.
- `academic`: dashboard, estudiantes, matriculas, asignaturas, notas y certificados.
- `finance`: dashboard y pagos.
- `teacher`: dashboard, asignaturas y notas.
- `student`: dashboard.

El menu lateral filtra automaticamente los modulos que no corresponden al rol activo.

## Consumo de API

La app usa `axios` y adjunta `Bearer token` si existe `academic_management_token` en `localStorage`. Los endpoints consumidos incluyen:

- `GET /students`
- `GET /academic-periods`
- `GET /careers`
- `GET /subjects`
- `GET /enrollments`
- `GET /payments`
- `GET /teachers`
- `GET /course-groups`
- `GET /grades`
- `GET /certificates`
- `GET /dashboard/metrics`

Las operaciones de creacion y actualizacion tambien se hacen contra la API mediante los stores de Pinia.

## Estados de carga y errores

Cada store mantiene `loading` y `error`. `App.vue` muestra un estado global de carga, resume errores de API y ofrece reintento de carga. Los errores `401` y `403` se capturan desde el interceptor de API para avisar problemas de sesion o permisos.

## Despliegue

1. Define las variables de entorno del proveedor cloud.
2. Ejecuta `npm ci`.
3. Ejecuta `npm run build`.
4. Publica la carpeta `dist/` en el hosting estatico.
5. Configura fallback de SPA para que todas las rutas sirvan `index.html`.

Esta aplicacion ya puede levantarse de forma reproducible en cualquier maquina.
