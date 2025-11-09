# Render.com Deployment Guide

## Frontend Deployment on Render

### Build Configuration

**Recommended Build Command (Option 1 - Most Reliable):**
```bash
npm ci --include=optional && npm run build
```
*Note: Requires `package-lock.json` to be committed to your repo*

**Alternative Build Command (Option 2 - Current Setup):**
```bash
npm install && npm run build
```
*This should work with the postinstall script and `.npmrc` config*

**If you get rollup errors with Option 2, try:**
```bash
npm install --include=optional && npm run build
```

**Publish Directory:**
```
dist
```

**Environment Variables:**
- `VITE_API_URL` - Your backend API URL (e.g., `https://your-api.onrender.com`)

### Common Issues and Solutions

#### Issue: Rollup Native Module Not Found

**Error:**
```
Error: Cannot find module @rollup/rollup-linux-x64-gnu
```

**Solutions:**

1. **Use npm ci with optional dependencies:**
   ```bash
   npm ci --include=optional
   ```

2. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **The postinstall script should handle this automatically**, but if it doesn't, try:
   ```bash
   npm rebuild
   ```

4. **Alternative: Use yarn instead:**
   - Change build command to: `yarn install && yarn build`
   - Yarn handles optional dependencies better in some cases

### Recommended Render Settings

**Static Site Settings:**
- **Build Command:** `npm ci --include=optional && npm run build`
- **Publish Directory:** `dist`
- **Node Version:** 18.x or 20.x (set in package.json engines or Render settings)

**Environment Variables:**
```
VITE_API_URL=https://your-backend.onrender.com
```

### Backend Deployment on Render

**Web Service Settings:**
- **Build Command:** `cd server && npm install && npm run build`
- **Start Command:** `cd server && npm start`
- **Node Version:** 18.x or 20.x

**Environment Variables:**
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
PORT=10000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.onrender.com
LOG_LEVEL=info
```

### Troubleshooting

1. **Build fails with rollup error:**
   - Try: `npm ci --include=optional`
   - Or: `npm install --legacy-peer-deps`
   - Check Node version matches (18+)

2. **Environment variables not working:**
   - Ensure `VITE_` prefix is used
   - Rebuild after changing env vars
   - Check Render environment variables are set correctly

3. **CORS errors:**
   - Ensure backend `CORS_ORIGIN` matches frontend URL exactly
   - Check both services are deployed and accessible

4. **API calls failing:**
   - Verify `VITE_API_URL` is set correctly
   - Check backend is running and accessible
   - Verify CORS settings

