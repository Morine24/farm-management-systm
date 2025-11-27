# Render Deployment Guide

## Backend Deployment

### 1. Create Web Service on Render
- Go to Render Dashboard → New → Web Service
- Connect your GitHub repository
- Select `farm-management-backend` folder

### 2. Configure Build Settings
```
Build Command: npm install
Start Command: npm start
Environment: Node
```

### 3. Set Environment Variables
Add these in Render Dashboard → Environment:

```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend-url.onrender.com
WEATHER_API_KEY=bd5e378503939ddaee76f12ad7a97608
JWT_SECRET=your-secure-random-string-here
```

### 4. Firebase Configuration
**Option A: Service Account Key (Recommended)**
```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```
Upload `serviceAccountKey.json` to your repo (add to .gitignore for security)

**Option B: Environment Variables**
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### 5. Health Check
Render will ping: `https://your-backend.onrender.com/health`

---

## Frontend Deployment

### 1. Create Static Site on Render
- Go to Render Dashboard → New → Static Site
- Connect your GitHub repository
- Select `farm-management-frontend` folder

### 2. Configure Build Settings
```
Build Command: npm install && npm run build
Publish Directory: build
```

### 3. Set Environment Variables
```
NODE_ENV=production
REACT_APP_API_URL=https://your-backend.onrender.com
```

### 4. Update Frontend API URL
In `src/services/apiService.ts`, ensure production URL points to your backend:
```typescript
const API_URL = process.env.REACT_APP_API_URL || window.location.origin;
```

---

## Troubleshooting 502 Bad Gateway

### Check 1: Backend Logs
Render Dashboard → Your Service → Logs
Look for:
- `✅ Firebase connected successfully`
- `🚀 Server running on port 10000`
- Any crash errors

### Check 2: Port Binding
Backend MUST use `process.env.PORT` and bind to `0.0.0.0`:
```javascript
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Check 3: Firebase Connection
- Verify `serviceAccountKey.json` exists
- Check Firebase credentials are correct
- Ensure Firestore is enabled in Firebase Console

### Check 4: Memory Limits
Free tier: 512MB RAM
- Monitor memory usage in Render logs
- Consider upgrading if exceeded

### Check 5: Build Failures
- Check if `npm install` completed successfully
- Verify all dependencies in `package.json`
- Look for missing modules errors

### Check 6: CORS Issues
Backend must allow frontend origin:
```javascript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
})
```

---

## Common Errors

### "Application failed to respond"
- Backend crashed or not starting
- Check logs for error messages
- Verify PORT binding

### "502 Bad Gateway"
- Backend not responding to health checks
- Check `/health` endpoint works
- Verify server is listening

### "CORS Error"
- FRONTEND_URL not set correctly
- Check CORS configuration in backend

### "Firebase Error"
- Missing or invalid credentials
- Check GOOGLE_APPLICATION_CREDENTIALS path
- Verify Firebase project settings

---

## Testing Deployment

1. **Backend Health Check**:
   ```
   curl https://your-backend.onrender.com/health
   ```
   Should return: `{"status":"OK","timestamp":"..."}`

2. **Frontend Access**:
   Open `https://your-frontend.onrender.com`
   Should load login page

3. **API Connection**:
   Login and check browser console for errors
   Should see: `Socket connected: ...`

---

## Performance Tips

1. **Free Tier Limitations**:
   - Services sleep after 15 min inactivity
   - First request takes 30-60 seconds to wake up
   - Consider paid tier for production

2. **Optimize Build**:
   - Remove unused dependencies
   - Minimize bundle size
   - Enable caching

3. **Database Optimization**:
   - Use Firestore indexes
   - Limit query results
   - Cache frequently accessed data
