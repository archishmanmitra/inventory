# Render.com Build Configuration

## Build Settings for Render

If deploying to Render.com, use these settings:

### Build Command
```bash
npm install && npm run build
```

### Publish Directory
```
dist
```

### Environment Variables
Make sure to set:
- `VITE_API_URL` - Your backend API URL (e.g., `https://api.yourdomain.com`)

## Troubleshooting Rollup Issues

If you encounter Rollup native dependency errors:

1. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **The `.npmrc` file ensures:**
   - Optional dependencies are installed
   - Proper handling of peer dependencies

3. **The `postinstall` script:**
   - Attempts to rebuild Rollup native dependencies
   - Won't fail the build if it can't rebuild

## Alternative: Use npm ci

If issues persist, you can modify the build command to:
```bash
npm ci && npm run build
```

This ensures a clean install from `package-lock.json`.

