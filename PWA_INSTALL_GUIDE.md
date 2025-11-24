# PWA Install Guide

## ✅ Fixes Applied

1. **Service Worker Enabled** - Uncommented registration in index.tsx
2. **Install Button Added** - Floating green download button (bounces)
3. **Install Banner** - Shows after 3 seconds with prompt
4. **Auto-hide when installed** - Detects if app is already installed

## 📱 How to Test Install Prompt

### Chrome/Edge (Desktop):
1. Open app in browser: `http://localhost:3000`
2. Look for floating green download button (bottom-right)
3. Click it to see install banner
4. Click "Install Now"

**Note**: Chrome only shows install prompt if:
- App is served over HTTPS (or localhost)
- Has valid manifest.json
- Has registered service worker
- User hasn't dismissed prompt 3+ times

### Chrome (Android):
1. Open app in Chrome browser
2. Wait 3 seconds for banner to appear
3. Or tap 3-dot menu → "Install app"

### Safari (iOS):
1. Open app in Safari
2. Tap Share button
3. Scroll down → "Add to Home Screen"
4. Tap "Add"

**Note**: Safari doesn't support `beforeinstallprompt` event, so manual install only.

## 🔍 Troubleshooting

### Install Button Not Showing?

**Check 1: Service Worker Registered**
Open DevTools → Application → Service Workers
Should see: `service-worker.js` with status "activated"

**Check 2: Manifest Valid**
Open DevTools → Application → Manifest
Should show: "Loosian Farm" with green icon

**Check 3: Console Logs**
Look for: `SW registered: ServiceWorkerRegistration`

**Check 4: Already Installed?**
If app is already installed, button won't show.
Uninstall: Chrome → 3-dot menu → "Uninstall Loosian Farm"

### Force Install Prompt (Testing):

1. **Clear Site Data**:
   - DevTools → Application → Storage
   - Click "Clear site data"
   - Refresh page

2. **Unregister Service Worker**:
   - DevTools → Application → Service Workers
   - Click "Unregister"
   - Refresh page

3. **Reset Install Prompt**:
   ```javascript
   // In browser console:
   localStorage.clear();
   location.reload();
   ```

## 🚀 Production Deployment

### For Install Prompt to Work:
- ✅ Must be served over HTTPS
- ✅ Valid SSL certificate
- ✅ Service worker registered
- ✅ Manifest.json accessible

### Render Deployment:
- Render automatically provides HTTPS
- Install prompt will work on deployed URL
- Test on mobile device for best experience

## 📊 Install Criteria (Chrome)

Chrome shows install prompt when:
1. ✅ Web app not already installed
2. ✅ Meets installability criteria
3. ✅ User has engaged with site (30 seconds)
4. ✅ Includes web app manifest with:
   - `short_name` or `name`
   - `icons` (192px and 512px)
   - `start_url`
   - `display` (standalone/fullscreen)
5. ✅ Served over HTTPS
6. ✅ Registers service worker with fetch handler

## 🎯 Current Setup

✅ Manifest: `/public/manifest.json`
✅ Service Worker: `/public/service-worker.js`
✅ Icons: `/public/loosian-logo.jpg`
✅ Registration: `src/index.tsx`
✅ Install Component: `src/components/InstallPWA.tsx`

## 🔄 Testing Locally

```bash
# Start app
cd farm-management-frontend
npm start

# Open browser
http://localhost:3000

# Wait 3 seconds
# Look for green download button (bottom-right)
# Click to install
```

## 📱 Mobile Testing

1. Deploy to Render (HTTPS required)
2. Open on mobile browser
3. Install prompt appears automatically
4. Or use browser menu → "Install app"

## ⚠️ Important Notes

- **iOS Safari**: No automatic prompt, manual install only
- **Chrome Desktop**: Requires user engagement (30s)
- **Already Installed**: Button won't show
- **Dismissed 3x**: Chrome blocks prompt for 3 months
- **HTTP**: Install prompt won't work (use HTTPS)
