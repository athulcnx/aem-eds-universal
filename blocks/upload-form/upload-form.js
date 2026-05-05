/**
 * Upload Form Block — Universal Editor (UE) authorable via AEM.
 *
 * AEM franklin delivery renders each JCR property on the block node as a
 * positional <div><div>VALUE</div></div> row inside the block element.
 * Child block items (region-option, product-tile, form-field) each render
 * as one additional row appended after the block-level property rows, with
 * each item property as a separate cell inside that row.
 *
 * Block-level property row order (matches component-models.json):
 *  Row 0  → bannerImage    (reference → <img> element in cell)
 *  Row 1  → bannerAlt      (string)
 *  Row 2  → regionHeading  (string)
 *  Row 3  → productHeading (string)
 *  Row 4  → productFootnote(string)
 *  Row 5  → infoHeading    (string)
 *  Row 6  → uploadHeading  (string)
 *  Row 7  → uploadNote     (string — "* Please note …")
 *  Row 8  → uploadFormats  (string — "Accepted file formats: …")
 *  Row 9  → submitLabel    (string)
 *  Row 10 → consentTermsLabel   (richtext → innerHTML)
 *  Row 11 → consentPrivacyLabel (richtext → innerHTML)
 *  Row 12 → disclaimerText      (richtext → innerHTML)
 *
 * Child item rows (appended after row 12):
 *  region-option  → 3 cells: label | value | isDefault("true"/"false")
 *  product-tile   → 4 cells: productImage(<img>) | productImageAlt | productLabel | productValue
 *  form-field     → 5 cells: fieldLabel | fieldType | fieldName | fieldRequired | fieldRow
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Number of block-level property rows before child item rows start. */
const BLOCK_PROP_ROWS = 13;

// ─── Row/cell helpers ─────────────────────────────────────────────────────────

/** Trimmed text of cell[idx] within a row div. */
function cellText(row, idx = 0) {
  const cell = row?.children?.[idx];
  return cell ? cell.textContent.trim() : '';
}

/** innerHTML of cell[idx] (for richtext fields). */
function cellHtml(row, idx = 0) {
  const cell = row?.children?.[idx];
  return cell ? cell.innerHTML.trim() : '';
}

/** First <img> inside cell[idx]. */
function cellImg(row, idx = 0) {
  const cell = row?.children?.[idx];
  return cell ? cell.querySelector('img') : null;
}

// ─── Widget builders ──────────────────────────────────────────────────────────

/**
 * Custom animated select with search dropdown.
 * @param {Array<{label:string,value:string,isDefault:boolean}>} options
 * @param {string} name
 */
function buildCustomSelect(options, name) {
  const defaultOpt = options.find((o) => o.isDefault) || options[0] || { label: '', value: '' };

  const wrapper = document.createElement('div');
  wrapper.className = 'uf-select-wrapper';

  const native = document.createElement('select');
  native.className = 'uf-select';
  native.name = name;
  options.forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt.value || opt.label;
    o.textContent = opt.label;
    if (opt === defaultOpt || opt.isDefault) o.selected = true;
    native.appendChild(o);
  });

  const display = document.createElement('span');
  display.className = 'uf-select-display';
  display.textContent = defaultOpt.label;

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
          closeDropdown(); // eslint-disable-line no-use-before-define
        });
        list.appendChild(item);
      });
  };
  buildOptions();
  dropdown.appendChild(list);

  const openDropdown = () => {
    wrapper.classList.add('open');
    searchInput.value = '';
    buildOptions();
    searchInput.focus();
  };
  const closeDropdown = () => wrapper.classList.remove('open');

  display.addEventListener('click', () => (wrapper.classList.contains('open') ? closeDropdown() : openDropdown()));
  arrowWrap.addEventListener('click', () => (wrapper.classList.contains('open') ? closeDropdown() : openDropdown()));
  searchInput.addEventListener('input', () => buildOptions(searchInput.value));
  document.addEventListener('click', (e) => { if (!wrapper.contains(e.target)) closeDropdown(); });

  wrapper.appendChild(native);
  wrapper.appendChild(display);
  wrapper.appendChild(arrowWrap);
  wrapper.appendChild(dropdown);
  return wrapper;
}

