# SaaS Production Workflow

Live checklist site for the Human · Grok · Anti-Gravity SaaS production process.

**Owner:** Noman Asghar / sirajiasol

## Features

- Master 6-phase workflow with roles, tips, and AI prompt templates
- **Make a copy** → creates `/p/<slug>` with fresh shared checklists
- Checklist state persisted in-repo via GitHub Contents API (`data/projects/<slug>.json`)
- Vercel serverless API: list / create / get / update projects

## Local / deploy

```bash
# Env for API writes
export GITHUB_TOKEN=ghp_...   # or gho_... with repo scope
export GITHUB_REPO=sirajiasol/saas-production-workflow
export GITHUB_BRANCH=main

vercel --yes
vercel env add GITHUB_TOKEN production
vercel env add GITHUB_REPO production
vercel --prod
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create `{ "name": "..." }` |
| GET | `/api/projects/:slug` | Get project + checks |
| PATCH | `/api/projects/:slug` | Update `{ "checks": { "id": true } }` |

## Notes

- Slugs: lowercase, hyphens, unique
- Do not host this on multistreamingplatform.com
