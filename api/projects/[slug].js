const { getProjectFile, putProjectFile, sanitizeSlug, emptyChecks } = require('../_github');

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
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

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return send(res, 204, {});
  }

  const slug = sanitizeSlug(req.query.slug || '');
  if (!slug) {
    return send(res, 400, { error: 'Invalid slug' });
  }

  try {
    if (req.method === 'GET') {
      const file = await getProjectFile(slug);
      if (!file) return send(res, 404, { error: 'Project not found' });
      // Merge any missing check IDs
      const checks = { ...emptyChecks(), ...(file.data.checks || {}) };
      return send(res, 200, { project: { ...file.data, checks } });
    }

    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const file = await getProjectFile(slug);
      if (!file) return send(res, 404, { error: 'Project not found' });

      const project = { ...file.data };
      if (body.checks && typeof body.checks === 'object') {
        const merged = { ...emptyChecks(), ...(project.checks || {}) };
        for (const [id, val] of Object.entries(body.checks)) {
          if (Object.prototype.hasOwnProperty.call(merged, id)) {
            merged[id] = Boolean(val);
          }
        }
        project.checks = merged;
      }
      if (typeof body.name === 'string' && body.name.trim().length >= 2) {
        project.name = body.name.trim().slice(0, 80);
      }
      project.updatedAt = new Date().toISOString();

      await putProjectFile(slug, project, file.sha, `Update checklist: ${slug}`);
      return send(res, 200, { project });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    // Concurrent write conflict
    if (err.status === 409) {
      return send(res, 409, { error: 'Conflict — reload and try again' });
    }
    return send(res, err.status || 500, { error: err.message || 'Server error' });
  }
};
