const {
  listProjectFiles,
  getProjectFile,
  putProjectFile,
  sanitizeSlug,
  emptyChecks,
} = require('../_github');

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return send(res, 204, {});
  }

  try {
    if (req.method === 'GET') {
      const files = await listProjectFiles();
      const projects = [];
      for (const f of files) {
        const slug = f.name.replace(/\.json$/, '');
        try {
          const file = await getProjectFile(slug);
          if (file && file.data) {
            const d = file.data;
            const checks = d.checks || {};
            const total = Object.keys(checks).length || 1;
            const done = Object.values(checks).filter(Boolean).length;
            projects.push({
              slug: d.slug || slug,
              name: d.name || slug,
              createdAt: d.createdAt,
              updatedAt: d.updatedAt,
              progress: Math.round((done / total) * 100),
              done,
              total,
            });
          }
        } catch (_) {
          /* skip broken file */
        }
      }
      projects.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      return send(res, 200, { projects });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return send(res, 400, { error: 'Invalid JSON body' });
        }
      }
      if (!body || typeof body !== 'object') {
        // Vercel may not auto-parse; read stream
        body = await readBody(req);
      }

      const name = (body.name || '').trim();
      if (!name || name.length < 2) {
        return send(res, 400, { error: 'Project name is required (min 2 characters)' });
      }
      if (name.length > 80) {
        return send(res, 400, { error: 'Project name too long (max 80 characters)' });
      }

      let slug = sanitizeSlug(body.slug || name);
      if (!slug || slug.length < 2) {
        return send(res, 400, { error: 'Invalid name — use letters or numbers' });
      }

      // Ensure unique slug
      let candidate = slug;
      let n = 2;
      while (true) {
        const existing = await getProjectFile(candidate);
        if (!existing) break;
        candidate = `${slug}-${n}`;
        n += 1;
        if (n > 50) {
          return send(res, 409, { error: 'Could not allocate a unique slug' });
        }
      }
      slug = candidate;

      const now = new Date().toISOString();
      const project = {
        slug,
        name,
        createdAt: now,
        updatedAt: now,
        checks: emptyChecks(),
      };

      await putProjectFile(slug, project, null, `Create project: ${name} (${slug})`);
      return send(res, 201, { project });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return send(res, err.status || 500, { error: err.message || 'Server error' });
  }
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      resolve(req.body);
      return;
    }
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}
