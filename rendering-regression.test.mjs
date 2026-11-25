import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// The optional integration harness runs the actual render/event functions in
// Chromium with a real jQuery DOM. No live ST data or provider requests.
// KONGGOMUL_TEST_CHROME=/path/to/chrome KONGGOMUL_TEST_JQUERY=/path/to/jquery.js
// node --test rendering-regression.test.mjs
const source = fs.readFileSync(new URL('./index.js', import.meta.url), 'utf8');
const chrome = process.env.KONGGOMUL_TEST_CHROME;
const jquery = process.env.KONGGOMUL_TEST_JQUERY;
const extract = name => {
  const start = source.indexOf('function ' + name + '(');
  const end = source.indexOf('\n}', start);
  assert.ok(start >= 0 && end > start, name);
  return source.slice(start, end + 2);
};
const functions = [
  'clampInt','normalizeAssistantVariantState','getAssistantVariantState','selectAssistantVariant',
  'appendAssistantVariant','normalizeQuotedReference','escapeHtml','normalizeNewlines',
  'renderSpeakerNameWithAvatar','bindSpeakerAvatarFallbacks','getMessageRenderLabels',
  'reconcileMessageNodes','updateMessageNode','renderGroupMessages','renderMessages',
  'renderHome','renderRoomList','toggleRoomList','canRenderPanel','canRenderMessages',
  'setPanelVisible','setPanelCollapsed','renderAll','renderPendingQuote','syncComposerUI','setComposerBusy',
  'bindVariantNavigationHandlers','bindMessagePressHandlers','cancelMessageLongPress',
  'switchAssistantVariant','scrollMessagesToBottom','markCollapsedUnreadReply','clearCollapsedUnreadReply',
  'closeSettingsPanel','closeModePicker','hideContextMenu',
  'getActiveGenerationKeepLoadingId','isGenerationPlaceholderMessage','isOrphanGenerationPlaceholder',
].map(extract).join('\n');

