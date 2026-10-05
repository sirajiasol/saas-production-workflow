/**
 * Shared workflow definitions — phases, checklists, tips, AI prompts.
 * Check IDs must match api/_github.js emptyChecks().
 */
window.WORKFLOW = {
  roles: [
    {
      id: 'human',
      name: 'Human',
      line: 'Researcher, bridge, final approver',
    },
    {
      id: 'grok',
      name: 'Grok',
      line: 'PM, SEO head, post-launch SEO',
    },
    {
      id: 'antigravity',
      name: 'Anti-Gravity',
      line: 'Coder — builds from guide + contract brief',
    },
  ],

  tips: [
    {
      title: 'SaaS theme only',
      body: 'While picking a theme/template, make sure it is a SaaS theme — dashboards, pricing, features, CTAs — not a blog, portfolio, or ecommerce skin.',
    },
    {
      title: 'Design inspo ≠ competitor clone',
      body: 'If you provide a live site as design inspiration, keep it in a different niche. Steal layout patterns and hierarchy — never copy a competitor’s design.',
    },
    {
      title: 'Assets before build',
      body: 'Have logo (SVG/PNG) and palette hex codes ready before Anti-Gravity starts. Replacing brand mid-build wastes cycles.',
    },
    {
      title: 'No invented stats',
      body: 'Never invent user counts, ratings, or case-study numbers. Use placeholders like “[metric]” until real proof exists.',
    },
    {
      title: 'Steady SEO pace',
      body: 'Rank from day-one keywords with a steady pace. Do not bulk-publish thin pages. Priority pages first, then expand.',
    },
    {
      title: 'Handoffs = files/links',
      body: 'Every handoff is a Doc, Markdown file, or URL — not vague chat. Anyone should pick up the thread cold.',
    },
    {
      title: 'Changes file, not chat',
      body: 'Grok’s spot-check findings go into a short changes file (bullets + acceptance). Anti-Gravity works from that file.',
    },
    {
      title: 'One source of truth',
      body: 'Doc A + Doc B + Grok brief are the contract. If chat and docs disagree, docs win until Human updates them.',
    },
  ],

  phases: [
    {
      id: 1,
      title: 'Research pack + assets',
      role: 'human',
      roleLabel: 'Human',
      summary:
        'Create Doc A (basics + competitors), Doc B (page specs + SEO + keywords), palette, and logo before any code starts.',
      checkpoint: 'Human delivers research pack',
      items: [
        { id: 'p1-doc-a', label: 'Doc A: product name, domain, idea, pricing, audience, problem' },
        { id: 'p1-competitors', label: 'Doc A: 3 competitors — likes / dislikes for each' },
        { id: 'p1-doc-b-pages', label: 'Doc B: page-by-page specs (home, features, pricing+) with acceptance criteria' },
        { id: 'p1-doc-b-seo', label: 'Doc B: technical + on-page SEO requirements' },
        { id: 'p1-keywords', label: 'Doc B: competitor keyword research from day one (seed list + priority pages)' },
        { id: 'p1-palette', label: 'Color palette delivered (hex codes)' },
        { id: 'p1-logo', label: 'Basic logo delivered (wordmark and/or icon)' },
        { id: 'p1-theme-saas', label: 'Chosen theme/template is explicitly a SaaS theme' },
        { id: 'p1-inspo-niche', label: 'Design inspo (if any) is a different niche — layout patterns only, not a competitor clone' },
        { id: 'p1-handoff-links', label: 'All docs/assets shared as files or links (not vague chat)' },
      ],
    },
    {
      id: 2,
      title: 'Justification brief / Anti-Gravity contract',
      role: 'grok',
      roleLabel: 'Grok',
      summary:
        'Grok reviews Doc A + Doc B, writes verification notes + Anti-Gravity contract brief (SEO + tech requirements). No human checkpoint — ship and continue.',
      checkpoint: 'No human checkpoint — Grok ships brief',
      items: [
        { id: 'p2-review-docs', label: 'Reviewed Doc A and Doc B end-to-end' },
        { id: 'p2-verification-notes', label: 'Verification notes written (gaps, risks, assumptions)' },
        { id: 'p2-justification', label: 'Justification brief: SEO practices Anti-Gravity must follow' },
        { id: 'p2-contract-brief', label: 'Anti-Gravity contract brief delivered as a file/link (not “the contract itself” in chat)' },
      ],
    },
    {
      id: 3,
      title: 'Build + Grok spot-check',
      role: 'antigravity',
      roleLabel: 'Anti-Gravity → Grok',
      summary:
        'Anti-Gravity codes from the developer’s guide + Grok’s brief. Grok spot-checks; issues go into a changes file.',
      checkpoint: 'Changes file drives fixes',
      items: [
        { id: 'p3-build-started', label: 'Anti-Gravity started build from Doc B + Grok brief' },
        { id: 'p3-build-pages', label: 'Core pages implemented (home, features, pricing at minimum)' },
        { id: 'p3-grok-spotcheck', label: 'Grok spot-checked against guide criteria (sections, SEO, acceptance)' },
        { id: 'p3-changes-file', label: 'Issues recorded in a short changes file (not vague chat)' },
        { id: 'p3-fixes-applied', label: 'Anti-Gravity applied changes-file fixes' },
      ],
    },
    {
      id: 4,
      title: 'Human bridge review loop',
      role: 'human',
      roleLabel: 'Human (bridge)',
      summary:
        'Human passes guide/brief to Anti-Gravity, sends preview to Grok, feeds changes file back. Loop until Human approves.',
      checkpoint: 'Human approves final product',
      items: [
        { id: 'p4-preview-shared', label: 'Preview / staging URL shared with Grok' },
        { id: 'p4-grok-review', label: 'Grok review received as changes file' },
        { id: 'p4-changes-to-ag', label: 'Changes file fed back to Anti-Gravity' },
        { id: 'p4-loop-done', label: 'Review loop repeated until criteria met' },
        { id: 'p4-human-approved', label: 'Human approved the final product' },
      ],
    },
    {
      id: 5,
      title: 'Deploy (GitHub → Vercel)',
      role: 'human',
      roleLabel: 'Human',
      summary: 'Connect GitHub to Vercel, deploy production, confirm live domain loads cleanly.',
      checkpoint: 'Live domain confirmed',
      items: [
        { id: 'p5-github-connected', label: 'GitHub repo connected to Vercel (or confirmed)' },
        { id: 'p5-vercel-deploy', label: 'Production deploy succeeded (usually merge to main)' },
        { id: 'p5-domain-live', label: 'Live domain loads cleanly (HTTPS, no broken home)' },
        { id: 'p5-smoke-test', label: 'Smoke-tested key routes + mobile layout' },
      ],
    },
    {
      id: 6,
      title: 'Post-launch SEO',
      role: 'grok',
      roleLabel: 'Grok',
      summary:
        'GSC, analytics, sitemap, indexing for priority URLs, ranking work from day-one keywords — steady pace, no bulk thin pages.',
      checkpoint: 'SEO systems running',
      items: [
        { id: 'p6-gsc', label: 'Google Search Console property set up + verified' },
        { id: 'p6-analytics', label: 'Analytics connected' },
        { id: 'p6-sitemap', label: 'Sitemap submitted' },
        { id: 'p6-index-priority', label: 'Priority URLs requested for indexing as needed' },
        { id: 'p6-ranking-plan', label: 'Ranking plan executing from day-one keyword research' },
        { id: 'p6-steady-pace', label: 'Steady pace confirmed — no bulk thin-page spam' },
      ],
    },
  ],

  prompts: [
    {
      phase: 2,
      title: 'Phase 2 — Grok: justification brief / Anti-Gravity contract',
      template: `JOB: You are Grok (PM + SEO head). Review the research pack and produce verification notes + an Anti-Gravity contract brief.

INPUTS:
- Product: [PRODUCT_NAME]
- Domain: [DOMAIN]
- Doc A link: [DOC_A_URL]
- Doc B link: [DOC_B_URL]
- Palette/logo notes: [BRAND_NOTES]
- Theme/template choice: [THEME]
- Design inspo (different niche only): [INSPO_URL_OR_NONE]

OUTPUT (as a file/link, not chat-only):
1) Verification notes — gaps, risks, assumptions, missing acceptance criteria.
2) Anti-Gravity contract brief — SEO practices + technical requirements the coder must follow (crawl, sitemap, canonicals, titles/H1s, internal links, performance, schema if needed, keyword → page mapping from day-one research).
3) Explicit do/don't list for copy (no invented stats) and design (SaaS theme; inspo = layout patterns only).

DO NOT:
- Wait for a human checkpoint (there is none in Phase 2).
- Invent metrics, testimonials, or competitor claims.
- Treat design inspo as a license to clone a competitor.
- Hand off as vague chat — ship a brief file/link.`,
    },
    {
      phase: 3,
      title: 'Phase 3 — Anti-Gravity build + Grok spot-check',
      template: `JOB: Anti-Gravity builds; Grok spot-checks and writes a changes file.

INPUTS:
- Doc B (developer’s guide): [DOC_B_URL]
- Grok contract brief: [BRIEF_URL]
- Repo / stack notes: [REPO_OR_STACK]
- Brand assets: [LOGO_PALETTE_LINKS]
- Preview URL (when ready): [PREVIEW_URL]

OUTPUT:
- Working implementation of required pages/sections per Doc B + brief.
- Grok: short changes file (bullets) mapped to acceptance criteria — sections missing, SEO gaps, copy/brand issues.

DO NOT:
- Invent stats or social proof.
- Deviating from SaaS theme / brand assets without Human updating Doc B.
- Leave feedback only in chat — use a changes file.
- Bulk-add thin SEO pages.`,
    },
    {
      phase: 4,
      title: 'Phase 4 — Human bridge review loop',
      template: `JOB: Human is the bridge. Run the review loop until Human approves.

INPUTS:
- Doc A / Doc B / Grok brief: [DOC_LINKS]
- Current preview: [PREVIEW_URL]
- Latest changes file: [CHANGES_FILE_URL]
- Open questions for Human: [QUESTIONS]

OUTPUT each loop:
1) Human → Anti-Gravity: pass updated guide/brief + changes file.
2) Human → Grok: send latest preview for review.
3) Grok → changes file update.
4) Stop only when Human explicitly approves the final product.

DO NOT:
- Skip Human approval.
- Lose track of which changes file version is current.
- Approve with known broken mobile, missing pricing, or fake metrics.`,
    },
    {
      phase: 5,
      title: 'Phase 5 — Human deploy (GitHub → Vercel)',
      template: `JOB: Human deploys production.

INPUTS:
- GitHub repo: [GITHUB_REPO]
- Vercel project / team: [VERCEL_PROJECT]
- Production branch: [BRANCH=main]
- Custom domain (if any): [DOMAIN]

OUTPUT:
- Production deploy live.
- Domain loads over HTTPS; home + key routes smoke-tested (desktop + mobile).

DO NOT:
- Ship with placeholder lorem or invented stats still visible.
- Skip checking env vars / build errors in Vercel logs.
- Point this tool’s domain at unrelated products.`,
    },
    {
      phase: 6,
      title: 'Phase 6 — Grok post-launch SEO',
      template: `JOB: You are Grok (post-launch SEO). Stand up measurement and execute ranking from day-one keywords.

INPUTS:
- Live URL: [LIVE_URL]
- Day-one keyword research: [KEYWORDS_DOC_OR_CSV]
- Priority pages: [PRIORITY_URLS]
- Analytics property: [ANALYTICS]
- GSC property: [GSC]

OUTPUT:
- GSC verified; analytics connected; sitemap submitted; priority URLs indexed as needed.
- Ranking plan from day-one keywords (priority pages first) at a steady pace.

DO NOT:
- Bulk-publish thin pages.
- Ignore technical issues (indexability, canonicals, CWV) while chasing keywords.
- Invent rankings or traffic numbers in reports.`,
    },
  ],
};
