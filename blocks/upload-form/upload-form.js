/**
 * Build a custom animated select dropdown matching the source's SlimSelect widget.
 */
function buildCustomSelect(options, name) {
  const wrapper = document.createElement('div');
  wrapper.className = 'uf-select-wrapper';

  // Hidden native select for form submission
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

  // Display value
  const display = document.createElement('span');
  display.className = 'uf-select-display';
  display.textContent = options.find((o) => o.includes('UK/Ireland')) || options[0];

  // Arrow container + button (matches source .ss-arrow > .arrow-down structure)
  const arrowWrap = document.createElement('span');
  arrowWrap.className = 'uf-select-arrow-wrap';
  const arrow = document.createElement('span');
  arrow.className = 'uf-select-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrowWrap.appendChild(arrow);

  // Dropdown panel
  const dropdown = document.createElement('div');
  dropdown.className = 'uf-select-dropdown';
  dropdown.setAttribute('role', 'listbox');

  // Search
  const searchWrap = document.createElement('div');
  searchWrap.className = 'uf-select-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Search';
  searchInput.autocomplete = 'off';
  searchWrap.appendChild(searchInput);
  dropdown.appendChild(searchWrap);

  // Scrollable options list container (max-height: 400px, overflow: auto)
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
          e.preventDefault(); // prevent blur before click registers
          display.textContent = opt;
          native.value = opt;
          list.querySelectorAll('.uf-select-option').forEach((el) => el.classList.remove('selected'));
          item.classList.add('selected');
          close();
        });
        list.appendChild(item);
      });
  };

  buildOptions();
  dropdown.appendChild(list); // list is inside dropdown, after search

  const open = () => {
    wrapper.classList.add('open');
    searchInput.value = '';
    buildOptions();
    searchInput.focus();
  };
  const close = () => wrapper.classList.remove('open');

  // Toggle on display/arrow click
  display.addEventListener('click', () => (wrapper.classList.contains('open') ? close() : open()));
  arrowWrap.addEventListener('click', () => (wrapper.classList.contains('open') ? close() : open()));

  // Search filter
  searchInput.addEventListener('input', () => buildOptions(searchInput.value));

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) close();
  });

  wrapper.appendChild(native);
  wrapper.appendChild(display);
  wrapper.appendChild(arrowWrap);
  wrapper.appendChild(dropdown);
  return wrapper;
}

/**
 * Build a product tile with a custom radio button (circle icon + label + image).
 */
function buildProductTile(imgCell, labelCell, name) {
  const tile = document.createElement('div');
  tile.className = 'uf-product-tile';

  // Radio field container (positions input absolutely over the whole row)
  const radioField = document.createElement('div');
  radioField.className = 'uf-radio-field';

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = name;
  radio.required = true;

  // Custom radio row — label wraps icon SVG + text (mirrors source structure)
  const radioRow = document.createElement('label');
  radioRow.className = 'uf-radio-row';

  // SVG circle icon — circle fills almost entire viewBox, stroke creates white gap
  // Matches source: viewBox maps circle r=20.3 in 43.2 space = ~94% coverage
  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('aria-hidden', 'true');
  iconSvg.className.baseVal = 'uf-radio-icon';
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '11'); // large radius — fills most of the 24px viewBox
  iconSvg.appendChild(circle);

  const labelText = document.createElement('span');
  labelText.className = 'uf-product-label';
  labelText.textContent = labelCell?.textContent?.trim() || '';

  radioRow.appendChild(iconSvg);
  radioRow.appendChild(labelText);
  radioField.appendChild(radio);
  radioField.appendChild(radioRow);

  tile.appendChild(radioField);

  const img = imgCell?.querySelector('img');
  if (img) tile.appendChild(img);

  return tile;
}

