/**
 * Footer Links Block — fully authorable via Universal Editor.
 *
 * AEM renders the block's JCR structure as div rows:
 *   - The first child div (no data-aue-model) holds the block-level props:
 *       cell 0: copyrightText
 *   - Subsequent child divs each have data-aue-model="footer-link-item" and cells:
 *       cell 0: linkLabel
 *       cell 1: linkHref
 *       cell 2: linkType  (nav | utility | social)
 *       cell 3: linkIcon  (<picture><img>) for social icons
 *
 * On the delivery/preview tier data-aue-* attributes are absent; we fall back
 * to reading the same positional cells and inferring type from cell content.
 */

// ── Cell helpers ──────────────────────────────────────────────────────────────

function cellText(row, idx) {
  const cell = row?.children?.[idx];
  return cell ? cell.textContent.trim() : '';
}

function cellImg(row, idx) {
  const cell = row?.children?.[idx];
  return cell ? cell.querySelector('img') : null;
}

// ── Decorate ──────────────────────────────────────────────────────────────────

export default async function decorate(block) {
  const allRows = [...block.children];
  const propsRow = allRows[0] || null;
  const itemRows = allRows.slice(1);

  // Block-level props
  const copyrightText = cellText(propsRow, 0) || `© ${new Date().getFullYear()} ZimVie Inc. All rights reserved.`;

  // Parse link items
  const navLinks = [];
  const utilityLinks = [];
  const socialLinks = [];

  itemRows.forEach((row) => {
    const model = row.getAttribute('data-aue-model') || '';

    // Accept rows with explicit model="footer-link-item" or fall back to
    // positional inference (2–4 cells).
    if (model === 'footer-link-item' || model === '') {
      const linkLabel = cellText(row, 0);
      const linkHref = cellText(row, 1) || '#';
      const linkType = cellText(row, 2).toLowerCase() || 'nav';
      const iconImg = cellImg(row, 3);

      if (!linkLabel && !iconImg) return; // skip truly empty rows

      const item = { label: linkLabel, href: linkHref, type: linkType, iconImg };

      if (linkType === 'social') {
        socialLinks.push(item);
      } else if (linkType === 'utility') {
        utilityLinks.push(item);
      } else {
        navLinks.push(item);
      }
    }
  });

  // ── Build DOM ─────────────────────────────────────────────────────────────
  block.innerHTML = '';

  // Row 1: primary — logo slot + nav links + social icons
  const primaryRow = document.createElement('div');

  // Logo slot (first nav link that has no label but has an icon, or just a placeholder)
  const logoCell = document.createElement('div');
  const logoLink = document.createElement('a');
  logoLink.href = '/';
  logoLink.setAttribute('aria-label', 'ZimVie home');
  // Attempt to find a nav item whose label suggests it's the logo
  const logoItem = navLinks.find((l) => l.label.toLowerCase().includes('logo') || (!l.label && l.iconImg));
  if (logoItem) {
    if (logoItem.iconImg) {
      const img = logoItem.iconImg.cloneNode(true);
      logoLink.appendChild(img);
    } else {
      logoLink.textContent = logoItem.label;
    }
    navLinks.splice(navLinks.indexOf(logoItem), 1);
  } else {
    // No explicit logo item — leave logo cell empty (CSS handles via icon class)
    logoLink.innerHTML = '<span class="icon icon-zimvie-logo">ZimVie</span>';
  }
  logoCell.appendChild(logoLink);
  primaryRow.appendChild(logoCell);

  // Nav links cell
  const navCell = document.createElement('div');
  navLinks.forEach((item) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    p.appendChild(a);
    navCell.appendChild(p);
  });
  primaryRow.appendChild(navCell);

  // Social icons cell
  const socialCell = document.createElement('div');
  socialLinks.forEach((item) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = item.href;
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.setAttribute('aria-label', item.label || 'Social link');
    if (item.iconImg) {
      const img = item.iconImg.cloneNode(true);
      img.alt = item.label || '';
      const span = document.createElement('span');
      span.className = 'icon';
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
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    p.appendChild(a);
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
