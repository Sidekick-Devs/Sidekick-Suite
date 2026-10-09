// QR Code: payload builders are pure (exported as SidekickQR for tests); rendering stays in the browser.
(() => {
  const stripAccents = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFC');
  const slug = text => stripAccents(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const clean = value => String(value ?? '').trim();

  // vCard 3.0 is the version both the iOS Camera and Android (Google Lens / camera) open as "Add contact".
  const escapeVCard = value => clean(value).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/[,;]/g, '\\$&');

  function buildVCard(data, options = {}) {
    const raw = data || {};
    const d = {};
    for (const key of Object.keys(raw)) d[key] = options.stripAccents ? stripAccents(clean(raw[key])) : clean(raw[key]);
    // Vietnamese order: Họ + tên đệm/tên. Contacts apps localize display order from N.
    const fullName = [d.family, d.given].filter(Boolean).join(' ') || d.org;
    if (!fullName) return '';
    const lines = ['BEGIN:VCARD', 'VERSION:3.0',
      `N:${escapeVCard(d.family)};${escapeVCard(d.given)};;;`,
      `FN:${escapeVCard(fullName)}`];
    if (d.org || d.dept) lines.push(`ORG:${[d.org, d.dept].filter(Boolean).map(escapeVCard).join(';')}`);
    if (d.title) lines.push(`TITLE:${escapeVCard(d.title)}`);
    if (d.mobile) lines.push(`TEL;TYPE=CELL:${escapeVCard(d.mobile)}`);
    if (d.work) lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(d.work)}`);
    if (d.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeVCard(d.email)}`);
    if (d.url) lines.push(`URL:${escapeVCard(withScheme(d.url))}`);
    if (d.street || d.city || d.country) {
      lines.push(`ADR;TYPE=WORK:;;${escapeVCard(d.street)};${escapeVCard(d.city)};;;${escapeVCard(d.country)}`);
    }
    if (d.note) lines.push(`NOTE:${escapeVCard(d.note)}`);
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  const withScheme = url => {
    const value = clean(url);
    return !value || /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : 'https://' + value;
  };
  const escapeWifi = value => String(value ?? '').replace(/[\\;,:"]/g, '\\$&');

  function buildWifi(data) {
    const d = data || {};
    if (!clean(d.ssid)) return '';
    const auth = ['WPA', 'WEP', 'nopass'].includes(d.auth) ? d.auth : 'WPA';
    return `WIFI:T:${auth};S:${escapeWifi(d.ssid)};` + (auth === 'nopass' ? '' : `P:${escapeWifi(d.password)};`) +
      (d.hidden ? 'H:true;' : '') + ';';
  }

  function buildEmail(data) {
    const d = data || {};
    const to = clean(d.to);
    if (!to) return '';
    const params = [['subject', d.subject], ['body', d.body]].filter(([, v]) => clean(v))
      .map(([k, v]) => `${k}=${encodeURIComponent(clean(v))}`);
    return `mailto:${to}` + (params.length ? '?' + params.join('&') : '');
  }

  function buildPhone(data) {
    const number = clean(data?.number).replace(/[^\d+]/g, '');
    return number ? `tel:${number}` : '';
  }

  const builders = {
    vcard: buildVCard,
    url: data => withScheme(data?.url),
    text: data => String(data?.text ?? '').trim() ? String(data.text) : '',
    wifi: buildWifi,
    email: buildEmail,
    phone: buildPhone
  };

  function fileBase(type, data) {
    const name = type === 'vcard' ? [data.family, data.given].filter(Boolean).join(' ') || data.org
      : type === 'wifi' ? data.ssid : '';
    return ['qr', type, slug(name)].filter(Boolean).join('-');
  }

  // Path of dark modules with a 4-module quiet zone; one unit per module.
  function svgMarkup(qr, color) {
    const count = qr.getModuleCount();
    const size = count + 8;
    let path = '';
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) path += `M${c + 4} ${r + 4}h1v1h-1z`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
      `<rect width="${size}" height="${size}" fill="#ffffff"/><path d="${path}" fill="${color}"/></svg>`;
  }

  // Relative luminance; QR readers need dark modules on the white background.
  function luminance(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return 0;
    return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255)
      .map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  }

  globalThis.SidekickQR = {buildVCard, buildWifi, buildEmail, buildPhone, builders, stripAccents, fileBase, svgMarkup, luminance};

  const pane = typeof document !== 'undefined' && document.getElementById('tab-qr');
  if (!pane) return;
  const get = id => document.getElementById('qr-' + id);
  let type = 'vcard';
  let current = null;

  function readFields() {
    const data = {};
    pane.querySelectorAll(`[data-qr-type="${type}"] [data-qr]`).forEach(el => {
      data[el.dataset.qr] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return data;
  }

  function setStatus(text, tone) {
    const box = get('warn');
    box.textContent = text;
    box.className = tone ? `alert alert-${tone}` : '';
    box.style.display = text ? '' : 'none';
  }

  function update() {
    const data = readFields();
    const payload = builders[type](data, {stripAccents: get('strip').checked});
    const color = get('color').value;
    current = null;
    get('payload').value = payload;
    pane.querySelectorAll('[data-qr-needs]').forEach(btn => { btn.disabled = true; });
    if (!payload) {
      get('preview').innerHTML = '<div class="qr-empty">Nhập thông tin để tạo QR</div>';
      get('info').textContent = '';
      setStatus('');
      return;
    }
    if (typeof qrcode === 'undefined') {
      setStatus('Chưa tải được thư viện QR. Hãy kiểm tra kết nối và tải lại trang.', 'danger');
      return;
    }
    let qr;
    try {
      qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
      qr = qrcode(0, get('ecc').value);
      qr.addData(payload, 'Byte');
      qr.make();
    } catch (error) {
      get('preview').innerHTML = '<div class="qr-empty">Nội dung quá dài</div>';
      get('info').textContent = '';
      setStatus('Nội dung vượt quá dung lượng QR. Hãy bớt trường, rút ngắn ghi chú hoặc giảm mức sửa lỗi.', 'danger');
      return;
    }
    const bytes = new TextEncoder().encode(payload).length;
    const count = qr.getModuleCount();
    const version = (count - 17) / 4;
    current = {qr, payload, color, name: fileBase(type, data)};
    get('preview').innerHTML = svgMarkup(qr, color);
    get('info').textContent = `Version ${version} · ${count}×${count} ô · ${bytes} byte · sửa lỗi ${get('ecc').value}`;
    pane.querySelectorAll('[data-qr-needs]').forEach(btn => { btn.disabled = false; });
    if (luminance(color) > 0.3) setStatus('Màu QR quá sáng so với nền trắng, nhiều máy sẽ không quét được. Nên dùng màu đậm.', 'danger');
    else if (version >= 15) setStatus('QR khá dày: in tối thiểu 3×3 cm, hoặc bớt trường / bật "Bỏ dấu" để điện thoại quét nhanh hơn.', 'info');
    else setStatus('');
  }

  function selectType(next) {
    type = builders[next] ? next : 'vcard';
    pane.querySelectorAll('[data-qr-tab]').forEach(tag => tag.classList.toggle('active', tag.dataset.qrTab === type));
    pane.querySelectorAll('[data-qr-type]').forEach(group => { group.hidden = group.dataset.qrType !== type; });
    get('strip-wrap').hidden = type !== 'vcard';
    get('vcf').hidden = type !== 'vcard';
    update();
  }

  pane.querySelectorAll('[data-qr-tab]').forEach(tag => { tag.onclick = () => selectType(tag.dataset.qrTab); });
  pane.addEventListener('input', update);
  pane.addEventListener('change', update);

  get('png').onclick = () => {
    if (!current) return;
    const count = current.qr.getModuleCount() + 8;
    const scale = Math.max(8, Math.ceil(1024 / count));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = count * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = current.color;
    const modules = current.qr.getModuleCount();
    for (let r = 0; r < modules; r++) for (let c = 0; c < modules; c++) {
      if (current.qr.isDark(r, c)) ctx.fillRect((c + 4) * scale, (r + 4) * scale, scale, scale);
    }
    const name = current.name;
    canvas.toBlob(blob => downloadBlob(blob, `${name}.png`), 'image/png');
  };
  get('svg').onclick = () => {
    if (current) downloadBlob(new Blob([svgMarkup(current.qr, current.color)], {type: 'image/svg+xml'}), `${current.name}.svg`);
  };
  get('vcf').onclick = () => {
    if (current && type === 'vcard') downloadBlob(new Blob([current.payload], {type: 'text/vcard;charset=utf-8'}), `${current.name.replace(/^qr-vcard-?/, '') || 'contact'}.vcf`);
  };
  get('copy').onclick = () => {
    if (!current) return;
    navigator.clipboard.writeText(current.payload).then(() => {
      get('copy').textContent = 'Đã copy';
      setTimeout(() => { get('copy').textContent = 'Copy nội dung'; }, 1500);
    });
  };
  get('reset').onclick = () => {
    pane.querySelectorAll(`[data-qr-type="${type}"] [data-qr]`).forEach(el => {
      if (el.type === 'checkbox') el.checked = false;
      else if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    });
    update();
  };

  selectType('vcard');
})();
