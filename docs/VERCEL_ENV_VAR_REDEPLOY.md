# 🔄 Vercel Environment Variables & Redeployment

## ⚠️ Important: Redeploy After Updating Environment Variables

**Yes, you need to redeploy after updating environment variables in Vercel!**

### Why?

Vercel environment variables are injected at **build time** and **runtime**, but:
- Serverless functions are built when you deploy
- Environment variables are baked into the deployment
- Updating env vars in the dashboard doesn't automatically update running deployments

---

## ✅ How to Redeploy

### Option 1: Via Vercel CLI (Quick)

```bash
vercel --prod
```

This triggers a new production deployment with the updated environment variables.

### Option 2: Via Vercel Dashboard

1. Go to Vercel Dashboard → Your Project
2. Go to **Deployments** tab
3. Click **"Redeploy"** on the latest deployment
4. Confirm redeployment

### Option 3: Push a Commit (Automatic)

```bash
git commit --allow-empty -m "chore: Trigger redeploy for env var update"
git push origin main
```

This triggers automatic deployment via GitHub integration.

---

## 🔍 Verify Environment Variables Are Updated

### Check in Vercel Dashboard

1. Go to: **Settings → Environment Variables**
2. Verify the variable shows the new value
3. Make sure it's set for **Production** environment

### Check After Redeploy

1. Wait for deployment to complete
2. Test the functionality
3. Check Vercel logs to verify new values are being used

---

## 📋 Best Practices

1. **Update env vars first**, then redeploy
2. **Test locally** with new values before deploying
3. **Redeploy immediately** after updating critical vars (like API keys)
4. **Verify** the deployment picked up the new values

---

## 🚨 Common Mistake

**Don't:** Update env vars and expect them to work immediately  
**Do:** Update env vars → Redeploy → Test

---

**Last Updated:** December 2025

