# WPMS Full Project Structure

## 1. Project Overview

Workspace root:

```text
wpms/
├── arena/                      # Angular frontend
├── work-permit-backend/        # Spring Boot backend
├── node_modules/
├── package.json
├── package-lock.json
└── project/report files
```

---

## 2. Frontend Structure

Frontend path:

```text
arena/
├── package.json
├── src/
│   └── app/
│       ├── app.component.ts
│       ├── app.config.ts
│       ├── app.routes.ts
│       ├── auth/
│       │   ├── login/
│       │   │   └── login.component.ts
│       │   ├── forgot-password/
│       │   │   └── forgot-password.component.ts
│       │   └── reset-password/
│       │       └── reset-password.component.ts
│       ├── core/
│       │   ├── guards/
│       │   │   └── auth.guard.ts
│       │   ├── interceptors/
│       │   │   └── jwt.interceptor.ts
│       │   ├── models/
│       │   │   └── index.ts
│       │   └── services/
│       │       ├── auth.service.ts
│       │       ├── dashboard.service.ts
│       │       ├── notification.service.ts
│       │       ├── organization.service.ts
│       │       ├── permit.service.ts
│       │       ├── toast.service.ts
│       │       └── user.service.ts
│       ├── modules/
│       │   ├── worker/
│       │   │   ├── worker.routes.ts
│       │   │   ├── worker-dashboard/
│       │   │   │   └── worker-dashboard.component.ts
│       │   │   ├── apply-permit/
│       │   │   │   └── apply-permit.component.ts
│       │   │   ├── my-permits/
│       │   │   │   └── my-permits.component.ts
│       │   │   └── permit-detail/
│       │   │       └── permit-detail.component.ts
│       │   ├── supervisor/
│       │   │   ├── supervisor.routes.ts
│       │   │   ├── supervisor-dashboard/
│       │   │   │   └── supervisor-dashboard.component.ts
│       │   │   ├── pending-approvals/
│       │   │   │   └── pending-approvals.component.ts
│       │   │   └── team-permits/
│       │   │       └── team-permits.component.ts
│       │   ├── safety-officer/
│       │   │   ├── safety-officer.routes.ts
│       │   │   ├── safety-officer-dashboard/
│       │   │   │   └── safety-officer-dashboard.component.ts
│       │   │   ├── active-permits/
│       │   │   │   └── active-permits.component.ts
│       │   │   ├── inspections/
│       │   │   │   └── inspections.component.ts
│       │   │   └── audit-log/
│       │   │       └── audit-log.component.ts
│       │   ├── admin/
│       │   │   ├── admin.routes.ts
│       │   │   ├── admin-dashboard/
│       │   │   │   └── admin-dashboard.component.ts
│       │   │   ├── all-permits/
│       │   │   │   └── all-permits.component.ts
│       │   │   ├── departments/
│       │   │   │   └── departments.component.ts
│       │   │   ├── reports/
│       │   │   │   └── reports.component.ts
│       │   │   └── user-management/
│       │   │       └── user-management.component.ts
│       │   └── super-admin/
│       │       ├── super-admin.routes.ts
│       │       ├── super-admin-dashboard/
│       │       │   └── super-admin-dashboard.component.ts
│       │       ├── organizations/
│       │       │   └── organizations.component.ts
│       │       ├── all-users/
│       │       │   └── all-users.component.ts
│       │       ├── global-permits/
│       │       │   └── global-permits.component.ts
│       │       ├── global-reports/
│       │       │   └── global-reports.component.ts
│       │       └── system-config/
│       │           └── system-config.component.ts
│       └── shared/
│           └── components/
│               ├── header/
│               │   └── header.component.ts
│               ├── permit-status-badge/
│               │   └── permit-status-badge.component.ts
│               ├── profile/
│               │   └── profile.component.ts
│               ├── shell/
│               │   └── shell.component.ts
│               ├── sidebar/
│               │   └── sidebar.component.ts
│               └── toast/
│                   └── toast.component.ts
```

