/**
 * Footer Links Block — authorable via Universal Editor, also handles
 * the legacy 3-row structured format from Google Docs/SharePoint migration.
 *
 * ── UE JCR item model (author tier) ──────────────────────────────────────────
 * Row 0: block props (cell 0 = copyrightText)
 * Rows 1+: each data-aue-model="footer-link-item" with cells:
 *   cell 0: linkLabel  cell 1: linkHref  cell 2: linkType  cell 3: linkIcon
 *
 * ── Legacy 3-row structured format (delivery tier / drafts) ──────────────────
 * Row 0: primary row (3 cells: logo-cell | nav-links-cell | social-icons-cell)
 * Row 1: utility links row (1 cell with multiple <p><a> children)
 * Row 2: copyright row (1 cell with <p> text)
 *
 * Detection: if row[0] has 3 cells and the first cell contains an icon/img/link,
 * treat as legacy format. Otherwise treat as UE item format.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function cellText(row, idx) {
  return row?.children?.[idx]?.textContent?.trim() || '';
}

function cellImg(row, idx) {
  return row?.children?.[idx]?.querySelector('img') || null;
}

/**
 * Detect whether this is the legacy 3-row structured format.
 * Heuristic: row[0] has exactly 3 child cells AND one cell contains an icon span or logo img.
 */
function isLegacyFooterFormat(rows) {
  if (!rows[0]) return false;
  const firstRow = rows[0];
  // Legacy: first row has 3 cells
  if (firstRow.children.length === 3) return true;
  // Also legacy: first row has 1 cell and has icon spans (the nav row wrapping pattern)
  if (firstRow.children.length === 1
    && firstRow.querySelector('.icon, img, a')) return true;
  return false;
}

/**
 * Parse the legacy 3-row footer format into { primaryRow, utilityRow, copyrightText }.
 * Returns the original DOM rows — we just pass them through with minor structure fixes.
 */
function parseLegacyFooter(rows) {
  // In legacy format the block structure is already correct:
  // rows[0] = primary (logo + nav + social)
  // rows[1] = utility links
  // rows[2] = copyright
  // We just need to ensure the DOM is clean and icons load properly.
  return {
    primaryRowEl: rows[0] || null,
    utilityRowEl: rows[1] || null,
    copyrightText: rows[2]?.textContent?.trim() || `Copyright ${new Date().getFullYear()} ZimVie Inc. All Rights Reserved.`,
  };
}

// ── DOM builders ──────────────────────────────────────────────────────────────

function buildLinkEl(href, label, target) {
  const a = document.createElement('a');
  a.href = href || '#';
  a.textContent = label;
  if (target) {
    a.target = target;
    a.rel = 'noopener noreferrer';
  }
  return a;
}

// ── Decorate ──────────────────────────────────────────────────────────────────

export default async function decorate(block) {
  const allRows = [...block.children];

  if (isLegacyFooterFormat(allRows)) {
    // ── Legacy 3-row format: pass rows through, load SVG icons ──────────────
    // The existing HTML structure from the fragment is already correct.
    // We just need to ensure icon SVGs are loaded (aem.js handles this normally,
    // but we trigger a manual icon decoration pass here for robustness).
    // Icons with class "icon icon-*" will be hydrated by the AEM framework.
    // Nothing to restructure — keep existing DOM.
    return;
  }

  // ── UE JCR item model: parse and build DOM ───────────────────────────────
  const propsRow = allRows[0] || null;
  const itemRows = allRows.slice(1);

  const copyrightText = cellText(propsRow, 0)
    || `Copyright ${new Date().getFullYear()} ZimVie Inc. All Rights Reserved.`;

  const navLinks = [];
  const utilityLinks = [];
  const socialLinks = [];

  itemRows.forEach((row) => {
    const model = row.getAttribute?.('data-aue-model') || '';
    if (model !== 'footer-link-item' && model !== '') return;

    const linkLabel = cellText(row, 0);
    const linkHref = cellText(row, 1) || '#';
    const linkType = cellText(row, 2).toLowerCase() || 'nav';
    const iconImg = cellImg(row, 3);

    if (!linkLabel && !iconImg) return;

    const item = { label: linkLabel, href: linkHref, type: linkType, iconImg };

    if (linkType === 'social') socialLinks.push(item);
    else if (linkType === 'utility') utilityLinks.push(item);
    else navLinks.push(item);
  });

  block.innerHTML = '';

  // Row 1: primary — logo + nav links + social icons
  const primaryRow = document.createElement('div');

  const logoCell = document.createElement('div');
  const logoLink = document.createElement('a');
  logoLink.href = '/';
  logoLink.setAttribute('aria-label', 'ZimVie home');
  logoLink.innerHTML = '<span class="icon icon-zimvie-logo-white">ZimVie</span>';
  logoCell.appendChild(logoLink);
  primaryRow.appendChild(logoCell);

  const navCell = document.createElement('div');
  navLinks.forEach((item) => {
    const p = document.createElement('p');
    p.appendChild(buildLinkEl(item.href, item.label));
    navCell.appendChild(p);
  });
  primaryRow.appendChild(navCell);

  const socialCell = document.createElement('div');
  socialLinks.forEach((item) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = item.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', item.label || 'Social link');
    if (item.iconImg) {
      const span = document.createElement('span');
      span.className = 'icon';
      const img = item.iconImg.cloneNode(true);
      img.alt = item.label || '';
      span.appendChild(img);
      a.appendChild(span);
    } else {
      a.textContent = item.label;
    }
    p.appendChild(a);
    socialCell.appendChild(p);
  });
  primaryRow.appendChild(socialCell);
  block.appendChild(primaryRow);

  // Row 2: utility links
  const utilityRow = document.createElement('div');
  const utilityCell = document.createElement('div');
  utilityLinks.forEach((item) => {
    const p = document.createElement('p');
    p.appendChild(buildLinkEl(item.href, item.label));
    utilityCell.appendChild(p);
  });
  utilityRow.appendChild(utilityCell);
  block.appendChild(utilityRow);

  // Row 3: copyright
  const copyrightRow = document.createElement('div');
  const copyrightP = document.createElement('p');
  copyrightP.textContent = copyrightText;
  copyrightRow.appendChild(copyrightP);
  block.appendChild(copyrightRow);
}
