-- ============================================================
-- V1: Create users table
-- Supports three roles: STUDENT, TEACHER, ADMIN
-- ============================================================

CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(150)        NOT NULL,
    email               VARCHAR(150)        NOT NULL UNIQUE,
    password_hash       VARCHAR(255)        NOT NULL,
    role                user_role           NOT NULL DEFAULT 'STUDENT',

    -- Student-specific fields (nullable for teachers/admins)
    roll_number         VARCHAR(20)         UNIQUE,
    registration_number VARCHAR(30)         UNIQUE,
    phone               VARCHAR(20),
    batch               INTEGER,            -- e.g. 2021 for batch starting 2021

    -- Teacher-specific fields
    designation         VARCHAR(100),
    department          VARCHAR(100),

    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Indexes for frequent lookups
CREATE INDEX idx_users_role         ON users (role);
CREATE INDEX idx_users_roll         ON users (roll_number);
CREATE INDEX idx_users_registration ON users (registration_number);
CREATE INDEX idx_users_email        ON users (email);

COMMENT ON TABLE  users                 IS 'All system users: students, teachers and admins';
COMMENT ON COLUMN users.roll_number     IS 'Unique roll number assigned to each student (e.g. 1413)';
COMMENT ON COLUMN users.registration_number IS 'University registration number for students';
COMMENT ON COLUMN users.batch          IS 'Academic batch year (e.g. 2021)';
