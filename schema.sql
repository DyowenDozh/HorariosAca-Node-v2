-- ============================================================================
-- HorariosAca-Node-v2 — Esquema completo de la base de datos
-- Motor: MySQL 8.4 (Laragon) · Base: horariosaca_node
--
-- CÓMO EJECUTAR EN DBeaver:
--   Con "horariosaca_node" seleccionada (en negrita), presiona Alt + X
--   para ejecutar TODO el script de una vez.
--
-- Este script crea las 15 tablas del sistema con sus relaciones (llaves
-- foráneas con ON DELETE CASCADE). No incluye usuarios ni contraseñas:
-- el primer usuario se registra desde la propia aplicación.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS horariosaca_node CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE horariosaca_node;

-- Borrado previo en orden inverso a las dependencias (para reejecutar limpio)
DROP TABLE IF EXISTS generated_classes;
DROP TABLE IF EXISTS schedule_pref_details;
DROP TABLE IF EXISTS teacher_grade_rules;
DROP TABLE IF EXISTS teacher_day_limits;
DROP TABLE IF EXISTS teacher_availability;
DROP TABLE IF EXISTS teacher_subjects;
DROP TABLE IF EXISTS grade_subjects;
DROP TABLE IF EXISTS schedule_prefs;
DROP TABLE IF EXISTS schedule_breaks;
DROP TABLE IF EXISTS schedule_days;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS users;

