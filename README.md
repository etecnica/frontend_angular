# Spike Investments - Frontend Angular

Este proyecto corresponde a la implementación del frontend en Angular para el sistema Spike Investments, desarrollado como evidencia académica del programa Análisis y Desarrollo de Software del SENA.

El proyecto toma como base el prototipo construido previamente con HTML, CSS y JavaScript, conservando su interfaz visual, pero migrando su estructura a Angular mediante el componente principal de la aplicación.

## Objetivo del proyecto

Implementar Angular como framework frontend para integrar los módulos del sistema Spike Investments con la API REST desarrollada previamente en Node.js, Express y MySQL.

## Relación con la sesión anterior

En la sesión anterior el frontend estaba compuesto por:

- `Index.html`: estructura visual de la aplicación.
- `styles.css`: estilos de la interfaz.
- `app.js`: lógica de navegación, login, registro, carrito, CRUD y consumo de API.
- `server.js`: backend con Node.js, Express y MySQL.

En esta versión con Angular, la estructura se reorganiza así:

- `src/app/app.html`: reemplaza la estructura visual principal del `Index.html`.
- `src/styles.css`: conserva los estilos globales del prototipo anterior.
- `src/app/app.ts`: contiene la lógica que antes estaba en `app.js`, ahora usando TypeScript.
- `backend_spike/server.js`: se conserva como backend y no es reemplazado por Angular.

## Tecnologías utilizadas

- Angular
- TypeScript
- HTML
- CSS
- Node.js
- Express
- MySQL
- Git y GitHub
- pnpm como gestor de paquetes

## Funcionalidades implementadas

- Interfaz principal de Spike Investments en Angular.
- Registro de clientes conectado a MySQL.
- Inicio de sesión mediante API REST.
- Validación de usuario administrador.
- Visualización de opciones administrativas según rol.
- CRUD de productos.
- CRUD de clientes.
- Consumo de rutas `/login`, `/clientes` y `/productos`.
- Separación entre frontend Angular y backend Node.js.

## Puertos utilizados

El frontend Angular se ejecuta en:

```bash
http://localhost:4200

El backend con Node.js y Express se ejecuta en:

http://localhost:3000
Ejecución del frontend Angular

Para ingresar al frontend:

cd frontend_angular
pnpm install
ng serve

Luego abrir en el navegador:

http://localhost:4200
Ejecución del backend

Para iniciar el servidor backend:

cd backend_spike
node server.js

El backend se conecta a la base de datos MySQL db_spike.

Evidencia de integración

La integración se valida cuando desde Angular se registra un cliente, se inicia sesión con usuario administrador y se realizan operaciones CRUD, verificando que los datos se almacenan y actualizan correctamente en MySQL.

Autor

Aprendiz: Eduardo Colmenares
Programa: Análisis y Desarrollo de Software
Institución: SENA