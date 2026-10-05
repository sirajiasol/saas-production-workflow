(function () {
  function sanitizeSlug(input) {
    return String(input || '')
      .toLowerCase()
      .trim()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
  }

  function toast(msg, isErr) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('err', !!isErr);
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function badgeClass(role) {
    if (role === 'human') return 'badge badge-human';
    if (role === 'grok') return 'badge badge-grok';
    return 'badge badge-antigravity';
  }

  function renderRoles(container) {
    if (!container || !window.WORKFLOW) return;
    container.innerHTML = WORKFLOW.roles
      .map(
        (r) => `
      <article class="role-card">
        <span class="${badgeClass(r.id)}">${r.name}</span>
        <p>${escapeHtml(r.line)}</p>
      </article>`
      )
      .join('');
  }

  function renderTips(container) {
    if (!container || !window.WORKFLOW) return;
    container.innerHTML = WORKFLOW.tips
      .map(
        (t) => `
      <article class="tip">
        <h3>💡 ${escapeHtml(t.title)}</h3>
        <p>${escapeHtml(t.body)}</p>
      </article>`
      )
      .join('');
  }

  function renderPrompts(container) {
    if (!container || !window.WORKFLOW) return;
    container.innerHTML = WORKFLOW.prompts
      .map(
        (p, i) => `
      <article class="prompt-card">
        <div class="prompt-head">
          <h3>${escapeHtml(p.title)}</h3>
          <button type="button" class="copy-btn" data-prompt-index="${i}">Copy prompt</button>
        </div>
        <pre>${escapeHtml(p.template)}</pre>
      </article>`
      )
      .join('');

    container.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.getAttribute('data-prompt-index'));
        const text = WORKFLOW.prompts[idx].template;
        try {
          await navigator.clipboard.writeText(text);
          btn.classList.add('copied');
          btn.textContent = 'Copied';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.textContent = 'Copy prompt';
          }, 1600);
        } catch {
          toast('Could not copy — select the text manually', true);
        }
      });
    });
  }

  function countProgress(checks, phase) {
    const ids = phase.items.map((i) => i.id);
    const done = ids.filter((id) => checks && checks[id]).length;
    return { done, total: ids.length, pct: ids.length ? Math.round((done / ids.length) * 100) : 0 };
  }

  function renderPhases(container, options) {
    if (!container || !window.WORKFLOW) return;
    const checks = (options && options.checks) || {};
    const interactive = !!(options && options.interactive);
    const onToggle = options && options.onToggle;

    container.innerHTML = WORKFLOW.phases
      .map((phase) => {
        const prog = countProgress(checks, phase);
        const items = phase.items
          .map((item) => {
            const checked = !!checks[item.id];
            const inputAttrs = interactive
              ? `id="${item.id}" data-check-id="${item.id}" ${checked ? 'checked' : ''}`
              : `id="master-${item.id}" disabled ${checked ? 'checked' : ''}`;
            return `
            <li class="checkbox ${checked ? 'done' : ''}">
              <input type="checkbox" ${inputAttrs} ${interactive ? '' : 'tabindex="-1"'} />
              <label for="${interactive ? item.id : 'master-' + item.id}">${escapeHtml(item.label)}</label>
            </li>`;
          })
          .join('');

        return `
        <article class="phase" data-phase="${phase.id}">
          <div class="phase-header">
            <div class="phase-num">${phase.id}</div>
            <div class="phase-meta">
              <h3>${escapeHtml(phase.title)}</h3>
              <p>${escapeHtml(phase.summary)}</p>
            </div>
            <div class="phase-side">
              <span class="${badgeClass(phase.role)}">${escapeHtml(phase.roleLabel)}</span>
              <div class="phase-progress">${prog.done}/${prog.total} · ${prog.pct}%</div>
              <div class="progress-bar"><span style="width:${prog.pct}%"></span></div>
            </div>
          </div>
          <div class="phase-body">
            <span class="checkpoint">Checkpoint: ${escapeHtml(phase.checkpoint)}</span>
            <ul class="checklist">${items}</ul>
          </div>
        </article>`;
      })
      .join('');

    if (interactive && typeof onToggle === 'function') {
      container.querySelectorAll('input[type="checkbox"][data-check-id]').forEach((input) => {
        input.addEventListener('change', () => {
          onToggle(input.getAttribute('data-check-id'), input.checked);
        });
      });
    }
  }

  function overallProgress(checks) {
    if (!window.WORKFLOW) return { done: 0, total: 0, pct: 0 };
    let done = 0;
    let total = 0;
    WORKFLOW.phases.forEach((p) => {
      p.items.forEach((i) => {
        total += 1;
        if (checks && checks[i.id]) done += 1;
      });
    });
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function wireCopyModal(opts) {
    const modal = document.getElementById('copyModal');
    const nameInput = document.getElementById('projectName');
    const slugPreview = document.getElementById('slugPreview');
    const errEl = document.getElementById('copyError');
    const confirmBtn = document.getElementById('confirmCopy');
    const cancelBtn = document.getElementById('cancelCopy');
    const openers = document.querySelectorAll('#makeCopyBtn, #makeCopyBtn2');

    function open() {
      errEl.textContent = '';
      nameInput.value = '';
      slugPreview.textContent = 'slug: —';
      modal.classList.add('open');
      nameInput.focus();
    }
    function close() {
      modal.classList.remove('open');
    }

    openers.forEach((btn) => btn && btn.addEventListener('click', open));
    cancelBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });

    nameInput.addEventListener('input', () => {
      const slug = sanitizeSlug(nameInput.value);
      slugPreview.textContent = slug ? `slug: ${slug}` : 'slug: —';
    });

    async function create() {
      errEl.textContent = '';
      const name = nameInput.value.trim();
      if (name.length < 2) {
        errEl.textContent = 'Enter a project name (at least 2 characters).';
        return;
      }
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Creating…';
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `Create failed (${res.status})`);
        }
        const slug = data.project.slug;
        toast(`Created “${data.project.name}”`);
        window.location.href = `/p/${slug}`;
      } catch (e) {
        errEl.textContent = e.message || 'Could not create project';
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Create project';
      }
    }

    confirmBtn.addEventListener('click', create);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') create();
    });

    return { open, close };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  window.WorkflowUI = {
    sanitizeSlug,
    toast,
    badgeClass,
    renderRoles,
    renderTips,
    renderPrompts,
    renderPhases,
    overallProgress,
    wireCopyModal,
    escapeHtml,
  };
})();
