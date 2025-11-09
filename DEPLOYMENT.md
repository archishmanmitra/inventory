# Deployment Guide

This guide explains how to deploy the Inventory Management System to production.

## Environment Variables Setup

### Frontend (Client)

The frontend uses Vite environment variables. Create a `.env.production` file in the `client/` directory:

```env
# Production API URL
VITE_API_URL=https://api.yourdomain.com
```

**Important Notes:**
- Vite requires the `VITE_` prefix for environment variables to be exposed to the client
- In development, if `VITE_API_URL` is not set, it will use the Vite proxy (`/api` → `http://localhost:5000`)
- In production, you **must** set `VITE_API_URL` to your backend API URL

### Backend (Server)

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
JWT_SECRET="your-secret-key-change-this-in-production"
PORT=5000
NODE_ENV=production
CORS_ORIGIN="https://yourdomain.com"
LOG_LEVEL="info"
```

**Important Notes:**
- `CORS_ORIGIN` should match your frontend domain
- Use a strong, random `JWT_SECRET` in production
- `DATABASE_URL` should point to your production database

## How API URL Works

### Development Mode

1. **Without `VITE_API_URL` set:**
   - Frontend uses `/api` as baseURL
   - Vite proxy forwards `/api/*` requests to `http://localhost:5000`
   - This allows development without CORS issues

2. **With `VITE_API_URL` set:**
   - Frontend uses the value of `VITE_API_URL` directly
   - No proxy is used
   - Useful for testing against remote APIs

### Production Mode

1. **Build time:**
   - Vite reads `VITE_API_URL` from `.env.production` during build
   - The value is embedded into the built JavaScript bundle
   - You cannot change it after building without rebuilding

2. **Runtime:**
   - The API calls use the embedded `VITE_API_URL` value
   - No proxy is available in production builds

## Deployment Steps

### 1. Backend Deployment

```bash
cd server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your production values

# Run database migrations
npx prisma generate
npx prisma migrate deploy

# Build the application
npm run build

# Start the server
npm start
```

**For PM2 (Process Manager):**
```bash
pm2 start dist/index.js --name inventory-api
pm2 save
```

**For Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### 2. Frontend Deployment

```bash
cd client

# Install dependencies
npm install

# Set up environment variables
# Create .env.production with VITE_API_URL=https://api.yourdomain.com

# Build for production
npm run build

# The dist/ folder contains your production build
```

**For Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Serve API through Nginx reverse proxy
    location /api {
        proxy_pass https://api.yourdomain.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**For Vercel/Netlify:**
1. Set environment variable `VITE_API_URL` in your deployment platform
2. Connect your repository
3. Build command: `npm run build`
4. Output directory: `dist`

### 3. Database Setup

1. Set up a PostgreSQL database (e.g., Neon, Supabase, AWS RDS)
2. Update `DATABASE_URL` in server `.env`
3. Run migrations: `npx prisma migrate deploy`

## Environment Variable Reference

### Frontend (`client/.env.production`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://api.yourdomain.com` |

### Backend (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-random-secret-key` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://yourdomain.com` |
| `LOG_LEVEL` | Logging level | `info` |

## Security Checklist

- [ ] Use strong, random `JWT_SECRET`
- [ ] Use HTTPS in production
- [ ] Set proper `CORS_ORIGIN` (not `*`)
- [ ] Use environment variables, never hardcode secrets
- [ ] Keep dependencies updated
- [ ] Use database connection pooling
- [ ] Set up proper error logging
- [ ] Configure rate limiting
- [ ] Use secure headers (helmet.js)

## Troubleshooting

### Frontend can't connect to API

1. Check `VITE_API_URL` is set correctly in `.env.production`
2. Rebuild the frontend after changing environment variables
3. Check CORS settings on backend
4. Verify backend is running and accessible

### CORS Errors

1. Ensure `CORS_ORIGIN` in backend `.env` matches your frontend domain
2. Check backend CORS configuration allows your frontend origin
3. Verify credentials are set correctly

### Environment Variables Not Working

1. **Frontend:** Must use `VITE_` prefix and rebuild after changes
2. **Backend:** Restart server after changing `.env` file
3. Check file is named correctly (`.env.production` for production build)

## Example Production Setup

### Option 1: Separate Domains
- Frontend: `https://app.yourdomain.com`
- Backend: `https://api.yourdomain.com`
- Set `VITE_API_URL=https://api.yourdomain.com`

### Option 2: Same Domain with Reverse Proxy
- Frontend: `https://yourdomain.com`
- Backend: `https://yourdomain.com/api` (via Nginx reverse proxy)
- Set `VITE_API_URL=https://yourdomain.com/api`

### Option 3: Subdirectory
- Frontend: `https://yourdomain.com/app`
- Backend: `https://yourdomain.com/api`
- Set `VITE_API_URL=https://yourdomain.com/api`
- Update Vite base config if needed