/**
 * Product radio-tile.
 * @param {HTMLImageElement|null} imgEl
 * @param {string} altText
 * @param {string} labelText
 * @param {string} value
 * @param {string} radioName
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
  const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  outerCircle.setAttribute('cx', '12');
  outerCircle.setAttribute('cy', '12');
  outerCircle.setAttribute('r', '11');
  iconSvg.appendChild(outerCircle);

  const labelEl = document.createElement('span');
  labelEl.className = 'uf-product-label';
  labelEl.textContent = labelText;

  radioRow.appendChild(iconSvg);
  radioRow.appendChild(labelEl);
  radioField.appendChild(radio);
  radioField.appendChild(radioRow);

  tile.addEventListener('click', () => {
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  });
  radio.addEventListener('change', () => {
    if (radio.checked) {
      tile.closest('.uf-products-grid')?.querySelectorAll('.uf-product-tile').forEach((t) => t.classList.remove('selected'));
      tile.classList.add('selected');
    }
  });

  tile.appendChild(radioField);

  if (imgEl) {
    const img = imgEl.cloneNode(true);
    img.alt = altText || labelText;
    img.loading = 'lazy';
    tile.appendChild(img);
  }

  return tile;
}

/** Labelled input / textarea field. */
function buildField(labelText, type, name, required) {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'uf-field';

  const lbl = document.createElement('label');
  lbl.textContent = labelText;
  if (required) lbl.setAttribute('data-required', '');

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

/** Checkbox row. */
function buildCheckbox(name, labelHtml, required) {
  const wrap = document.createElement('div');
  wrap.className = 'uf-checkbox-row';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = name;
  input.id = `uf-checkbox-${name}`;
  if (required) input.required = true;

  const lbl = document.createElement('label');
  lbl.htmlFor = `uf-checkbox-${name}`;
  lbl.innerHTML = labelHtml;

  wrap.appendChild(input);
  wrap.appendChild(lbl);
  return wrap;
}

// ─── Default fallback data ────────────────────────────────────────────────────

const DEFAULT_REGION_OPTIONS = [
  { label: 'UK/Ireland (EN)', value: 'uk-ie-en', isDefault: true },
  { label: 'Austria (DE)', value: 'at-de' },
  { label: 'Belgium (FR)', value: 'be-fr' },
  { label: 'Belgium (NL)', value: 'be-nl' },
  { label: 'France (FR)', value: 'fr-fr' },
  { label: 'Germany (DE)', value: 'de-de' },
  { label: 'Italy (IT)', value: 'it-it' },
  { label: 'Netherlands (EN)', value: 'nl-en' },
  { label: 'Netherlands (NL)', value: 'nl-nl' },
  { label: 'Other Markets (EN)', value: 'other-en' },
  { label: 'Portugal (PT)', value: 'pt-pt' },
  { label: 'Spain (ES)', value: 'es-es' },
  { label: 'Switzerland (DE)', value: 'ch-de' },
  { label: 'Switzerland (FR)', value: 'ch-fr' },
  { label: 'Switzerland (IT)', value: 'ch-it' },
  { label: 'Israel (IL)', value: 'il' },
];

const DEFAULT_PRODUCTS = [
  { label: 'Puros® Allograft Customized Block', value: 'puros_allograft_customzied_block', imgSrc: '' },
  { label: 'PEEK AccuraPlate™', value: 'peek_accuraplate', imgSrc: '' },
  { label: 'Titanium AccuraMesh™', value: 'titanium_accuramesh', imgSrc: '' },
  { label: 'PEEK AccuraMesh™', value: 'peek_accuramesh', imgSrc: '' },
];

const DEFAULT_FIELDS = [
  { label: 'Account Number *', type: 'text', name: 'account_number', required: true, row: 1 },
  { label: 'Patient ID (e.g. Numerical Code, Initials etc.) *', type: 'text', name: 'patient_id', required: true, row: 1 },
  { label: 'Customer Name *', type: 'text', name: 'contact', required: true, row: 2 },
  { label: 'Defect Site *', type: 'text', name: 'region', required: true, row: 2 },
  { label: 'E-Mail *', type: 'email', name: 'email', required: true, row: 3 },
  { label: 'Number of planned Implants; Ø and length (mm) *', type: 'text', name: 'implant_size', required: true, row: 3 },
  { label: 'Address *', type: 'text', name: 'street', required: true, row: 4 },
  { label: 'Comments', type: 'textarea', name: 'comments', required: false, row: 4 },
  { label: 'Phone Number *', type: 'tel', name: 'phone', required: true, row: 5 },
];

// ─── Section builders ─────────────────────────────────────────────────────────

function buildBannerSection(imgEl, alt) {
  const section = document.createElement('div');
  section.className = 'uf-banner';
  if (imgEl) {
    section.style.backgroundImage = `url('${imgEl.src}')`;
    section.setAttribute('aria-label', alt || '');
  }
  return section;
}

function buildRegionSection(heading, regionOptions) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-region-section';

  const h3 = document.createElement('h3');
  h3.textContent = heading || '1. Select Region / Language';
  section.appendChild(h3);

  section.appendChild(buildCustomSelect(regionOptions, 'lang_switch'));
  return section;
}

