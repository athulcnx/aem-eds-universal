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
 * @param {HTMLImageElement|HTMLPictureElement|null} imgEl  img or picture element
 * @param {string} altText
 * @param {string} labelText
 * @param {string} value
 * @param {string} radioName
 * @param {string} [imgSrcFallback]  fallback src if local draft path 404s
 */
function buildProductTile(imgEl, altText, labelText, value, radioName, imgSrcFallback) {
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

  const labelSpan = document.createElement('span');
  labelSpan.className = 'uf-radio-text';
  labelSpan.textContent = labelText;

  labelEl.appendChild(radio);
  labelEl.appendChild(iconSvg);
  labelEl.appendChild(labelSpan);
  tile.appendChild(labelEl);

  // Product image (below radio row)
  // Handles: bare <img>, <picture> with nested <img>, or null
  if (imgEl) {
    let imageNode;
    if (imgEl.tagName === 'PICTURE') {
      // Clone the full <picture> element including <source> and <img> children
      imageNode = imgEl.cloneNode(true);
      const innerImg = imageNode.querySelector('img');
      if (innerImg) {
        innerImg.alt = altText || labelText;
        innerImg.loading = 'lazy';
        innerImg.className = 'uf-product-img';
        // Fallback src if local draft image 404s
        if (imgSrcFallback) {
          innerImg.addEventListener('error', () => { innerImg.src = imgSrcFallback; }, { once: true });
        }
      }
    } else {
      // Bare <img> element
      imageNode = imgEl.cloneNode(true);
      imageNode.alt = altText || labelText;
      imageNode.loading = 'lazy';
      imageNode.className = 'uf-product-img';
      if (imgSrcFallback) {
        imageNode.addEventListener('error', () => { imageNode.src = imgSrcFallback; }, { once: true });
      }
    }
    tile.appendChild(imageNode);
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
    // Use drafts/ local paths as primary; fall back to live site if hosted
    imgSrc: '/drafts/images/puros-allograft.jpeg',
    imgSrcFallback: 'https://cuztomgraft.zimvie.com/content/zimvie-cuztomgraft/en-GB/_jcr_content/root/container/cuztomgraft_app/_content/region/file-upload-form/field-opt_article/tier-1/product-tile/image.coreimg.jpeg/1660744695684/puros-allograft-customized-block.jpeg',
  },
  {
    label: 'PEEK AccuraPlate\u2122',
    value: 'peek_accuraplate',
    imgSrc: '/drafts/images/peek-accuraplate.jpeg',
    imgSrcFallback: 'https://cuztomgraft.zimvie.com/content/zimvie-cuztomgraft/en-GB/_jcr_content/root/container/cuztomgraft_app/_content/region/file-upload-form/field-opt_article/tier-1/product-tile-1/image.coreimg.jpeg/1660744732893/peek-accuraplate.jpeg',
  },
  {
    label: 'Titanium AccuraMesh\u2122',
    value: 'titanium_accuramesh',
    imgSrc: '/drafts/images/titanium-accuramesh.jpeg',
    imgSrcFallback: 'https://cuztomgraft.zimvie.com/content/zimvie-cuztomgraft/en-GB/_jcr_content/root/container/cuztomgraft_app/_content/region/file-upload-form/field-opt_article/tier-1/product-tile-2/image.coreimg.jpeg/1660744756285/titanium-accuramesh.jpeg',
  },
  {
    label: 'PEEK AccuraMesh\u2122',
    value: 'peek_accuramesh',
    imgSrc: '/drafts/images/peek-accuramesh.jpeg',
    imgSrcFallback: 'https://cuztomgraft.zimvie.com/content/zimvie-cuztomgraft/en-GB/_jcr_content/root/container/cuztomgraft_app/_content/region/file-upload-form/field-opt_article/tier-1/product-tile-3/image.coreimg.jpeg/1660744779050/peek-accuramesh.jpeg',
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
    // Support both authored child-item rows (p.imgEl / p.picEl) and default fallback (p.imgSrc)
    // p.imgEl may be a bare <img> OR a <picture> element (when cloned from UE-authored data)
    let imgEl = p.picEl || p.imgEl || null;
    if (!imgEl && p.imgSrc) {
      imgEl = document.createElement('img');
      imgEl.src = p.imgSrc;
      imgEl.alt = p.imgAlt || p.label;
    }
    grid.appendChild(buildProductTile(
      imgEl,
      p.imgAlt || p.label,
      p.label,
      p.value,
      'opt_article',
      p.imgSrcFallback || null,
    ));
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

// ─── Child item parsers (UE JCR row/cell model) ──────────────────────────────

/**
 * Parse a region-option child item row (UE model).
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
 * Parse a product-tile child item row (UE model).
 * Cells: [0] productImage(<picture>/<img>)  [1] productImageAlt  [2] productLabel  [3] productValue
 *
 * In UE JCR mode, cell[0] may contain a <picture> element wrapping the DAM image ref.
 * We capture the full <picture> element as picEl for proper srcset/responsive rendering,
 * plus the bare <img> as imgEl for alt text extraction.
 */
function parseProductTileRow(row) {
  const cell0 = row?.children?.[0];
  const picEl = cell0 ? cell0.querySelector('picture') : null;
  const imgEl = cell0 ? cell0.querySelector('img') : null;
  return {
    picEl,               // full <picture> element (preferred — preserves srcset)
    imgEl,               // bare <img> fallback
    imgAlt: cellText(row, 1),
    label: cellText(row, 2),
    value: cellText(row, 3) || cellText(row, 2).toLowerCase().replace(/[^a-z0-9]+/g, '_'),
  };
}

/**
 * Parse a form-field child item row (UE model).
 * Cells: [0] fieldLabel  [1] fieldType  [2] fieldName  [3] fieldRequired  [4] fieldRow
 */
function parseFormFieldRow(row) {
  return {
    label: cellText(row, 0),
    type: cellText(row, 1) || 'text',
    name: cellText(row, 2) || cellText(row, 0).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
    required: cellText(row, 3).toLowerCase() === 'true' || cellText(row, 3) === 'required',
    row: parseInt(cellText(row, 4), 10) || 1,
  };
}

/**
 * Identify what kind of child item a row is.
 * Checks data-aue-model first (UE author tier), then falls back to cell count + content.
 * region-option: 3 cells
 * product-tile:  4 cells — [image/picture] [altText] [label] [value]
 *                         (first cell has an <img> or <picture>)
 * form-field:    5 cells  OR 2 cells with pipe-delimited text
 */
function classifyChildRow(row) {
  const model = row.getAttribute?.('data-aue-model') || '';
  if (model === 'region-option') return 'region-option';
  if (model === 'product-tile') return 'product-tile';
  if (model === 'form-field') return 'form-field';

  const count = row.children.length;
  if (count === 3) return 'region-option';
  if (count === 4) {
    // 4-cell row: product-tile if first cell has an image or picture element
    const firstCellHasMedia = !!(row.children[0]?.querySelector('img, picture'));
    return firstCellHasMedia ? 'product-tile' : null;
  }
  if (count === 5) return 'form-field';
  return null;
}

// ─── Legacy pipe-delimited markdown format parser ────────────────────────────
// Handles the old Google Docs / SharePoint migration format where data is
// encoded as "label|type|name|required" inside <p> elements.

/**
 * Detect whether this block is using the legacy pipe-delimited format
 * (as opposed to the UE JCR row/cell model).
 * Heuristic: if row[0] has a single cell containing a <picture>/<img> AND
 * row[1] has a single cell containing an <h3> + pipe text, it's legacy.
 * More robustly: look for rows with single cells whose text contains "|".
 */
function isLegacyFormat(rows) {
  // Check if any of the first 15 rows has a single cell with pipe-delimited text
  const sample = rows.slice(0, 16);
  return sample.some((row) => {
    if (row.children.length === 1) {
      const text = row.children[0]?.textContent?.trim() || '';
      return text.includes('|') && !text.startsWith('http');
    }
    // Also check multi-cell rows where individual cells contain pipe-delimited text
    if (row.children.length >= 2) {
      for (let i = 0; i < row.children.length; i += 1) {
        const t = row.children[i]?.textContent?.trim() || '';
        if (t.includes('|') && !t.startsWith('http')) return true;
      }
    }
    return false;
  });
}

/**
 * Parse the legacy pipe-delimited block format into structured data objects.
 * Returns { bannerImg, bannerAlt, regionHeading, regionOptions,
 *           productHeading, products, productFootnote,
 *           infoHeading, formFields,
 *           uploadHeading, uploadNote, uploadFormats,
 *           disclaimerHtml, termsHtml, privacyHtml, submitLabel }
 */
function parseLegacyFormat(rows) {
  const data = {
    bannerImg: null,
    bannerAlt: '',
    regionHeading: '',
    regionOptions: [],
    productHeading: '',
    products: [],
    productFootnote: '',
    infoHeading: '',
    formFields: [],
    uploadHeading: '',
    uploadNote: '',
    uploadFormats: '',
    disclaimerHtml: '',
    termsHtml: '',
    privacyHtml: '',
    submitLabel: '',
  };

  // Track state as we scan through rows
  let currentSection = null; // 'region'|'products'|'info'|'upload'|'consent'|'disclaimer'
  let formFieldRowCounter = 1;
  let pendingProductImages = []; // buffer for product image cells

  rows.forEach((row) => {
    const cellCount = row.children.length;
    const firstCell = row.children[0];
    const firstCellText = firstCell?.textContent?.trim() || '';
    const firstCellHtml = firstCell?.innerHTML?.trim() || '';

    // ── Single-cell rows ──────────────────────────────────────────────────
    if (cellCount === 1) {
      // Row containing banner image (picture/img element, no text)
      const imgEl = firstCell?.querySelector('img');
      if (imgEl && !firstCellText) {
        data.bannerImg = imgEl;
        return;
      }

      // h3 heading → determines current section
      const h3 = firstCell?.querySelector('h3');
      if (h3) {
        const headingText = h3.textContent.trim();
        if (/select region/i.test(headingText)) {
          currentSection = 'region';
          data.regionHeading = headingText;
        } else if (/choose product/i.test(headingText)) {
          currentSection = 'products';
          data.productHeading = headingText;
          pendingProductImages = [];
        } else if (/fill in/i.test(headingText) || /information/i.test(headingText)) {
          currentSection = 'info';
          data.infoHeading = headingText;
          formFieldRowCounter = 1;
        } else if (/upload/i.test(headingText)) {
          currentSection = 'upload';
          data.uploadHeading = headingText;
          // Also grab any sub-content in this same cell
          const paras = [...(firstCell?.querySelectorAll('p') || [])];
          paras.forEach((p) => {
            const t = p.textContent.trim();
            if (/please note/i.test(t)) data.uploadNote = t;
            else if (/accepted file/i.test(t) || /\.pdf/i.test(t)) {
              data.uploadFormats = t.replace(/^accepted file formats:\s*/i, '').replace(/\s*\.\s*/g, ', ').replace(/^,\s*/, '');
              if (!data.uploadFormats) data.uploadFormats = '.pdf, .zip, .rar';
            }
          });
        } else if (/disclaimer/i.test(headingText)) {
          currentSection = 'disclaimer';
          // Capture the em/italic content as disclaimer
          const em = firstCell?.querySelector('em, i, p');
          if (em) data.disclaimerHtml = em.outerHTML || em.innerHTML;
        }
        return;
      }

      // Region dropdown: "UK/Ireland (EN)|Austria (DE)|..."
      if (currentSection === 'region' && firstCellText.includes('|')) {
        const parts = firstCellText.split('|');
        data.regionOptions = parts.map((label, idx) => ({
          label: label.trim(),
          value: label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isDefault: idx === 0,
        }));
        return;
      }

      // Upload section: note + formats (already handled in h3 block above via paras)
      if (currentSection === 'upload') {
        const t = firstCellText;
        if (/please note/i.test(t)) { data.uploadNote = t; return; }
        if (/accepted file/i.test(t) || /\.pdf/i.test(t)) {
          data.uploadFormats = t.replace(/accepted file formats:\s*/i, '');
          return;
        }
        // file-upload row: "file-upload|files[]|.pdf,.zip,.rar" — skip, handled in buildUploadSection
        if (/^file-upload/i.test(t)) return;
      }

      // Product footnote (em/italic, single cell, after products section)
      if (currentSection === 'products') {
        const em = firstCell?.querySelector('em');
        if (em && em.textContent.includes('*Product')) {
          data.productFootnote = em.textContent.trim();
          return;
        }
      }

      // Consent section: starts with "By clicking..."
      if (firstCellText.includes('By clicking') || firstCellHtml.includes('By clicking')) {
        currentSection = 'consent';
      }

      // Consent section content: checkboxes and submit
      if (currentSection === 'consent') {
        const paras = [...(firstCell?.querySelectorAll('p') || [])];
        const disclaimerParas = [];
        paras.forEach((p) => {
          const t = p.textContent.trim();
          const html = p.innerHTML.trim();
          if (/^checkbox\|statement\|/i.test(t)) {
            // "*I agree" — use plain text since it has no HTML
            data.termsHtml = t.replace(/^checkbox\|statement\|/i, '').replace(/\|required\s*$/i, '').trim();
          } else if (/^checkbox\|policy\|/i.test(t)) {
            // "*I Accept the <a href="...">Privacy Policy</a>" — strip prefix/suffix from innerHTML
            // html example: "checkbox|policy|*I Accept the <a href='...'>Privacy Policy</a>|required"
            data.privacyHtml = html
              .replace(/^checkbox\|policy\|/i, '')
              .replace(/\|required\s*$/i, '')
              .trim();
          } else if (/^submit\|/i.test(t)) {
            data.submitLabel = t.replace(/^submit\|/i, '').trim();
          } else {
            disclaimerParas.push(html);
          }
        });
        if (disclaimerParas.length > 0 && !data.disclaimerHtml) {
          data.disclaimerHtml = disclaimerParas.map((h) => `<p>${h}</p>`).join('');
        }
        return;
      }

      // Disclaimer section (Disclaimer h3 already handled; gather em content)
      if (currentSection === 'disclaimer') {
        const em = firstCell?.querySelector('em');
        if (em) data.disclaimerHtml = `<p>${em.outerHTML}</p>`;
        return;
      }

      // "* Required fields" note — skip
      if (/required fields/i.test(firstCellText)) return;
    }

    // ── Multi-cell rows ───────────────────────────────────────────────────
    if (cellCount >= 2) {
      // Products section: alternating image|label pairs in a multi-cell row
      // Legacy format: cell0=picture/img, cell1=label text, cell2=picture/img, cell3=label...
      if (currentSection === 'products') {
        for (let i = 0; i < cellCount; i += 2) {
          const imgCell = row.children[i];
          const labelCell = row.children[i + 1];
          const picEl = imgCell?.querySelector('picture') || null;
          const img = imgCell?.querySelector('img') || null;
          const labelText = labelCell?.textContent?.trim() || '';
          if (picEl || img || labelText) {
            data.products.push({
              picEl,                           // full <picture> for responsive images
              imgEl: img || null,              // bare <img> fallback
              imgAlt: img?.alt || labelText,
              label: labelText || img?.alt || '',
              value: (labelText || img?.alt || '').toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            });
          }
        }
        return;
      }

      // Info section: form field rows (2 cells, each containing "label|type|name|required")
      if (currentSection === 'info') {
        const rowFields = [];
        for (let i = 0; i < cellCount; i += 1) {
          const cellTxt = row.children[i]?.textContent?.trim() || '';
          if (cellTxt.includes('|')) {
            const parts = cellTxt.split('|');
            const label = parts[0]?.trim() || '';
            const type = parts[1]?.trim() || 'text';
            const name = parts[2]?.trim() || label.toLowerCase().replace(/\W+/g, '_');
            const required = (parts[3]?.trim() || '') === 'required';
            if (label) {
              rowFields.push({ label, type, name, required, row: formFieldRowCounter });
            }
          }
        }
        if (rowFields.length > 0) {
          data.formFields.push(...rowFields);
          formFieldRowCounter += 1;
        }
        return;
      }
    }
  });

  return data;
}

// ─── Main decorate ────────────────────────────────────────────────────────────

export default async function decorate(block) {
  const rows = [...block.children];

  let bannerImg;
  let bannerAlt;
  let regionHeading;
  let regionOptions = [];
  let productHeading;
  let products = [];
  let productFootnote;
  let infoHeading;
  let formFields = [];
  let uploadHeading;
  let uploadNote;
  let uploadFormats;
  let disclaimerHtml;
  let termsHtml;
  let privacyHtml;
  let submitLabel;

  // ── Detect format and parse ────────────────────────────────────────────
  if (isLegacyFormat(rows)) {
    // ── Legacy pipe-delimited markdown format (Google Docs / SharePoint) ──
    const d = parseLegacyFormat(rows);
    bannerImg = d.bannerImg;
    bannerAlt = d.bannerAlt;
    regionHeading = d.regionHeading;
    regionOptions = d.regionOptions;
    productHeading = d.productHeading;
    products = d.products;
    productFootnote = d.productFootnote;
    infoHeading = d.infoHeading;
    formFields = d.formFields;
    uploadHeading = d.uploadHeading;
    uploadNote = d.uploadNote;
    uploadFormats = d.uploadFormats;
    disclaimerHtml = d.disclaimerHtml;
    termsHtml = d.termsHtml;
    privacyHtml = d.privacyHtml;
    submitLabel = d.submitLabel;
  } else {
    // ── UE JCR row/cell model (AEM Universal Editor authored content) ──────
    // Block-level property row order (matches _upload-form.json model):
    //  Row 0  → bannerImage
    //  Row 1  → bannerAlt
    //  Row 2  → regionHeading
    //  Row 3  → productHeading
    //  Row 4  → productFootnote
    //  Row 5  → infoHeading
    //  Row 6  → uploadHeading
    //  Row 7  → uploadNote
    //  Row 8  → uploadFormats
    //  Row 9  → submitLabel
    //  Row 10 → consentTermsLabel
    //  Row 11 → consentPrivacyLabel
    //  Row 12 → disclaimerText
    bannerImg = cellImg(rows[0], 0);
    bannerAlt = cellText(rows[1], 0);
    regionHeading = cellText(rows[2], 0);
    productHeading = cellText(rows[3], 0);
    productFootnote = cellText(rows[4], 0);
    infoHeading = cellText(rows[5], 0);
    uploadHeading = cellText(rows[6], 0);
    uploadNote = cellText(rows[7], 0);
    uploadFormats = cellText(rows[8], 0);
    submitLabel = cellText(rows[9], 0);
    termsHtml = cellHtml(rows[10], 0);
    privacyHtml = cellHtml(rows[11], 0);
    disclaimerHtml = cellHtml(rows[12], 0);

    // Child item rows (rows 13+)
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
  }

  // ── Apply defaults when items not yet authored ───────────────────────────
  const finalRegionOptions = regionOptions.length > 0 ? regionOptions : DEFAULT_REGION_OPTIONS;
  const finalProducts = products.length > 0 ? products : DEFAULT_PRODUCTS;
  const finalFields = formFields.length > 0 ? formFields : DEFAULT_FIELDS;

  // ── Render ────────────────────────────────────────────────────────────────
  block.innerHTML = '';

  // Banner (only shown when bannerImage is authored or present in legacy format)
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
    termsHtml || null,
    privacyHtml || null,
    submitLabel,
  ));

  formBody.appendChild(form);
  block.appendChild(formBody);
}
