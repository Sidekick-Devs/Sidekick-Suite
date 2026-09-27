const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const elements = new Map();
  function element() {
    return {value:'', style:{}, children:[], events:{}, disabled:false,
      addEventListener(name, fn) { this.events[name] = fn; },
      setAttribute() {}, replaceChildren() { this.children = []; },
      append(...children) { this.children.push(...children); },
      querySelectorAll() { return [...elements.values()]; }};
  }
  const get = id => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  const downloads = [];
  const entries = new Map();
  class Zip {
    file(name, data) { entries.set(name, data); }
    async generateAsync() { return new Blob(['zip stub']); }
  }
  const context = vm.createContext({Blob, JSZip:Zip,
    document:{getElementById:get, createElement:element},
    downloadBlob:(blob, name) => downloads.push({blob, name})});
  vm.runInContext(fs.readFileSync('file-export.js', 'utf8'), context);
  return {get:id => get('export-' + id), pane:get('tab-export'), downloads, entries, context};
}

test('long Unicode logs preserve whitespace in TXT/Markdown and round-trip JSON', async () => {
  const s = setup();
  const text = '  Lỗi 😃\n\t<script>alert(1)</script>\\path\n'.repeat(30000);
  s.get('text').value = text;
  s.get('name').value = 'error-log.txt';
  for (const format of ['txt','md','json','html']) {
    s.get('format').value = format;
    await s.get('download').onclick();
    const result = s.downloads.at(-1);
    assert.equal(result.name, 'error-log.' + format);
    const output = await result.blob.text();
    if (format === 'json') assert.equal(JSON.parse(output).content, text);
    else if (format === 'html') {
      assert.ok(output.includes('&lt;script&gt;'));
      assert.ok(!output.includes('<script>'));
    } else assert.equal(output, text);
  }
});

test('attachments select ZIP, preserve bytes and get unique safe names', async () => {
  const s = setup();
  const files = ['../clip.mp4','../clip.mp4'].map(name => new File([new Uint8Array([0,255,7])], name));
  s.get('files').events.change({target:{files, value:''}});
  assert.equal(s.get('format').value, 'zip');
  s.get('format').value = 'txt';
  await s.get('download').onclick();
  assert.equal(s.downloads.length, 0);
  s.get('format').value = 'zip';
  s.get('text').value = 'log';
  await s.get('download').onclick();
  assert.deepEqual([...s.entries.keys()], ['content.txt','attachments/.._clip.mp4','attachments/.._clip_2.mp4','content.md']);
  assert.deepEqual(new Uint8Array(s.entries.get('attachments/.._clip.mp4')), new Uint8Array([0,255,7]));
  assert.ok(s.entries.get('content.md').includes('attachments/.._clip_2.mp4'));
  s.get('clear').onclick();
  assert.equal(s.get('download').disabled, true);
});

test('missing ZIP library reports error and restores controls', async () => {
  const s = setup();
  s.context.JSZip = undefined;
  s.get('text').value = 'log';
  s.get('format').value = 'zip';
  await s.get('download').onclick();
  assert.match(s.get('status').textContent, /Chưa tải được thư viện ZIP/);
  assert.equal(s.get('download').disabled, false);
  assert.equal(s.downloads.length, 0);
});
