// File Export: content stays in memory until the user downloads it.
(() => {
  const get = id => document.getElementById('export-' + id);
  const pane = document.getElementById('tab-export');
  let attachments = [];
  let busy = false;
  const safeName = name => (name || '').normalize('NFC')
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '_').replace(/[. ]+$/g, '').slice(0, 120) || 'untitled';
  const escape = text => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function update() {
    get('stats').textContent = `${get('text').value.length.toLocaleString('vi-VN')} ký tự · ${attachments.length} tệp đính kèm`;
    get('file-list').replaceChildren();
    attachments.forEach((file, index) => {
      const row = document.createElement('li');
      row.style.cssText = 'display:flex;gap:12px;align-items:center;overflow-wrap:anywhere;';
      const label = document.createElement('span');
      label.style.flex = '1';
      label.textContent = `${file.name} (${(file.size / 1024).toLocaleString('vi-VN', {maximumFractionDigits:1})} KB)`;
      const remove = document.createElement('button');
      remove.className = 'btn';
      remove.textContent = 'Xóa';
      remove.disabled = busy;
      remove.setAttribute('aria-label', `Xóa ${file.name}`);
      remove.onclick = () => { attachments.splice(index, 1); update(); };
      row.append(label, remove);
      get('file-list').append(row);
    });
    get('download').disabled = busy || (!get('text').value.length && !attachments.length);
  }

  function addFiles(files) {
    if (busy) return;
    attachments.push(...Array.from(files));
    if (attachments.length) get('format').value = 'zip';
    get('status').textContent = '';
    update();
  }
  get('files').addEventListener('change', event => {
    addFiles(event.target.files);
    event.target.value = '';
  });
  get('text').addEventListener('input', update);
  pane.addEventListener('paste', event => {
    const files = event.clipboardData?.files;
    if (!files?.length) return;
    addFiles(files);
    // Let the textarea insert accompanying plain text at the cursor as usual.
    if (!event.clipboardData.getData('text/plain')) event.preventDefault();
  });
  pane.addEventListener('dragover', event => {
    if (Array.from(event.dataTransfer.types).includes('Files')) event.preventDefault();
  });
  pane.addEventListener('drop', event => {
    if (!event.dataTransfer.files.length) return;
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  });
  get('clear').onclick = () => {
    attachments = [];
    get('text').value = '';
    get('files').value = '';
    get('status').textContent = '';
    update();
  };

  get('download').onclick = async () => {
    if (busy) return;
    const content = get('text').value;
    const format = get('format').value;
    const files = attachments.slice();
    if (!content.length && !files.length) return;
    if (files.length && format !== 'zip') {
      get('status').textContent = 'Nội dung có tệp đính kèm. Chọn ZIP để xuất đầy đủ, hoặc xóa tệp trước khi xuất văn bản.';
      return;
    }
    const name = safeName(get('name').value.trim().replace(/\.(txt|md|json|html|zip)$/i, '') || 'export');
    busy = true;
    pane.querySelectorAll('input, textarea, select, button').forEach(el => { el.disabled = true; });
    update();
    get('status').textContent = 'Đang tạo file…';
    try {
      let blob;
      if (format === 'zip') {
        if (typeof JSZip === 'undefined') throw new Error('Chưa tải được thư viện ZIP. Hãy kiểm tra kết nối và tải lại trang.');
        const zip = new JSZip();
        zip.file('content.txt', content);
        const used = new Set();
        const links = [];
        for (const file of files) {
          const original = safeName(file.name);
          const dot = original.lastIndexOf('.');
          const stem = dot > 0 ? original.slice(0, dot) : original;
          const ext = dot > 0 ? original.slice(dot) : '';
          let unique = original;
          let count = 2;
          while (used.has(unique.toLowerCase())) unique = `${stem}_${count++}${ext}`;
          used.add(unique.toLowerCase());
          const path = 'attachments/' + unique;
          zip.file(path, await file.arrayBuffer());
          const urlName = encodeURIComponent(unique).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16));
          links.push(`- [${escape(unique).replace(/[\[\]\\]/g, '\\$&')}](attachments/${urlName})`);
        }
        zip.file('content.md', content + (links.length ? '\n\n## Tệp đính kèm\n\n' + links.join('\n') + '\n' : ''));
        blob = await zip.generateAsync({type:'blob', compression:'STORE'});
      } else if (format === 'json') {
        blob = new Blob([JSON.stringify({content}, null, 2)], {type:'application/json;charset=utf-8'});
      } else if (format === 'html') {
        const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(name)}</title><style>body{max-width:960px;margin:32px auto;padding:0 20px;font-family:monospace}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><pre>${escape(content)}</pre></body></html>`;
        blob = new Blob([html], {type:'text/html;charset=utf-8'});
      } else if (format === 'txt' || format === 'md') {
        blob = new Blob([content], {type:format === 'txt' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8'});
      } else throw new Error('Định dạng chưa được hỗ trợ.');
      downloadBlob(blob, `${name}.${format}`);
      get('status').textContent = `Đã tạo ${name}.${format} và gửi yêu cầu tải xuống.`;
    } catch (error) {
      get('status').textContent = `Không thể xuất file: ${error.message}`;
    } finally {
      busy = false;
      pane.querySelectorAll('input, textarea, select, button').forEach(el => { el.disabled = false; });
      update();
    }
  };
  update();
})();