const fixture = function () {
  const $ = window.jQuery;
  const panelEl = document.getElementById('tua-panel');
  const box = document.getElementById('tua-messages');
  const settings = {collapsed:false};
  let homeVisible = false, panelRenderPending = true, homeRenderPending = true, homeRoomEntries = null;
  let roomStateCharKey = 'alice', activeRoomId = 'same-id', roomState = {rooms:[]};
  let generationInFlight = false, activeGenerationTask = null, groupStartPending = false;
  let pendingQuote = null, messageLongPressState = null, messageLongPressTimer = null;
  let contextMenuEl = null, modePickerTargetRoomId = null, roomContextSuppressClick = false;
  let saves = 0, sortCalls = 0, menuCalls = [], callbacks = new Map(), nextTimer = 1;
  const MESSAGE_LONG_PRESS_MS = 850, MESSAGE_LONG_PRESS_MOVE_CANCEL_PX = 12;
  const avatar = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const chars = [{avatar:'alice',name:'Alice'},{avatar:'bob',name:'Bob'}];
  const ctx = () => ({characters:chars});
  const getCharKey = character => character?.avatar || roomStateCharKey;
  const getActiveRoom = () => roomState.rooms.find(room => room.id === activeRoomId) || null;
  const getRoomMode = (room = getActiveRoom()) => room?.mode || 'kongtalk';
  const getSpeakerName = () => chars.find(c => c.avatar === roomStateCharKey)?.name || 'Alice';
  const getSpeakerCharacter = () => chars.find(c => c.avatar === roomStateCharKey);
  const getKongtalkCharacterAvatarUrl = character => character ? avatar : '';
  const getUserKongtalkNickname = () => 'Me';
  const getGroupParticipants = () => chars.map(c => ({name:c.name}));
  const getSettings = () => settings;
  const saveSettings = () => {};
  const saveRooms = () => { saves++; roomState = structuredClone(roomState); };
  const uiText = (key,...values) => ({
    'message.variant':'Variant {0} of {1}', 'message.quotedFrom':'Reply to {0}',
    'message.previous':'Previous','message.next':'Next','message.pressHint':'Press',
    'message.declaration':'Declaration','room.noMessages':'No messages','mode.groupTalk':'Group'
  }[key] || key).replace(/\{(\d+)\}/g,(token,index)=>values[Number(index)] ?? token);
  const uiHtml = (key,...values) => escapeHtml(uiText(key,...values));
  const modeUiLabel = mode => mode;
  const getRoomDisplayTitle = room => room?.title || 'Room';
  const getHomeParticipants = room => room.participants || 'Alice';
  const getVisibleRoomEntries = () => { sortCalls++; return roomState.rooms.map(room => ({room,ownerKey:roomStateCharKey})); };
  const isRoomSortConversationMessage = msg => !msg.loading && !!msg.content;
  const isKongtalkIntroContent = () => false;
  const isStandaloneEllipsisContent = value => /^(\.{3}|…)$/.test(String(value || '').trim());
  const normalizeGuestPersonaBinding = () => null;
  const hydratePanelSettingsUI = () => {};
  const applyVisualSettings = () => panelEl.classList.toggle('tua-collapsed',settings.collapsed);
  const ensurePanel = () => {};
  const refreshSendButtonState = () => {};
  const hideRoomContextMenu = () => {};
  const openContextMenuForMessage = id => menuCalls.push(String(id));
  const openRoomContextMenuForRoom = () => {};
  const cancelRoomLongPress = () => {};
  const scheduleRoomLongPress = () => {};
  const moveRoomLongPress = () => {};
  const finishRoomLongPress = () => {};
  const openSelectedRoom = () => {};
  const setTimeout = fn => { const id=nextTimer++; callbacks.set(id,fn);return id; };
  const clearTimeout = id => callbacks.delete(id);
  const requestAnimationFrame = fn => setTimeout(fn);
  const flushTimers = () => { const tasks = [...callbacks.values()];callbacks.clear();tasks.forEach(fn=>fn()); };
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const eq = (actual,expected,message) => check(actual===expected,message+' (actual '+actual+', expected '+expected+')');
  const results = [];
  const run = (name, fn) => {
    try { fn(); results.push({name,pass:true}); }
    catch (error) { results.push({name,pass:false,error:String(error.stack || error)}); }
  };
  const reset = (n, mode = 'kongtalk') => {
    $(box).empty(); delete box.dataset.renderRoom;
    panelEl.className='tua-visible';
    settings.collapsed=false; homeVisible=false; panelRenderPending=true;
    homeRenderPending=true; homeRoomEntries=null;
    roomStateCharKey=mode==='groupTalk'?'group':'alice'; activeRoomId='same-id';
    roomState={rooms:[{id:activeRoomId,mode,title:'Room A',messages:Array.from({length:n},(_,i)=>({
      id:'m'+i,role:i%2?'assistant':'user',content:'Message '+i,
      ...(mode==='groupTalk'&&i%2?{speakerKey:'alice',speakerName:'Alice'}:{})
    }))}]};
    generationInFlight=false; activeGenerationTask=null; pendingQuote=null; saves=0; menuCalls=[];
    callbacks.clear(); cancelMessageLongPress();
    $('#tua-room-list').removeClass('open').empty(); delete $('#tua-room-list')[0]._tuaRoomListMarkup;
    $('#tua-home-list').empty(); delete $('#tua-home-list')[0]._tuaHomeMarkup;
    $('#tua-home-search').val(''); $('#tua-in-panel-settings').removeClass('open');
  };
  const rows = () => Array.from(box.children);
  const byId = id => rows().find(node => node.dataset.id===id);
  const unchanged = old => old.forEach(node => eq(byId(node.dataset.id),node,'retained message '+node.dataset.id));
  const observe = node => { const observer = new MutationObserver(()=>{});observer.observe(node,{childList:true,subtree:true,attributes:true,characterData:true});return observer; };
  // The exact scroll cancellation binding installed once by ensurePanel.
  $(box).on('scroll.tuaPressCancel',cancelMessageLongPress);
  for (const n of [25,240,1000]) run('append after '+n+' messages preserves every historical node and avatar',()=>{
    reset(n); renderMessages();
    const old=rows(), names=old.map(node=>node.querySelector('.tua-msg-name')), bubbles=old.map(node=>node.querySelector('.tua-bubble'));
    const imgs=old.map(node=>node.querySelector('img'));
    roomState=structuredClone(roomState);
    getActiveRoom().messages.push({id:'new',role:'assistant',content:'new reply'});
    const observer=observe(box);renderMessages();
    unchanged(old); eq(rows().length,n+1,'message count');
    old.forEach((node,i)=>{eq(node.querySelector('.tua-msg-name'),names[i],'name identity');eq(node.querySelector('.tua-bubble'),bubbles[i],'bubble identity');eq(node.querySelector('img'),imgs[i],'avatar identity');});
    const records=observer.takeRecords();observer.disconnect();
    eq(records.filter(record=>record.target===box && record.type==='childList').length,1,'only one message insertion');
    check(records.every(record=>record.target===box || !old.some(node=>node===record.target || node.contains(record.target))),'unchanged message mutated');
    eq(saves,0,'render must not persist');
  });
  run('edit/delete/regeneration update only the affected row or loading placeholder',()=>{
    reset(240);renderMessages();const old=rows();const target=byId('m239'), avatarNode=target.querySelector('.tua-msg-name');
    getActiveRoom().messages[239].content='Edited';renderMessages();
    unchanged(old);eq(target.querySelector('.tua-msg-name'),avatarNode,'avatar after edit');eq(target.querySelector('.tua-bubble').textContent,'Edited','body');
    getActiveRoom().messages.splice(30,1);const observer=observe(box);renderMessages();
    unchanged(old.filter(node=>node.dataset.id!=='m30'));eq(byId('m30'),undefined,'deleted row');
    const records=observer.takeRecords();observer.disconnect();
    eq(records.filter(r=>r.target===box&&r.type==='childList').length,1,'one removal, no sibling moves');
    generationInFlight=true;activeGenerationTask={roomId:activeRoomId,loadingId:'loading'};
    getActiveRoom().messages.push({id:'loading',role:'assistant',loading:true,content:'...'});renderMessages();
    check(byId('loading'),'active loading placeholder');
    getActiveRoom().messages.pop();appendAssistantVariant(getActiveRoom().messages.at(-1),'Regenerated');
    generationInFlight=false;activeGenerationTask=null;renderMessages();
    eq(byId('loading'),undefined,'placeholder removed');unchanged(old.filter(node=>node.dataset.id!=='m30'));
    eq(target.querySelector('.tua-bubble').textContent,'Regenerated','regenerated body');
  });
  run('variant clicks preserve avatar, bubble, navigation and old handlers',()=>{
    reset(25); const m=getActiveRoom().messages[23];m.variants=['first','second'];m.variantIndex=0;m.content='first';
    renderMessages(); const old=rows(), node=byId('m23'), name=node.querySelector('.tua-msg-name'), bubble=node.querySelector('.tua-bubble'), nav=node.querySelector('.tua-variant-nav'), next=nav.querySelector('[data-variant-direction="1"]');
    const eventCount=window.jQuery._data(next,'events').click.length;
    next.click(); unchanged(old);eq(node.querySelector('.tua-msg-name'),name,'name identity');eq(node.querySelector('.tua-bubble'),bubble,'bubble identity');eq(node.querySelector('.tua-variant-nav'),nav,'nav identity');eq(nav.querySelector('[data-variant-direction="1"]'),next,'button identity');
    eq(bubble.textContent,'second','swiped content');eq(nav.querySelector('span').textContent,'2/2','counter');eq(saves,1,'one save');
    renderMessages();eq(window.jQuery._data(next,'events').click.length,eventCount,'no repeated binding');
    next.click();eq(bubble.textContent,'first','second swipe');eq(saves,2,'one additional save');
    generationInFlight=true;setComposerBusy(true);check(next.disabled,'busy disables nav');
    generationInFlight=false;setComposerBusy(false);check(!next.disabled,'completion enables nav');
  });
  run('closed and minimized completions leave message DOM untouched; reopen flushes data and composer',()=>{
    reset(25);renderAll();const old=rows();
    setPanelVisible(false,{persistPreference:false});const observer=observe(box);
    getActiveRoom().messages.push({id:'closed-reply',role:'assistant',content:'closed'});renderMessages();renderAll();renderPendingQuote();scrollMessagesToBottom();setComposerBusy(false);
    eq(observer.takeRecords().length,0,'closed mutations');check(panelRenderPending,'pending on close');eq(byId('closed-reply'),undefined,'closed row absent');
    setPanelVisible(true,{persistPreference:false});unchanged(old);check(byId('closed-reply'),'closed result rendered on open');
    observer.takeRecords();setPanelCollapsed(true);
    getActiveRoom().messages.push({id:'min-reply',role:'assistant',content:'minimized'});renderMessages();markCollapsedUnreadReply();renderAll();scrollMessagesToBottom();setComposerBusy(false);
    eq(observer.takeRecords().length,0,'minimized mutations');check(panelEl.classList.contains('tua-has-unread-reply'),'unread badge');
    setPanelCollapsed(false);setPanelVisible(true,{persistPreference:false});check(byId('min-reply'),'minimized result rendered on open');check(!panelEl.classList.contains('tua-has-unread-reply'),'badge cleared');
    observer.disconnect();
  });
  run('home/search, overlays and closed room list do not render hidden messages or resort each search',()=>{
    reset(25);renderMessages();const old=rows();homeVisible=true;
    const observer=observe(box);renderAll(); const calls=sortCalls;
    $('#tua-home-search').val('alice');renderHome({reuseEntries:true});eq(sortCalls,calls,'search reuses sort');
    $('#tua-home-search').val('');renderHome({reuseEntries:true});eq(sortCalls,calls,'clear reuses sort');
    getActiveRoom().messages.push({id:'home-reply',role:'assistant',content:'home reply'});renderMessages();
    eq(observer.takeRecords().length,0,'home did not mutate messages');unchanged(old);
    check($('#tua-home-list').text().includes('home reply'),'home preview updated');
    $('#tua-in-panel-settings').addClass('open');panelEl.classList.add('tua-home-settings-open');
    const homeObserver=observe($('#tua-home-list')[0]);
    getActiveRoom().messages.push({id:'overlay-reply',role:'assistant',content:'overlay reply'});renderMessages();
    eq(homeObserver.takeRecords().length,0,'hidden home not updated');closeSettingsPanel();
    check($('#tua-home-list').text().includes('overlay reply'),'home refreshed on close');homeObserver.disconnect();
    homeVisible=false;renderAll();check(byId('overlay-reply'),'room catches up');unchanged(old);
    eq($('#tua-room-list').children().length,0,'closed room list unbuilt');
    toggleRoomList(true);const first=$('#tua-room-list').children()[0];check(first,'open list rendered');
    renderMessages();eq($('#tua-room-list').children()[0],first,'unchanged list row retained');
    toggleRoomList(false);const listObserver=observe($('#tua-room-list')[0]);
    getActiveRoom().messages.push({id:'another',role:'assistant',content:'new'});renderMessages();
    eq(listObserver.takeRecords().length,0,'closed list unchanged');listObserver.disconnect();observer.disconnect();
  });
  run('same room ID in another owner never reuses previous owner DOM',()=>{
    reset(25);renderMessages();const old=rows();
    roomStateCharKey='bob';getActiveRoom().messages[0].content='Bob room';renderMessages();
    eq(rows().length,25,'row count');check(rows().every(node=>!old.includes(node)),'owner change rebuilds rows');
    eq(byId('m0').querySelector('.tua-bubble').textContent,'Bob room','owner data');
    const bob=rows();getActiveRoom().id='other';activeRoomId='other';renderMessages();
    check(rows().every(node=>!bob.includes(node)),'room change rebuilds rows');
  });
  run('mobile pointer press, move/scroll cancellation, PC contextmenu and event reuse',()=>{
    reset(25);renderMessages();const node=byId('m23');
    const fire=(type,extra={})=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerType:'touch',button:0,buttons:1,clientX:20,clientY:20,...extra}));
    const original=window.jQuery._data(node,'events').pointerdown[0].handler;
    renderMessages();renderMessages();eq(window.jQuery._data(node,'events').pointerdown.length,1,'one pointer handler');eq(window.jQuery._data(node,'events').pointerdown[0].handler,original,'same handler');
    fire('pointerdown');fire('pointermove',{clientX:50});flushTimers();eq(menuCalls.length,0,'move cancels');
    fire('pointerdown');box.dispatchEvent(new Event('scroll'));flushTimers();eq(menuCalls.length,0,'scroll cancels');
    fire('pointerdown');fire('pointerup');flushTimers();eq(menuCalls.length,0,'release cancels');
    fire('pointerdown');flushTimers();eq(menuCalls.join(','),'m23','long press');
    node.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:20,clientY:20}));eq(menuCalls.join(','),'m23,m23','PC right click');
    fire('pointerdown');getActiveRoom().messages=getActiveRoom().messages.filter(m=>m.id!=='m23');renderMessages();flushTimers();eq(menuCalls.length,2,'deleted pressed row cancels');
  });
  run('group turns retain earlier messages and scroll position; minimized delivery keeps unread badge',()=>{
    reset(40,'groupTalk');renderAll();const old=rows();box.scrollTop=75;const top=box.scrollTop;
    getActiveRoom().messages.push({id:'g1',role:'assistant',content:'First turn',speakerKey:'alice',speakerName:'Alice'});renderMessages();unchanged(old);eq(box.scrollTop,top,'reading position');
    const first=byId('g1');setPanelCollapsed(true);const observer=observe(box);
    getActiveRoom().messages.push({id:'g2',role:'assistant',content:'Second turn',speakerKey:'bob',speakerName:'Bob'});renderMessages();markCollapsedUnreadReply();
    eq(observer.takeRecords().length,0,'hidden group turn');check(panelEl.classList.contains('tua-has-unread-reply'),'group unread');
    setPanelCollapsed(false);setPanelVisible(true,{persistPreference:false});unchanged(old);eq(byId('g1'),first,'first turn retained');check(byId('g2'),'second turn shown');observer.disconnect();
  });
  run('quoted message and declaration keep markup and locked behavior',()=>{
    reset(3);const room=getActiveRoom();room.messages[0]={id:'m0',role:'declaration',content:'<unsafe>'};room.messages[1].quote={messageId:'m0',speaker:'A&B',content:'quoted <tag>'};
    renderMessages();check(byId('m0').classList.contains('tua-locked'),'locked class');eq(byId('m0').querySelector('.tua-bubble').textContent,'<unsafe>','escaped declaration');eq(window.jQuery._data(byId('m0'),'events'),undefined,'no press on declaration');
    eq(byId('m1').querySelector('.tua-quoted-message b').textContent,'Reply to A&B','escaped quote label');
    eq(byId('m1').querySelector('.tua-quoted-message span').textContent,'quoted <tag>','escaped quote body');
  });
  document.getElementById('result').textContent=btoa(unescape(encodeURIComponent(JSON.stringify(results))));
};

