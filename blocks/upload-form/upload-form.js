/**
 * Upload Form Block â fully authorable via Universal Editor.
 *
 * Content format (row-based, pipe-delimited fields within cells):
 *
 * Row 0  : banner image row â 1 cell containing a <picture><img>
 * Row 1  : region heading + options â cell[0] has h3 + <p> with pipe-separated
 *           "Label (LANG)" values
 * Row 2  : product section heading â cell[0] has h3
 * Row 3  : product tiles â alternating cells: even = <picture>, odd = label text
 * Row 4  : product footnote â cell[0] has <em> text
 * Row 5  : info heading â cell[0] has h3
 * Rows 6â10: form field rows â each cell contains text in the format
 *           "Label|type|name[|required]"
 * Row 11 : required-fields note â cell[0] has <em>* Required fields</em>
 * Row 12 : upload section â cell[0] has h3 + description paragraphs +
 *           a line "file-upload|files[]|.pdf,.zip,.rar"
 * Row 13 : consent/submit section â cell[0] has:
 *           - <p><strong>intro text</strong></p>
 *           - optional T&C link paragraphs
 *           - disclaimer paragraph
 *           - "checkbox|name|Label[|required]" lines
 *           - "submit|Button Label" line
 * Row 14 : legal disclaimer â cell[0] has optional h3 + <em> disclaimer text
 */

// ââ Cell helpers âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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

