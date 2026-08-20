# HorariosAca — Node.js + Express + MySQL + React

Sistema web para la **gestión y configuración de horarios académicos** de instituciones educativas. Permite a un usuario autenticado configurar la estructura de una jornada escolar, registrar asignaturas, grados con su malla curricular, profesores con su disponibilidad y reglas de asignación, y preferencias de organización. Toda la información se almacena en una base de datos relacional normalizada.

La autenticación se realiza con JSON Web Tokens (JWT) y la arquitectura sigue el patrón **Routes → Controller → Service → DB**.

---

## Tecnologías

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend Runtime | Node.js | 26.1.0 |
| Backend Framework | Express | 5.2.1 |
| Base de datos | MySQL | 8.4.3 |
| Conector BD | mysql2 | 3.23.0 |
| Autenticación | jsonwebtoken (JWT) | 9.0.3 |
| Cifrado | bcryptjs | 3.0.3 |
| Frontend | React | 19.2.8 |
| Build tool | Vite | 8.2.0 |
| HTTP Client | axios | 1.19.0 |

---

## Características principales

- **Autenticación JWT** con registro, inicio de sesión y gestión de cuenta.
- **Gestión de horarios** con persistencia real en MySQL: crear, editar, listar y eliminar.
- **Borradores y papelera**: los horarios sin terminar se guardan como borrador; la eliminación es un borrado suave (soft delete) con opción de restaurar o eliminar definitivamente.
- **Aislamiento por horario**: cada horario mantiene sus propias materias, grados y profesores mediante llaves foráneas, sin compartir datos entre horarios.
- **Asistente de creación en 6 fases**:
  1. **Estructura** — días laborales, horas por día, duración de clase, hora de inicio y descansos (con diales y arrastrar-y-soltar).
  2. **Materias** — asignaturas con sigla automática, color y control de duplicados.
  3. **Grados** — creación de grados y su malla curricular (materias y horas semanales, con opción de copiar de otro grado).
  4. **Profesores** — materias que imparte, disponibilidad semanal (D/ND), límites y reglas por grado (podrá / deberá / no impartirá).
  5. **Preferencias** — preferencias generales y detalladas de agrupamiento por clase.
  6. **Resultado** — cierre del asistente.
- **Interfaz bilingüe** español / inglés.

> **Nota:** la generación automática del horario sin choques y la exportación a PDF/Excel están planificadas como trabajo futuro. Toda la configuración necesaria para ellas ya se almacena en la base de datos.

---

## Estructura del proyecto

```
HorariosAca-Node-v2/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/                    # Vistas y fases del asistente
│   │   ├── components/              # Componentes reutilizables (Modal, Sidebar, Dial...)
│   │   ├── services/
│   │   │   └── api.js               # Peticiones HTTP con axios
│   │   ├── i18n/                     # Soporte bilingüe ES/EN
│   │   └── main.jsx
│   └── package.json
├── src/                             # Backend Node.js
│   ├── config/
│   │   └── db.js                    # Conexión MySQL
│   ├── controllers/                 # Manejo de peticiones HTTP
│   ├── middlewares/
│   │   └── authMiddleware.js        # Validación JWT
│   ├── routes/                      # Definición de endpoints
│   ├── services/                    # Lógica de negocio y consultas SQL
│   └── app.js
├── index.js                         # Punto de entrada del servidor
├── .env                             # Variables de entorno (no incluido en el repo)
├── .gitignore
└── package.json
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL 8.x](https://laragon.org/download/) (recomendado vía Laragon)
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

Crear la base de datos `horariosaca_node` y ejecutar los scripts SQL del proyecto para generar las tablas. El modelo relacional está compuesto por las siguientes tablas:

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios registrados del sistema. |
| `schedules` | Horarios; pertenecen a un usuario. |
| `schedule_days` | Configuración de cada día de un horario. |
| `schedule_breaks` | Descansos de cada día. |
| `schedule_prefs` | Preferencias generales del horario. |
| `subjects` | Asignaturas de un horario. |
| `grades` | Grados o salones de un horario. |
| `grade_subjects` | Malla curricular: materias y horas por grado. |
| `teachers` | Profesores de un horario. |
| `teacher_subjects` | Materias que imparte cada profesor. |
| `teacher_availability` | Horas no disponibles de un profesor. |
| `teacher_day_limits` | Límite diario de horas por profesor. |
| `teacher_grade_rules` | Reglas por grado (podrá / debe / no impartirá). |
| `schedule_pref_details` | Preferencias de agrupamiento por clase. |

Todas las relaciones usan llaves foráneas con `ON DELETE CASCADE` para preservar la integridad referencial.

### 5. Configurar variables de entorno

Crear un archivo `.env` en la raíz:

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

> El frontend recarga los cambios automáticamente (Vite). El backend debe reiniciarse manualmente tras modificar su código.

---

## Endpoints de la API

Todos los módulos, salvo autenticación, requieren un token JWT válido en la cabecera `Authorization: Bearer <token>`.

| Módulo | Ruta base | Descripción |
|--------|-----------|-------------|
| Autenticación | `/api/auth` | Registro e inicio de sesión (emite JWT). |
| Horarios | `/api/schedules` | CRUD de horarios, borradores, papelera y finalización. |
| Materias | `/api/subjects` | CRUD de asignaturas, aisladas por horario. |
| Grados | `/api/grades` | CRUD de grados, aislados por horario. |
| Malla curricular | `/api/grade-subjects` | Materias y horas semanales por grado. |
| Profesores | `/api/teachers` | CRUD de profesores, aislados por horario. |
| Config. profesor | `/api/teacher-config` | Materias, disponibilidad, límites y reglas por grado. |
| Preferencias | `/api/pref-details` | Preferencias detalladas de agrupamiento. |

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

## Seguridad

- El archivo `.env` **no** se incluye en el repositorio (está en `.gitignore`).
- Las contraseñas se almacenan **hasheadas con bcrypt**, nunca en texto plano.
- El acceso a los módulos de gestión está protegido con JWT.
- El token expira en 24 horas.

---

## Estado del proyecto

Este repositorio corresponde a la evidencia **GA8-220501096-AA1-EV02: Módulos integrados** del programa Análisis y Desarrollo de Software (SENA). Los módulos de autenticación, gestión de horarios y las fases de configuración (estructura, materias, grados, profesores y preferencias) se encuentran integrados y funcionales con persistencia real en base de datos. La generación automática del horario y la exportación quedan documentadas como trabajo futuro.
