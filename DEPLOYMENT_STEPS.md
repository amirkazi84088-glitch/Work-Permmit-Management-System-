# WPMS Deployment Steps

This setup keeps local development working and adds separate production configuration for:

- Frontend: Netlify
- Backend: Render
- Database: Railway MySQL

## 1. Local behavior remains unchanged

- Angular local dev still uses `proxy.conf.json` and calls `/api` through `http://localhost:8080`
- Spring Boot local dev still defaults to local MySQL on `localhost:3308`
- No local workflow is removed

## 2. Railway MySQL

Create a Railway project and add a MySQL database.

Collect these values from Railway:

- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLDATABASE`
- `MYSQLUSER`
- `MYSQLPASSWORD`

Build the JDBC URL in this format:

`jdbc:mysql://<MYSQLHOST>:<MYSQLPORT>/<MYSQLDATABASE>?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true`

## 3. Render backend

Create a new Web Service in Render from the GitHub repo.

Use:

- Root Directory: `work-permit-backend`
- Environment: `Docker`

Set these environment variables in Render:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
- `SPRING_JPA_SHOW_SQL=false`
- `JWT_SECRET`
- `JWT_EXPIRATION=86400000`
- `APP_CORS_ALLOWED_ORIGINS`
- `SPRING_MAIL_HOST`
- `SPRING_MAIL_PORT`
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`
- `SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true`
- `SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true`

For `APP_CORS_ALLOWED_ORIGINS`, use:

- your Netlify domain
- `http://localhost:4200`
- `http://127.0.0.1:4200`

Example:

`https://your-site.netlify.app,http://localhost:4200,http://127.0.0.1:4200`

After deployment, copy the Render backend URL.

## 4. Netlify frontend

Create a new site from GitHub in Netlify.

This repo already includes `netlify.toml` with:

- Base directory: `arena`
- Build command: `npm install && npm run build:prod`
- Publish directory: `dist/wpms-frontend/browser`

Before the frontend can call the backend, add a Netlify redirect rule that proxies `/api/*` to your Render backend.

Update `netlify.toml` after you know the Render URL:

```toml
[[redirects]]
from = "/api/*"
to = "https://your-render-service.onrender.com/api/:splat"
status = 200
force = true
```

Keep the SPA fallback below it:

```toml
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

Then push the updated `netlify.toml` to GitHub and trigger a Netlify redeploy.

## 5. Final verification

Verify:

- Netlify frontend loads
- login works
- API calls succeed
- Render connects to Railway MySQL
- local Angular + local Spring Boot still run on your PC