// ââ Widget builders âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * Build a custom animated select dropdown.
 * @param {Array<{label:string, value:string, isDefault:boolean}>} options
 * @param {string} name  â native select name attribute
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
 * Build a product selection tile with a custom radio button.
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

  // Wire the tile click to check the radio
  tile.addEventListener('click', () => {
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    tile.closest('.uf-products-grid')
      ?.querySelectorAll('.uf-product-tile')
      .forEach((t) => t.classList.remove('selected'));
    tile.classList.add('selected');
  });
  radio.addEventListener('change', () => {
    if (radio.checked) {
      tile.closest('.uf-products-grid')
        ?.querySelectorAll('.uf-product-tile')
        .forEach((t) => t.classList.remove('selected'));
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

/**
 * Build a labelled input / textarea field.
 */
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

/**
 * Build a checkbox row.
 */
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

// ââ Default fallback data âââââââââââââââââââââââââââââââââââââââââââââââââââââ

const DEFAULT_REGION_OPTIONS = [
  { label: 'UK/Ireland (EN)', value: 'uk-ie-en', isDefault: true },
  { label: 'Austria (DE)', value: 'at-de', isDefault: false },
  { label: 'Belgium (FR)', value: 'be-fr', isDefault: false },
  { label: 'Belgium (NL)', value: 'be-nl', isDefault: false },
  { label: 'France (FR)', value: 'fr-fr', isDefault: false },
  { label: 'Germany (DE)', value: 'de-de', isDefault: false },
  { label: 'Italy (IT)', value: 'it-it', isDefault: false },
  { label: 'Netherlands (EN)', value: 'nl-en', isDefault: false },
  { label: 'Netherlands (NL)', value: 'nl-nl', isDefault: false },
  { label: 'Other Markets (EN)', value: 'other-en', isDefault: false },
  { label: 'Portugal (PT)', value: 'pt-pt', isDefault: false },
  { label: 'Spain (ES)', value: 'es-es', isDefault: false },
  { label: 'Switzerland (DE)', value: 'ch-de', isDefault: false },
  { label: 'Switzerland (FR)', value: 'ch-fr', isDefault: false },
  { label: 'Switzerland (IT)', value: 'ch-it', isDefault: false },
  { label: 'Israel (IL)', value: 'il', isDefault: false },
];

const DEFAULT_PRODUCTS = [
  { label: 'PurosÂ® Allograft Customized Block', value: 'puros_allograft_customzied_block', imgSrc: '/drafts/images/puros-allograft.jpeg' },
  { label: 'PEEK AccuraPlateâ¢', value: 'peek_accuraplate', imgSrc: '/drafts/images/peek-accuraplate.jpeg' },
  { label: 'Titanium AccuraMeshâ¢', value: 'titanium_accuramesh', imgSrc: '/drafts/images/titanium-accuramesh.jpeg' },
  { label: 'PEEK AccuraMeshâ¢', value: 'peek_accuramesh', imgSrc: '/drafts/images/peek-accuramesh.jpeg' },
];

const DEFAULT_FIELDS = [
  { label: 'Account Number *', type: 'text', name: 'account_number', required: true, row: 1 },
  { label: 'Patient ID (e.g. Numerical Code, Initials etc.) *', type: 'text', name: 'patient_id', required: true, row: 1 },
  { label: 'Customer Name *', type: 'text', name: 'contact', required: true, row: 2 },
  { label: 'Defect Site *', type: 'text', name: 'region', required: true, row: 2 },
  { label: 'E-Mail *', type: 'email', name: 'email', required: true, row: 3 },
  { label: 'Number of planned Implants; Ã and length (mm) *', type: 'text', name: 'implant_size', required: true, row: 3 },
  { label: 'Address *', type: 'text', name: 'street', required: true, row: 4 },
  { label: 'Comments', type: 'textarea', name: 'comments', required: false, row: 4 },
  { label: 'Phone Number *', type: 'tel', name: 'phone', required: true, row: 5 },
];

// ââ Row classification helpers ââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * Detect if a row is the "banner" row (single cell with a picture/img).
 */
function isBannerRow(row) {
  return row.children.length === 1 && !!row.children[0].querySelector('picture, img');
}

/**
 * Detect if a row contains an h3 heading.
 */
function hasHeading(row) {
  return !!row.querySelector('h3');
}

/**
 * Detect if a cell text matches field format: "Label|type|name[|required]"
 */
function isFieldSpec(text) {
  return /^[^|]+\|(text|email|tel|textarea)\|[a-z_[\]]+/.test(text.trim());
}

/**
 * Parse field spec: "Label|type|name[|required]"
 */
function parseFieldSpec(text) {
  const parts = text.trim().split('|');
  return {
    label: parts[0].trim(),
    type: parts[1]?.trim() || 'text',
    name: parts[2]?.trim() || '',
    required: parts[3]?.trim() === 'required',
  };
}

/**
 * Detect if a row is a product tiles row (alternating picture + text cells, even number >= 4).
 */
function isProductTilesRow(row) {
  if (row.children.length < 2) return false;
  // Check if cells alternate between having images and text
  const cells = [...row.children];
  const evenHaveImages = cells.filter((_, i) => i % 2 === 0).some((c) => c.querySelector('picture, img'));
  return evenHaveImages && cells.length >= 4;
}

/**
 * Detect if a row contains form field definitions (pipe-separated text in cells).
 */
function isFormFieldsRow(row) {
  const cells = [...row.children];
  return cells.some((cell) => {
    const text = cell.textContent.trim();
    return isFieldSpec(text);
  });
}

/**
 * Detect if a row is the upload section (has h3 "Upload" or contains "file-upload" text).
 */
function isUploadRow(row) {
  const text = row.textContent;
  return text.includes('file-upload') || (hasHeading(row) && text.toLowerCase().includes('upload'));
}

/**
 * Detect if a row is the consent/checkboxes/submit section.
 */
function isConsentRow(row) {
  const text = row.textContent;
  return text.includes('checkbox|') || text.includes('submit|');
}

// ââ Section builders ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function buildBannerSection(row) {
  const section = document.createElement('div');
  section.className = 'uf-banner';
  const img = row.querySelector('img');
  if (img) {
    section.style.backgroundImage = `url('${img.src}')`;
  }
  return section;
}

function buildRegionSection(row, regionHeading) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-region-section';

  const h3 = document.createElement('h3');
  h3.textContent = regionHeading || '1. Select Region / Language';
  section.appendChild(h3);

  // Parse region options from pipe-separated paragraph text
  let options = [...DEFAULT_REGION_OPTIONS];
  const p = row.querySelector('p');
  if (p) {
    const rawText = p.textContent.trim();
    if (rawText.includes('|')) {
      options = rawText.split('|').map((label, idx) => ({
        label: label.trim(),
        value: label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        isDefault: idx === 0,
      }));
    }
  }

  section.appendChild(buildCustomSelect(options, 'lang_switch'));
  return section;
}

function buildProductsSection(headingRow, tilesRow, footnoteRow, productHeading) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-products-section';

  const h3 = document.createElement('h3');
  h3.textContent = productHeading || '2. Choose Product*';
  section.appendChild(h3);

  const grid = document.createElement('div');
  grid.className = 'uf-products-grid';

  if (tilesRow) {
    const cells = [...tilesRow.children];
    for (let i = 0; i + 1 < cells.length; i += 2) {
      const imgCell = cells[i];
      const labelCell = cells[i + 1];
      const imgEl = imgCell.querySelector('img');
      const altText = imgEl?.alt || '';
      const labelText = labelCell.textContent.trim();
      // Derive a form value from the label
      const productValues = {
        'PurosÂ® Allograft Customized Block': 'puros_allograft_customzied_block',
        'PEEK AccuraPlateâ¢': 'peek_accuraplate',
        'PEEK AccuraMeshâ¢': 'peek_accuramesh',
        'Titanium AccuraMeshâ¢': 'titanium_accuramesh',
      };
      const value = productValues[labelText] || labelText.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      grid.appendChild(buildProductTile(imgEl, altText, labelText, value, 'product'));
    }
  } else {
    // Fallback: use default products (no images)
    DEFAULT_PRODUCTS.forEach((p) => {
      grid.appendChild(buildProductTile(null, '', p.label, p.value, 'product'));
    });
  }

  section.appendChild(grid);

  if (footnoteRow) {
    const fnDiv = document.createElement('div');
    fnDiv.className = 'uf-product-footnote';
    fnDiv.innerHTML = footnoteRow.querySelector('div')?.innerHTML || '';
    section.appendChild(fnDiv);
  }

  return section;
}

