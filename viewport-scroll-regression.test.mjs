import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('./index.js', import.meta.url), 'utf8');
function extract(name) {
    const a = source.indexOf('function ' + name + '('), b = source.indexOf('\n}', a);
    assert.ok(a >= 0 && b > a);
    return source.slice(a, b + 2);
}
function fixture() {
    let visible = false, group = false;
    const frames = [], writes = [];
    const panelEl = { classList: { contains: name => name === 'tua-visible' && visible } };
    const box = { dataset: { renderRoom: 'a' }, isConnected: true, scrollHeight: 100,
        set scrollTop(value) { writes.push(value); } };
    let size = 0, position = 0;
    const ctx = vm.createContext({
        panelEl, panelViewportRepairRaf: null,
        applyViewportPanelSize: () => { size++; },
        applyPanelPosition: () => { position++; },
        canRenderMessages: () => visible,
        document: { getElementById: () => box },
        getRoomMode: () => group ? 'groupTalk' : 'kongtalk',
        requestAnimationFrame(fn) { frames.push(fn); return frames.length; },
        setTimeout() { throw Error('no delayed polling/scroll timer'); },
    });
    vm.runInContext(extract('schedulePanelViewportRepair') + '\n' + extract('scrollMessagesToBottom'), ctx);
    return { ctx, box, frames, writes, show: value => { visible = value; },
        group: value => { group = value; }, flush: () => frames.splice(0).forEach(fn => fn()),
        counts: () => [size, position] };
}
test('hidden viewport events do nothing, visible resize burst performs one size/position repair', () => {
    const t = fixture();
    for (let i = 0; i < 10; i++) t.ctx.schedulePanelViewportRepair();
    assert.equal(t.frames.length, 0);
    t.show(true);
    for (let i = 0; i < 10; i++) t.ctx.schedulePanelViewportRepair();
    assert.equal(t.frames.length, 1);
    t.flush();
    assert.deepEqual(t.counts(), [1, 1]);
    t.ctx.schedulePanelViewportRepair(); t.show(false); t.flush();
    assert.deepEqual(t.counts(), [1, 1]);
});
test('scroll requests coalesce and stale callbacks cannot move another room', () => {
    const t = fixture();
    t.show(true);
    for (let i = 0; i < 5; i++) t.ctx.scrollMessagesToBottom();
    assert.deepEqual(t.writes, [100]); assert.equal(t.frames.length, 1);
    t.box.scrollHeight = 150; t.flush();
    assert.deepEqual(t.writes, [100, 150]);
    t.ctx.scrollMessagesToBottom();
    t.box.dataset.renderRoom = 'b'; t.box.scrollHeight = 200;
    t.ctx.scrollMessagesToBottom();
    t.flush();
    assert.deepEqual(t.writes, [100, 150, 150, 200, 200]);
    t.ctx.scrollMessagesToBottom(); t.show(false); t.flush();
    assert.deepEqual(t.writes, [100, 150, 150, 200, 200, 200]);
    t.show(true); t.group(true);
    t.ctx.scrollMessagesToBottom();
    assert.equal(t.frames.length, 0);
});
