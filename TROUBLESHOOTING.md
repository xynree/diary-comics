# 🔧 Troubleshooting Guide

## 🚨 Common Issues & Solutions

### **🖼️ Images Not Loading**

#### **Symptoms**
- Black boxes instead of images
- "Failed to load image" errors
- Images load in lightbox but not in gallery

#### **Solutions**
1. **Check Cloudinary Credentials**
   ```bash
   # Verify environment variables
   echo $CLOUDINARY_CLOUD_NAME
   echo $NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
   ```

2. **Verify Image URLs**
   - Open browser dev tools → Network tab
   - Look for 404 errors on image requests
   - Check if URLs are correctly formatted

3. **Check Cloudinary Folder Structure**
   - Images should be in `diary/{year}/` folders
   - Example: `diary/2024/1.1.24_1.jpg`

4. **Clear Next.js Cache**
   ```bash
   rm -rf .next
   npm run build
   ```

### **📡 API Errors**

#### **Symptoms**
- "Failed to Load Gallery" message
- 500 Internal Server Error
- Empty gallery despite having images

#### **Solutions**
1. **Check API Endpoint**
   ```bash
   curl http://localhost:3000/api/diary
   ```

2. **Verify Cloudinary API Limits**
   - Check Cloudinary dashboard for usage
   - Ensure you haven't exceeded rate limits

3. **Check Server Logs**
   ```bash
   npm run dev
   # Look for error messages in terminal
   ```

4. **Environment Variables**
   ```bash
   # Ensure all required variables are set
   cat .env.local
   ```

### **🔄 Upload System Issues**

#### **Symptoms**
- Files not uploading automatically
- "Duplicate check failed" errors
- Upload queue stuck

#### **Solutions**
1. **Check File Naming**
   - Must follow `M.D.YY_sequence.ext` format
   - Examples: `1.1.24_1.jpg`, `12.25.24_2.png`

2. **Verify Watch Folder**
   ```bash
   npm run upload:config
   # Check if folder path is correct
   ```

3. **Check File Permissions**
   ```bash
   ls -la "/path/to/watch/folder"
   # Ensure read/write permissions
   ```

4. **Restart Upload Watcher**
   ```bash
   # Stop current watcher (Ctrl+C)
   npm run upload:watch
   ```

5. **Manual Upload Test**
   ```bash
   npm run upload:validate "/path/to/test/image.jpg"
   ```

### **🏗️ Build Failures**

#### **Symptoms**
- `npm run build` fails
- TypeScript errors
- ESLint errors

#### **Solutions**
1. **TypeScript Errors**
   ```bash
   npx tsc --noEmit
   # Fix reported type errors
   ```

2. **ESLint Errors**
   ```bash
   npm run lint
   # Fix linting issues
   ```

3. **Clear Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check Node.js Version**
   ```bash
   node --version
   # Should be 22+
   ```

### **🚀 Deployment Issues**

#### **Symptoms**
- Vercel deployment fails
- Environment variables not working in production
- Build succeeds locally but fails on Vercel

#### **Solutions**
1. **Check Vercel Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Ensure all required variables are set for Production

2. **Build Locally with Production Settings**
   ```bash
   NODE_ENV=production npm run build
   ```

3. **Check Vercel Build Logs**
   - Go to Vercel Dashboard → Deployments
   - Click on failed deployment for detailed logs

4. **Verify vercel.json Configuration**
   ```json
   {
     "functions": {
       "src/app/api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

### **⚡ Performance Issues**

#### **Symptoms**
- Slow page loading
- Images loading slowly
- High memory usage

#### **Solutions**
1. **Enable Image Optimization**
   ```javascript
   // next.config.js
   images: {
     formats: ['image/webp', 'image/avif'],
     minimumCacheTTL: 60,
   }
   ```

2. **Check Bundle Size**
   ```bash
   npm run build
   # Look for large bundle warnings
   ```

3. **Optimize Images**
   - Use appropriate image sizes
   - Consider compressing images before upload

4. **Enable Caching**
   ```javascript
   // API routes
   res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
   ```

## 🔍 Debugging Tools

### **Browser Developer Tools**
1. **Console Tab**: Check for JavaScript errors
2. **Network Tab**: Monitor API requests and image loading
3. **Application Tab**: Check localStorage and cookies
4. **Lighthouse Tab**: Performance auditing

### **Server-Side Debugging**
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check specific service logs
DEBUG=upload:* npm run upload:watch
```

### **Database/API Debugging**
```bash
# Test Cloudinary connection
node -e "
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
cloudinary.api.ping().then(console.log).catch(console.error);
"
```

## 📊 Monitoring & Logs

### **Application Logs**
- **Development**: Check terminal output
- **Production**: Vercel Dashboard → Functions → Logs

### **Error Tracking**
```bash
# Check for recent errors
tail -f logs/upload.log
tail -f logs/error.log
```

### **Performance Monitoring**
- **Vercel Analytics**: Built-in performance metrics
- **Lighthouse CI**: Automated performance testing
- **Bundle Analyzer**: Check bundle size

## 🆘 Getting Help

### **Before Asking for Help**
1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Check the documentation
4. Try reproducing the issue locally

### **When Reporting Issues**
Include the following information:

```
**Environment:**
- OS: [e.g., macOS 14.0]
- Node.js version: [e.g., 22.0.0]
- npm version: [e.g., 10.0.0]
- Browser: [e.g., Chrome 120.0]

**Steps to Reproduce:**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior:**
A clear description of what you expected to happen.

**Actual Behavior:**
A clear description of what actually happened.

**Screenshots/Logs:**
If applicable, add screenshots or error logs.

**Additional Context:**
Any other context about the problem.
```

### **Support Channels**
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community help
- **Documentation**: Check README.md and other docs
- **Email**: your-email@example.com

## 🔄 Recovery Procedures

### **Rollback Deployment**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments tab
4. Click "..." on a previous working deployment
5. Select "Promote to Production"

### **Reset Upload Configuration**
```bash
rm scripts/config/upload-config.json
npm run upload:config
```

### **Clear All Caches**
```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Clear browser cache (manual)
# Chrome: Ctrl+Shift+R or Cmd+Shift+R
```

### **Database Recovery**
If using a database, ensure you have backups:
```bash
# Example backup command
pg_dump your_database > backup.sql

# Example restore command
psql your_database < backup.sql
```

---

## 🎯 Prevention Tips

1. **Regular Backups**: Backup your configuration and data
2. **Monitoring**: Set up alerts for errors and performance issues
3. **Testing**: Run tests before deploying
4. **Documentation**: Keep your setup documented
5. **Updates**: Keep dependencies updated regularly

**💡 Remember: Most issues can be resolved by checking logs, verifying configuration, and following the error messages carefully.**