function buildInfoSection(fieldRows, infoHeading) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-info-section';

  const h3 = document.createElement('h3');
  h3.textContent = infoHeading || '3. Please Fill in the Following Information';
  section.appendChild(h3);

  if (fieldRows.length > 0) {
    // Parse fields from the rows
    // Each row can have 1 or 2 cells, each cell has "Label|type|name[|required]"
    fieldRows.forEach((row) => {
      const cells = [...row.children];
      const validCells = cells.filter((c) => isFieldSpec(c.textContent.trim()));

      if (validCells.length === 0) return; // skip non-field rows (like required note)

      if (validCells.length > 1) {
        // Two-column row
        const rowDiv = document.createElement('div');
        rowDiv.className = 'uf-field-row uf-field-row-2col';
        validCells.forEach((cell) => {
          const spec = parseFieldSpec(cell.textContent.trim());
          rowDiv.appendChild(buildField(spec.label, spec.type, spec.name, spec.required));
        });
        section.appendChild(rowDiv);
      } else {
        // Single field row
        const spec = parseFieldSpec(validCells[0].textContent.trim());
        const rowDiv = document.createElement('div');
        rowDiv.className = 'uf-field-row uf-field-row-1col';
        rowDiv.appendChild(buildField(spec.label, spec.type, spec.name, spec.required));
        section.appendChild(rowDiv);
      }
    });
  } else {
    // Fallback defaults â group fields by row number
    const grouped = {};
    DEFAULT_FIELDS.forEach((f) => {
      if (!grouped[f.row]) grouped[f.row] = [];
      grouped[f.row].push(f);
    });
    Object.values(grouped).forEach((rowFields) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = `uf-field-row uf-field-row-${rowFields.length > 1 ? '2col' : '1col'}`;
      rowFields.forEach((f) => rowDiv.appendChild(buildField(f.label, f.type, f.name, f.required)));
      section.appendChild(rowDiv);
    });
  }

  const note = document.createElement('p');
  note.className = 'uf-required-note';
  note.textContent = '* Required fields';
  section.appendChild(note);

  return section;
}

