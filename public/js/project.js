(function () {
  const {
    renderTips,
    renderPhases,
    overallProgress,
    wireCopyModal,
    toast,
    escapeHtml,
  } = window.WorkflowUI;

  function slugFromPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    // /p/<slug>
    if (parts[0] === 'p' && parts[1]) return decodeURIComponent(parts[1]);
    return '';
  }

  const slug = slugFromPath();
  let project = null;
  let saveTimer = null;
  let pendingChecks = null;

  renderTips(document.getElementById('tipsGrid'));
  wireCopyModal();

  const saveState = document.getElementById('saveState');
  const overall = document.getElementById('overall');
  const overallPct = document.getElementById('overallPct');
  const overallCount = document.getElementById('overallCount');
  const overallBar = document.getElementById('overallBar');

  function setSaveState(mode, text) {
    saveState.className = 'save-state ' + (mode || '');
    saveState.textContent = text || '';
  }

  function updateOverall(checks) {
    const o = overallProgress(checks);
    overall.hidden = false;
    overallPct.textContent = o.pct + '%';
    overallCount.textContent = `(${o.done}/${o.total})`;
    overallBar.style.width = o.pct + '%';
  }

  function paint() {
    document.title = `${project.name} — SaaS Production Workflow`;
    document.getElementById('projectTitle').textContent = project.name;
    document.getElementById('slugLabel').textContent = `/p/${project.slug}`;
    const byEl = document.getElementById('createdBy');
    if (project.createdBy) {
      byEl.hidden = false;
      byEl.innerHTML = `Created by <strong>${escapeHtml(project.createdBy)}</strong>`;
    } else {
      byEl.hidden = true;
      byEl.textContent = '';
    }
    document.getElementById('projectMeta').textContent =
      'Shared checklists for Human & Grok. Changes save to this project URL. Phase prompts are inside each phase card.';
    updateOverall(project.checks);
    renderPhases(document.getElementById('phaseList'), {
      checks: project.checks,
      interactive: true,
      onToggle: onToggle,
    });
  }

  function onToggle(id, checked) {
    project.checks[id] = checked;
    // Optimistic UI refresh for strike-through + phase %
    updateOverall(project.checks);
    const phaseEl = document.querySelector(`input[data-check-id="${id}"]`)?.closest('.phase');
    if (phaseEl) {
      const li = phaseEl.querySelector(`input[data-check-id="${id}"]`)?.closest('.checkbox');
      if (li) li.classList.toggle('done', checked);
      // recompute phase progress from DOM
      const inputs = phaseEl.querySelectorAll('input[data-check-id]');
      let done = 0;
      inputs.forEach((inp) => {
        if (inp.checked) done += 1;
      });
      const total = inputs.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      const prog = phaseEl.querySelector('.phase-progress');
      const bar = phaseEl.querySelector('.progress-bar > span');
      if (prog) prog.textContent = `${done}/${total} · ${pct}%`;
      if (bar) bar.style.width = pct + '%';
    }

    pendingChecks = pendingChecks || {};
    pendingChecks[id] = checked;
    setSaveState('saving', 'Saving…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 400);
  }

  async function flushSave() {
    if (!pendingChecks) return;
    const payload = { checks: pendingChecks };
    pendingChecks = null;
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      project = data.project;
      setSaveState('saved', 'Saved');
      setTimeout(() => {
        if (saveState.textContent === 'Saved') setSaveState('', '');
      }, 1500);
    } catch (e) {
      setSaveState('error', 'Save failed');
      toast(e.message || 'Save failed', true);
    }
  }

  async function load() {
    if (!slug) {
      document.getElementById('projectTitle').textContent = 'Invalid project';
      document.getElementById('phaseList').innerHTML =
        '<div class="empty-state">Missing project slug. <a href="/">Go home</a></div>';
      return;
    }
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(slug)}`);
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) {
        document.getElementById('projectTitle').textContent = 'Project not found';
        document.getElementById('phaseList').innerHTML =
          '<div class="empty-state">No project at this URL. <a href="/">Make a copy</a> from the home page.</div>';
        return;
      }
      if (!res.ok) throw new Error(data.error || `Load failed (${res.status})`);
      project = data.project;
      paint();
    } catch (e) {
      document.getElementById('projectTitle').textContent = 'Error';
      document.getElementById('phaseList').innerHTML = `<div class="empty-state">${e.message}</div>`;
      toast(e.message, true);
    }
  }

  load();
})();