function buildProductsSection(heading, products, footnote) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-products-section';

  const h3 = document.createElement('h3');
  h3.textContent = heading || '2. Choose Product*';
  section.appendChild(h3);

  const grid = document.createElement('div');
  grid.className = 'uf-products-grid';
  products.forEach((p) => grid.appendChild(buildProductTile(p.imgEl || null, p.imgAlt || '', p.label, p.value, 'product')));
  section.appendChild(grid);

  if (footnote) {
    const fn = document.createElement('p');
    fn.className = 'uf-product-footnote';
    fn.textContent = footnote;
    section.appendChild(fn);
  }

  return section;
}

function buildInfoSection(heading, fields) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-info-section';

  const h3 = document.createElement('h3');
  h3.textContent = heading || '3. Please Fill in the Following Information';
  section.appendChild(h3);

  // Group fields by row number
  const grouped = {};
  fields.forEach((f) => {
    const r = f.row || 1;
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(f);
  });

  Object.values(grouped).forEach((rowFields) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = `uf-field-row uf-field-row-${rowFields.length > 1 ? '2col' : '1col'}`;
    rowFields.forEach((f) => rowDiv.appendChild(buildField(f.label, f.type, f.name, f.required)));
    section.appendChild(rowDiv);
  });

  const note = document.createElement('p');
  note.className = 'uf-required-note';
  note.textContent = '* Required fields';
  section.appendChild(note);

  return section;
}

