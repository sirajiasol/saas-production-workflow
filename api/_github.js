/**
 * GitHub Contents API helpers for persisting project JSON in the repo.
 * Env: GITHUB_TOKEN, GITHUB_REPO (owner/repo), optional GITHUB_BRANCH (default main)
 */

const REPO = process.env.GITHUB_REPO || 'sirajiasol/saas-production-workflow';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN;

function assertAuth() {
  if (!TOKEN) {
    const err = new Error('GITHUB_TOKEN is not configured on this deployment');
    err.status = 503;
    throw err;
  }
}

function projectsPath(slug) {
  return `data/projects/${slug}.json`;
}

async function gh(path, options = {}) {
  assertAuth();
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res;
}

function decodeContent(file) {
  const raw = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return JSON.parse(raw);
}

async function listProjectFiles() {
  assertAuth();
  const url = `https://api.github.com/repos/${REPO}/contents/data/projects?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (res.status === 404) return [];
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub list failed: ${res.status} ${text}`);
    err.status = res.status;
    throw err;
  }
  const items = await res.json();
  return (items || []).filter(
    (f) => f.type === 'file' && f.name.endsWith('.json') && f.name !== '.gitkeep'
  );
}

async function getProjectFile(slug) {
  const res = await gh(`${projectsPath(slug)}?ref=${BRANCH}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub get failed: ${res.status} ${text}`);
    err.status = res.status;
    throw err;
  }
  const file = await res.json();
  return { data: decodeContent(file), sha: file.sha };
}

async function putProjectFile(slug, data, sha, message) {
  const body = {
    message: message || `Update project ${slug}`,
    content: Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64'),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await gh(projectsPath(slug), {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub put failed: ${res.status} ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function sanitizeSlug(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function emptyChecks() {
  // Stable IDs — must match public/js/workflow-data.js
  const ids = [
    'p1-doc-a', 'p1-competitors', 'p1-doc-b-pages', 'p1-doc-b-seo', 'p1-keywords',
    'p1-palette', 'p1-logo', 'p1-theme-saas', 'p1-inspo-niche', 'p1-handoff-links',
    'p2-review-docs', 'p2-justification', 'p2-contract-brief', 'p2-verification-notes',
    'p3-build-started', 'p3-build-pages', 'p3-grok-spotcheck', 'p3-changes-file',
    'p3-fixes-applied',
    'p4-preview-shared', 'p4-grok-review', 'p4-changes-to-ag', 'p4-loop-done', 'p4-human-approved',
    'p5-github-connected', 'p5-vercel-deploy', 'p5-domain-live', 'p5-smoke-test',
    'p6-gsc', 'p6-analytics', 'p6-sitemap', 'p6-index-priority', 'p6-ranking-plan', 'p6-steady-pace',
  ];
  const checks = {};
  for (const id of ids) checks[id] = false;
  return checks;
}

module.exports = {
  REPO,
  BRANCH,
  listProjectFiles,
  getProjectFile,
  putProjectFile,
  sanitizeSlug,
  emptyChecks,
  decodeContent,
};
