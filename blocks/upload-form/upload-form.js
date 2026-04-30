/**
 * Upload Form Block — fully authorable via Universal Editor.
 *
 * AEM renders the block's JCR structure as an HTML table-like set of div rows:
 *   - The first child div (no data-aue-model) holds the block-level property cells
 *     in the order they appear in component-models.json.
 *   - Subsequent child divs carry data-aue-model="region-option|product-tile|form-field"
 *     and their cells hold the item property values in model order.
 *
 * On the delivery/preview tier the data-aue-* attributes are absent; the JS reads the
 * same positional cell values and falls back to built-in defaults for anything missing.
 */

// ── Cell helpers ─────────────────────────────────────────────────────────────

/** Returns trimmed text content of the nth child cell of a row div. */
function cellText(row, idx) {
  const cell = row?.children?.[idx];
  return cell ? cell.textContent.trim() : '';
}

/** Returns the first <img> element found in the nth child cell of a row div. */
function cellImg(row, idx) {
  const cell = row?.children?.[idx];
  return cell ? cell.querySelector('img') : null;
}

/** Returns the raw innerHTML of the nth child cell of a row div (for richtext). */
function cellHtml(row, idx) {
  const cell = row?.children?.[idx];
  return cell ? cell.innerHTML.trim() : '';
}

// ── Widget builders ───────────────────────────────────────────────────────────

/**
 * Build a custom animated select dropdown.
 * @param {Array<{label:string, value:string, isDefault:boolean}>} options
 * @param {string} name  — native select name attribute
 */
function buildCustomSelect(options, name) {
  const defaultOpt = options.find((o) => o.isDefault) || options[0];

  const wrapper = document.createElement('div');
  wrapper.className = 'uf-select-wrapper';

  const native = document.createElement('select');
  native.className = 'uf-select';
  native.name = name;
  options.forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt.value || opt.label;
    o.textContent = opt.label;
    if (opt.isDefault || opt === defaultOpt) o.selected = true;
    native.appendChild(o);
  });

  const display = document.createElement('span');
  display.className = 'uf-select-display';
  display.textContent = defaultOpt ? defaultOpt.label : '';

  const arrowWrap = document.createElement('span');
  arrowWrap.className = 'uf-select-arrow-wrap';
  const arrow = document.createElement('span');
  arrow.className = 'uf-select-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrowWrap.appendChild(arrow);

  const dropdown = document.createElement('div');
  dropdown.className = 'uf-select-dropdown';
  dropdown.setAttribute('role', 'listbox');

  const searchWrap = document.createElement('div');
  searchWrap.className = 'uf-select-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Search';
  searchInput.autocomplete = 'off';
  searchWrap.appendChild(searchInput);
  dropdown.appendChild(searchWrap);

  const list = document.createElement('div');
  list.className = 'uf-select-list';

  const buildOptions = (filter = '') => {
    list.innerHTML = '';
    options
      .filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()))
      .forEach((opt) => {
        const item = document.createElement('div');
        item.className = 'uf-select-option';
        if (opt === defaultOpt || opt.isDefault) item.classList.add('selected');
        item.textContent = opt.label;
        item.setAttribute('role', 'option');
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          display.textContent = opt.label;
          native.value = opt.value || opt.label;
          list.querySelectorAll('.uf-select-option').forEach((el) => el.classList.remove('selected'));
          item.classList.add('selected');
          close(); // eslint-disable-line no-use-before-define
        });
        list.appendChild(item);
      });
  };

  buildOptions();
  dropdown.appendChild(list);

  const open = () => {
    wrapper.classList.add('open');
    searchInput.value = '';
    buildOptions();
    searchInput.focus();
  };
  const close = () => wrapper.classList.remove('open');

  display.addEventListener('click', () => (wrapper.classList.contains('open') ? close() : open()));
  arrowWrap.addEventListener('click', () => (wrapper.classList.contains('open') ? close() : open()));
  searchInput.addEventListener('input', () => buildOptions(searchInput.value));
  document.addEventListener('click', (e) => { if (!wrapper.contains(e.target)) close(); });

  wrapper.appendChild(native);
  wrapper.appendChild(display);
  wrapper.appendChild(arrowWrap);
  wrapper.appendChild(dropdown);
  return wrapper;
}

/**
 * Build a product selection tile with a custom radio button.
 * @param {HTMLImageElement|null} imgEl  — cloned <img> from AEM-rendered cell (or null)
 * @param {string} altText
 * @param {string} labelText
 * @param {string} value       — radio value for form submission
 * @param {string} radioName   — shared radio group name
 */
function buildProductTile(imgEl, altText, labelText, value, radioName) {
  const tile = document.createElement('div');
  tile.className = 'uf-product-tile';

  const radioField = document.createElement('div');
  radioField.className = 'uf-radio-field';

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = radioName;
  radio.value = value || labelText;
  radio.required = true;

  const radioRow = document.createElement('label');
  radioRow.className = 'uf-radio-row';

  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('aria-hidden', 'true');
  iconSvg.classList.add('uf-radio-icon');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '11');
  iconSvg.appendChild(circle);

  const labelEl = document.createElement('span');
  labelEl.className = 'uf-product-label';
  labelEl.textContent = labelText;

  radioRow.appendChild(iconSvg);
  radioRow.appendChild(labelEl);
  radioField.appendChild(radio);
  radioField.appendChild(radioRow);
  tile.appendChild(radioField);

  if (imgEl) {
    const img = imgEl.cloneNode(true);
    img.alt = altText || labelText;
    img.loading = 'lazy';
    tile.appendChild(img);
  }

  return tile;
}

/**
 * Build a labelled input / textarea field.
 * @param {string} labelText
 * @param {string} type        — text | email | tel | textarea
 * @param {string} name        — input name attribute
 * @param {boolean} required
 */
function buildField(labelText, type, name, required) {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'uf-field';

  const lbl = document.createElement('label');
  lbl.textContent = labelText;

  let input;
  if (type === 'textarea') {
    input = document.createElement('textarea');
  } else {
    input = document.createElement('input');
    input.type = type || 'text';
  }
  input.name = name || labelText.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (required) input.required = true;

  fieldDiv.appendChild(lbl);
  fieldDiv.appendChild(input);
  return fieldDiv;
}

// ── Default fallback data ─────────────────────────────────────────────────────
// Used when no item rows are present (block just dropped, not yet configured).

const DEFAULT_REGION_OPTIONS = [
  { label: 'UK/Ireland', value: 'uk-ie', isDefault: true },
  { label: 'Austria', value: 'at', isDefault: false },
  { label: 'Belgium', value: 'be', isDefault: false },
  { label: 'Croatia', value: 'hr', isDefault: false },
  { label: 'Czech Republic', value: 'cz', isDefault: fa