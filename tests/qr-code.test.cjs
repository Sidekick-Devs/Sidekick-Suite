const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load() {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync('qr-code.js', 'utf8'), context);
  return context.SidekickQR;
}

const sample = {
  family:'Nguyễn', given:'Văn An', org:'Sidekick Communications Ltd', dept:'Marketing',
  title:'Account Manager', mobile:'+84 912 345 678', work:'028 1234 5678', email:'an.nguyen@sidekick.vn',
  url:'sidekick.vn', street:'12 Nguyễn Huệ, Quận 1', city:'TP. Hồ Chí Minh', country:'Việt Nam', note:'Gặp tại; sự kiện\ndòng 2'
};

test('vCard 3.0 has every contact field with CRLF lines and escaped values', () => {
  const card = load().buildVCard(sample);
  assert.deepEqual(card.split('\r\n'), [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Nguyễn;Văn An;;;',
    'FN:Nguyễn Văn An',
    'ORG:Sidekick Communications Ltd;Marketing',
    'TITLE:Account Manager',
    'TEL;TYPE=CELL:+84 912 345 678',
    'TEL;TYPE=WORK,VOICE:028 1234 5678',
    'EMAIL;TYPE=INTERNET,WORK:an.nguyen@sidekick.vn',
    'URL:https://sidekick.vn',
    'ADR;TYPE=WORK:;;12 Nguyễn Huệ\\, Quận 1;TP. Hồ Chí Minh;;;Việt Nam',
    'NOTE:Gặp tại\\; sự kiện\\ndòng 2',
    'END:VCARD'
  ]);
});

test('vCard omits empty fields, falls back to company name and is empty without a name', () => {
  const qr = load();
  assert.equal(qr.buildVCard({}), '');
  assert.equal(qr.buildVCard({given:'  ', email:'a@b.c'}), '');
  assert.equal(qr.buildVCard({org:'Sidekick', mobile:'0912'}),
    'BEGIN:VCARD\r\nVERSION:3.0\r\nN:;;;;\r\nFN:Sidekick\r\nORG:Sidekick\r\nTEL;TYPE=CELL:0912\r\nEND:VCARD');
});

test('stripAccents option removes Vietnamese diacritics including đ', () => {
  const qr = load();
  const card = qr.buildVCard({family:'Đặng', given:'Thị Ánh Tuyết', city:'Đà Nẵng'}, {stripAccents:true});
  assert.match(card, /^N:Dang;Thi Anh Tuyet;;;$/m);
  assert.match(card, /^ADR;TYPE=WORK:;;;Da Nang;;;$/m);
  assert.equal(/[^\x00-\x7f]/.test(card), false);
});

test('WiFi, email, phone and URL payloads follow scanner formats', () => {
  const qr = load();
  assert.equal(qr.buildWifi({ssid:'Sidekick;Guest', password:'p:a"ss\\', auth:'WPA'}),
    'WIFI:T:WPA;S:Sidekick\\;Guest;P:p\\:a\\"ss\\\\;;');
  assert.equal(qr.buildWifi({ssid:'Open', password:'ignored', auth:'nopass', hidden:true}), 'WIFI:T:nopass;S:Open;H:true;;');
  assert.equal(qr.buildWifi({ssid:''}), '');
  assert.equal(qr.buildEmail({to:'a@b.vn', subject:'Xin chào & hẹn', body:''}), 'mailto:a@b.vn?subject=Xin%20ch%C3%A0o%20%26%20h%E1%BA%B9n');
  assert.equal(qr.buildPhone({number:'+84 (912) 345-678'}), 'tel:+84912345678');
  assert.equal(qr.builders.url({url:'sidekick.vn/a'}), 'https://sidekick.vn/a');
  assert.equal(qr.builders.url({url:'mailto:x@y.z'}), 'mailto:x@y.z');
});

test('file names are ASCII slugs and SVG keeps a 4-module quiet zone', () => {
  const qr = load();
  assert.equal(qr.fileBase('vcard', sample), 'qr-vcard-nguyen-van-an');
  assert.equal(qr.fileBase('url', {}), 'qr-url');
  const stub = {getModuleCount:() => 2, isDark:(r, c) => r === c};
  assert.equal(qr.svgMarkup(stub, '#000000'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" shape-rendering="crispEdges">' +
    '<rect width="10" height="10" fill="#ffffff"/><path d="M4 4h1v1h-1zM5 5h1v1h-1z" fill="#000000"/></svg>');
  assert.ok(qr.luminance('#000000') < 0.01 && qr.luminance('#ffff00') > 0.3);
});