### Frontend technical notes

- Framework: Angular 17
- Routing: role-based module routes
- HTTP auth: JWT interceptor
- State style: Angular signals in many components
- Core service layer:
  - `auth.service.ts`
  - `user.service.ts`
  - `permit.service.ts`
  - `organization.service.ts`
  - `dashboard.service.ts`
  - `notification.service.ts`

### Frontend role modules

- `worker`: apply permit, my permits, permit details
- `supervisor`: approval queue, team permits
- `safety-officer`: safety review, inspections
- `admin`: permits, users, departments, reports, audit log route
- `super-admin`: global oversight for organizations, users, permits, reports, config

---

## 3. Backend Structure

Backend path:

```text
work-permit-backend/
├── pom.xml
└── src/
    └── main/
        ├── java/com/wpms/
        │   ├── config/
        │   │   ├── CorsConfig.java
        │   │   └── DataInitializer.java
        │   ├── controller/
        │   │   ├── ApprovalController.java
        │   │   ├── AuditController.java
        │   │   ├── AuthController.java
        │   │   ├── DashboardController.java
        │   │   ├── NotificationController.java
        │   │   ├── OrganizationController.java
        │   │   ├── PermitController.java
        │   │   ├── PermitTypeController.java
        │   │   ├── ReportController.java
        │   │   └── UserController.java
        │   ├── dto/
        │   │   ├── ApiResponse.java
        │   │   ├── ApprovalDecisionDTO.java
        │   │   ├── AuditLogResponseDTO.java
        │   │   ├── ChangePasswordRequestDTO.java
        │   │   ├── CreateUserRequestDTO.java
        │   │   ├── DepartmentRequestDTO.java
        │   │   ├── DepartmentResponseDTO.java
        │   │   ├── ForgotPasswordRequestDTO.java
        │   │   ├── InspectionRequestDTO.java
        │   │   ├── InspectionResponseDTO.java
        │   │   ├── LoginRequest.java
        │   │   ├── LoginResponse.java
        │   │   ├── NotificationResponseDTO.java
        │   │   ├── OrganizationRequestDTO.java
        │   │   ├── OrganizationResponseDTO.java
        │   │   ├── PagedResponseDTO.java
        │   │   ├── PermitRequestDTO.java
        │   │   ├── PermitResponseDTO.java
        │   │   ├── PermitTypeResponseDTO.java
        │   │   ├── ProfileUpdateRequestDTO.java
        │   │   ├── ResetPasswordRequestDTO.java
        │   │   ├── UpdateUserRequestDTO.java
        │   │   └── UserResponseDTO.java
        │   ├── entity/
        │   │   ├── AuditLog.java
        │   │   ├── Department.java
        │   │   ├── Document.java
        │   │   ├── InspectionResult.java
        │   │   ├── Notification.java
        │   │   ├── Organization.java
        │   │   ├── OrganizationStatus.java
        │   │   ├── Permit.java
        │   │   ├── PermitApproval.java
        │   │   ├── PermitChecklist.java
        │   │   ├── PermitChecklistResponse.java
        │   │   ├── PermitInspection.java
        │   │   ├── PermitStatus.java
        │   │   ├── PermitType.java
        │   │   ├── Role.java
        │   │   ├── RoleType.java
        │   │   ├── User.java
        │   │   └── UserRole.java
        │   ├── exception/
        │   │   ├── GlobalExceptionHandler.java
        │   │   ├── PermitStateException.java
        │   │   └── ResourceNotFoundException.java
        │   ├── repository/
        │   │   ├── ApprovalRepository.java
        │   │   ├── AuditLogRepository.java
        │   │   ├── DepartmentRepository.java
        │   │   ├── DocumentRepository.java
        │   │   ├── NotificationRepository.java
        │   │   ├── OrganizationRepository.java
        │   │   ├── PermitApprovalRepository.java
        │   │   ├── PermitChecklistRepository.java
        │   │   ├── PermitChecklistResponseRepository.java
        │   │   ├── PermitInspectionRepository.java
        │   │   ├── PermitRepository.java
        │   │   ├── PermitTypeRepository.java
        │   │   ├── RoleRepository.java
        │   │   ├── UserRepository.java
        │   │   └── UserRoleRepository.java
        │   ├── security/
        │   │   ├── JwtAuthFilter.java
        │   │   ├── JwtUtil.java
        │   │   ├── SecurityConfig.java
        │   │   └── UserDetailsServiceImpl.java
        │   ├── service/
        │   │   ├── ApprovalService.java
        │   │   ├── AuditLogService.java
        │   │   ├── AuthService.java
        │   │   ├── DashboardService.java
        │   │   ├── NotificationService.java
        │   │   ├── OrganizationService.java
        │   │   ├── PermitExpiryScheduler.java
        │   │   ├── PermitService.java
        │   │   ├── PermitTypeService.java
        │   │   ├── ReportService.java
        │   │   └── UserService.java
        │   └── work_permit_backend/
        │       └── WorkPermitBackendApplication.java
        └── resources/
            ├── application.properties
            ├── static/
            └── templates/
```

