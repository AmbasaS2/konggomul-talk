import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const index = read('index.js');
const storeSrc = read('room-storage.js');
const counterSrc = read('room-reset.js');
const load = code => import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const storage = await load(storeSrc);
const { countRoomData } = await load(counterSrc);
const copy = x => JSON.parse(JSON.stringify(x));

class FileReaderShim {
  readAsDataURL(blob) {
    blob.arrayBuffer().then(bytes => {
      this.result = 'data:application/json;base64,' + Buffer.from(bytes).toString('base64');
      this.onload?.();
    }).catch(error => { this.error = error; this.onerror?.(); });
  }
}
globalThis.FileReader = FileReaderShim;
const jsonResponse = (data, status=200) => ({
  ok: status >= 200 && status < 300, status, json: async () => copy(data),
});
function server() {
  const files = new Map();
  let blockUploads = false;
  globalThis.fetch = async (url, req={}) => {
    const body = req.body ? JSON.parse(req.body) : {};
    if (url === '/api/files/verify') return jsonResponse(Object.fromEntries(body.urls.map(p => [p, files.has(p)])));
    if (url === '/api/files/upload') {
      if (blockUploads) return jsonResponse({ error: 'offline' }, 500);
      const file = '/user/files/' + body.name;
      assert.match(body.name, /^konggomul-[a-zA-Z0-9_-]+\.json$/);
      files.set(file, JSON.parse(Buffer.from(body.data,'base64').toString('utf8')));
      return jsonResponse({ path:file });
    }
    if (url.startsWith('/user/files/')) return files.has(url) ? jsonResponse(files.get(url)) : jsonResponse({},404);
    throw new Error('Unknown server route: '+url);
  };
  return { files, failWrites:()=>{blockUploads=true;} };
}
const context = () => ({getRequestHeaders:()=>({'Content-Type':'application/json','X-CSRF-Token':'test'})});
function clip(start,end) {
  const a=index.indexOf(start), b=index.indexOf(end,a);
  assert.ok(a>=0&&b>a,'Missing code section '+start);
  return index.slice(a,b);
}
const migrate=clip('function getServerRoomStore() {','\nfunction getMessageUpdatedAt');
const legacy=clip('async function cleanupLegacySettingsData() {','\nasync function runBulkConversationCleanup');
function original() {
  return {
    Remus:{rooms:[{id:'m',messages:[{content:'old'}]}]},
    __konggomul_guest_ooc__:{rooms:[{id:'g',messages:[{content:'guest'}]}]},
    __konggomul_group_talk__:{rooms:[{id:'t',messages:[]}]},
  };
}
function migration(settings,patch={}) {
  const dep={
    getSettings:()=>settings, ctx:context,saveSettings:()=>{},
    readRoomIndex:storage.readRoomIndex,readRoomSnapshot:storage.readRoomSnapshot,
    writeRoomSnapshot:storage.writeRoomSnapshot,writeRoomIndex:storage.writeRoomIndex,
    backupLegacyRooms:storage.backupLegacyRooms,readLegacyRoomBackup:storage.readLegacyRoomBackup,
    notice:()=>{},...patch,
  };
  return new Function('d',
    'const {getSettings,ctx,saveSettings,readRoomIndex,readRoomSnapshot,writeRoomSnapshot,writeRoomIndex,backupLegacyRooms,readLegacyRoomBackup}=d;'+
    'const alert=x=>d.notice(x),uiText=x=>x;'+
    'let roomFileStoreCache=null,roomFileRevisions={},roomFileIndex=null,roomFilesReady=false,roomRecoveryNoticeShown=false;'+
    'let lifecycleEpoch=1,cleanInProgress=false,lifecycleEnabled=true;'+
    migrate+
    'return {init:initializeRoomFileStorage,store:getServerRoomStore,state:()=>({roomFilesReady,roomFileIndex})};'
  )(dep);
}
function cleanup(settings,fileIndex,patch={}) {
  const dep={
    getSettings:()=>settings,ctx:context,saveSettings:()=>{},
    readRoomIndex:storage.readRoomIndex,readLegacyRoomBackup:storage.readLegacyRoomBackup,
    readRoomSnapshot:storage.readRoomSnapshot,
    roomStatesEqual:(a,b)=>JSON.stringify(a)===JSON.stringify(b),
    countRoomData,confirmConversationCleanup:async()=>true,
    backupLegacyRooms:storage.backupLegacyRooms,
    alert:()=>{},uiText:x=>x,...patch,fileIndex,
  };
  return new Function('d',
    'const {getSettings,ctx,saveSettings,readRoomIndex,readLegacyRoomBackup,readRoomSnapshot,roomStatesEqual,countRoomData,confirmConversationCleanup,backupLegacyRooms,alert,uiText}=d;'+
    'const console={error:()=>{}};'+
    'let roomFilesReady=true,roomFileIndex=d.fileIndex,cleanInProgress=false,lifecycleEnabled=true,generationInFlight=false,groupStartPending=false,roomSaveQueue=Promise.resolve();'+
    legacy+'return cleanupLegacySettingsData;'
  )(dep);
}
test('valid JavaScript syntax and manifest',()=>{
  assert.doesNotThrow(()=>new Function(index.replace(/^import .*?;$/gm,'').replace(/^export\s+/gm,'')));
  assert.equal(JSON.parse(read('manifest.json')).version,'5.5.1');
});
test('full server file round-trip and stale revision protection',async()=>{
  const disk=server();
  const data={rooms:[{id:'r',messages:[{content:'안녕 😀'}]}]};
  assert.equal(await storage.readRoomSnapshot('Remus',context()),null);
  assert.equal(await storage.writeRoomSnapshot('Remus',data,0,context()),1);
  assert.deepEqual((await storage.readRoomSnapshot('Remus',context())).data,data);
  assert.equal(await storage.writeRoomSnapshot('Remus',data,1,context()),2);
  await assert.rejects(storage.writeRoomSnapshot('Remus',data,1,context()),/another device/);
  disk.files.get(storage.roomFilePath('Remus')).ownerKey='someone-else';
  await assert.rejects(storage.readRoomSnapshot('Remus',context()),/mismatched/);
});
test('migration retains legacy data and reloads newer file messages',async()=>{
  server();
  const before=original(),settings={characterRooms:copy(before)};
  const first=migration(settings);
  assert.equal(await first.init(),true);
  assert.deepEqual(settings.characterRooms,before);
  assert.equal(first.state().roomFileIndex.keys.length,3);
  const old=await storage.readRoomSnapshot('Remus',context());
  old.data.rooms[0].messages.push({content:'new file message'});
  assert.equal(await storage.writeRoomSnapshot('Remus',old.data,old.revision,context()),2);
  const restarted=migration(settings);
  assert.equal(await restarted.init(),true);
  assert.equal(restarted.store().Remus.rooms[0].messages.length,2);
  assert.equal(settings.characterRooms.Remus.rooms[0].messages.length,1);
  const alerts=[];
  await cleanup(settings,restarted.state().roomFileIndex,{alert:x=>alerts.push(x)})();
  assert.deepEqual(settings.characterRooms,{});
  assert.equal((await storage.readRoomSnapshot('Remus',context())).data.rooms[0].messages.length,2);
  assert.match(alerts.at(-1),/cleanupLegacySuccess/);
  assert.equal(await migration(settings).init(),true);
});
test('old client additions block migration and legacy cleanup',async()=>{
  server();
  const settings={characterRooms:original()};
  const first=migration(settings);
  await first.init();
  settings.characterRooms.Remus.rooms[0].messages.push({content:'written from old client'});
  await assert.rejects(migration(settings).init(),/Legacy settings changed/);
  const alerts=[];
  await cleanup(settings,first.state().roomFileIndex,{alert:x=>alerts.push(x)})();
  assert.match(alerts.at(-1),/cleanupLegacyBlocked/);
  assert.equal(settings.characterRooms.Remus.rooms[0].messages.length,2);
});
test('migration upload failures do not erase original settings',async()=>{
  const disk=server();
  disk.failWrites();
  const before=original(),settings={characterRooms:copy(before)};
  await assert.rejects(migration(settings).init(),/500/);
  assert.deepEqual(settings.characterRooms,before);
});
test('a missing index after migration is a blocking error',async()=>{
  const disk=server(),settings={characterRooms:original()};
  await migration(settings).init();
  disk.files.delete(storage.ROOM_INDEX_PATH);
  await assert.rejects(migration(settings).init(),/index is missing/);
});
test('legacy recovery reopens conversations while file storage is unavailable',async()=>{
  const settings={roomFileStorage:{format:'legacy-recovery'},characterRooms:{Remus:{rooms:[{id:'r',messages:[{content:'recovered'}]}]}}};
  const notices=[];
  const restore=migration(settings,{notice:x=>notices.push(x),readRoomIndex:async()=>{throw Error('unavailable');}});
  assert.equal(await restore.init(),true);
  assert.equal(restore.store().Remus.rooms[0].messages[0].content,'recovered');
  assert.equal(restore.state().roomFilesReady,false);
  assert.deepEqual(notices,['dialog.storageRecoveryMode']);
});
test('261115 reset means old settings path, not date cutoff',()=>{
  assert.ok(index.includes('if (result === POPUP_RESULT.CUSTOM1) await cleanupLegacySettingsData();'));
  assert.ok(!index.includes('stripBefore261115'));
  assert.ok(!counterSrc.includes('PRE_261115_CUTOFF_MS'));
  assert.ok(legacy.includes('settings.characterRooms = {};'));
  assert.ok(!legacy.includes('persistRoomSnapshot('));
  const ko=JSON.parse(read('i18n/ko-kr.json'));
  assert.equal(ko['konggomul.dialog.cleanupBefore'],'261115 이전 데이터 초기화');
  assert.match(ko['konggomul.dialog.cleanupBeforeHint'],/메시지 작성 날짜와 관계없으며/);
  assert.match(ko['konggomul.guest.legacyPersonaUnknown'],/확인할 수 없습니다/);
});
