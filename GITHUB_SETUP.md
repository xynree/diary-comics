# 🔧 GitHub Repository Setup Guide

## 📋 Required GitHub Secrets

To enable the CI/CD pipeline, you need to configure the following secrets in your GitHub repository:

### **Navigation: Settings → Secrets and variables → Actions → New repository secret**

### **🔐 Vercel Secrets**
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id  
VERCEL_PROJECT_ID=your_vercel_project_id
```

**How to get these values:**
1. **VERCEL_TOKEN**: Go to Vercel Dashboard → Settings → Tokens → Create Token
2. **VERCEL_ORG_ID**: Run `vercel link` in your project, then check `.vercel/project.json`
3. **VERCEL_PROJECT_ID**: Same file as above, look for `projectId`

### **☁️ Cloudinary Secrets**
```
CLOUDINARY_CLOUD_NAME=xynree
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xynree
```

### **📊 Optional: Code Coverage**
```
CODECOV_TOKEN=your_codecov_token
```

## 🚀 CI/CD Pipeline Features

### **✅ Quality Assurance**
- **ESLint**: Code style and quality checks
- **TypeScript**: Type checking
- **Unit Tests**: Jest test suite with coverage
- **Security Audit**: npm audit for vulnerabilities

### **🏗️ Build Process**
- **Next.js Build**: Production build with optimizations
- **Artifact Upload**: Build files stored for deployment
- **Environment Variables**: Secure handling of secrets

### **🧪 Testing**
- **Unit Tests**: Component and utility function tests
- **E2E Tests**: Playwright browser automation
- **Performance Tests**: Lighthouse audits
- **Bundle Analysis**: Size and optimization checks

### **🚢 Deployment**
- **Preview Deployments**: Automatic for pull requests
- **Production Deployment**: Automatic for main branch pushes
- **Rollback Support**: Via Vercel dashboard
- **Status Updates**: GitHub deployment status

### **🔄 Automation**
- **Dependency Updates**: Weekly automated PRs
- **Security Monitoring**: Daily vulnerability scans
- **Performance Monitoring**: Daily Lighthouse audits

## 📊 Workflow Triggers

### **Main CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
- **Push to main/develop**: Full pipeline with deployment
- **Pull Requests**: Quality checks + preview deployment
- **Manual**: Can be triggered manually

### **Dependency Updates** (`.github/workflows/dependency-update.yml`)
- **Schedule**: Every Monday at 9 AM UTC
- **Manual**: Can be triggered manually

### **Performance Monitoring** (`.github/workflows/performance.yml`)
- **Push to main**: Performance audit
- **Pull Requests**: Performance comparison
- **Schedule**: Daily at 2 AM UTC

## 🛡️ Branch Protection Rules

### **Recommended Settings for `main` branch:**

1. **Go to**: Settings → Branches → Add rule
2. **Branch name pattern**: `main`
3. **Enable**:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1 minimum)
   - ✅ Dismiss stale PR approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require conversation resolution before merging
   - ✅ Include administrators

4. **Required Status Checks**:
   - `Quality Assurance`
   - `Build Application`
   - `End-to-End Tests`

## 📈 Monitoring & Alerts

### **GitHub Actions**
- **Build Status**: Visible in repository badges
- **Test Results**: Detailed reports in Actions tab
- **Performance Metrics**: Lighthouse scores in PR comments

### **Vercel Dashboard**
- **Deployment Status**: Real-time deployment monitoring
- **Performance Analytics**: Built-in Vercel analytics
- **Error Tracking**: Function logs and error reports

## 🔧 Local Development Integration

### **Pre-commit Hooks** (Optional)
Install husky for local quality checks:

```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

Add to `package.json`:
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### **VS Code Integration**
Recommended extensions:
- ESLint
- Prettier
- TypeScript Importer
- GitLens

## 🚨 Troubleshooting

### **Common Issues**

**Build Failures:**
- Check environment variables are set correctly
- Verify Cloudinary credentials
- Review TypeScript errors in Actions logs

**Deployment Failures:**
- Confirm Vercel token has correct permissions
- Check project linking in Vercel dashboard
- Verify build artifacts are generated

**Test Failures:**
- Review test logs in Actions tab
- Check if tests pass locally
- Verify test environment variables

### **Getting Help**
- Check Actions logs for detailed error messages
- Review Vercel deployment logs
- Use GitHub Discussions for community support

---

## 🎯 Quick Setup Checklist

- [ ] Add all required secrets to GitHub repository
- [ ] Configure branch protection rules for `main`
- [ ] Link repository to Vercel project
- [ ] Test CI/CD pipeline with a test PR
- [ ] Verify production deployment works
- [ ] Set up monitoring and alerts
- [ ] Configure optional integrations (Codecov, etc.)

**🚀 Your CI/CD pipeline is now ready for production!**
