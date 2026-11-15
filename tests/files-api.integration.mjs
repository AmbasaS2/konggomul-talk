import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { fileURLToPath, pathToFileURL } from 'node:url';

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sillyTavernRoot = path.resolve(extensionRoot, 'sillytavern');
const { default: express } = await import(pathToFileURL(path.join(sillyTavernRoot, 'node_modules/express/index.js')));
const { router: officialFilesRouter } = await import(pathToFileURL(path.join(sillyTavernRoot, 'src/endpoints/files.js')));
const storageSource = fs.readFileSync(path.join(extensionRoot,'room-storage.js'),'utf8');
const storage = await import('data:text/javascript;base64,'+Buffer.from(storageSource).toString('base64'));
class FileReaderShim {
  readAsDataURL(blob) {
    blob.arrayBuffer().then(bytes=>{
      this.result='data:application/json;base64,'+Buffer.from(bytes).toString('base64');
      this.onload?.();
    }).catch(error=>{this.error=error;this.onerror?.();});
  }
}
globalThis.FileReader=FileReaderShim;

test('official SillyTavern /api/files endpoints preserve per-user data and path structure', async t => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'konggomul-st-files-'));
  const files=path.join(root,'user','files');
  fs.mkdirSync(files,{recursive:true});
  const app=express();
  app.use(express.json({limit:'100mb'}));
  app.use((req,res,next)=>{
    req.user={profile:{handle:'isolated-ci-user'},directories:{root,files}};
    next();
  });
  app.use('/api/files',officialFilesRouter);
  // SillyTavern src/users.js serves this same directory via /user/files/*.
  // This static route reproduces that GET mapping without invoking login flows.
  app.use('/user/files',express.static(files,{fallthrough:false}));
  const server=app.listen(0,'127.0.0.1');
  await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  const originalFetch=globalThis.fetch;
  globalThis.fetch=(url,options)=>originalFetch(new URL(String(url),base),options);
  t.after(async()=>{
    globalThis.fetch=originalFetch;
    await new Promise(resolve=>server.close(resolve));
    fs.rmSync(root,{recursive:true,force:true});
  });
  const ctx={getRequestHeaders:()=>({'Content-Type':'application/json','X-CSRF-Token':'test'})};
  const original={rooms:[{id:'r1',messages:[{role:'user',content:'안녕 😀'}]}]};
  assert.equal(await storage.readRoomIndex(ctx),null);
  const backup=await storage.backupLegacyRooms({Remus:original},ctx);
  assert.match(backup,/^\/user\/files\/konggomul-legacy-/);
  assert.ok(fs.existsSync(path.join(files,path.basename(backup))));
  assert.deepEqual(await storage.readLegacyRoomBackup(backup,ctx),{Remus:original});
  assert.equal(await storage.writeRoomSnapshot('Remus',original,0,ctx),1);
  assert.deepEqual((await storage.readRoomSnapshot('Remus',ctx)).data,original);
  const index=await storage.writeRoomIndex(['Remus'],backup,ctx);
  assert.deepEqual((await storage.readRoomIndex(ctx)).keys,index.keys);
  assert.equal(await storage.writeRoomSnapshot('Remus',{...original,updatedAt:987},1,ctx),2);
  await assert.rejects(storage.writeRoomSnapshot('Remus',original,1,ctx),/another device/);
  const raw=JSON.parse(fs.readFileSync(path.join(files,path.basename(storage.roomFilePath('Remus'))),'utf8'));
  assert.equal(raw.revision,2);
  assert.equal(raw.data.updatedAt,987);
});
