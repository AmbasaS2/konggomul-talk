import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=filename=>fs.readFileSync(path.join(root,filename),'utf8');
const script=read('index.js');
const storage=await import('data:text/javascript;base64,'+Buffer.from(read('room-storage.js')).toString('base64'));
const clone=value=>JSON.parse(JSON.stringify(value));
const userKey='title_undecided_assistant';
const original=()=>({
  Remus:{rooms:[{id:'room-1',messages:[{id:'old',role:'user',content:'오래된 콩톡 기록'}]}]},
  __konggomul_guest_ooc__:{rooms:[{id:'guest-1',messages:[{id:'g',content:'게스트톡'}]}]},
  __konggomul_group_talk__:{rooms:[{id:'group-1',messages:[{id:'gr',content:'그룹톡'}]}]},
});
class Reader{
  readAsDataURL(blob){
    blob.arrayBuffer().then(buf=>{this.result='data:application/json;base64,'+Buffer.from(buf).toString('base64');this.onload?.();})
    .catch(err=>{this.error=err;this.onerror?.();});
  }
}
globalThis.FileReader=Reader;
const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>clone(data)});
function clip(start,end){
  const a=script.indexOf(start),b=script.indexOf(end,a);
  assert.ok(a>=0&&b>a,'Source boundaries missing: '+start);
  return script.slice(a,b);
}
const migration=clip('function getServerRoomStore() {','\nfunction getMessageUpdatedAt');
const cleanup=clip('// The old pre-5.5.2 settings storage','\nasync function runBulkConversationCleanup(scope)');
const chooser=clip('async function openConversationDataCleanupMenu() {','\nasync function openStoredCharacterRoomResetPopup() {');