### Backend technical notes

- Framework: Spring Boot `3.3.5`
- Java: `17`
- Security: Spring Security + JWT
- Persistence: Spring Data JPA + Hibernate
- Database: MySQL
- Mail: Spring Boot Mail
- Build tool: Maven

### Backend layers

- `controller`: REST API endpoints
- `service`: business logic
- `repository`: database access
- `entity`: JPA database mapping
- `dto`: request/response contracts
- `security`: JWT and authentication
- `config`: CORS and seed/init logic

---

## 4. Database Structure

### Database configuration

From `application.properties`:

- DBMS: MySQL
- Database name: `wpms_db`
- Port: `3308`
- JDBC URL: `jdbc:mysql://localhost:3308/wpms_db`
- Hibernate mode: `spring.jpa.hibernate.ddl-auto=update`

### Main database tables

#### 4.1 `organizations`

- `id`
- `name`
- `code` (unique)
- `address`
- `city`
- `country`
- `phone`
- `email`
- `industry`
- `status`
- `max_users`
- `subscription_plan`
- `subscription_expiry`
- `created_at`
- `updated_at`

#### 4.2 `departments`

- `id`
- `name`
- `organization_id` -> `organizations.id`
- `manager_id` -> `users.id`
- `is_active`

#### 4.3 `users`

- `id`
- `name`
- `first_name`
- `last_name`
- `email` (unique)
- `password`
- `phone`
- `employee_id`
- `is_active`
- `last_login`
- `reset_token`
- `reset_token_expiry`
- `created_at`
- `organization_id` -> `organizations.id`
- `department_id` -> `departments.id`

#### 4.4 `roles`

- `id`
- `role_name` (unique)
- `description`

#### 4.5 `user_roles`

- `id`
- `user_id` -> `users.id`
- `role_id` -> `roles.id`
- `is_primary`

This is the user-role mapping table.

#### 4.6 `permit_types`

- `id`
- `name` (unique)
- `description`

#### 4.7 `permits`

- `id`
- `permit_number` (unique)
- `requester_id` -> `users.id`
- `permit_type_id` -> `permit_types.id`
- `title`
- `description`
- `location`
- `status`
- `start_date`
- `submitted_at`
- `expiry_at`

#### 4.8 `permit_approvals`

- `id`
- `permit_id` -> `permits.id`
- `approved_by` -> `users.id`
- `decision`
- `approver_role`
- `approval_level`
- `comments`
- `decision_at`

#### 4.9 `permit_checklists`

- `id`
- `permit_type_id` -> `permit_types.id`
- `checklist_item`
- `mandatory`

#### 4.10 `permit_checklist_responses`

- `id`
- `permit_id` -> `permits.id`
- `checklist_id` -> `permit_checklists.id`
- `compliant`
- `remarks`

#### 4.11 `permit_inspections`

