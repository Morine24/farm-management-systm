# Render 502 Error - Quick Fix Checklist

## ✅ Fixes Applied

1. **Backend Port Binding** - Now binds to `0.0.0.0` (required for Render)
2. **Socket Port Fixed** - Frontend now connects to correct port `5001`
3. **Offline Indicator** - Shows when backend is unavailable
4. **API Error Handling** - Graceful fallback when server is down
5. **Better Logging** - Server logs environment and startup status

## 🔍 What to Check on Render Dashboard

### Step 1: Check Backend Service Status
- [ ] Service shows "Live" (green)
- [ ] No "Deploy failed" errors
- [ ] Build completed successfully

### Step 2: Check Backend Logs
Look for these messages:
- [ ] `✅ Firebase connected successfully`
- [ ] `🚀 Server running on port 10000`
- [ ] `🌍 Environment: production`

If you see errors:
- ❌ `Firebase connection failed` → Check Firebase credentials
- ❌ `EADDRINUSE` → Port conflict (shouldn't happen on Render)
- ❌ `Cannot find module` → Build failed, check dependencies

### Step 3: Verify Environment Variables
Required variables in Render:
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000` (or leave empty, Render sets this)
- [ ] `FRONTEND_URL=https://your-frontend.onrender.com`
- [ ] `WEATHER_API_KEY=bd5e378503939ddaee76f12ad7a97608`
- [ ] `GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json`

### Step 4: Test Health Endpoint
```bash
curl https://your-backend.onrender.com/health
```
Should return: `{"status":"OK","timestamp":"2024-..."}`

If 502 error:
- Backend crashed or not starting
- Check logs for crash reason
- Verify Firebase credentials

### Step 5: Check Firebase Setup
- [ ] `serviceAccountKey.json` exists in backend folder
- [ ] File is valid JSON
- [ ] Firebase project is active
- [ ] Firestore database is enabled

## 🚀 Quick Fixes

### If Backend Won't Start:
1. Check Render logs for error message
2. Verify all environment variables are set
3. Ensure `serviceAccountKey.json` is in repo
4. Try manual redeploy

### If 502 Persists:
1. Check if free tier service is sleeping (takes 30-60s to wake)
2. Verify health check endpoint works
3. Check memory usage (free tier: 512MB limit)
4. Look for Firebase connection errors

### If CORS Errors:
1. Set `FRONTEND_URL` to exact frontend URL
2. No trailing slash in URL
3. Must include `https://`

## 📱 Local Testing

Before deploying, test locally:

1. **Start Backend**:
   ```bash
   cd farm-management-backend
   npm install
   npm start
   ```
   Should see: `Server running on port 5001`

2. **Start Frontend**:
   ```bash
   cd farm-management-frontend
   npm install
   npm start
   ```
   Should open: `http://localhost:3000`

3. **Check Connection**:
   - Login page loads
   - No console errors
   - Can login successfully

## 🆘 Still Having Issues?

1. **Check Render Status**: https://status.render.com
2. **View Render Docs**: https://render.com/docs/troubleshooting-deploys
3. **Check Backend Logs**: Most errors show here
4. **Verify Firebase**: Test credentials locally first

## 📞 Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| 502 Bad Gateway | Backend not responding | Check logs, verify startup |
| Application failed to respond | Backend crashed | Check Firebase credentials |
| CORS error | Wrong FRONTEND_URL | Update environment variable |
| Firebase connection failed | Invalid credentials | Check serviceAccountKey.json |
| Cannot find module | Build failed | Check package.json dependencies |
