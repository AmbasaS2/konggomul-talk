import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';

// Exercise the exact function in index.js without booting SillyTavern.
const source = fs.readFileSync(new URL('./index.js', import.meta.url), 'utf8');
const functionStart = source.indexOf('function isImageOrFileOnlyReply(text) {');
const functionEnd = source.indexOf('\nfunction textOnlyTail(', functionStart);
assert.ok(functionStart >= 0 && functionEnd > functionStart, 'image-reply predicate must exist');
const isImageOrFileOnlyReply = vm.runInNewContext(
  '(' + source.slice(functionStart, functionEnd).trim() + ')',
);

function legacyIsImageOrFileOnlyReply(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  if (/^!\[[^\]]*\]\((?:https?:\/\/|blob:|data:image\/)[^)]+\)\s*$/i.test(value)) return true;
  if (/^(?:https?:\/\/|blob:|data:image\/)\S+$/i.test(value)) return true;
  if (/\.(?:png|jpe?g|webp|gif|bmp|svg)(?:\?\S*)?$/i.test(value)) return true;
  if (/^\[.*?\]\((?:https?:\/\/|blob:|data:image\/)[^)]+\)\s*$/i.test(value) && value.length < 500) return true;
  return false;
}

test('image-only replies preserve existing image and ordinary-text behavior', () => {
  const cases = [
    ['', false],
    ['Just a normal chat message.', false],
    ['image.png', true],
    ['photo.jpg', true],
    ['photo.jpeg', true],
    ['picture.webp?size=full&v=3', true],
    ['foo.svg', true],
    ['see attached file.bmp', true],
    ['https://example.test/path-without-extension', true],
    ['blob:abc-def-123', true],
    ['data:image/png;base64,AAAA', true],
    ['![](https://example.test/image.png)', true],
    ['[image](https://example.test/image.png)', true],
    ['image.png plus additional normal words', false],
    ['image.png?view=1 and normal words', false],
    ['text.jpg\nmore text', false],
    ['text.jpg\nanother.png', true],
  ];
  for (const [input, expected] of cases) {
    assert.equal(isImageOrFileOnlyReply(input), expected, JSON.stringify(input));
    assert.equal(isImageOrFileOnlyReply(input), legacyIsImageOrFileOnlyReply(input));
  }
});

test('file classification is unchanged for 70,000 deterministic varied inputs', () => {
  const chars = ['.', 'p', 'n', 'g', '?', 'w', 'j', 'e', 'b', 's', 'v', 'a',
    ' ', '\n', '\t', '/', 'x', 'z', '한', '🦊', '[', ']', '(', ')', '&'];
  let seed = 0x20261123;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 70_000; i++) {
    const len = Math.floor(random() * 180);
    let input = '';
    for (let j = 0; j < len; j++) input += chars[Math.floor(random() * chars.length)];
    assert.equal(isImageOrFileOnlyReply(input), legacyIsImageOrFileOnlyReply(input), 'sample ' + i);
  }
});

test('long image-like AI text cannot trigger quadratic extension scans', () => {
  const crafted = '.png?'.repeat(20_000) + ' x';
  const start = performance.now();
  assert.equal(isImageOrFileOnlyReply(crafted), false);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 1000, '100k-character malformed image-like text should not stall chat: ' + elapsed + 'ms');
});