- `id`
- `permit_id` -> `permits.id`
- `inspected_by` -> `users.id`
- `inspection_date`
- `result`
- `findings`
- `recommendations`
- `follow_up_required`
- `follow_up_date`

#### 4.12 `documents`

- `id`
- `permit_id` -> `permits.id`
- `uploaded_by` -> `users.id`
- `file_name`
- `file_path`
- `uploaded_at`

#### 4.13 `notifications`

- `id`
- `user_id` -> `users.id`
- `message`
- `read_status`
- `created_at`

#### 4.14 `audit_logs`

- `id`
- `user_id` -> `users.id`
- `action`
- `module`
- `entity_id`
- `logged_at`

---

## 5. Database Relationship Summary

```text
organizations
  ├──< departments
  └──< users

departments
  └──< users

users
  ├──< user_roles >── roles
  ├──< permits (as requester)
  ├──< permit_approvals (as approver)
  ├──< permit_inspections (as inspector)
  ├──< notifications
  ├──< documents (as uploader)
  └──< audit_logs

permit_types
  ├──< permits
  └──< permit_checklists

permits
  ├──< permit_approvals
  ├──< permit_checklist_responses
  ├──< permit_inspections
  └──< documents

permit_checklists
  └──< permit_checklist_responses
```

---

## 6. API Area Summary

Main backend controller groups:

- `AuthController` -> login, password flows
- `UserController` -> users and profile
- `OrganizationController` -> organizations and likely departments linkage
- `PermitController` -> create, submit, fetch, close, cancel, extend, attachments, inspections
- `ApprovalController` -> approval queue and decisions
- `PermitTypeController` -> permit type master data
- `DashboardController` -> dashboard cards/stats
- `ReportController` -> permit trends and exports
- `AuditController` -> audit log endpoints
- `NotificationController` -> notifications

---

## 7. Hosting-Relevant Notes

- Frontend app: Angular 17 SPA in `arena/`
- Backend app: Spring Boot API in `work-permit-backend/`
- DB: MySQL database `wpms_db`
- Backend currently expects:
  - port `8080`
  - MySQL on `3308`
  - CORS for `http://localhost:4200` and `http://127.0.0.1:4200`
- File uploads are stored under backend runtime path:
  - `uploads/permits/{permitId}/`

---

## 8. Main Tech Stack

### Frontend

- Angular 17
- TypeScript 5.4
- RxJS 7.8

### Backend

- Spring Boot 3.3.5
- Spring Web
- Spring Data JPA
- Spring Security
- JWT (`jjwt`)
- Spring Validation
- Spring Mail
- MySQL Connector/J

---

## 9. File Purpose Summary

- [arena/src/app/core/models/index.ts](/d:/OJT%20Project/Projects/wpms/arena/src/app/core/models/index.ts:1): frontend domain models and request/response interfaces
- [arena/src/app/core/services/permit.service.ts](/d:/OJT%20Project/Projects/wpms/arena/src/app/core/services/permit.service.ts:1): frontend permit API integration
- [arena/src/app/shared/components/sidebar/sidebar.component.ts](/d:/OJT%20Project/Projects/wpms/arena/src/app/shared/components/sidebar/sidebar.component.ts:1): role-based navigation
- [work-permit-backend/src/main/java/com/wpms/entity](/d:/OJT%20Project/Projects/wpms/work-permit-backend/src/main/java/com/wpms/entity): JPA entity definitions
- [work-permit-backend/src/main/java/com/wpms/controller](/d:/OJT%20Project/Projects/wpms/work-permit-backend/src/main/java/com/wpms/controller): REST controllers
- [work-permit-backend/src/main/java/com/wpms/service](/d:/OJT%20Project/Projects/wpms/work-permit-backend/src/main/java/com/wpms/service): business logic
- [work-permit-backend/src/main/resources/application.properties](/d:/OJT%20Project/Projects/wpms/work-permit-backend/src/main/resources/application.properties:1): runtime configuration

