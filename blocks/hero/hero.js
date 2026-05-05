/**
 * Hero Block — ZimVie CuztomGraft.
 * Renders a full-width banner image with optional overlay text.
 *
 * UE model fields (row order):
 *  Row 0 → image (reference → <picture>/<img>)
 *  Row 1 → imageAlt (text)
 *  Row 2 → text (richtext)
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Extract picture/img from first row
  const pictureEl = rows[0]?.querySelector('picture');
  const imgEl = rows[0]?.querySelector('img');
  const altText = rows[1]?.textContent?.trim() || '';
  const textEl = rows[2];

  // Set alt text if authored separately
  if (imgEl && altText) imgEl.alt = altText;

  // Restructure: move picture to block root as background, text content inside
  block.innerHTML = '';

  if (pictureEl) {
    block.appendChild(pictureEl);
  } else if (imgEl) {
    // Wrap bare img in picture for consistency
    const pic = document.createElement('picture');
    pic.appendChild(imgEl);
    block.appendChild(pic);
  }

  if (textEl) {
    const content = document.createElement('div');
    content.className = 'hero-content';
    content.innerHTML = textEl.innerHTML;
    block.appendChild(content);
  }
}
