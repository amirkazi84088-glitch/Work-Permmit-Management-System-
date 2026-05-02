# Work Permit Management System (WPMS) - Angular Frontend

A comprehensive, role-based work permit management system built with **Angular 17** (standalone components), designed to work seamlessly with your Spring Boot backend.

## 🎯 Features

### ✅ **Complete Role-Based Access Control**
- **Worker**: Apply for permits, view permit status
- **Supervisor**: Approve/reject worker applications
- **Safety Officer**: Inspect permits, audit trails
- **Admin**: Manage users, departments, and organization
- **Super Admin**: Manage multiple organizations, system config

### 🔐 **Authentication & Security**
- JWT-based authentication with auto token refresh
- Role-based route guards
- HTTP interceptors for automatic token attachment
- Protected API calls with error handling

### 📧 **Email Notification Integration**
- Backend email service integration ready
- Real-time notification center in header
- Toast notifications for all actions

### 🎨 **Modern UI/UX**
- Clean, professional design system
- Responsive layout (desktop & mobile)
- Collapsible sidebar navigation
- Status badges and visual indicators
- Loading states and error handling

### 📋 **Permit Management**
- Full permit lifecycle: Draft → Submit → Approve → Active → Close
- Risk assessment and hazard identification
- Safety precautions checklist
- Approval workflow with comment history
- Permit filtering and search

### 📊 **Dashboard Analytics**
- Role-specific dashboards
- Real-time statistics
- Recent activity tracking
- Visual status indicators

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- Angular CLI 17+

### Installation

1. **Extract the project**
```bash
unzip wpms-frontend-part1.zip
cd wpms-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure API endpoint**

Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',  // ← Your Spring Boot API URL
  // ... other config
};
```

For production, edit `src/environments/environment.production.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',  // ← Production API
  // ... other config
};
```

4. **Run development server**
```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`

5. **Build for production**
```bash
npm run build:prod
# Output: dist/wpms-frontend/
```

---

## 📁 Project Structure

```
wpms-frontend/
├── src/
│   ├── app/
│   │   ├── core/                          # Core services & models
│   │   │   ├── guards/                    # Auth & role guards
│   │   │   ├── interceptors/              # HTTP interceptors
│   │   │   ├── services/                  # API services
│   │   │   └── models/                    # TypeScript interfaces
│   │   │
│   │   ├── shared/                        # Shared components
│   │   │   ├── components/
│   │   │   │   ├── shell/                 # Layout wrapper
│   │   │   │   ├── header/                # Top navigation
│   │   │   │   ├── sidebar/               # Side navigation
│   │   │   │   ├── toast/                 # Notifications
│   │   │   │   ├── profile/               # User profile
│   │   │   │   └── permit-status-badge/   # Status badges
│   │   │   ├── directives/
│   │   │   └── pipes/
│   │   │
│   │   ├── auth/                          # Auth module
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   │
│   │   ├── modules/                       # Feature modules
│   │   │   ├── worker/                    # Worker dashboard & permits
│   │   │   ├── supervisor/                # Approval workflows
│   │   │   ├── safety-officer/            # Inspections & audits
│   │   │   ├── admin/                     # User & org management
│   │   │   └── super-admin/               # Multi-org management
│   │   │
│   │   ├── app.component.ts               # Root component
│   │   ├── app.routes.ts                  # Route definitions
│   │   └── app.config.ts                  # App configuration
│   │
│   ├── environments/                      # Environment configs
│   ├── styles.scss                        # Global styles
│   └── index.html
│
├── angular.json                           # Angular config
├── tsconfig.json                          # TypeScript config
├── package.json                           # Dependencies
└── README.md                              # This file
```

---

## 🔌 Backend Integration

### Expected API Endpoints

Your Spring Boot backend should expose these endpoints:

#### **Authentication** (`/api/auth`)
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile

#### **Permits** (`/api/permits`)
- `GET /api/permits` - List all permits (paginated)
- `GET /api/permits/{id}` - Get permit details
- `POST /api/permits` - Create permit
- `PUT /api/permits/{id}` - Update permit
- `POST /api/permits/{id}/submit` - Submit for approval
- `POST /api/permits/{id}/approve` - Approve permit
- `POST /api/permits/{id}/reject` - Reject permit
- `POST /api/permits/{id}/close` - Close permit
- `POST /api/permits/{id}/cancel` - Cancel permit
- `GET /api/permits/my-permits` - Worker's permits
- `GET /api/permits/pending-approvals` - Supervisor pending list
- `POST /api/permits/{id}/inspections` - Add inspection

#### **Users** (`/api/users`)
- `GET /api/users` - List users (paginated)
- `GET /api/users/{id}` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
- `PATCH /api/users/{id}/toggle-status` - Activate/deactivate

#### **Organizations** (`/api/organizations`)
- `GET /api/organizations` - List organizations
- `GET /api/organizations/{id}` - Get organization
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/{id}` - Update organization
- `GET /api/organizations/{id}/departments` - Get departments
- `POST /api/organizations/{id}/departments` - Create department

#### **Notifications** (`/api/notifications`)
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/{id}/read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all read

#### **Dashboard** (`/api/dashboard`)
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/admin/{orgId}` - Admin stats
- `GET /api/dashboard/super-admin` - Super admin stats

### Response Format

All API responses should follow this structure:

```typescript
{
  "success": true,
  "message": "Optional message",
  "data": { /* actual data */ },
  "timestamp": "2024-04-18T10:30:00Z"
}
```

Paginated responses:
```typescript
{
  "success": true,
  "data": {
    "content": [ /* items */ ],
    "totalElements": 100,
    "totalPages": 10,
    "currentPage": 0,
    "pageSize": 10,
    "first": true,
    "last": false
  }
}
```

---

## 👥 User Roles & Permissions

| Role | Dashboard | Apply Permits | Approve Permits | Inspect | Manage Users | Manage Orgs |
|------|-----------|---------------|-----------------|---------|--------------|-------------|
| Worker | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Supervisor | ✅ | ✅ | ✅ (L1) | ❌ | ❌ | ❌ |
| Safety Officer | ✅ | ❌ | ✅ (L2) | ✅ | ❌ | ❌ |
| Admin | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Super Admin | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## 🎨 Customization

### Theming

Edit `src/styles.scss` to customize colors:

```scss
:root {
  --primary: #2563eb;           // Main brand color
  --sidebar-bg: #0f172a;        // Sidebar background
  --success: #16a34a;           // Success states
  --danger: #dc2626;            // Error/danger states
  // ... more variables
}
```

### Logo

Replace the emoji logo in:
- `src/app/shared/components/sidebar/sidebar.component.ts` (line with `🏗️`)
- `src/app/auth/login/login.component.ts` (brand icon)

---

## 🧪 Testing

```bash
# Unit tests
npm test

# Linting
npm run lint
```

---

## 📦 Build & Deployment

### Development Build
```bash
ng build
```

### Production Build
```bash
ng build --configuration production
```

The build artifacts will be in `dist/wpms-frontend/`. Deploy these static files to any web server (Nginx, Apache, Netlify, Vercel, etc.).

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=build /app/dist/wpms-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🐛 Troubleshooting

### CORS Issues
If you see CORS errors, ensure your Spring Boot backend has CORS configuration:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

### API Connection Failed
- Check `environment.ts` has correct `apiUrl`
- Ensure backend is running on the configured port
- Check network tab in browser DevTools

---

## 📄 License

MIT License - feel free to use this project for your organization.

---

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the backend API integration guide
3. Ensure all dependencies are installed

---

**Built with ❤️ using Angular 17 + Spring Boot**
