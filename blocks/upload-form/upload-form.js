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
 *  Row 0  → bannerImage    (reference → <picture>/<img> element in cell)
 *  Row 1  → bannerAlt      (string)
 *  Row 2  → regionHeading  (string)
 *  Row 3  → productHeading (string)
 *  Row 4  → productFootnote(string)
 *  Row 5  → infoHeading    (string)
 *  Row 6  → uploadHeading  (string)
 *  Row 7  → uploadNote     (string — "* Please note …")
 *  Row 8  → uploadFormats  (string — "Accepted file formats: …")
 *  Row 9  → submitLabel    (string — "Submit Form")
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

/** First <img> inside cell[idx] (handles <picture> wrappers too). */
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
 * Product radio-tile matching original ZimVie layout:
 * radio label on top, product image below, click anywhere selects.
 * @param {HTMLImageElement|null} imgEl
 * @param {string} altText
 * @param {string} labelText
 * @param {string} value
 * @param {string} radioName
 */
function buildProductTile(imgEl, altText, labelText, value, radioName) {
  const tile = document.createElement('div');
  tile.className = 'uf-product-tile';

  // Radio input (hidden, controlled via tile click)
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = radioName;
  radio.value = value || labelText;
  radio.required = true;
  radio.className = 'uf-radio-native';

  // Radio label row with custom SVG dot
  const labelEl = document.createElement('label');
  labelEl.className = 'uf-radio-label';

  // SVG: outer ring + inner filled dot (dot hidden until selected)
  const svgNS = 'http://www.w3.org/2000/svg';
  const iconSvg = document.createElementNS(svgNS, 'svg');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('aria-hidden', 'true');
  iconSvg.classList.add('uf-radio-icon');

  const outerCircle = document.createElementNS(svgNS, 'circle');
  outerCircle.setAttribute('cx', '12');
  outerCircle.setAttribute('cy', '12');
  outerCircle.setAttribute('r', '10');
  outerCircle.classList.add('uf-radio-outer');

  const innerCircle = document.createElementNS(svgNS, 'circle');
  innerCircle.setAttribute('cx', '12');
  innerCircle.setAttribute('cy', '12');
  innerCircle.setAttribute('r', '5');
  innerCircle.classList.add('uf-radio-inner');

  iconSvg.appendChild(outerCircle);
  iconSvg.appendChild(innerCircle);

  const labelText2 = document.createElement('span');
  labelText2.className = 'uf-radio-text';
  labelText2.textContent = labelText;

  labelEl.appendChild(radio);
  labelEl.appendChild(iconSvg);
  labelEl.appendChild(labelText2);
  tile.appendChild(labelEl);

  // Product image (below radio row)
  if (imgEl) {
    const img = imgEl.cloneNode(true);
    img.alt = altText || labelText;
    img.loading = 'lazy';
    img.className = 'uf-product-img';
    tile.appendChild(img);
  }

  // Click anywhere on tile selects the radio
  tile.addEventListener('click', (e) => {
    if (e.target !== radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  radio.addEventListener('change', () => {
    if (radio.checked) {
      tile.closest('.uf-products-grid')?.querySelectorAll('.uf-product-tile').forEach((t) => t.classList.remove('selected'));
      tile.classList.add('selected');
    }
  });

  return tile;
}

/** Labelled input / textarea field. */
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

/** Checkbox row with custom SVG mark. */
function buildCheckbox(name, labelHtml, required) {
  const wrap = document.createElement('div');
  wrap.className = 'uf-checkbox-row';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = name;
  input.id = `uf-checkbox-${name}`;
  if (required) input.required = true;

  // Custom SVG checkbox mark
  const svgNS = 'http://www.w3.org/2000/svg';
  const checkIcon = document.createElementNS(svgNS, 'svg');
  checkIcon.setAttribute('viewBox', '0 0 20 20');
  checkIcon.setAttribute('aria-hidden', 'true');
  checkIcon.classList.add('uf-checkbox-icon');
  const rect = document.createElementNS(svgNS, 'rect');
  rect.setAttribute('x', '1');
  rect.setAttribute('y', '1');
  rect.setAttribute('width', '18');
  rect.setAttribute('height', '18');
  rect.setAttribute('rx', '3');
  rect.classList.add('uf-checkbox-rect');
  const check = document.createElementNS(svgNS, 'polyline');
  check.setAttribute('points', '4,10 8,14 16,6');
  check.classList.add('uf-checkbox-check');
  checkIcon.appendChild(rect);
  checkIcon.appendChild(check);

  const lbl = document.createElement('label');
  lbl.htmlFor = `uf-checkbox-${name}`;
  lbl.innerHTML = labelHtml;

  // Toggle checked state on click (icon + hidden input)
  const toggle = () => {
    input.checked = !input.checked;
    wrap.classList.toggle('checked', input.checked);
  };
  checkIcon.addEventListener('click', toggle);
  lbl.addEventListener('click', (e) => { e.preventDefault(); toggle(); });

  wrap.appendChild(input);
  wrap.appendChild(checkIcon);
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
  {
    label: 'Puros\u00ae Allograft Customized Block',
    value: 'puros_allograft_customzied_block',
    imgSrc: 'https://cuztomgraft.zimvie.com/content/zimvie-cuztomgraft/en-GB/_jcr_content/root/container/cuztomgraft_app/_content/region/file-upload-form/field-opt_article/tier-1/product-tile/image.coreimg.jpeg/1660744695684/puros-allograft-customized-block.jpeg',
  },
  {
    label: 'PEEK AccuraPlate\u2122',
    value: 'peek_accuraplate',
    imgSrc: 'https://cuztomgraft.zimvie.com/content/zimvie-cuztomgraft/en-GB/_jcr_content/root/container/cuztomgraft_app/_content/region/file-upload-form/field-opt_article/tier-1/product-tile-1/image.coreimg.jpeg/1660744732893/peek-accuraplate.jpeg',
  },
  {
    label: 'Titanium AccuraMesh\u2122',
    value: 'titanium_accuramesh',
    imgSrc: 'https://cuztomgraft.zimvie.com/content/zimvie-cuztomgraft/en-GB/_jcr_content/root/container/cuztomgraft_app/_content/region/file-upload-form/field-opt_article/tier-1/product-tile-2/image.coreimg.jpeg/1660744756285/titanium-accuramesh.jpeg',
  },
  {
    label: 'PEEK AccuraMesh\u2122',
    value: 'peek_accuramesh',
    imgSrc: 'https://cuztomgraft.zimvie.com/content/zimvie-cuztomgraft/en-GB/_jcr_content/root/container/cuztomgraft_app/_content/region/file-upload-form/field-opt_article/tier-1/product-tile-3/image.coreimg.jpeg/1660744779050/peek-accuramesh.jpeg',
  },
];

const DEFAULT_FIELDS = [
  { label: 'Account Number *', type: 'text', name: 'account_number', required: true, row: 1 },
  { label: 'Patient ID (e.g. Numerical Code, Initials etc.) *', type: 'text', name: 'patient_id', required: true, row: 1 },
  { label: 'Customer Name *', type: 'text', name: 'contact', required: true, row: 2 },
  { label: 'Defect Site *', type: 'text', name: 'region', required: true, row: 2 },
  { label: 'E-Mail *', type: 'email', name: 'email', required: true, row: 3 },
  { label: 'Number of planned Implants; \u00d8 and length (mm) *', type: 'text', name: 'implant_size', required: true, row: 3 },
  { label: 'Address *', type: 'text', name: 'street', required: true, row: 4 },
  { label: 'Comments', type: 'textarea', name: 'comments', required: false, row: 4 },
  { label: 'Phone Number *', type: 'tel', name: 'phone', required: true, row: 5 },
];

// ─── Section builders ─────────────────────────────────────────────────────────

function buildBannerSection(imgEl, alt) {
  const section = document.createElement('div');
  section.className = 'uf-banner';
  if (imgEl) {
    // Use picture element's src as background or show inline
    const src = imgEl.src || imgEl.currentSrc;
    if (src) {
      section.style.backgroundImage = `url('${src}')`;
    }
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
  products.forEach((p) => {
    // Support both authored child-item rows (p.imgEl) and default fallback (p.imgSrc)
    let imgEl = p.imgEl || null;
    if (!imgEl && p.imgSrc) {
      imgEl = document.createElement('img');
      imgEl.src = p.imgSrc;
      imgEl.alt = p.label;
    }
    grid.appendChild(buildProductTile(imgEl, p.imgAlt || p.label, p.label, p.value, 'opt_article'));
  });
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

  return section;
}

function buildUploadSection(heading, note, formats) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-upload-section';

  const h3 = document.createElement('h3');
  h3.textContent = heading || '4. Upload DICOM Data';
  section.appendChild(h3);

  // Note paragraph
  const notePara = document.createElement('p');
  notePara.className = 'uf-upload-note';
  notePara.textContent = note || '* Please note the following information for the data transfer:';
  section.appendChild(notePara);

  // Accepted formats line
  if (formats) {
    const fmtPara = document.createElement('p');
    fmtPara.className = 'uf-upload-formats';
    fmtPara.innerHTML = `<strong>Accepted file formats: </strong><strong>${formats.replace(/^Accepted file formats:\s*/i, '')}</strong>`;
    section.appendChild(fmtPara);
  }

  // File input — styled as a simple CTA button matching original ZimVie site
  const fileWrap = document.createElement('div');
  fileWrap.className = 'uf-file-wrap';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.name = 'files[]';
  fileInput.id = 'uf-file-input';
  fileInput.accept = '.pdf,.zip,.rar';
  fileInput.multiple = true;
  fileInput.className = 'uf-file-input';

  const cta = document.createElement('label');
  cta.htmlFor = 'uf-file-input';
  cta.className = 'uf-file-cta';
  cta.textContent = 'Select files \u2026';

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

  fileWrap.appendChild(fileInput);
  fileWrap.appendChild(cta);
  fileWrap.appendChild(fileList);
  section.appendChild(fileWrap);
  return section;
}

function buildConsentSection(disclaimerHtml, termsHtml, privacyHtml, submitLabel) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-consent-section';

  // Disclaimer text block (italicized paragraph above checkboxes)
  if (disclaimerHtml) {
    const disc = document.createElement('div');
    disc.className = 'uf-disclaimer-text';
    disc.innerHTML = disclaimerHtml;
    section.appendChild(disc);
  }

  // Checkboxes in a flex row
  const checkboxRow = document.createElement('div');
  checkboxRow.className = 'uf-checkboxes';

  const defaultTerms = '*I agree';
  const defaultPrivacy = '*I Accept the <a href="https://www.zimvie.eu/en/privacy-notice.html">Privacy Policy</a>';

  checkboxRow.appendChild(buildCheckbox('statement', termsHtml || defaultTerms, true));
  checkboxRow.appendChild(buildCheckbox('policy', privacyHtml || defaultPrivacy, true));
  section.appendChild(checkboxRow);

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'uf-submit';
  submitBtn.textContent = submitLabel || 'SUBMIT FORM';
  section.appendChild(submitBtn);

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
    disclaimerHtml || null,
    consentTermsHtml || null,
    consentPrivacyHtml || null,
    submitLabel,
  ));

  formBody.appendChild(form);
  block.appendChild(formBody);
}
