# Environment Variables Guide

## How VITE_API_URL Works

### Current Implementation

The application uses `VITE_API_URL` environment variable to configure the API base URL. Here's how it works:

### Frontend API Configuration (`client/src/lib/api.ts`)

```typescript
const getApiBaseURL = () => {
  // In production, use the environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // In development, use relative path which will be proxied by Vite
  return '/api'
}
```

### How It Works in Different Environments

#### 1. Development (No VITE_API_URL set)

**Behavior:**
- `VITE_API_URL` is not set or empty
- Frontend uses `/api` as baseURL
- Vite proxy (configured in `vite.config.ts`) forwards `/api/*` requests to `http://localhost:5000`
- This avoids CORS issues during development

**Example:**
```bash
# No .env file or VITE_API_URL not set
npm run dev
# API calls go to: /api → proxied to → http://localhost:5000
```

#### 2. Development (VITE_API_URL set)

**Behavior:**
- `VITE_API_URL` is set (e.g., `http://localhost:5000`)
- Frontend uses the value directly
- No proxy is used
- Useful for testing against remote APIs or different ports

**Example:**
```bash
# .env.development
VITE_API_URL=http://localhost:5000

npm run dev
# API calls go directly to: http://localhost:5000
```

#### 3. Production (VITE_API_URL required)

**Behavior:**
- `VITE_API_URL` must be set in `.env.production`
- Value is embedded into the JavaScript bundle at build time
- No proxy available (Vite dev server not running)
- API calls go directly to the specified URL

**Example:**
```bash
# .env.production
VITE_API_URL=https://api.yourdomain.com

npm run build
# Built files contain: baseURL = "https://api.yourdomain.com"
```

### Important Notes

1. **Vite Prefix Requirement:**
   - Vite only exposes environment variables prefixed with `VITE_`
   - This is a security feature to prevent accidental exposure of server-side secrets

2. **Build-Time Embedding:**
   - Environment variables are embedded during `npm run build`
   - You cannot change them after building without rebuilding
   - Each environment needs its own build

3. **Type Safety:**
   - Type definitions are in `client/src/vite-env.d.ts`
   - Provides TypeScript autocomplete for `import.meta.env.VITE_API_URL`

### File Structure

```
client/
├── .env                    # Local development (gitignored)
├── .env.development        # Development defaults
├── .env.production         # Production values (gitignored)
├── vite.config.ts          # Vite configuration with proxy
└── src/
    ├── lib/
    │   └── api.ts          # API client using VITE_API_URL
    └── vite-env.d.ts       # TypeScript definitions
```

### Usage Examples

#### Local Development
```bash
# No .env file needed - uses proxy
cd client
npm run dev
```

#### Development with Remote API
```bash
# .env.development
VITE_API_URL=https://staging-api.example.com

cd client
npm run dev
```

#### Production Build
```bash
# .env.production
VITE_API_URL=https://api.example.com

cd client
npm run build
# Deploy dist/ folder
```

### Troubleshooting

**Problem:** API calls fail in production
- **Solution:** Ensure `VITE_API_URL` is set in `.env.production` and rebuild

**Problem:** CORS errors in production
- **Solution:** Check backend `CORS_ORIGIN` matches your frontend domain

**Problem:** Environment variable not working
- **Solution:** 
  1. Ensure it starts with `VITE_`
  2. Rebuild after changing environment variables
  3. Check file is named correctly (`.env.production` for production)

### Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use `.env.example`** - Document required variables
3. **Separate environments** - Use `.env.development` and `.env.production`
4. **CI/CD Integration** - Set environment variables in your deployment platform
5. **Security** - Never put secrets in frontend environment variables (they're exposed in the bundle)

