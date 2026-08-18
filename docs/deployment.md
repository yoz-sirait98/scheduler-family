# YJS Scheduler — Deployment & Custom Domain Guide

## 1. Target Deployment Architecture

```text
GitHub Repository (main branch)
       ↓
GitHub Actions Workflow (.github/workflows/deploy.yml)
       ↓
GitHub Pages
       ↓
Custom Domain (CNAME)
       ↓
yjsfinance.web.id
```

## 2. Setting Up GitHub Pages & Custom Domain

1. In your GitHub repository, go to **Settings** -> **Pages**.
2. Under **Build and deployment**:
   - Source: Choose **GitHub Actions**.
3. Under **Custom domain**:
   - Enter `yjsfinance.web.id`
   - Click **Save**.
   - Check **Enforce HTTPS** (after DNS verification).

## 3. DNS Configuration for `yjsfinance.web.id`

In your DNS provider (Cloudflare, Namecheap, Niagahoster, etc.), add the following DNS records:

| Type | Name | Content / Value |
| :--- | :--- | :--- |
| **CNAME** | `@` or `yjsfinance.web.id` | `<your-github-username>.github.io` |
| **CNAME** | `www` | `<your-github-username>.github.io` |

*(Alternatively, standard GitHub Pages A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`)*

## 4. GitHub Repository Secrets

Add the following repository secrets under **Settings** -> **Secrets and variables** -> **Actions**:
- `VITE_SUPABASE_URL`: Your Supabase project URL (`https://<project-id>.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`: Your Supabase public anon key
