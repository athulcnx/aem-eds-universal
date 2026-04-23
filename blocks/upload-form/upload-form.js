export default async function decorate(block) {
  const rows = [...block.children];

  // Create a wrapper for the entire form body
  const formBody = document.createElement('div');
  formBody.className = 'uf-form-body';

  // Row 0: Banner image
  const bannerRow = rows[0];
  if (bannerRow) {
    bannerRow.className = 'uf-banner';
    const img = bannerRow.querySelector('img');
    if (img) {
      img.style.width = '100%';
      img.style.height = '170px';
      img.style.objectFit = 'cover';
    }
  }

  // Row 1: Region / Language selector
  const regionRow = rows[1];
  if (regionRow) {
    const cell = regionRow.querySelector('div');
    const h3 = cell?.querySelector('h3');
    const p = cell?.querySelector('p');
    if (h3 && p) {
      const options = p.textContent.split('|').map((o) => o.trim());
      const select = document.createElement('select');
      select.className = 'uf-select';
      select.name = 'lang_switch';
      options.forEach((opt) => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt.includes('UK/Ireland')) option.selected = true;
        select.appendChild(option);
      });
      p.replaceWith(select);
    }
    formBody.appendChild(regionRow);
  }

  // Row 2: Product heading
  const productHeadingRow = rows[2];
  if (productHeadingRow) {
    formBody.appendChild(productHeadingRow);
  }

  // Row 3: Product tiles (image and label cells)
  const productRow = rows[3];
  if (productRow) {
    const cells = [...productRow.children];
    const productsDiv = document.createElement('div');
    productsDiv.className = 'uf-products';

    // Cells come in pairs: image, label
    for (let i = 0; i < cells.length; i += 2) {
      const imgCell = cells[i];
      const labelCell = cells[i + 1];

      const tile = document.createElement('div');
      tile.className = 'uf-product-tile';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'opt_article';
      radio.required = true;

      const label = document.createElement('span');
      label.className = 'uf-product-label';
      label.textContent = labelCell?.textContent?.trim() || '';

      const img = imgCell?.querySelector('img');

      tile.appendChild(radio);
      tile.appendChild(label);
      if (img) tile.appendChild(img);

      productsDiv.appendChild(tile);
    }

    productRow.innerHTML = '';
    productRow.appendChild(productsDiv);
    formBody.appendChild(productRow);
  }

  // Row 4: Product footnote
  const footnoteRow = rows[4];
  if (footnoteRow) {
    footnoteRow.className = 'uf-footnote-row';
    const p = footnoteRow.querySelector('p');
    if (p) p.className = 'uf-footnote';
    formBody.appendChild(footnoteRow);
  }

  // Row 5: Info heading
  const infoHeadingRow = rows[5];
  if (infoHeadingRow) {
    formBody.appendChild(infoHeadingRow);
  }

  // Rows 6–10: Form field rows
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

  // Row 11: Required fields note
  const requiredNote = rows[11];
  if (requiredNote) {
    const p = requiredNote.querySelector('p');
    if (p) p.className = 'uf-required-note';
    formBody.appendChild(requiredNote);
  }

  // Row 12: Upload DICOM Data section
  const uploadRow = rows[12];
  if (uploadRow) {
    uploadRow.className = 'uf-upload-row';
    const cell = uploadRow.querySelector('div');
    if (cell) {
      cell.className = 'uf-upload-section';
      // Find and replace the file-upload placeholder
      const paragraphs = [...cell.querySelectorAll('p')];
      paragraphs.forEach((p) => {
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

  // Row 13: Terms, checkboxes, submit
  const termsRow = rows[13];
  if (termsRow) {
    const cell = termsRow.querySelector('div');
    if (cell) {
      cell.className = 'uf-terms';
      const paragraphs = [...cell.querySelectorAll('p')];
      paragraphs.forEach((p) => {
        const text = p.textContent.trim();
        if (text.startsWith('checkbox|')) {
          const parts = text.split('|');
          const checkboxRow = document.createElement('label');
          checkboxRow.className = 'uf-checkbox-row';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.name = parts[1] || '';
          if (parts[3] === 'required') cb.required = true;

          const span = document.createElement('span');
          // Check for link in checkbox label
          const link = p.querySelector('a');
          if (link) {
            span.innerHTML = `${parts[2].replace(/<[^>]*>/g, '')} `;
            span.appendChild(link);
          } else {
            span.textContent = parts[2] || '';
          }

          checkboxRow.appendChild(cb);
          checkboxRow.appendChild(span);
          p.replaceWith(checkboxRow);
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

  // Row 14: Disclaimer
  const disclaimerRow = rows[14];
  if (disclaimerRow) {
    disclaimerRow.className = 'uf-disclaimer-row';
    const cell = disclaimerRow.querySelector('div');
    if (cell) cell.className = 'uf-disclaimer';
    formBody.appendChild(disclaimerRow);
  }

  // Wrap everything in a form element
  const form = document.createElement('form');
  form.method = 'post';
  form.enctype = 'multipart/form-data';
  form.noValidate = true;

  // Keep banner outside the form body wrapper
  block.innerHTML = '';
  if (bannerRow) block.appendChild(bannerRow);

  // Move all form content into the form element within formBody
  while (formBody.firstChild) {
    form.appendChild(formBody.firstChild);
  }
  formBody.appendChild(form);
  block.appendChild(formBody);
}
