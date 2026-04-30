/**
 * Build a custom animated select dropdown matching the source's SlimSelect widget.
 */
function buildCustomSelect(options, name) {
  const wrapper = document.createElement('div');
  wrapper.className = 'uf-select-wrapper';

  const native = document.createElement('select');
  native.className = 'uf-select';
  native.name = name;
  options.forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    if (opt.includes('UK/Ireland')) o.selected = true;
    native.appendChild(o);
  });

  const display = document.createElement('span');
  display.className = 'uf-select-display';
  display.textContent = options.find((o) => o.includes('UK/Ireland')) || options[0];

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
      .filter((o) => o.toLowerCase().includes(filter.toLowerCase()))
      .forEach((opt) => {
        const item = document.createElement('div');
        item.className = 'uf-select-option';
        if (opt.includes('UK/Ireland')) item.classList.add('selected');
        item.textContent = opt;
        item.setAttribute('role', 'option');
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          display.textContent = opt;
          native.value = opt;
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
 * Build a product tile with a custom radio button.
 */
function buildProductTile(imgSrc, labelText, name) {
  const tile = document.createElement('div');
  tile.className = 'uf-product-tile';

  const radioField = document.createElement('div');
  radioField.className = 'uf-radio-field';

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = name;
  radio.required = true;

  const radioRow = document.createElement('label');
  radioRow.className = 'uf-radio-row';

  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('aria-hidden', 'true');
  iconSvg.className.baseVal = 'uf-radio-icon';
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

  if (imgSrc) {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = labelText;
    img.loading = 'lazy';
    tile.appendChild(img);
  }

  return tile;
}

/**
 * Build a labelled input/textarea field.
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
  input.name = name;
  if (required) input.required = true;

  fieldDiv.appendChild(lbl);
  fieldDiv.appendChild(input);
  return fieldDiv;
}

// ── Static content data ───────────────────────────────────────────────────────

const LANG_OPTIONS = [
  'UK/Ireland',
  'Austria', 'Belgium', 'Croatia', 'Czech Republic', 'Denmark',
  'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
  'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Netherlands',
  'Norway', 'Poland', 'Portugal', 'Romania', 'Serbia', 'Slovakia',
  'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey',
];

const PRODUCTS = [
  { label: 'Tutoplast Cortical Plate', img: '/drafts/images/product-cortical.png' },
  { label: 'Tutoplast Cortical Granules', img: '/drafts/images/product-granules.png' },
  { label: 'Tutoplast Cancellous Granules', img: '/drafts/images/product-cancellous.png' },
  { label: 'Tutoplast Processed Pericardium', img: '/drafts/images/product-pericardium.png' },
  { label: 'Custom Graft DICOM Upload', img: '/drafts/images/product-custom.png' },
];

const FORM_FIELDS = [
  [
    { label: 'First Name *', type: 'text', name: 'first_name', required: true },
    { label: 'Last Name *', type: 'text', name: 'last_name', required: true },
  ],
  [
    { label: 'Email Address *', type: 'email', name: 'email', required: true },
    { label: 'Phone Number *', type: 'tel', name: 'phone', required: true },
  ],
  [
    { label: 'Hospital / Institution', type: 'text', name: 'hospital', required: false },
    { label: 'City', type: 'text', name: 'city', required: false },
  ],
  [
    { label: 'Country', type: 'text', name: 'country', required: false },
    { label: 'Zip / Postal Code', type: 'text', name: 'zip', required: false },
  ],
  [
    { label: 'Additional Notes', type: 'textarea', name: 'notes', required: false },
  ],
];

export default async function decorate(block) {
  const formBody = document.createElement('div');
  formBody.className = 'uf-form-body';

  // ── Section 1: Region / Language ─────────────────────────────────
  const regionSection = document.createElement('div');
  regionSection.className = 'uf-section';
  const regionH3 = document.createElement('h3');
  regionH3.textContent = 'Region / Language';
  regionSection.appendChild(regionH3);
  regionSection.appendChild(buildCustomSelect(LANG_OPTIONS, 'lang_switch'));
  formBody.appendChild(regionSection);

  // ── Section 2: Product selection ─────────────────────────────────
  const productSection = document.createElement('div');
  productSection.className = 'uf-section';
  const productH3 = document.createElement('h3');
  productH3.textContent = 'Select Product *';
  productSection.appendChild(productH3);

  const productsDiv = document.createElement('div');
  productsDiv.className = 'uf-products';
  PRODUCTS.forEach(({ label, img }) => {
    productsDiv.appendChild(buildProductTile(img, label, 'opt_article'));
  });
  productSection.appendChild(productsDiv);

  const footnote = document.createElement('p');
  footnote.className = 'uf-footnote';
  footnote.textContent = '* Custom Graft products require a DICOM upload.';
  productSection.appendChild(footnote);
  formBody.appendChild(productSection);

  // ── Section 3: Contact information ───────────────────────────────
  const infoSection = document.createElement('div');
  infoSection.className = 'uf-section';
  const infoH3 = document.createElement('h3');
  infoH3.textContent = 'Contact Information';
  infoSection.appendChild(infoH3);

  FORM_FIELDS.forEach((rowFields) => {
    const fieldsRow = document.createElement('div');
    fieldsRow.className = 'uf-fields-row';
    rowFields.forEach(({ label, type, name, required }) => {
      fieldsRow.appendChild(buildField(label, type, name, required));
    });
    infoSection.appendChild(fieldsRow);
  });

  const requiredNote = document.createElement('p');
  requiredNote.className = 'uf-required-note';
  requiredNote.textContent = '* Required fields';
  infoSection.appendChild(requiredNote);
  formBody.appendChild(infoSection);

  // ── Section 4: DICOM upload ───────────────────────────────────────
  const uploadSection = document.createElement('div');
  uploadSection.className = 'uf-section uf-upload-section';
  const uploadH3 = document.createElement('h3');
  uploadH3.textContent = 'Upload DICOM Files';
  uploadSection.appendChild(uploadH3);

  const fileLabel = document.createElement('label');
  fileLabel.className = 'uf-file-input';
  fileLabel.textContent = 'Select files ...';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.name = 'files[]';
  fileInput.accept = '.dcm,.zip,.rar';
  fileInput.multiple = true;
  fileInput.style.display = 'none';
  fileLabel.appendChild(fileInput);
  uploadSection.appendChild(fileLabel);
  formBody.appendChild(uploadSection);

  // ── Section 5: Terms + submit ─────────────────────────────────────
  const termsSection = document.createElement('div');
  termsSection.className = 'uf-section uf-terms';

  const makeCheckbox = (name, labelHtml, required) => {
    const cbLabel = document.createElement('label');
    cbLabel.className = 'uf-checkbox-row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.name = name;
    if (required) cb.required = true;
    const span = document.createElement('span');
    span.innerHTML = labelHtml;
    cbLabel.appendChild(cb);
    cbLabel.appendChild(span);
    return cbLabel;
  };

  termsSection.appendChild(makeCheckbox(
    'consent_terms',
    'I agree to the <a href="/terms" target="_blank">Terms &amp; Conditions</a>',
    true,
  ));
  termsSection.appendChild(makeCheckbox(
    'consent_privacy',
    'I have read and understood the <a href="/privacy" target="_blank">Privacy Policy</a>',
    true,
  ));

  const submitWrapper = document.createElement('div');
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'uf-submit-btn';
  submitBtn.textContent = 'SUBMIT';
  submitWrapper.appendChild(submitBtn);
  termsSection.appendChild(submitWrapper);
  formBody.appendChild(termsSection);

  // ── Section 6: Disclaimer ─────────────────────────────────────────
  const disclaimer = document.createElement('div');
  disclaimer.className = 'uf-disclaimer-row';
  const disclaimerInner = document.createElement('div');
  disclaimerInner.className = 'uf-disclaimer';
  disclaimerInner.innerHTML = `ZimVie Inc. and its subsidiaries (collectively "ZimVie") maintain this website
    for informational purposes. The information on this website is subject to change without notice.
    ZimVie makes no representations or warranties of any kind regarding the information contained herein.`;
  disclaimer.appendChild(disclaimerInner);
  formBody.appendChild(disclaimer);

  // ── Assemble ──────────────────────────────────────────────────────
  const form = document.createElement('form');
  form.method = 'post';
  form.enctype = 'multipart/form-data';
  form.noValidate = true;

  block.innerHTML = '';

  const bannerDiv = document.createElement('div');
  bannerDiv.className = 'uf-banner';
  block.appendChild(bannerDiv);

  while (formBody.firstChild) form.appendChild(formBody.firstChild);
  formBody.appendChild(form);
  block.appendChild(formBody);
}
