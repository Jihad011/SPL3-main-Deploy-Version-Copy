# 🎓 MIT Open Credit Management System

> **Institute of Information Technology (IIT), University of Dhaka**  
> **Author / Student:** Md. Jihad Hossain (Roll: 1413)

---

## 🌟 Executive Summary & System Assessment

The **MIT Open Credit Management System** is an enterprise-grade full-stack web platform engineered to automate and streamline the academic credit system for IIT, University of Dhaka. It manages student course enrollments, grade entries, automated CGPA calculations, seat capacity caps, and retake fee management with strict integrity constraints.

### 🟢 Overall Quality & Health Verdict: **EXCELLENT & FULLY OPERATIONAL**

| Metric / Dimension | Status | Assessment Details |
| :--- | :---: | :--- |
| **Backend Architecture** | 🟢 100% | Clean 3-tier Spring Boot architecture with Flyway migrations, JPA/Hibernate, and Spring Security. |
| **Frontend Architecture** | 🟢 100% | Modern Angular 18 implementation featuring standalone components, RxJS, and reactive forms. |
| **Database Integrity** | 🟢 100% | PostgreSQL with automated schema version control via Flyway. Dual-layer business rule enforcement. |
| **Authentication & RBAC** | 🟢 100% | Stateless JWT authentication enforcing Role-Based Access Control (`STUDENT`, `TEACHER`, `ADMIN`). |
| **Development Setup** | 🟢 100% | Fully configured local dev environment + pgAdmin 4 integration + Docker containerization. |

---

## 🛠️ Technology Stack

| Layer | Technology | Key Features / Purpose |
| :--- | :--- | :--- |
| **Frontend** | **Angular 18** | TypeScript, Standalone Components, RxJS, SCSS |
| **Backend** | **Spring Boot 3.3.0** | Java 21, Spring Data JPA, Spring Security |
| **Database** | **PostgreSQL 16** | Relational Database, Triggers, Views |
| **Database Versioning**| **Flyway 10** | Automated SQL Migration (`V1` to `V6`) |
| **Authentication** | **JWT (JSON Web Token)**| Stateless Authentication, Role-based Guards |
| **Documentation** | **SpringDoc OpenAPI 3.0**| Swagger UI interactive API documentation |
| **Database Admin** | **pgAdmin 4** | Database management & GUI query runner |

---

## ⚙️ Core Business Rules Enforced

The platform guarantees strict compliance with institutional academic policies across both application and database layers:

```
                  +-----------------------------------+
                  |      BUSINESS RULES ENFORCED      |
                  +-----------------------------------+
                                    |
     +-----------------+------------+------------+-----------------+
     |                 |                         |                 |
     v                 v                         v                 v
[Credit Cap]     [Seat Limits]             [Auto Grade/CGPA]  [Retake Fees]
Max 12 Credits  Max 40 Seats for          Calculated via DB  Auto fee on course
 per semester    optional courses           triggers & views    retake enrollment
```

1. **Credit Capacity Limit**: Students can enroll in a maximum of **12 credits per semester**.
2. **Optional Course Seat Cap**: Optional courses are capped at a maximum of **40 seats**.
3. **Automated Grade & CGPA Calculation**: Letter grades (`A+`, `A`, `A-`, `B+`, etc.) and CGPA are automatically calculated upon mark entry.
4. **Retake Fee Tracking**: Enrolling in retake courses automatically generates corresponding unpaid fee records.
5. **Role-Based Access Control (RBAC)**: Enforced via Spring Security `@PreAuthorize` and Angular route guards.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java**: JDK 21+
- **Node.js**: Node 20+
- **Database**: PostgreSQL 16+
- **Build Tools**: Apache Maven 3.8+ & npm

---

### Step-by-Step Local Setup

#### 1. Database Setup (PostgreSQL)
Ensure PostgreSQL is running on `127.0.0.1:5432`:
```bash
sudo -u postgres psql
```
Inside the `psql` prompt:
```sql
ALTER USER postgres WITH PASSWORD '1413';
CREATE DATABASE credit_management_db;
\q
```

#### 2. Run Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
*The backend will automatically start on `http://localhost:8080/api` and run Flyway migrations.*

#### 3. Run Frontend (Angular)
```bash
cd frontend
npm start
```
*The application will open on `http://localhost:4200`.*

---

## 🔐 Pre-seeded Test Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | System Admin | `admin@iit.du.ac.bd` | `Admin@123` |
| **Teacher** | Dr. Tawhid | `tawhid@iit.du.ac.bd` | `Teacher@123` |
| **Student** | Md. Jihad Hossain | `jihad@iit.du.ac.bd` | `Student@123` |

---

## 🐘 Connecting via pgAdmin 4

To inspect the database manually using **pgAdmin 4**:

- **Server Name**: `Credit Management DB`
- **Host name / address**: `127.0.0.1` (or `localhost`)
- **Port**: `5432`
- **Maintenance database**: `credit_management_db`
- **Username**: `postgres`
- **Password**: `1413`

---

## 🌐 API Overview & Endpoints

Interactive documentation is available live at: **`http://localhost:8080/api/swagger-ui.html`**

| Method | Path | Role Required | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `GET` | `/api/student/dashboard` | `STUDENT` | View student dashboard summary |
| `GET` | `/api/courses/available` | `STUDENT` | View available courses for registration |
| `POST` | `/api/enrollments` | `STUDENT` | Enroll in a course (Credit limit checked) |
| `PATCH` | `/api/enrollments/{id}/drop` | `STUDENT` | Drop an enrolled course |
| `GET` | `/api/grades/my` | `STUDENT` | View personal semester grades |
| `GET` | `/api/grades/my/cgpa` | `STUDENT` | View cumulative CGPA |
| `GET` | `/api/fees/my/unpaid` | `STUDENT` | View unpaid retake/semester dues |
| `POST` | `/api/grades/enter` | `TEACHER` | Enter or update student marks |
| `GET` | `/api/grades/course/{id}/semester/{id}` | `TEACHER` | View grade entry sheet for course |
| `GET` | `/api/admin/students` | `ADMIN` | Fetch list of all registered students |
| `POST` | `/api/courses` | `ADMIN` | Create new course entry |
| `POST` | `/api/fees` | `ADMIN` | Issue fee invoice |
| `PATCH` | `/api/fees/{id}/pay` | `ADMIN` | Mark student fee as paid |

---

## 📁 Repository Structure

```
SPL3-main/
├── backend/                  # Spring Boot 3.3 Application
│   ├── src/main/java/        # Controllers, Services, Repositories, Entities
│   └── src/main/resources/   # Application properties & Flyway migration scripts
├── frontend/                 # Angular 18 Single Page Application
│   ├── src/app/              # Components, Services, Guards, Interceptors
│   └── angular.json          # Angular CLI configuration
├── database/                 # Raw SQL Migrations & Seed data scripts
│   ├── migrations/           # V1 to V6 DDL scripts
│   └── seeds/                # Initial seed data for users and courses
└── README.md                 # System Documentation & Guide
```

---

## 📜 Verification & Testing

Run backend & frontend test suites to ensure complete regression safety:

```bash
# Run Spring Boot Unit & Integration Tests
cd backend && mvn test

# Run Angular Unit Tests
cd frontend && ng test --watch=false
```