export default async function decorate(block) {
  const rows = [...block.children];

  const formBody = document.createElement('div');
  formBody.className = 'uf-form-body';

  // ── Row 0: Banner image — replaced with CSS background div ──
  const bannerRow = rows[0];
  if (bannerRow) bannerRow.style.display = 'none';

  // ── Row 1: Region / Language ─────────────────────────────────────
  const regionRow = rows[1];
  if (regionRow) {
    const cell = regionRow.querySelector('div');
    const h3 = cell?.querySelector('h3');
    const p = cell?.querySelector('p');
    if (h3 && p) {
      const options = p.textContent.split('|').map((o) => o.trim()).filter(Boolean);
      const widget = buildCustomSelect(options, 'lang_switch');
      p.replaceWith(widget);
    }
    formBody.appendChild(regionRow);
  }

  // ── Row 2: Product heading ───────────────────────────────────────
  if (rows[2]) formBody.appendChild(rows[2]);

  // ── Row 3: Product tiles ─────────────────────────────────────────
  const productRow = rows[3];
  if (productRow) {
    const cells = [...productRow.children];
    const productsDiv = document.createElement('div');
    productsDiv.className = 'uf-products';
    for (let i = 0; i < cells.length; i += 2) {
      productsDiv.appendChild(buildProductTile(cells[i], cells[i + 1], 'opt_article'));
    }
    productRow.innerHTML = '';
    productRow.appendChild(productsDiv);
    formBody.appendChild(productRow);
  }

  // ── Row 4: Footnote ──────────────────────────────────────────────
  const footnoteRow = rows[4];
  if (footnoteRow) {
    footnoteRow.className = 'uf-footnote-row';
    const p = footnoteRow.querySelector('p');
    if (p) p.className = 'uf-footnote';
    formBody.appendChild(footnoteRow);
  }

  // ── Row 5: Info heading ──────────────────────────────────────────
  if (rows[5]) formBody.appendChild(rows[5]);

  // ── Rows 6–10: Form field rows ───────────────────────────────────
  for (let r = 6; r <= 10; r += 1) {
    const row = rows[r];
    if (!row) continue;
    const cells = [...row.children];
    const fieldsRow = document.createElement('div');
    fieldsRow.className = 'uf-fields-row';

    cells.forEach((cell) => {
      const text = cell.textContent.trim();
      const parts = text.split('|').map((s) => s.trim());
      if (parts.length >= 3) {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'uf-field';

        const lbl = document.createElement('label');
        lbl.textContent = parts[0];

        let input;
        if (parts[1] === 'textarea') {
          input = document.createElement('textarea');
        } else {
          input = document.createElement('input');
          input.type = parts[1] || 'text';
        }
        input.name = parts[2] || '';
        if (parts[3] === 'required') input.required = true;

        fieldDiv.appendChild(lbl);
        fieldDiv.appendChild(input);
        cell.innerHTML = '';
        cell.appendChild(fieldDiv);
        fieldsRow.appendChild(cell);
      }
    });

    row.innerHTML = '';
    row.appendChild(fieldsRow);
    formBody.appendChild(row);
  }

  // ── Row 11: Required note ────────────────────────────────────────
  const requiredNote = rows[11];
  if (requiredNote) {
    const p = requiredNote.querySelector('p');
    if (p) p.className = 'uf-required-note';
    formBody.appendChild(requiredNote);
  }

  // ── Row 12: Upload DICOM ─────────────────────────────────────────
  const uploadRow = rows[12];
  if (uploadRow) {
    uploadRow.className = 'uf-upload-row';
    const cell = uploadRow.querySelector('div');
    if (cell) {
      cell.className = 'uf-upload-section';
      [...cell.querySelectorAll('p')].forEach((p) => {
        if (p.textContent.startsWith('file-upload|')) {
          const parts = p.textContent.split('|');
          const fileLabel = document.createElement('label');
          fileLabel.className = 'uf-file-input';
          fileLabel.textContent = 'Select files ...';
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.name = parts[1] || 'files[]';
          fileInput.accept = parts[2] || '.pdf,.zip,.rar';
          fileInput.multiple = true;
          fileInput.style.display = 'none';
          fileLabel.appendChild(fileInput);
          p.replaceWith(fileLabel);
        }
      });
    }
    formBody.appendChild(uploadRow);
  }

  // ── Row 13: Terms, checkboxes, submit ────────────────────────────
  const termsRow = rows[13];
  if (termsRow) {
    const cell = termsRow.querySelector('div');
    if (cell) {
      cell.className = 'uf-terms';
      [...cell.querySelectorAll('p')].forEach((p) => {
        const text = p.textContent.trim();
        if (text.startsWith('checkbox|')) {
          const parts = text.split('|');
          const cbLabel = document.createElement('label');
          cbLabel.className = 'uf-checkbox-row';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.name = parts[1] || '';
          if (parts[3] === 'required') cb.required = true;
          const span = document.createElement('span');
          const link = p.querySelector('a');
          if (link) {
            span.innerHTML = `${parts[2].replace(/<[^>]*>/g, '')} `;
            span.appendChild(link);
          } else {
            span.textContent = parts[2] || '';
          }
          cbLabel.appendChild(cb);
          cbLabel.appendChild(span);
          p.replaceWith(cbLabel);
        } else if (text.startsWith('submit|')) {
          const parts = text.split('|');
          const btn = document.createElement('button');
          btn.type = 'submit';
          btn.className = 'uf-submit-btn';
          btn.textContent = parts[1] || 'SUBMIT';
          const wrapper = document.createElement('div');
          wrapper.appendChild(btn);
          p.replaceWith(wrapper);
        }
      });
    }
    formBody.appendChild(termsRow);
  }

  // ── Row 14: Disclaimer ───────────────────────────────────────────
  const disclaimerRow = rows[14];
  if (disclaimerRow) {
    disclaimerRow.className = 'uf-disclaimer-row';
    const cell = disclaimerRow.querySelector('div');
    if (cell) cell.className = 'uf-disclaimer';
    formBody.appendChild(disclaimerRow);
  }

  // Wrap in <form>
  const form = document.createElement('form');
  form.method = 'post';
  form.enctype = 'multipart/form-data';
  form.noValidate = true;

  block.innerHTML = '';

  // ── Banner strip (tutoplast.jpg, 104px visible height matching source) ──
  const bannerDiv = document.createElement('div');
  bannerDiv.className = 'uf-banner';
  block.appendChild(bannerDiv);

  while (formBody.firstChild) form.appendChild(formBody.firstChild);
  formBody.appendChild(form);
  block.appendChild(formBody);
}