function buildUploadSection(heading, note, formats) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-upload-section';

  const h3 = document.createElement('h3');
  h3.textContent = heading || '4. Upload DICOM Data';
  section.appendChild(h3);

  const desc = document.createElement('div');
  desc.className = 'uf-upload-desc';

  const notePara = document.createElement('p');
  notePara.textContent = note || '* Please note the following information for the data transfer:';
  desc.appendChild(notePara);

  if (formats) {
    const fmtPara = document.createElement('p');
    fmtPara.innerHTML = `<strong>${formats}</strong>`;
    desc.appendChild(fmtPara);
  }

  section.appendChild(desc);

  const accept = '.dcm,.zip,.rar';
  const fileWrap = document.createElement('div');
  fileWrap.className = 'uf-file-drop-zone';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.name = 'files[]';
  fileInput.id = 'uf-file-input';
  fileInput.accept = accept;
  fileInput.multiple = true;
  fileInput.className = 'uf-file-input';

  const dropLabel = document.createElement('label');
  dropLabel.htmlFor = 'uf-file-input';
  dropLabel.className = 'uf-file-drop-label';

  dropLabel.innerHTML = `
    <span class="uf-file-drop-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="16 16 12 12 8 16"></polyline>
        <line x1="12" y1="12" x2="12" y2="21"></line>
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
      </svg>
    </span>
    <span class="uf-file-drop-text">Drop files here or click to browse</span>
    <span class="uf-file-drop-sub">Accepted formats: ${accept}</span>
  `;

  const fileList = document.createElement('div');
  fileList.className = 'uf-file-list';

  fileInput.addEventListener('change', () => {
    fileList.innerHTML = '';
    [...fileInput.files].forEach((file) => {
      const item = document.createElement('div');
      item.className = 'uf-file-item';
      item.innerHTML = `<span class="uf-file-name">${file.name}</span><span class="uf-file-size">${(file.size / 1024).toFixed(1)} KB</span>`;
      fileList.appendChild(item);
    });
  });

  fileWrap.addEventListener('dragover', (e) => { e.preventDefault(); fileWrap.classList.add('drag-over'); });
  fileWrap.addEventListener('dragleave', () => fileWrap.classList.remove('drag-over'));
  fileWrap.addEventListener('drop', (e) => {
    e.preventDefault();
    fileWrap.classList.remove('drag-over');
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  });

  fileWrap.appendChild(fileInput);
  fileWrap.appendChild(dropLabel);
  fileWrap.appendChild(fileList);
  section.appendChild(fileWrap);
  return section;
}

function buildConsentSection(termsHtml, privacyHtml, submitLabel) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-consent-section';

  const checkboxArea = document.createElement('div');
  checkboxArea.className = 'uf-checkboxes';

  const defaultTerms = '*I agree to the <a href="https://www.zimvie.eu/en/privacy-notice.html">Terms &amp; Conditions</a>';
  const defaultPrivacy = '*I Accept the <a href="https://www.zimvie.eu/en/privacy-notice.html">Privacy Policy</a>';

  checkboxArea.appendChild(buildCheckbox('statement', termsHtml || defaultTerms, true));
  checkboxArea.appendChild(buildCheckbox('policy', privacyHtml || defaultPrivacy, true));
  section.appendChild(checkboxArea);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'uf-submit';
  submitBtn.textContent = submitLabel || 'SUBMIT FORM';
  section.appendChild(submitBtn);

  return section;
}

function buildDisclaimerSection(html) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-disclaimer';
  if (html) {
    section.innerHTML = html;
  }
  return section;
}

// ─── Child item parsers ───────────────────────────────────────────────────────

/**
 * Parse a region-option child item row.
 * Cells: [0] label  [1] value  [2] isDefault("true")
 */
function parseRegionOptionRow(row) {
  return {
    label: cellText(row, 0),
    value: cellText(row, 1) || cellText(row, 0).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    isDefault: cellText(row, 2).toLowerCase() === 'true',
  };
}

/**
 * Parse a product-tile child item row.
 * Cells: [0] productImage(<img>)  [1] productImageAlt  [2] productLabel  [3] productValue
 */
function parseProductTileRow(row) {
  return {
    imgEl: cellImg(row, 0),
    imgAlt: cellText(row, 1),
    label: cellText(row, 2),
    value: cellText(row, 3) || cellText(row, 2).toLowerCase().replace(/[^a-z0-9]+/g, '_'),
  };
}

/**
 * Parse a form-field child item row.
 * Cells: [0] fieldLabel  [1] fieldType  [2] fieldName  [3] fieldRequired  [4] fieldRow
 */
function parseFormFieldRow(row) {
  return {
    label: cellText(row, 0),
    type: cellText(row, 1) || 'text',
    name: cellText(row, 2) || cellText(row, 0).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
    required: cellText(row, 3).toLowerCase() === 'true',
    row: parseInt(cellText(row, 4), 10) || 1,
  };
}

