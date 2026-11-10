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
| Exportación Excel | exceljs | 4.4.0 |
| Exportación PDF | jspdf + jspdf-autotable | 2.5.2 / 3.8.2 |

---

## Características principales

- **Autenticación JWT** con registro, inicio de sesión y gestión de cuenta.
- **Gestión de horarios** con persistencia real en MySQL: crear, editar, listar y eliminar.
- **Borradores y papelera**: los horarios sin terminar se guardan como borrador; la eliminación es un borrado suave (soft delete) con opción de restaurar o eliminar definitivamente.
- **Duplicar horario**: clona un horario completo (profesores, materias, grados, malla, reglas, disponibilidad, límites, preferencias y el horario generado) a uno nuevo e independiente. Ideal para el año siguiente: se reutiliza casi todo y editar la copia no afecta al original, porque cada profesor/materia/grado del duplicado es una fila nueva con su propio ID.
- **Aislamiento por horario**: cada horario mantiene sus propias materias, grados y profesores mediante llaves foráneas, sin compartir datos entre horarios.
- **Asistente de creación en 6 fases**:
  1. **Estructura** — días laborales, horas por día, duración de clase, hora de inicio y descansos (con diales y arrastrar-y-soltar).
  2. **Materias** — asignaturas con sigla automática, color y control de duplicados.
  3. **Grados** — creación de grados y su malla curricular (materias y horas semanales, con opción de copiar de otro grado).
  4. **Profesores** — materias que imparte, disponibilidad semanal (D/ND), límites y reglas por grado (podrá / deberá / no impartirá).
  5. **Preferencias** — preferencias generales y detalladas de agrupamiento por clase (unir horas, máximo 1/día, días no consecutivos).
  6. **Generación** — genera el horario automáticamente, lo muestra en tres vistas y permite exportarlo o editarlo a mano.
- **Generación automática de horarios**: motor en dos fases (asignación de días + coloreo de horas) que respeta las restricciones duras (sin choques de grado ni de profesor, reglas obligatorias, horas exactas) y las preferencias (unir materias, días no consecutivos, límites diarios y disponibilidad del profesor). Incluye:
  - **Repaso de calidad** que mejora la comodidad de los profesores: evita días libres innecesarios y que un profesor tenga dos horas libres seguidas.
  - **Relajación por niveles**: si el horario pedido es muy ajustado, va relajando preferencias y avisa al usuario qué no se pudo cumplir y por qué profesor.
  - **Variedad al regenerar**: cada regeneración explora un acomodo distinto sin empeorar el resultado.
- **Editor manual del horario**: ajustar el horario a mano sobre una grilla, por grados o por profesores (conmutables en caliente), con lápiz/borrador, aviso de conflictos (rojo/blanco), contador de materias pendientes y opción de limpiar para armar desde cero.
- **Exportación a PDF y Excel**: tres vistas (por grado, general y por profesor) con opciones de siglas, sin color y horario de estudiante (sin profesores).
- **Interfaz bilingüe** español / inglés (incluye los archivos exportados).

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

> La exportación a PDF/Excel usa `exceljs`, `jspdf` y `jspdf-autotable` (con sus dependencias `canvg`, `dompurify` y `html2canvas`). Si vienen listadas en `client/package.json`, `npm install` ya las instala. Si al exportar aparece un error de importación, instálalas con:
> ```bash
> cd client
> npm install exceljs jspdf jspdf-autotable canvg dompurify html2canvas
> ```

### 4. Crear la base de datos

Todo el esquema está en el archivo **`schema.sql`** (en la raíz del proyecto). Crea la base de datos `horariosaca_node` y las 15 tablas con sus relaciones.

**Opción A — línea de comandos** (desde la raíz del proyecto):

```bash
mysql -u root -p < schema.sql
```

**Opción B — interfaz gráfica** (DBeaver, MySQL Workbench, phpMyAdmin, HeidiSQL…): abre `schema.sql`, selecciona la base de datos y ejecuta todo el script de una vez (en DBeaver, con la base en negrita, `Alt + X`).

El script crea la base si no existe, así que puedes ejecutarlo tal cual. Vuelve a ejecutarlo cuando quieras reiniciar las tablas desde cero (borra y recrea).

El modelo relacional está compuesto por las siguientes tablas:

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
| `generated_classes` | Horario generado o editado a mano: cada clase ubicada en día y hora. |

Todas las relaciones usan llaves foráneas con `ON DELETE CASCADE` (o `SET NULL` en el profesor del horario generado) para preservar la integridad referencial.

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
| Horarios | `/api/schedules` | CRUD de horarios, borradores, papelera, finalización y duplicación. |
| Materias | `/api/subjects` | CRUD de asignaturas, aisladas por horario. |
| Grados | `/api/grades` | CRUD de grados, aislados por horario. |
| Malla curricular | `/api/grade-subjects` | Materias y horas semanales por grado. |
| Profesores | `/api/teachers` | CRUD de profesores, aislados por horario. |
| Config. profesor | `/api/teacher-config` | Materias, disponibilidad, límites y reglas por grado. |
| Preferencias | `/api/pref-details` | Preferencias detalladas de agrupamiento. |
| Generación | `/api/generate` | Genera y guarda el horario, lo recupera, y da el contexto y guardado de la edición manual. |

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

Proyecto formativo del programa **Análisis y Desarrollo de Software (SENA)**. Se encuentran integrados y funcionales con persistencia real en base de datos:

- Autenticación (registro, inicio de sesión, gestión de cuenta) con JWT y bcrypt.
- Gestión de horarios (crear, editar, listar, duplicar, borradores y papelera).
- Asistente de configuración en 6 fases (estructura, materias, grados, profesores, preferencias y generación).
- Generación automática del horario con repaso de calidad y relajación por niveles.
- Editor manual del horario sobre grilla.
- Exportación a PDF y Excel en tres vistas.
- Interfaz bilingüe español / inglés.