-- ============================================================================
-- 1. USUARIOS (autenticación JWT + bcrypt)
-- ============================================================================
CREATE TABLE users (
    user_id    INT AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- 2. HORARIOS (pertenecen a un usuario)
-- ============================================================================
CREATE TABLE schedules (
    schedule_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    name         VARCHAR(120) NOT NULL,
    institution  VARCHAR(150) DEFAULT '',
    school_year  VARCHAR(20)  DEFAULT '',
    journey      VARCHAR(20)  DEFAULT 'mañana',
    day_mode     VARCHAR(10)  DEFAULT 'uniform',   -- 'uniform' | 'perday'
    is_draft     TINYINT(1) NOT NULL DEFAULT 0,    -- borrador oculto de la lista
    deleted_at   TIMESTAMP NULL DEFAULT NULL,      -- papelera (soft delete)
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sched_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 3. DÍAS DEL HORARIO
-- ============================================================================
CREATE TABLE schedule_days (
    day_id        INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id   INT NOT NULL,
    day_key       VARCHAR(5)  NOT NULL,   -- 'all','lun','mar','mie','jue','vie','sab','dom'
    is_working    TINYINT(1)  DEFAULT 1,
    hours_per_day INT DEFAULT 1,
    class_h       INT DEFAULT 1,
    class_m       INT DEFAULT 0,
    start_h       INT DEFAULT 6,
    start_m       INT DEFAULT 0,
    start_ap      VARCHAR(2) DEFAULT 'AM',
    CONSTRAINT fk_day_sched FOREIGN KEY (schedule_id)
        REFERENCES schedules(schedule_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 4. DESCANSOS DE CADA DÍA
-- ============================================================================
CREATE TABLE schedule_breaks (
    break_id    INT AUTO_INCREMENT PRIMARY KEY,
    day_id      INT NOT NULL,
    after_hour  INT NOT NULL,
    minutes     INT NOT NULL,
    CONSTRAINT fk_break_day FOREIGN KEY (day_id)
        REFERENCES schedule_days(day_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 5. PREFERENCIAS GENERALES DEL HORARIO (Fase 5)
-- ============================================================================
CREATE TABLE schedule_prefs (
    schedule_id        INT PRIMARY KEY,
    no_repeat_same_day TINYINT(1) DEFAULT 1,
    group_two_hours    TINYINT(1) DEFAULT 0,
    avoid_three_in_row TINYINT(1) DEFAULT 1,
    area_meeting       TINYINT(1) DEFAULT 0,
    avoid_no_break     TINYINT(1) DEFAULT 1,
    CONSTRAINT fk_prefs_sched FOREIGN KEY (schedule_id)
        REFERENCES schedules(schedule_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 6. MATERIAS (aisladas por horario)
-- ============================================================================
CREATE TABLE subjects (
    subject_id   INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    color_id     VARCHAR(10) NOT NULL DEFAULT '#FFFFFF',
    abbreviation VARCHAR(10) DEFAULT '',
    schedule_id  INT NULL,
    CONSTRAINT fk_subject_sched FOREIGN KEY (schedule_id)
        REFERENCES schedules(schedule_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 7. GRADOS / SALONES (aislados por horario)
-- ============================================================================
CREATE TABLE grades (
    grade_id    INT AUTO_INCREMENT PRIMARY KEY,
    grade_name  VARCHAR(50) NOT NULL,
    schedule_id INT NULL,
    CONSTRAINT fk_grade_sched FOREIGN KEY (schedule_id)
        REFERENCES schedules(schedule_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 8. PROFESORES (aislados por horario)
-- ============================================================================
CREATE TABLE teachers (
    teacher_id   INT AUTO_INCREMENT PRIMARY KEY,
    teacher_name VARCHAR(100) NOT NULL,
    amount_hour  INT NOT NULL DEFAULT 0,
    schedule_id  INT NULL,
    CONSTRAINT fk_teacher_sched FOREIGN KEY (schedule_id)
        REFERENCES schedules(schedule_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 9. MALLA CURRICULAR: materias y horas por grado (Fase 3)
-- ============================================================================
CREATE TABLE grade_subjects (
    grade_subject_id INT AUTO_INCREMENT PRIMARY KEY,
    grade_id     INT NOT NULL,
    subject_id   INT NOT NULL,
    weekly_hours INT NOT NULL DEFAULT 0,
    teacher_id   INT NULL,
    CONSTRAINT fk_gs_grade   FOREIGN KEY (grade_id)   REFERENCES grades(grade_id)     ON DELETE CASCADE,
    CONSTRAINT fk_gs_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT fk_gs_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- 10. MATERIAS QUE IMPARTE CADA PROFESOR (Fase 4)
-- ============================================================================
CREATE TABLE teacher_subjects (
    teacher_subject_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    CONSTRAINT fk_ts_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    CONSTRAINT fk_ts_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 11. DISPONIBILIDAD DEL PROFESOR (solo horas NO disponibles marcadas)
-- ============================================================================
CREATE TABLE teacher_availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    day_key    VARCHAR(5) NOT NULL,
    hour_index INT NOT NULL,
    status     VARCHAR(3) NOT NULL DEFAULT 'ND',
    CONSTRAINT fk_ta_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 12. LÍMITE DIARIO DE HORAS DEL PROFESOR
-- ============================================================================
CREATE TABLE teacher_day_limits (
    day_limit_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    day_key    VARCHAR(5) NOT NULL,
    max_hours  INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_tdl_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 13. REGLAS POR GRADO: podrá / debe / no impartirá (Fase 4)
-- ============================================================================
CREATE TABLE teacher_grade_rules (
    rule_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    grade_id   INT NOT NULL,
    rule       VARCHAR(5) NOT NULL DEFAULT 'PODRA',   -- 'PODRA' | 'DEBE' | 'NO'
    CONSTRAINT fk_tgr_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    CONSTRAINT fk_tgr_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT fk_tgr_grade   FOREIGN KEY (grade_id)   REFERENCES grades(grade_id)     ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 14. PREFERENCIAS DETALLADAS DE AGRUPAMIENTO (Fase 5)
-- ============================================================================
CREATE TABLE schedule_pref_details (
    pref_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    grade_id    INT NOT NULL,
    subject_id  INT NOT NULL,
    `grouping`  VARCHAR(20) NOT NULL DEFAULT 'NONE',  -- 'NONE' | 'GROUP2' | 'MAX1' | 'NO_CONSEC'
    CONSTRAINT fk_spd_sched   FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE,
    CONSTRAINT fk_spd_grade   FOREIGN KEY (grade_id)    REFERENCES grades(grade_id)       ON DELETE CASCADE,
    CONSTRAINT fk_spd_subject FOREIGN KEY (subject_id)  REFERENCES subjects(subject_id)   ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 15. HORARIO GENERADO / EDITADO (resultado del motor o del editor manual)
-- Cada fila es una clase ubicada: grado + materia + profesor en día y franja.
-- Se reemplaza por completo al regenerar o al guardar la edición manual.
-- ============================================================================
CREATE TABLE generated_classes (
    generated_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id  INT NOT NULL,
    grade_id     INT NOT NULL,
    subject_id   INT NOT NULL,
    teacher_id   INT NULL,                  -- puede quedar sin profesor asignado
    day_key      VARCHAR(5) NOT NULL,       -- 'lun','mar','mie','jue','vie','sab','dom'
    hour_index   INT NOT NULL,              -- franja del día (0 = primera hora)
    CONSTRAINT fk_gc_sched   FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE,
    CONSTRAINT fk_gc_grade   FOREIGN KEY (grade_id)    REFERENCES grades(grade_id)       ON DELETE CASCADE,
    CONSTRAINT fk_gc_subject FOREIGN KEY (subject_id)  REFERENCES subjects(subject_id)   ON DELETE CASCADE,
    CONSTRAINT fk_gc_teacher FOREIGN KEY (teacher_id)  REFERENCES teachers(teacher_id)   ON DELETE SET NULL,
    INDEX idx_gc_sched (schedule_id)
) ENGINE=InnoDB;

-- ============================================================================
-- FIN DEL ESQUEMA
-- El primer usuario se crea desde la aplicación (pantalla de registro),
-- de modo que la contraseña queda cifrada con bcrypt automáticamente.
-- ============================================================================