/**
 * Identify what kind of child item a row is by its cell count.
 * region-option: 3 cells
 * product-tile:  4 cells
 * form-field:    5 cells
 *
 * Also checks the data-aue-model attribute if present (author-tier only).
 */
function classifyChildRow(row) {
  const model = row.getAttribute?.('data-aue-model') || '';
  if (model === 'region-option') return 'region-option';
  if (model === 'product-tile') return 'product-tile';
  if (model === 'form-field') return 'form-field';

  const count = row.children.length;
  if (count === 3) return 'region-option';
  if (count === 4) return 'product-tile';
  if (count === 5) return 'form-field';
  return null;
}

// ─── Main decorate ────────────────────────────────────────────────────────────

export default async function decorate(block) {
  const rows = [...block.children];

  // ── 1. Read block-level properties (positional) ───────────────────────────
  const bannerImg = cellImg(rows[0], 0);
  const bannerAlt = cellText(rows[1], 0);
  const regionHeading = cellText(rows[2], 0);
  const productHeading = cellText(rows[3], 0);
  const productFootnote = cellText(rows[4], 0);
  const infoHeading = cellText(rows[5], 0);
  const uploadHeading = cellText(rows[6], 0);
  const uploadNote = cellText(rows[7], 0);
  const uploadFormats = cellText(rows[8], 0);
  const submitLabel = cellText(rows[9], 0);
  const consentTermsHtml = cellHtml(rows[10], 0);
  const consentPrivacyHtml = cellHtml(rows[11], 0);
  const disclaimerHtml = cellHtml(rows[12], 0);

  // ── 2. Read child item rows (rows 13+) ────────────────────────────────────
  const regionOptions = [];
  const products = [];
  const formFields = [];

  rows.slice(BLOCK_PROP_ROWS).forEach((row) => {
    const type = classifyChildRow(row);
    if (type === 'region-option') {
      const opt = parseRegionOptionRow(row);
      if (opt.label) regionOptions.push(opt);
    } else if (type === 'product-tile') {
      const tile = parseProductTileRow(row);
      if (tile.label) products.push(tile);
    } else if (type === 'form-field') {
      const field = parseFormFieldRow(row);
      if (field.label) formFields.push(field);
    }
  });

  // ── 3. Apply defaults when child items not yet authored ───────────────────
  const finalRegionOptions = regionOptions.length > 0 ? regionOptions : DEFAULT_REGION_OPTIONS;
  const finalProducts = products.length > 0 ? products : DEFAULT_PRODUCTS;
  const finalFields = formFields.length > 0 ? formFields : DEFAULT_FIELDS;

  // ── 4. Render ─────────────────────────────────────────────────────────────
  block.innerHTML = '';

  // Banner
  if (bannerImg) {
    block.appendChild(buildBannerSection(bannerImg, bannerAlt));
  }

  const formBody = document.createElement('div');
  formBody.className = 'uf-form-body';

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://cuztomgraft.zimvie.com/content/zimvie-cuztomgraft/en-GB/_jcr_content/root/container/cuztomgraft_app.post.bin';
  form.enctype = 'multipart/form-data';

  form.appendChild(buildRegionSection(regionHeading, finalRegionOptions));
  form.appendChild(buildProductsSection(productHeading, finalProducts, productFootnote));
  form.appendChild(buildInfoSection(infoHeading, finalFields));
  form.appendChild(buildUploadSection(uploadHeading, uploadNote, uploadFormats));
  form.appendChild(buildConsentSection(
    consentTermsHtml || null,
    consentPrivacyHtml || null,
    submitLabel,
  ));

  formBody.appendChild(form);
  block.appendChild(formBody);

  if (disclaimerHtml) {
    block.appendChild(buildDisclaimerSection(disclaimerHtml));
  }
}