function setup({failFlush=false}={}){
  const files=new Map(),logs=[],notices=[];
  const settings={characterRooms:clone(original())};
  let persisted={extension_settings:{[userKey]:clone(settings)}};
  let blockFlush=failFlush;
  const save=()=>{};
  save.flush=async()=>{if(!blockFlush)persisted={extension_settings:{[userKey]:clone(settings)}};};
  const context=()=>({
    saveSettingsDebounced:save,
    getRequestHeaders:()=>({'Content-Type':'application/json','X-CSRF-Token':'simulated'}),
  });
  globalThis.fetch=async(url,options={})=>{
    const body=options.body?JSON.parse(options.body):{};
    if(url==='/api/files/verify')return response(Object.fromEntries(body.urls.map(p=>[p,files.has(p)])));
    if(url==='/api/files/upload'){
      files.set('/user/files/'+body.name,JSON.parse(Buffer.from(body.data,'base64').toString('utf8')));
      return response({path:'/user/files/'+body.name});
    }
    if(url==='/api/settings/get')return response({settings:JSON.stringify(persisted)});
    if(files.has(url))return response(files.get(url));
    return response({error:'missing file'},404);
  };
  const deps={
    ctx:context,getSettings:()=>settings,saveSettings:()=>{},
    readRoomIndex:storage.readRoomIndex,writeRoomIndex:storage.writeRoomIndex,
    readRoomSnapshot:storage.readRoomSnapshot,writeRoomSnapshot:storage.writeRoomSnapshot,
    readLegacyRoomBackup:storage.readLegacyRoomBackup,backupLegacyRooms:storage.backupLegacyRooms,
    MODULE_NAME:userKey,notice:value=>notices.push(value),logs,
  };
  const harness=[
    'const {ctx,getSettings,saveSettings,readRoomIndex,writeRoomIndex,readRoomSnapshot,writeRoomSnapshot,readLegacyRoomBackup,backupLegacyRooms,MODULE_NAME}=d;',
    'const uiText=key=>key,alert=value=>d.notice(value);',
    'const console={info:(...a)=>d.logs.push(a.join(" ")),warn:(...a)=>d.logs.push(a.join(" "))};',
    'let roomFileStoreCache=null,roomFileRevisions={},roomFileIndex=null,roomFilesReady=false,roomRecoveryNoticeShown=false;',
    'let lifecycleEpoch=3,cleanInProgress=false,lifecycleEnabled=true,generationInFlight=false,groupStartPending=false,roomSaveQueue=Promise.resolve();',
    migration,cleanup,
    'return {init:initializeRoomFileStorage,cleanup:attemptAutomaticLegacyCleanup,store:getServerRoomStore,status:()=>({roomFilesReady,roomFileIndex})};'
  ].join('\n');
  const api=new Function('d',harness)(deps);
  return {api,settings,files,logs,notices,
    persisted:()=>clone(persisted),
    setFlushFailure:value=>{blockFlush=value;},context};
}
test('syntax, version and exactly two cleanup buttons',()=>{
  assert.doesNotThrow(()=>new Function(script.replace(/^import .*?;$/gm,'').replace(/^export\s+/gm,'')));
  assert.equal(JSON.parse(read('manifest.json')).version,'5.5.5');
  assert.ok(script.includes("await attemptAutomaticLegacyCleanup();"));
  assert.ok(script.includes('async function attemptAutomaticLegacyCleanup()'));
  assert.ok(!chooser.includes('dialog.cleanupBefore'));
  assert.ok(!chooser.includes('CUSTOM1'));
  assert.ok(chooser.includes("runBulkConversationCleanup('all')"));
  assert.ok(chooser.includes('openStoredCharacterRoomResetPopup()'));
  assert.equal((chooser.match(/\['dialog\.cleanup[A-Za-z]+', 'dialog\.cleanup[A-Za-z]+Hint'/g)||[]).length,2);
});
test('automatic cleanup removes old settings copies only after verified file migration',async()=>{
  const run=setup();
  assert.equal(await run.api.init(),true);
  const before=clone(run.settings.characterRooms);
  assert.equal(Object.keys(before).length,3);
  const oldFile=await storage.readRoomSnapshot('Remus',run.context());
  assert.equal(oldFile.data.rooms[0].messages[0].content,'오래된 콩톡 기록');
  assert.equal(await run.api.cleanup(),true);
  assert.deepEqual(run.settings.characterRooms,{});
  assert.deepEqual(run.persisted().extension_settings[userKey].characterRooms,{});
  assert.equal(run.settings.roomFileStorage.legacyPendingCleanup,false);
  assert.ok(run.files.has(run.settings.roomFileStorage.cleanupBackup));
  const after=await storage.readRoomSnapshot('Remus',run.context());
  assert.deepEqual(after,oldFile);
  assert.equal(await run.api.cleanup(),true);
});
test('failed settings save preserves original copies and retries safely',async()=>{
  const run=setup({failFlush:true});
  await run.api.init();
  const expected=clone(run.settings.characterRooms);
  assert.equal(await run.api.cleanup(),false);
  assert.deepEqual(run.settings.characterRooms,expected);
  assert.deepEqual(run.persisted().extension_settings[userKey].characterRooms,expected);
  assert.equal(run.settings.roomFileStorage.legacyPendingCleanup,true);
  run.setFlushFailure(false);
  assert.equal(await run.api.cleanup(),true);
  assert.deepEqual(run.persisted().extension_settings[userKey].characterRooms,{});
});
test('changed data from old client prevents automatic deletion',async()=>{
  const run=setup();
  await run.api.init();
  run.settings.characterRooms.Remus.rooms[0].messages.push({content:'다른 기기에서 추가됨'});
  const expected=clone(run.settings.characterRooms);
  assert.equal(await run.api.cleanup(),false);
  assert.deepEqual(run.settings.characterRooms,expected);
  assert.ok(run.logs.some(x=>x.includes('old settings changed')));
});
test('missing original migration backup prevents automatic deletion',async()=>{
  const run=setup();
  await run.api.init();
  const old=clone(run.settings.characterRooms);
  run.files.delete(run.api.status().roomFileIndex.legacyBackup);
  assert.equal(await run.api.cleanup(),false);
  assert.deepEqual(run.settings.characterRooms,old);
});
