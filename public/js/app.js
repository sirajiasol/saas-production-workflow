(function () {
  const { renderRoles, renderTips, renderPhases, wireCopyModal, toast, escapeHtml } = window.WorkflowUI;

  renderRoles(document.getElementById('rolesGrid'));
  renderTips(document.getElementById('tipsGrid'));
  renderPhases(document.getElementById('phaseList'), { checks: {}, interactive: false });
  wireCopyModal();

  async function loadProjects() {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '<div class="empty-state">Loading projects…</div>';
    try {
      const res = await fetch('/api/projects');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to load (${res.status})`);
      const projects = data.projects || [];
      if (!projects.length) {
        grid.innerHTML =
          '<div class="empty-state">No project copies yet. Click <strong>Make a copy</strong> to create one.</div>';
        return;
      }
      grid.innerHTML = projects
        .map((p) => {
          const by = p.createdBy
            ? `<div class="byline">Created by ${escapeHtml(p.createdBy)}</div>`
            : '';
          return `
        <a class="project-card" href="/p/${encodeURIComponent(p.slug)}" style="color:inherit;text-decoration:none">
          <h3>${escapeHtml(p.name)}</h3>
          <div class="slug">/p/${escapeHtml(p.slug)}</div>
          ${by}
          <div class="progress-bar"><span style="width:${p.progress || 0}%"></span></div>
          <div class="muted" style="font-size:0.82rem">${p.done || 0}/${p.total || 0} checks · ${p.progress || 0}%</div>
        </a>`;
        })
        .join('');
    } catch (e) {
      grid.innerHTML = `<div class="empty-state">${escapeHtml(e.message || 'Could not load projects')}</div>`;
      toast(e.message || 'Could not load projects', true);
    }
  }

  document.getElementById('refreshProjects').addEventListener('click', loadProjects);
  loadProjects();
})();
