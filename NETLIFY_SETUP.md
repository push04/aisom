# Netlify Deployment Guide for StructuralVision AI

## How to Deploy to Netlify

### 1. Build Settings
In your Netlify dashboard, configure these build settings:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18 (automatically set via netlify.toml)

### 2. Environment Variables
You need to add environment variables in Netlify for the app to work properly.

#### Steps to Add Environment Variables:
1. Go to your Netlify site dashboard
2. Click on **Site settings**
3. Navigate to **Environment variables** (under Build & deploy)
4. Click **Add a variable**

#### Required Variables:

**OPENROUTER_API_KEY** (Server-side only - SECURE)
- Key: `OPENROUTER_API_KEY`
- Value: Your OpenRouter API key (same one you provided to Replit)
- Scopes: ✅ Functions (REQUIRED - must be checked!)

**Note:** This key is server-side only (NOT exposed to clients)

**IMPORTANT Security Note:**
- ⚠️ This key is ONLY used in Netlify Functions (serverless backend)
- ⚠️ It is NEVER exposed to the client browser
- ⚠️ Do NOT use the `VITE_` prefix for this key (that would expose it!)
- The app uses secure serverless functions to call the OpenRouter API
- Your API key remains safe on the server side

**How it works:**
1. Client sends image data to `/.netlify/functions/analyze-structure`
2. Netlify Function uses the secure `OPENROUTER_API_KEY` environment variable
3. Function calls OpenRouter API server-to-server
4. Results are returned to the client without exposing the API key

### 3. Deployment Process
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Netlify
3. Configure build settings (see above)
4. Add environment variables (see above)
5. Click "Deploy site"

### 4. Common Issues & Solutions

#### Site shows blank page:
- Check browser console for errors
- Verify `dist` folder is set as publish directory
- Ensure `_redirects` file exists in `public/` folder

#### Environment variables not working:
- Verify variable names start with `VITE_`
- Check that "Builds" scope is enabled
- Trigger a new deployment after adding variables
- In your code, access via: `import.meta.env.VITE_OPENROUTER_API_KEY`

#### 404 errors on page refresh:
- Verify `_redirects` file is in `public/` folder
- Check `netlify.toml` has redirect rules
- Both files are already configured in this project ✓

### 5. Architecture & Security

**Serverless Functions (Secure)**
- The OpenRouter API key is stored server-side in Netlify Functions
- Client code calls `/.netlify/functions/analyze-structure`
- The function is located in `netlify/functions/analyze-structure.js`
- API key is accessed via `process.env.OPENROUTER_API_KEY` in the function
- This architecture keeps your API key completely secure

**No Client-Side API Keys**
- This app does NOT use `VITE_` prefixed environment variables for API keys
- All AI analysis is routed through secure serverless functions
- Your API key is never exposed in the browser bundle

### 6. Security Architecture ✓

**Current Security Measures:**
- ✅ OpenRouter API key stored server-side only (never exposed to browser)
- ✅ Serverless function proxy architecture
- ✅ Origin/Referer validation (blocks unauthorized domains)
- ✅ IP-based rate limiting (10 requests/minute)
- ✅ Request body size validation (1.5MB limit)

**Important Security Note:**
This implementation provides **basic protection** suitable for:
- Demo/educational projects
- Personal portfolios
- Low-traffic applications
- Development/testing environments

**Known Limitation:**
Origin headers can be forged in non-browser HTTP clients (e.g., curl, Postman). While this prevents casual abuse and browser-based attacks, determined attackers could still call the serverless function directly.

**For Production/High-Security Use:**
If you need enterprise-grade security:
1. Implement **Netlify Identity** for user authentication
2. Use **signed JWT tokens** for API access
3. Consider **API key rotation** and **usage monitoring**
4. Set up **CloudFlare** or **WAF** protection

See: https://docs.netlify.com/security/secure-access-to-sites/

### 7. Local Development
For local testing with Netlify Functions:
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Create a `.env` file in project root:
```bash
OPENROUTER_API_KEY=your-key-here
```
3. Run locally: `netlify dev` (this runs both Vite and Functions)
4. The app will be available at `http://localhost:8888`

**Important:** 
- `.env` is already in `.gitignore` - never commit it!
- Origin validation automatically allows localhost for local development

## Quick Checklist Before Deploying
- ✅ `netlify.toml` exists in project root
- ✅ `public/_redirects` file exists
- ✅ Environment variables added in Netlify UI with `VITE_` prefix
- ✅ "Builds" scope enabled for all environment variables
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist`

## After Deployment
1. Visit your deployed site URL
2. Open browser DevTools → Console
3. Check for any errors
4. Test all features: Dashboard, Structural Scan, Beam Analysis, Ergonomics, Site Context
5. Test navigation and page refreshes

## Need Help?
- Check Netlify deploy logs for build errors
- Verify all environment variables are set correctly
- Ensure `dist` folder contains your built files
- Check that React Router works on all pages
