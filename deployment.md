# Deployment Guide (Vercel)

The Placement Monitor Dashboard is purely built on Vanilla HTML/CSS/JS and strictly utilizes Supabase for any backend state, database management, authentication, and file storage. There is **no local server backend requirement**, which implies it can be hosted on any static site host out of the box.

## Instructions to Deploy on Vercel

1. **Initialize Git Repository:**
   In your root project directory (`placement dashboard`), initialize a git repository and commit your files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Vercel deployment"
   ```

2. **Push to GitHub / GitLab / Bitbucket**:
   Create a new blank repository on your preferred Git provider and push this code.
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

3. **Deploy via Vercel Dashboard:**
   - Log into [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
   - Import your newly pushed Git repository.
   - For **Framework Preset**, select `Other` (since it's a raw HTML/JS app).
   - In the **Root Directory**, keep it as `./` (the root).
   - Click **Deploy**. Vercel will automatically provision an SSL certificate and assign a global CDN URL.

4. **Verify Supabase Configurations:**
   - Go to your Supabase project dashboard (`zidwpnxhmypmknmchbnt`).
   - Navigate to **Authentication** -> **URL Configuration**.
   - Add your newly provided `https://<your-app>.vercel.app` domain to the **Site URL** and **Redirect URLs** to allow users to securely authenticate without encountering CORS or invalid redirect errors.

That's it! Your application is entirely serverless—utilizing Vercel's global edge network for UI delivery, and Supabase's PostgreSQL/Storage buckets for state. No persistent local drives are required.
