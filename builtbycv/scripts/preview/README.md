# Shareable preview (website + CRM demo)

Builds one self-contained HTML file from the running app: every public page plus a CRM demo with sample data. Links become in-page navigation, photos are embedded, and forms are demo-only. This is what's hosted at https://cv-capital-preview.vercel.app.

**Never point any of this at the production database.** `demo_seed.py` deletes all CRM data before inserting sample data.

## Rebuild

```bash
# 1. Local Postgres with the app's schema, then the sample CRM data
python3 scripts/preview/demo_seed.py > /tmp/seed.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /tmp/seed.sql

# 2. Production build of the app on port 5000
npm run build && npm start &

# 3. A CRM session for the crawler (token in the cookie, sha256 of it in the DB)
TOKEN=$(openssl rand -hex 24)
psql "$DATABASE_URL" -c "insert into sessions (id, user_id, expires_at) select '$(printf %s $TOKEN | sha256sum | cut -d' ' -f1)', id, now() + interval '1 day' from users where role='admin' limit 1"

# 4. Build the file
CV_SESSION_TOKEN=$TOKEN python3 scripts/preview/build.py /tmp/preview
```

Output: `/tmp/preview/cv-capital-site-preview.html` plus photos in `/tmp/preview/img/` (each photo written once, long edge ≤ 1400 px). The HTML has no `<!doctype>`/`<head>` (the Claude artifact host adds those). For Vercel, wrap it in a normal HTML document with `<meta name="robots" content="noindex,nofollow">`, deploy it as `index.html`, and upload the `img/` files alongside it.

Files: `build.py` (crawler/assembler), `preview.js` (site navigation, menu, calculator, estimate form, before/after slider), `crm.js` (CRM navigation, drag-and-drop pipeline, notes, tasks, demo toasts), `demo_seed.py` (fictional sample data).
