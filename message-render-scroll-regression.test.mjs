import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.js'), 'utf8');
const from = source.indexOf('// Coalesce repeated post-render scroll requests.');
const to = source.indexOf('function switchAssistantVariant(messageId, direction)', from);
assert.ok(from > 0 && to > from, 'Message render/scroll section is missing');
const snippet = source.slice(from, to);

function fixture(mode = 'kongtalk', count = 15) {
    const messages = Array.from({ length: count }, (_, i) => ({
        id: 'message-' + i,
        role: i % 2 ? 'assistant' : 'user',
        content: 'Content ' + i,
        quote: null,
        loading: false,
    }));
    const room = { id: 'room-A', mode, messages };
    const frames = new Map();
    const timers = new Map();
    const stats = { heightReads: 0, append: [], empty: 0, binds: 0, groupRenders: 0, homeRenders: 0 };
    let next = 0;
    const element = { isConnected: true, dataset: {}, scrollTop: 0 };
    Object.defineProperty(element, 'scrollHeight', { get() { stats.heightReads++; return 500; } });
    const box = {
        0: element, length: 1,
        empty() { stats.empty++; stats.append = []; return this; },
        append(html) { stats.append.push(String(html)); return this; },
    };
    const fakeContext = {
        $: selector => selector === '#tua-messages' ? box : null,
        document: { getElementById: id => id === 'tua-messages' ? element : null },
        roomStateCharKey: 'character-A',
        lifecycleEpoch: 7,
        runtimeActive: true,
        lifecycleEnabled: true,
        getActiveRoom: () => room,
        getRoomMode: target => (target || room).mode,
        getUserKongtalkNickname: () => 'USER',
        getSpeakerName: () => 'CHAR',
        normalizeQuotedReference: () => null,
        renderSpeakerNameWithAvatar: name => '<span>' + name + '</span>',
        getKongtalkCharacterAvatarUrl: () => '',
        getSpeakerCharacter: () => ({}),
        isOrphanGenerationPlaceholder: () => false,
        escapeHtml: value => String(value),
        normalizeNewlines: value => String(value),
        getAssistantVariantState: () => ({ variants: [], variantIndex: 0 }),
        uiText: key => key,
        uiHtml: key => key,
        hideContextMenu: () => {},
        renderHome: () => { stats.homeRenders++; },
        renderGroupMessages: () => { stats.groupRenders++; },
        bindVariantNavigationHandlers: () => { stats.binds++; },
        bindMessagePressHandlers: () => { stats.binds++; },
        bindSpeakerAvatarFallbacks: () => { stats.binds++; },
        homeVisible: false,
        setTimeout: callback => { const id = ++next; timers.set(id, callback); return id; },
        clearTimeout: id => timers.delete(id),
        requestAnimationFrame: callback => { const id = ++next; frames.set(id, callback); return id; },
        cancelAnimationFrame: id => frames.delete(id),
    };
    vm.createContext(fakeContext);
    vm.runInContext(snippet + '\nglobalThis.kongTestApi = { renderMessages, scrollMessagesToBottom, cancelPendingMessageBottomScroll };', fakeContext);
    const stepFrame = () => {
        const [id, callback] = frames.entries().next().value || [];
        if (callback) { frames.delete(id); callback(); }
    };
    const stepTimers = () => {
        const callbacks = [...timers.values()];
        timers.clear();
        callbacks.forEach(callback => callback());
    };
    return { context: fakeContext, api: fakeContext.kongTestApi, element, room, frames, timers, stats, stepFrame, stepTimers };
}

test('normal room inserts all messages with a single DOM append and preserves handlers', () => {
    const f = fixture('kongtalk', 40);
    f.api.renderMessages();
    assert.equal(f.stats.empty, 1);
    assert.equal(f.stats.append.length, 1);
    assert.equal((f.stats.append[0].match(/class="tua-msg /g) || []).length, 40);
    assert.equal(f.stats.binds, 3);
    assert.equal(f.stats.heightReads, 1, 'One synchronous initial scroll read ensures the first room opens at bottom');
    assert.equal(f.element.scrollTop, 500);
    assert.equal(f.frames.size, 1);
});

test('multiple same-room requests coalesce into one scroll frame', () => {
    const f = fixture();
    f.api.renderMessages();
    f.api.scrollMessagesToBottom();
    f.api.scrollMessagesToBottom();
    assert.equal(f.frames.size, 1);
    f.stepFrame();
    assert.equal(f.stats.heightReads, 1);
    assert.equal(f.element.scrollTop, 500);
    assert.equal(f.timers.size, 1);
});

test('late media follow-up does not override manual reader scroll', () => {
    const f = fixture();
    f.api.renderMessages();
    f.stepFrame();
    f.element.scrollTop = 120;
    f.stepTimers();
    assert.equal(f.element.scrollTop, 120);
    assert.equal(f.stats.heightReads, 1);
});

test('late follow-up scrolls if reader stayed at the bottom', () => {
    const f = fixture();
    f.api.renderMessages();
    f.stepFrame();
    f.stepTimers();
    assert.equal(f.stats.heightReads, 2);
    assert.equal(f.element.scrollTop, 500);
});

test('room switch invalidates pending scroll from previous room', () => {
    const f = fixture();
    f.api.renderMessages();
    f.room.id = 'room-B';
    f.api.scrollMessagesToBottom();
    assert.equal(f.frames.size, 1);
    f.stepFrame();
    assert.equal(f.stats.heightReads, 2);
});

test('group mode delegates rendering to existing group renderer and keeps explicit scroll behavior', () => {
    const f = fixture('groupTalk', 10);
    f.api.renderMessages();
    assert.equal(f.stats.groupRenders, 1);
    assert.equal(f.stats.append.length, 0);
    f.api.scrollMessagesToBottom();
    assert.equal(f.frames.size, 0);
    assert.equal(f.element.scrollTop, 500);
});

test('canceling pending scroll during extension disable removes timers', () => {
    const f = fixture();
    f.api.renderMessages();
    f.api.cancelPendingMessageBottomScroll();
    assert.equal(f.frames.size, 0);
    f.api.renderMessages();
    f.stepFrame();
    f.api.cancelPendingMessageBottomScroll();
    assert.equal(f.timers.size, 0);
    assert.match(source, /function cleanupRuntimeState\(\) \{\r?\n  cancelPendingMessageBottomScroll\(\);/);
});

test('storage, save queue, cross-device revisions, variants and group scroll remain unchanged', () => {
    assert.match(source, /roomSaveQueue = roomSaveQueue\.catch\(\(\) => undefined\)\.then\(persist\)/);
    assert.match(source, /writeRoomSnapshot\(charKey, snapshot, roomFileRevisions\[charKey\] \|\| 0/);
    assert.match(source, /function renderGroupMessages\(room\)/);
    assert.match(source, /box\.scrollTop = switched \? 0 : oldTop/);
    assert.match(source, /function switchAssistantVariant\(messageId, direction\)/);
    assert.match(source, /function bindVariantNavigationHandlers\(\)/);
});
