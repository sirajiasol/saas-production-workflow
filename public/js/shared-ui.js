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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function promptForPhase(phaseId) {
    if (!window.WORKFLOW || !WORKFLOW.prompts) return null;
    return WORKFLOW.prompts.find((p) => p.phase === phaseId) || null;
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

  function countProgress(checks, phase) {
    const ids = phase.items.map((i) => i.id);
    const done = ids.filter((id) => checks && checks[id]).length;
    return { done, total: ids.length, pct: ids.length ? Math.round((done / ids.length) * 100) : 0 };
  }

  function renderPhasePromptBlock(phase) {
    const prompt = promptForPhase(phase.id);
    if (!prompt) return '';
    const pid = `phase-prompt-${phase.id}`;
    return `
      <div class="phase-prompt" data-phase-prompt="${phase.id}">
        <button type="button" class="prompt-toggle" aria-expanded="false" aria-controls="${pid}">
          <span>AI prompt template · Phase ${phase.id}</span>
          <span class="chev" aria-hidden="true">▾</span>
        </button>
        <div class="prompt-panel" id="${pid}">
          <div class="prompt-panel-head">
            <p>Replace <code>[bracketed]</code> variables, then paste into your AI chat.</p>
            <button type="button" class="copy-btn" data-phase="${phase.id}">Copy prompt</button>
          </div>
          <pre>${escapeHtml(prompt.template)}</pre>
        </div>
      </div>`;
  }

  function wirePhasePrompts(container) {
    container.querySelectorAll('.phase-prompt .prompt-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const wrap = btn.closest('.phase-prompt');
        const open = wrap.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    container.querySelectorAll('.phase-prompt .copy-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const phaseId = Number(btn.getAttribute('data-phase'));
        const prompt = promptForPhase(phaseId);
        if (!prompt) return;
        try {
          await navigator.clipboard.writeText(prompt.template);
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

  function renderPhases(container, options) {
    if (!container || !window.WORKFLOW) return;
    const checks = (options && options.checks) || {};
    const interactive = !!(options && options.interactive);
    const onToggle = options && options.onToggle;
    const prefix = interactive ? '' : 'master-';

    container.innerHTML = WORKFLOW.phases
      .map((phase) => {
        const prog = countProgress(checks, phase);
        const items = phase.items
          .map((item) => {
            const checked = !!checks[item.id];
            const id = prefix + item.id;
            const inputAttrs = interactive
              ? `id="${id}" data-check-id="${item.id}" ${checked ? 'checked' : ''}`
              : `id="${id}" disabled ${checked ? 'checked' : ''} tabindex="-1"`;
            return `
            <li class="checkbox ${checked ? 'done' : ''}">
              <input type="checkbox" ${inputAttrs} />
              <label for="${id}">${escapeHtml(item.label)}</label>
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
            ${renderPhasePromptBlock(phase)}
          </div>
        </article>`;
      })
      .join('');

    wirePhasePrompts(container);

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

  function wireCopyModal() {
    const modal = document.getElementById('copyModal');
    const nameInput = document.getElementById('projectName');
    const userInput = document.getElementById('userName');
    const slugPreview = document.getElementById('slugPreview');
    const errEl = document.getElementById('copyError');
    const confirmBtn = document.getElementById('confirmCopy');
    const cancelBtn = document.getElementById('cancelCopy');
    const openers = document.querySelectorAll('#makeCopyBtn, #makeCopyBtn2');

    function open() {
      errEl.textContent = '';
      nameInput.value = '';
      if (userInput) userInput.value = '';
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
      const createdBy = userInput ? userInput.value.trim() : '';
      if (name.length < 2) {
        errEl.textContent = 'Enter a project name (at least 2 characters).';
        return;
      }
      if (!createdBy || createdBy.length < 2) {
        errEl.textContent = 'Enter your name (at least 2 characters).';
        return;
      }
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Creating…';
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, createdBy }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `Create failed (${res.status})`);
        }
        toast(`Created “${data.project.name}”`);
        window.location.href = `/p/${data.project.slug}`;
      } catch (e) {
        errEl.textContent = e.message || 'Could not create project';
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Create project';
      }
    }

    confirmBtn.addEventListener('click', create);
    [nameInput, userInput].forEach((el) => {
      if (!el) return;
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') create();
      });
    });

    return { open, close };
  }

  window.WorkflowUI = {
    sanitizeSlug,
    toast,
    badgeClass,
    renderRoles,
    renderTips,
    renderPhases,
    overallProgress,
    wireCopyModal,
    escapeHtml,
  };
})();