function buildUploadSection(row, uploadHeading) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-upload-section';

  const h3 = document.createElement('h3');
  h3.textContent = uploadHeading || '4. Upload DICOM Data';
  section.appendChild(h3);

  // Parse upload details from the row
  let accept = '.pdf,.zip,.rar';
  let fileInputName = 'files[]';
  let descriptionHtml = '';

  if (row) {
    const cell = row.children[0];
    const lines = cell ? [...cell.childNodes].filter((n) => n.nodeType === 1) : [];
    const descParts = [];

    lines.forEach((el) => {
      const text = el.textContent.trim();
      if (text.startsWith('file-upload|')) {
        const parts = text.split('|');
        fileInputName = parts[1]?.trim() || fileInputName;
        accept = parts[2]?.trim() || accept;
      } else if (el.tagName === 'H3') {
        // skip - we already added the heading
      } else {
        descParts.push(el.outerHTML);
      }
    });

    descriptionHtml = descParts.join('');
  }

  if (descriptionHtml) {
    const desc = document.createElement('div');
    desc.className = 'uf-upload-desc';
    desc.innerHTML = descriptionHtml;
    section.appendChild(desc);
  } else {
    const note = document.createElement('p');
    note.className = 'uf-upload-note';
    note.textContent = '* Please note the following information for the data transfer:';
    section.appendChild(note);

    const formats = document.createElement('p');
    formats.innerHTML = '<strong>Accepted file formats:</strong> <strong>.pdf, .zip, .rar</strong>';
    section.appendChild(formats);
  }

  const fileWrap = document.createElement('div');
  fileWrap.className = 'uf-file-drop-zone';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.name = fileInputName;
  fileInput.id = 'uf-file-input';
  fileInput.accept = accept;
  fileInput.multiple = true;
  fileInput.className = 'uf-file-input';

  const dropLabel = document.createElement('label');
  dropLabel.htmlFor = 'uf-file-input';
  dropLabel.className = 'uf-file-drop-label';

  const dropIcon = document.createElement('span');
  dropIcon.className = 'uf-file-drop-icon';
  dropIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="16 16 12 12 8 16"></polyline>
    <line x1="12" y1="12" x2="12" y2="21"></line>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
  </svg>`;

  const dropText = document.createElement('span');
  dropText.className = 'uf-file-drop-text';
  dropText.textContent = 'Drop files here or click to browse';

  const dropSub = document.createElement('span');
  dropSub.className = 'uf-file-drop-sub';
  dropSub.textContent = `Accepted formats: ${accept}`;

  dropLabel.appendChild(dropIcon);
  dropLabel.appendChild(dropText);
  dropLabel.appendChild(dropSub);

  const fileList = document.createElement('div');
  fileList.className = 'uf-file-list';

  fileInput.addEventListener('change', () => {
    fileList.innerHTML = '';
    [...fileInput.files].forEach((file) => {
      const item = document.createElement('div');
      item.className = 'uf-file-item';
      const name = document.createElement('span');
      name.className = 'uf-file-name';
      name.textContent = file.name;
      const size = document.createElement('span');
      size.className = 'uf-file-size';
      size.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      item.appendChild(name);
      item.appendChild(size);
      fileList.appendChild(item);
    });
  });

  // Drag and drop support
  fileWrap.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileWrap.classList.add('drag-over');
  });
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

function buildConsentSection(row) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-consent-section';

  const checkboxes = [];
  let submitLabel = 'SUBMIT FORM';
  let introHtml = '';
  let disclaimerHtml = '';

  if (row) {
    const cell = row.children[0];
    if (cell) {
      const children = [...cell.children];
      const introParts = [];
      const disclaimerParts = [];
      let pastCheckboxes = false;

      children.forEach((el) => {
        const text = el.textContent.trim();

        if (text.startsWith('checkbox|')) {
          pastCheckboxes = true;
          const parts = text.split('|');
          checkboxes.push({
            name: parts[1]?.trim() || 'checkbox',
            label: parts[2]?.trim() || 'I agree',
            required: parts[3]?.trim() === 'required',
          });
        } else if (text.startsWith('submit|')) {
          submitLabel = text.split('|')[1]?.trim() || submitLabel;
        } else if (!pastCheckboxes) {
          introParts.push(el.outerHTML);
        } else {
          disclaimerParts.push(el.outerHTML);
        }
      });

      introHtml = introParts.join('');
      disclaimerHtml = disclaimerParts.join('');
    }
  }

  if (introHtml) {
    const intro = document.createElement('div');
    intro.className = 'uf-consent-intro';
    intro.innerHTML = introHtml;
    section.appendChild(intro);
  }

  const checkboxArea = document.createElement('div');
  checkboxArea.className = 'uf-checkboxes';

  if (checkboxes.length > 0) {
    checkboxes.forEach((cb) => {
      checkboxArea.appendChild(buildCheckbox(cb.name, cb.label, cb.required));
    });
  } else {
    // Fallback defaults
    checkboxArea.appendChild(buildCheckbox(
      'statement',
      '*I agree',
      true,
    ));
    const privacyLabel = '*I Accept the <a href="https://www.zimvie.eu/en/privacy-notice.html">Privacy Policy</a>';
    checkboxArea.appendChild(buildCheckbox('policy', privacyLabel, true));
  }

  section.appendChild(checkboxArea);

  if (disclaimerHtml) {
    const disclaimerEl = document.createElement('div');
    disclaimerEl.className = 'uf-consent-disclaimer';
    disclaimerEl.innerHTML = disclaimerHtml;
    section.appendChild(disclaimerEl);
  }

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'uf-submit';
  submitBtn.textContent = submitLabel;
  section.appendChild(submitBtn);

  return section;
}

function buildDisclaimerSection(row) {
  const section = document.createElement('div');
  section.className = 'uf-section uf-disclaimer';

  if (row) {
    const cell = row.children[0];
    if (cell) {
      const h3 = cell.querySelector('h3');
      if (!h3) {
        const heading = document.createElement('h3');
        heading.textContent = 'Disclaimer';
        section.appendChild(heading);
      }
      const content = document.createElement('div');
      content.className = 'uf-disclaimer-content';
      content.innerHTML = cell.innerHTML;
      section.appendChild(content);
    }
  } else {
    const h3 = document.createElement('h3');
    h3.textContent = 'Disclaimer';
    section.appendChild(h3);
  }

  return section;
}

// ââ Main decorate âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export default async function decorate(block) {
  const rows = [...block.children];

  // ââ 1. Identify all rows by type ââââââââââââââââââââââââââââââââââââââââââ
  let bannerRow = null;
  let regionRow = null;
  let productHeadingRow = null;
  let tilesRow = null;
  let footnoteRow = null;
  let infoHeadingRow = null;
  const fieldRows = [];
  let uploadRow = null;
  let consentRow = null;
  let disclaimerRow = null;

  rows.forEach((row) => {
    const text = row.textContent.trim();

    if (isBannerRow(row)) {
      bannerRow = row;
    } else if (isConsentRow(row)) {
      consentRow = row;
    } else if (isUploadRow(row) && !consentRow) {
      uploadRow = row;
    } else if (isProductTilesRow(row)) {
      tilesRow = row;
    } else if (isFormFieldsRow(row)) {
      fieldRows.push(row);
    } else if (hasHeading(row)) {
      const h3Text = row.querySelector('h3')?.textContent.trim() || '';
      if (/1\.|region|language/i.test(h3Text)) {
        regionRow = row;
      } else if (/2\.|product/i.test(h3Text)) {
        productHeadingRow = row;
      } else if (/3\.|fill|information/i.test(h3Text)) {
        infoHeadingRow = row;
      } else if (/4\.|upload|dicom/i.test(h3Text)) {
        uploadRow = row;
      } else if (/disclaimer/i.test(h3Text)) {
        disclaimerRow = row;
      }
    } else if (/^\*?\s*product clearance|may be limited/i.test(text)) {
      footnoteRow = row;
    } else if (/^\*\s*required fields?/i.test(text)) {
      // skip â built inline
    } else if (text.length > 100 && !bannerRow && !regionRow) {
      // Possibly a standalone disclaimer row
      disclaimerRow = disclaimerRow || row;
    }
  });

  // Region row may contain both the heading and the options list
  if (!regionRow) regionRow = rows.find((r) => r.textContent.includes('|') && r.textContent.length > 50 && !tilesRow === r);

  // ââ 2. Get block-level props from data-aue-prop attributes (UE author tier) ââ
  const getUeProp = (propName) => {
    const el = block.querySelector(`[data-aue-prop="${propName}"]`);
    return el ? el.textContent.trim() : null;
  };

  const regionHeading = getUeProp('regionHeading') || '1. Select Region / Language';
  const productHeading = getUeProp('productHeading') || '2. Choose Product*';
  const infoHeading = getUeProp('infoHeading') || '3. Please Fill in the Following Information';
  const uploadHeading = getUeProp('uploadHeading') || '4. Upload DICOM Data';

  // ââ 3. Build the block ââââââââââââââââââââââââââââââââââââââââââââââââââââ
  block.innerHTML = '';

  // Banner
  if (bannerRow) {
    block.appendChild(buildBannerSection(bannerRow));
  }

  // Wrap everything else in a form body container
  const formBody = document.createElement('div');
  formBody.className = 'uf-form-body';

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://cuztomgraft.zimvie.com/content/zimvie-cuztomgraft/en-GB/_jcr_content/root/container/cuztomgraft_app.post.bin';
  form.enctype = 'multipart/form-data';
  form.noValidate = false;

  // Region section
  form.appendChild(buildRegionSection(regionRow, regionHeading));

  // Products section
  form.appendChild(buildProductsSection(productHeadingRow, tilesRow, footnoteRow, productHeading));

  // Info / form fields section
  form.appendChild(buildInfoSection(fieldRows, infoHeading));

  // Upload section
  form.appendChild(buildUploadSection(uploadRow, uploadHeading));

  // Consent + submit section
  form.appendChild(buildConsentSection(consentRow));

  formBody.appendChild(form);
  block.appendChild(formBody);

  // Disclaimer (outside form)
  if (disclaimerRow) {
    block.appendChild(buildDisclaimerSection(disclaimerRow));
  }
}
