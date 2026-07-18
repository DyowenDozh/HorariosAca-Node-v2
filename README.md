# HorariosAca — Node.js + Express + MySQL API REST

Módulo de servicios web para el sistema HorariosAca, desarrollado con Node.js, Express y MySQL siguiendo arquitectura limpia con separación de responsabilidades (Routes → Controllers → Services → Database).

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js v26.1.0 |
| Framework | Express 4.x |
| Base de datos | MySQL 8.4 |
| Conector DB | mysql2 |
| Variables de entorno | dotenv |
| Arquitectura | Routes → Controller → Service → DB |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL 8.x](https://laragon.org/download/) (recomendado via Laragon)
- [Postman](https://www.postman.com/downloads/) para probar los endpoints
- [Git](https://git-scm.com/downloads)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/DyowenDozh/HorariosAca-Node-v2.git
cd HorariosAca-Node-v2
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear la base de datos

Conectarse a MySQL y ejecutar:

```sql
CREATE DATABASE IF NOT EXISTS horariosaca_node 
CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE horariosaca_node;

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

### 4. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=horariosaca_node
```

### 5. Correr el servidor

```bash
node index.js
```

El servidor arranca en `http://localhost:3000` y muestra:
```
Server running at http://localhost:3000
Database connected successfully
```

---

## Estructura del proyecto

```
HorariosAca-Node-v2/
├── src/
│   ├── config/
│   │   └── db.js               # MySQL connection pool
│   ├── controllers/
│   │   ├── teacher.controller.js
│   │   ├── subject.controller.js
│   │   └── grade.controller.js
│   ├── routes/
│   │   ├── teacher.routes.js
│   │   ├── subject.routes.js
│   │   └── grade.routes.js
│   ├── services/
│   │   ├── teacher.service.js
│   │   ├── subject.service.js
│   │   └── grade.service.js
│   └── app.js
├── index.js
├── .env                        # Not included in repo
├── .gitignore
└── package.json
```

---

## Endpoints de la API

### Teachers

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/teachers` | Get all teachers |
| GET | `/api/teachers/:id` | Get a teacher by ID |
| POST | `/api/teachers` | Create a new teacher |
| PUT | `/api/teachers/:id` | Update a teacher |
| DELETE | `/api/teachers/:id` | Delete a teacher |

### Subjects

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/subjects` | Get all subjects |
| GET | `/api/subjects/:id` | Get a subject by ID |
| POST | `/api/subjects` | Create a new subject |
| PUT | `/api/subjects/:id` | Update a subject |
| DELETE | `/api/subjects/:id` | Delete a subject |

### Grades

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/grades` | Get all grades |
| GET | `/api/grades/:id` | Get a grade by ID |
| POST | `/api/grades` | Create a new grade |
| PUT | `/api/grades/:id` | Update a grade |
| DELETE | `/api/grades/:id` | Delete a grade |

---

## Pruebas con Postman

### Teachers

**POST — Crear profesor**
- URL: `http://localhost:3000/api/teachers`
- Body (raw JSON):
```json
{
    "teacher_name": "Carlos García",
    "amount_hour": 20
}
```
- Respuesta (201 Created):
```json
{
    "message": "Teacher created successfully",
    "data": {
        "teacher_id": 1,
        "teacher_name": "Carlos García",
        "amount_hour": 20
    }
}
```

**GET — Listar profesores**
- URL: `http://localhost:3000/api/teachers`
- Respuesta (200 OK):
```json
{
    "message": "Teachers retrieved successfully",
    "total": 1,
    "data": [
        {
            "teacher_id": 1,
            "teacher_name": "Carlos García",
            "amount_hour": 20,
            "created_at": "2026-07-18T19:19:46.000Z"
        }
    ]
}
```

**PUT — Actualizar profesor**
- URL: `http://localhost:3000/api/teachers/1`
- Body (raw JSON):
```json
{
    "teacher_name": "Carlos García López",
    "amount_hour": 25
}
```
- Respuesta (200 OK):
```json
{ "message": "Teacher updated successfully" }
```

**DELETE — Eliminar profesor**
- URL: `http://localhost:3000/api/teachers/1`
- Respuesta (200 OK):
```json
{ "message": "Teacher deleted successfully" }
```

---

### Subjects

**POST — Crear materia**
- URL: `http://localhost:3000/api/subjects`
- Body (raw JSON):
```json
{
    "subject_name": "Mathematics",
    "color_id": "#FF5733"
}
```
- Respuesta (201 Created):
```json
{
    "message": "Subject created successfully",
    "data": {
        "subject_id": 1,
        "subject_name": "Mathematics",
        "color_id": "#FF5733"
    }
}
```

---

### Grades

**POST — Crear grado**
- URL: `http://localhost:3000/api/grades`
- Body (raw JSON):
```json
{
    "grade_name": "10-A"
}
```
- Respuesta (201 Created):
```json
{
    "message": "Grade created successfully",
    "data": {
        "grade_id": 1,
        "grade_name": "10-A"
    }
}
```

---

## Códigos de estado HTTP

| Código | Significado |
|--------|-------------|
| 200 OK | Petición exitosa |
| 201 Created | Recurso creado exitosamente |
| 400 Bad Request | Datos inválidos o faltantes |
| 404 Not Found | Recurso no encontrado |
| 500 Internal Server Error | Error del servidor |

---

## Notas

- Los datos se almacenan en MySQL — persisten aunque se reinicie el servidor.
- El archivo `.env` no está incluido en el repositorio por seguridad. Debe crearse manualmente.
- Si MySQL tiene contraseña, agregar en `.env`: `DB_PASSWORD=tu_contraseña`
