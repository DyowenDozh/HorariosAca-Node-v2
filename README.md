# HorariosAca — Node.js + Express + MySQL + React

Sistema de gestión de horarios académicos con autenticación JWT. Incluye un backend REST API con Node.js/Express y un frontend en React con flujo de autenticación completo.

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend Runtime | Node.js v26.1.0 |
| Backend Framework | Express 4.x |
| Base de datos | MySQL 8.4 |
| Autenticación | JSON Web Tokens (JWT) |
| Cifrado | Bcrypt |
| Frontend | React + Vite |
| HTTP Client | Axios |
| Arquitectura | Routes → Controller → Service → DB |

---

## Estructura del proyecto

```
HorariosAca-Node-v2/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Página de login
│   │   │   └── Dashboard.jsx        # Página protegida
│   │   ├── services/
│   │   │   └── api.js               # Peticiones HTTP con axios
│   │   ├── App.jsx                  # Routing por autenticación
│   │   └── main.jsx
│   └── package.json
├── src/                             # Backend Node.js
│   ├── config/
│   │   └── db.js                    # Conexión MySQL
│   ├── controllers/
│   │   ├── authController.js        # Login y registro
│   │   ├── teacher.controller.js
│   │   ├── subject.controller.js
│   │   └── grade.controller.js
│   ├── middlewares/
│   │   └── authMiddleware.js        # Validación JWT
│   ├── routes/
│   │   ├── authRoutes.js            # /api/auth
│   │   ├── teacher.routes.js        # /api/teachers (protegida)
│   │   ├── subject.routes.js        # /api/subjects (protegida)
│   │   └── grade.routes.js          # /api/grades (protegida)
│   ├── services/
│   │   ├── authService.js           # Lógica de autenticación
│   │   ├── teacher.service.js
│   │   ├── subject.service.js
│   │   └── grade.service.js
│   └── app.js
├── index.js                         # Entry point del servidor
├── .env                             # Variables de entorno (no incluido)
├── .gitignore
└── package.json
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL 8.x](https://laragon.org/download/) (recomendado via Laragon)
- [Postman](https://www.postman.com/downloads/) para probar el backend
- [Git](https://git-scm.com/downloads)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/DyowenDozh/HorariosAca-Node-v2.git
cd HorariosAca-Node-v2
```

### 2. Instalar dependencias del backend

```bash
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd client
npm install
cd ..
```

### 4. Crear la base de datos

Conectarse a MySQL y ejecutar:

```sql
CREATE DATABASE IF NOT EXISTS horariosaca_node 
CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE horariosaca_node;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_name VARCHAR(100) NOT NULL,
    amount_hour INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    color_id VARCHAR(10) NOT NULL DEFAULT '#FFFFFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grades (
    grade_id INT AUTO_INCREMENT PRIMARY KEY,
    grade_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Configurar variables de entorno

Crear archivo `.env` en la raíz:

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=horariosaca_node
JWT_SECRET=horariosaca_secret_key_2026
JWT_EXPIRES_IN=24h
```

---

## Ejecución

### Backend

```bash
node index.js
```

Servidor disponible en `http://localhost:3000`

### Frontend React

```bash
cd client
node node_modules/vite/bin/vite.js
```

Aplicación disponible en `http://localhost:5173`

---

## Flujo de autenticación

```
1. Usuario se registra   → POST /api/auth/register
2. Usuario hace login    → POST /api/auth/login → recibe JWT token
3. Frontend guarda token → localStorage
4. Peticiones protegidas → Authorization: Bearer <token>
5. Middleware valida     → 401 sin token | 200 con token válido
```

---

## Endpoints de la API

### Autenticación (públicos)

| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión → devuelve JWT |

### Teachers (protegidos — requieren JWT)

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/teachers` | Get all teachers |
| GET | `/api/teachers/:id` | Get teacher by ID |
| POST | `/api/teachers` | Create teacher |
| PUT | `/api/teachers/:id` | Update teacher |
| DELETE | `/api/teachers/:id` | Delete teacher |

### Subjects (protegidos)

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/subjects` | Get all subjects |
| POST | `/api/subjects` | Create subject |
| PUT | `/api/subjects/:id` | Update subject |
| DELETE | `/api/subjects/:id` | Delete subject |

### Grades (protegidos)

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/grades` | Get all grades |
| POST | `/api/grades` | Create grade |
| PUT | `/api/grades/:id` | Update grade |
| DELETE | `/api/grades/:id` | Delete grade |

---

## Pruebas con Postman

### 1. Registrar usuario
- **POST** `http://localhost:3000/api/auth/register`
- Body:
```json
{
    "nombre": "Daniel Ortiz",
    "email": "daniel@test.com",
    "password": "MiPassword1!"
}
```

### 2. Login
- **POST** `http://localhost:3000/api/auth/login`
- Body:
```json
{
    "email": "daniel@test.com",
    "password": "MiPassword1!"
}
```
- Respuesta: `{ "token": "eyJ...", "user": {...} }`

### 3. Ruta protegida sin token
- **GET** `http://localhost:3000/api/teachers`
- Respuesta: `401 Unauthorized` — `{ "message": "No token provided" }`

### 4. Ruta protegida con token
- **GET** `http://localhost:3000/api/teachers`
- Header: `Authorization: Bearer <token>`
- Respuesta: `200 OK` — lista de profesores

---

## Códigos de estado HTTP

| Código | Significado |
|--------|-------------|
| 200 OK | Petición exitosa |
| 201 Created | Recurso creado |
| 400 Bad Request | Datos inválidos |
| 401 Unauthorized | Sin token |
| 403 Forbidden | Token inválido o expirado |
| 404 Not Found | Recurso no encontrado |
| 409 Conflict | Email ya registrado |
| 500 Internal Server Error | Error del servidor |

---

## Notas

- El archivo `.env` no está incluido en el repositorio. Debe crearse manualmente.
- Las contraseñas se almacenan hasheadas con **bcrypt** — nunca en texto plano.
- El token JWT expira en **24 horas**.
- Si MySQL tiene contraseña, agregar en `.env`: `DB_PASSWORD=tu_contraseña`
