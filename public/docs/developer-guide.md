# ⚙️ Developer & Deployment Guide

This project utilizes a modern **Serverless Edge Architecture** hosted entirely on Cloudflare. There is no traditional backend server; everything is routed through Cloudflare Pages Functions.

### Tech Stack
* **Frontend:** Vanilla JS, HTML, CSS, Bootstrap 5.3
* **Database:** Cloudflare D1 (Serverless SQLite)
* **Storage:** Cloudflare R2 (S3-compatible Object Storage)
* **Compute:** Cloudflare Pages Functions (Workers)

---

## 🚀 How to Deploy Your Own Version

To fork and deploy this architecture for your own organization, follow these steps.

### Step 1: Install Wrangler CLI
You need Cloudflare's CLI tool to provision databases.
```bash
npm install -g wrangler
wrangler login
```

### Step 2: Provision the D1 Database
Create the database and take note of the `database_id` output.

```bash
wrangler d1 create alumni-db
Apply the schema to your remote database:
```

```bash
wrangler d1 execute alumni-db --command "CREATE TABLE students (id TEXT PRIMARY KEY, programme TEXT, start_year INTEGER, end_year INTEGER, name TEXT, department TEXT, permanent_email TEXT, niser_email TEXT, professional_email TEXT, phone_number TEXT, current_position TEXT, current_institute TEXT, social_media_links TEXT, photo_url TEXT, status TEXT DEFAULT 'APPROVED');" --remote

wrangler d1 execute alumni-db --command "CREATE TABLE requests (id TEXT PRIMARY KEY, type TEXT, data TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);" --remote

wrangler d1 execute alumni-db --command "CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, batch TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);" --remote
```

### Step 3: Provision the R2 Storage Bucket
Create a bucket to hold profile pictures.

```bash
wrangler r2 bucket create alumni-photos
```
Go to your **Cloudflare Dashboard → R2 → alumni-photos → Settings → CORS**. Add this rule to allow browser uploads:

```JSON
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"]
  }
]
```

### Step 4: Configure Cloudflare Pages
1. Push your repository to GitHub.

2. Go to **Cloudflare Dashboard → Pages → Connect to Git** and deploy the repo.

3. Go to **Pages → Your Project → Settings → Bindings**:

    - **D1 Database Binding**: Variable Name `DB` → Select `alumni-db`.

    - **R2 Bucket Binding**: Variable Name `BUCKET` → Select `alumni-photos`.

4. Go to **Pages → Your Project → Settings → Environment Variables**. Add the following:

    - `ADMIN_EMAIL` : `admin@example.com`

    - `ADMIN_PASSWORD` : `your-secure-password`

    - `DISCORD_WEBHOOK_DM` : `(Optional Discord webhook URL)`

    - `DISCORD_WEBHOOK_MAIN` : `(Optional Discord webhook URL)`

Redeploy the application in the Cloudflare dashboard to apply the bindings, and your directory will be live!