// Keep test-only MutationObserver out of the production runtime. These
// structural assertions still run when an external Chrome/jquery isn't supplied.
test('rendering does not add observers, intervals, or persistence to node reconciliation',()=>{
  assert.ok(!/new MutationObserver|setInterval\(/.test(extract('reconcileMessageNodes')+extract('updateMessageNode')+extract('renderMessages')));
  assert.ok(!/saveRooms\(|saveSettings\(/.test(extract('reconcileMessageNodes')+extract('updateMessageNode')+extract('renderMessages')));
  assert.ok(extract('renderMessages').includes('canRenderPanel()'));
  assert.ok(extract('renderGroupMessages').includes('canRenderMessages()'));
});

test('Chromium DOM rendering and input regressions', {skip: !chrome || !jquery ? 'Set KONGGOMUL_TEST_CHROME and KONGGOMUL_TEST_JQUERY for browser integration' : false}, async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'konggomul-browser-test-'));
  try {
    const fixtureSource=fixture.toString();
    const body=fixtureSource.slice(fixtureSource.indexOf('{')+1,fixtureSource.lastIndexOf('}'));
    const script='(function(){\n'+functions+'\n'+body+'\n})();';
    const html='<!doctype html><meta charset="utf-8"><style>#tua-messages{height:140px;overflow:auto}.tua-msg{min-height:30px}</style>'+
      '<div id="tua-panel"><button id="tua-home-button"></button><div id="tua-home"><input id="tua-home-search"><button id="tua-home-search-clear"></button><div id="tua-home-list"></div></div>'+
      '<span id="tua-char-name"></span><span id="tua-mode-badge"></span><button id="tua-active-room-title"></button><button id="tua-pin-room"></button><div id="tua-room-list"></div>'+
      '<div id="tua-in-panel-settings"></div><div id="tua-mode-picker"></div><div id="tua-messages"></div><div id="tua-reply-preview"></div>'+
      '<textarea id="tua-input"></textarea><button id="tua-group-show-all"></button></div><pre id="result"></pre>'+
      '<script>'+fs.readFileSync(jquery,'utf8').replace(/<\/script/gi,'<\\/script')+'</script><script>'+script.replace(/<\/script/gi,'<\\/script')+'</script>';
    const file=path.join(dir,'fixture.html');fs.writeFileSync(file,html);
    const result=spawnSync(chrome,['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--disable-background-networking','--user-data-dir='+path.join(dir,'profile'),'--dump-dom','file://'+file],{encoding:'utf8',timeout:45000,maxBuffer:10*1024*1024});
    assert.equal(result.status,0,result.error?.message || result.stderr);
    const match=result.stdout.match(/<pre id="result">([A-Za-z0-9+/=]+)<\/pre>/);
    assert.ok(match,'browser fixture did not finish');
    const cases=JSON.parse(Buffer.from(match[1],'base64').toString('utf8'));
    assert.equal(cases.length,11);
    for(const result of cases) await t.test(result.name,()=>assert.ok(result.pass,result.error));
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});

