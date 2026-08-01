# System Architecture for SRS (Software Requirements Specification)

This document provides the architectural blueprint of the MIT Open Credit Management System. It is formatted to be directly integrated into the **System Architecture**, **Data Model**, and **Technical Stack** sections of your Software Requirements Specification (SRS) report.

---

## 1. System Overview

The MIT Credit Management System follows a classic **Client-Server Architecture** utilizing a decoupled frontend and backend. 
- The **Client** is a Single Page Application (SPA) built with Angular that runs in the user's web browser. 
- The **Server** is a RESTful API built with Spring Boot that handles business logic, security, and data persistence.
- Communication between the client and server is strictly via stateless HTTP/HTTPS protocols using JSON payloads.

---

## 2. Technology Stack

### Frontend (Client-Side)
- **Framework**: Angular 18 (Standalone Components, Signals for State Management)
- **Styling**: Custom CSS with Glassmorphism Design System (CSS Variables)
- **Routing**: Angular Router

### Backend (Server-Side)
- **Framework**: Spring Boot 3 (Java 21)
- **Security**: Spring Security with JWT (JSON Web Tokens) for stateless authentication.
- **ORM**: Spring Data JPA / Hibernate
- **Database Migration**: Flyway

### Database
- **Primary Database**: PostgreSQL (Relational Database Management System)

---

## 3. High-Level Architectural Diagram

*You can copy this Mermaid diagram into tools like draw.io or Notion to generate the visual diagram.*

```mermaid
graph TD
    %% Client Layer
    subgraph Client Layer [Frontend - Angular 18]
        UI[User Interface]
        State[State Management / Signals]
        HTTPClient[HTTP Interceptors / API Services]
    end

    %% Network Layer
    Network((Internet / HTTP Request))

    %% Server Layer
    subgraph Server Layer [Backend - Spring Boot 3]
        Sec[Spring Security Filter Chain / JWT Auth]
        Controller[REST Controllers]
        Service[Service Layer / Business Logic]
        Repo[Spring Data JPA Repositories]
    end

    %% Data Layer
    subgraph Database Layer
        PG[(PostgreSQL Database)]
        Flyway[Flyway Migrations]
    end

    %% Connections
    UI --> State
    State --> HTTPClient
    HTTPClient -- JSON / REST --> Network
    Network --> Sec
    Sec --> Controller
    Controller --> Service
    Service --> Repo
    Repo --> PG
    Flyway -. manages schema .-> PG
```

---

## 4. Subsystem Decomposition (Core Modules)

The system is decomposed into five primary functional modules:

1. **Authentication & Authorization Module**: 
   - Handles User Registration, Login, and JWT Token issuance.
   - Enforces Role-Based Access Control (RBAC) separating Admin, Teacher, and Student roles.
2. **Course Management Module**:
   - Allows Admins to create, update, and deactivate courses.
   - Manages course metadata (credits, type, capacity).
3. **Semester & Enrollment Module**:
   - Manages the lifecycle of academic semesters (Spring, Summer, Fall).
   - Handles student course registration, ensuring students cannot exceed credit limits or enroll in full courses.
4. **Grading & Results Module**:
   - Allows Teachers to input midterm and final marks for their assigned courses.
   - Automatically calculates Total Marks, Grade Letters, and Grade Points.
   - Calculates the student's current Semester GPA and Cumulative GPA (CGPA).
5. **Fee Management Module**:
   - Generates financial dues based on enrollment and semester status.
   - Allows students to track and simulate payment of outstanding balances.

---

## 5. Entity Relationship Diagram (ERD)

This represents the core data model stored in PostgreSQL.

```mermaid
erDiagram
    USERS {
        Long id PK
        String name
        String email UK
        String password
        String role "ADMIN, TEACHER, STUDENT"
        String roll_number "Nullable"
        String registration_number "Nullable"
        String designation "Nullable"
    }

    SEMESTERS {
        Long id PK
        String name "SPRING, SUMMER, FALL"
        Integer year
        Boolean is_active
    }

    COURSES {
        Long id PK
        String code UK
        String name
        Integer credit_hours
        String course_type "CORE, OPTIONAL"
        Integer max_seats
        Long teacher_id FK "References USERS"
    }

    ENROLLMENTS {
        Long id PK
        Long student_id FK "References USERS"
        Long course_id FK "References COURSES"
        Long semester_id FK "References SEMESTERS"
        String status "ACTIVE, COMPLETED"
    }

    GRADES {
        Long id PK
        Long enrollment_id FK "References ENROLLMENTS"
        Double midterm_marks
        Double final_marks
        Double total_marks
        String grade_letter
        Double grade_point
    }

    FEES {
        Long id PK
        Long student_id FK "References USERS"
        Long semester_id FK "References SEMESTERS"
        Double amount
        String status "UNPAID, PAID"
        String fee_type
    }

    %% Relationships
    USERS ||--o{ COURSES : "teaches"
    USERS ||--o{ ENROLLMENTS : "registers"
    USERS ||--o{ FEES : "owes"
    SEMESTERS ||--o{ ENROLLMENTS : "contains"
    COURSES ||--o{ ENROLLMENTS : "has"
    ENROLLMENTS ||--|| GRADES : "receives"
    SEMESTERS ||--o{ FEES : "generates"
```

---

## 6. Security Architecture

1. **Authentication (Stateless)**: 
   - Upon successful login, the server generates an asymmetric JSON Web Token (JWT) signed with a secret key.
   - The client stores this JWT (in memory or `localStorage`) and attaches it as a `Bearer` token in the `Authorization` header of all subsequent API requests.
2. **Password Cryptography**: 
   - Passwords are never stored in plain text. They are hashed using **BCrypt** with a strong work factor before persistence.
3. **Authorization (RBAC)**:
   - Security Context is established per request via a custom JWT Filter.
   - Endpoints are protected via `@PreAuthorize("hasRole('ADMIN')")` ensuring vertical privilege escalation is prevented at the method level.
