import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Test the real request-construction code with an isolated SillyTavern context.
// No provider requests, preset switching, or writes to RP data.
const source = fs.readFileSync(new URL('./index.js', import.meta.url), 'utf8');
const extract = (start, end) => {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, start);
  return source.slice(a, b);
};
const helpers = extract("function getKongtalkPresetPrompts(", "\nasync function generateWithSelectedProfile(");
const request = extract("async function generateWithSelectedProfile(", "\n\n\nfunction sanitizeAssistantReply");
const tails = extract("function appendTailToMessages(", "\nasync function refreshProfiles(");
const create = new Function('deps', helpers + '\n' + tails + '\n' + request + `
  const {ctx, getSettings, resolveSelectedConnectionProfileFresh, getGlobalGroupSettings,
    getActiveRoom, getSpeakerName, getUserName, textOnlyTail, addDebugLog, uiText,
    getConnectionManagerRequestService, getEffectiveProfileMaxTokens, setStatus,
    rememberOutgoingPrompt, extractGroupResponse, extractAssistantText,
    AbortController, setTimeout, clearTimeout} = deps;
  return {getKongtalkPresetPrompts, prepareKongtalkPresetMessages,
    buildKongtalkPresetRequest, generateWithSelectedProfile};
`);

function fixture({dedicated = false, enabled = true, groupEnabled = false, quiet = false,
  missing = false, roomSpeaker = 'Guest', api = 'openai'} = {}) {
  const makePreset = prefix => ({
    prompts: [
      {identifier:'main', role:'system', content: prefix + ' {{char}}'},
      {identifier:'disabled', role:'system', content:'DISABLED'},
      {identifier:'charDescription', role:'system', content:'DUPLICATE CARD'},
      {identifier:'marker', marker:true, content:'DUPLICATE MARKER'},
      {identifier:'extra', role:'user', content:'Address {{user}}'},
      {identifier:'example', role:'assistant', content:'An example'},
      {identifier:'post', role:'system', content:'POST'},
      {identifier:'continueOnly', role:'system', content:'CONTINUE', injection_trigger:['continue']},
    ],
    prompt_order: [
      {character_id:100000, order:[{identifier:'disabled',enabled:true}]},
      {character_id:100001, order:['main','disabled','charDescription','marker','extra','example','post','continueOnly','main'].map(identifier=>({identifier,enabled:identifier!=='disabled'}))},
    ],
  });
  const live=makePreset('LIVE'), saved=makePreset('SAVED');
  const profile={id:'p',name:'Gemini test',api:'google',preset:missing?'missing':'Saved'};
  const settings={selectedProfile:dedicated?'p':'',includePreset:enabled,maxTokens:500};
  const calls=[], previews=[], logs=[];
  let macroCalls=0;
  const context={
    mainApi:api, CONNECT_API_MAP:{google:{selected:'openai'}},
    chatCompletionSettings:live, extensionSettings:{connectionManager:{profiles:[profile]}},
    getPresetManager:()=>({getCompletionPresetByName:name=>name==='Saved'?saved:null}),
    substituteParams:text=>{macroCalls++;return text},
  };
  if(quiet) context.generateQuietPrompt=async args=>{calls.push({route:'quiet',args});return 'answer'};
  else context.generateRaw=async args=>{calls.push({route:'raw',args});return 'answer'};
  const service={sendRequest:async (...args)=>{calls.push({route:'profile',args});return 'answer'}};
  const functions=create({
    ctx:()=>context, getSettings:()=>settings,
    resolveSelectedConnectionProfileFresh:async()=>profile,
    getGlobalGroupSettings:()=>({includePreset:groupEnabled}),
    getActiveRoom:()=>({groupBinding:{name:'Bound persona'}}), getSpeakerName:()=>roomSpeaker, getUserName:()=>'Persona',
    textOnlyTail:tail=>tail+' PLAIN ONLY',addDebugLog:(...args)=>logs.push(args),uiText:x=>x,
    getConnectionManagerRequestService:async()=>service,
    getEffectiveProfileMaxTokens:n=>({requested:n,effective:8000,multiplier:8000/n}),
    setStatus:()=>{},rememberOutgoingPrompt:(...args)=>previews.push(args),
    extractGroupResponse:x=>x,extractAssistantText:x=>x,
    AbortController:class {abort(){}},setTimeout:()=>1,clearTimeout:()=>{},
  });
  const snapshot=JSON.stringify([live,saved,profile,settings]);
  return {functions,calls,previews,logs,context,profile,
    unchanged:()=>assert.equal(JSON.stringify([live,saved,profile,settings]),snapshot),
    macroCalls:()=>macroCalls,
    send:options=>functions.generateWithSelectedProfile('Kongtalk own system',[{role:'user',content:'hello'}],500,'answer now',null,options),
  };
}

test('main API injects only active live preset prompts with configured roles and preserves side-chat instructions',async()=>{
  const f=fixture(); await f.send();
  const req=f.calls[0].args;
  assert.equal(req.systemPrompt,'');
  assert.deepEqual(req.prompt.map(m=>m.role),['system','system','user','assistant','system','user']);
  assert.deepEqual(req.prompt.slice(0,-1).map(m=>m.content),['LIVE Guest','Kongtalk own system','Address Persona','An example','POST']);
  assert.ok(req.prompt.at(-1).content.includes('hello'));
  assert.ok(f.previews[0][1].includes('LIVE Guest'));
  assert.equal(f.macroCalls(),0); f.unchanged();
});

test('dedicated Gemini profile injects its own saved preset instead of the active main preset',async()=>{
  const f=fixture({dedicated:true}); await f.send();
  const [id,messages,max,options]=f.calls[0].args;
  assert.equal(id,'p'); assert.equal(max,8000);
  assert.equal(options.includePreset,true); assert.equal(options.includeInstruct,false);
  assert.deepEqual(messages.slice(0,-1).map(m=>m.content),['SAVED Guest','Kongtalk own system','Address Persona','An example','POST']);
  assert.ok(f.previews[0][1].includes('SAVED Guest'));
  assert.equal(f.macroCalls(),4); f.unchanged();
});

test('switch off preserves existing raw and dedicated request shapes exactly',async()=>{
  const a=fixture({enabled:false}); await a.send();
  assert.equal(a.calls[0].args.systemPrompt,'Kongtalk own system');
  assert.equal(a.calls[0].args.prompt,'user: hello\\n\\nanswer now PLAIN ONLY'.replaceAll('\\n','\n'));
  const b=fixture({dedicated:true,enabled:false}); await b.send();
  const [id,messages,max,options]=b.calls[0].args;
  assert.equal(options.includePreset,false); assert.equal(messages.length,1);
  assert.equal(messages[0].role,'user'); assert.ok(messages[0].content.startsWith('Kongtalk own system'));
  assert.equal(b.macroCalls(),0); a.unchanged(); b.unchanged();
});

test('missing profile preset does not fall back to another preset; non-chat completion is unaffected',async()=>{
  const a=fixture({dedicated:true,missing:true}); await a.send();
  assert.equal(a.calls[0].args[1].length,1);
  assert.ok(!a.calls[0].args[1][0].content.includes('LIVE'));
  const b=fixture({api:'textgenerationwebui'}); await b.send();
  assert.equal(typeof b.calls[0].args.prompt,'string'); a.unchanged(); b.unchanged();
});

test('group uses independent setting and bound persona; JSON tail unchanged',async()=>{
  const a=fixture({enabled:true,groupEnabled:false}); await a.send({outputFormat:'group'});
  assert.equal(typeof a.calls[0].args.prompt,'string');
  const b=fixture({enabled:false,groupEnabled:true}); await b.send({outputFormat:'group'});
  const m=b.calls[0].args.prompt;
  assert.equal(m[0].content,'LIVE each participant');
  assert.ok(m.some(x=>x.content==='Address Bound persona'));
  assert.ok(!m.at(-1).content.includes('PLAIN ONLY'));
  a.unchanged(); b.unchanged();
});

test('continuation triggers and quiet fallback retain enabled preset text',async()=>{
  const a=fixture(); await a.send({generationType:'continue'});
  assert.ok(a.calls[0].args.prompt.some(x=>x.content==='CONTINUE'));
  const b=fixture({quiet:true}); await b.send();
  assert.ok(b.calls[0].args.quietPrompt.includes('LIVE Guest'));
  assert.ok(b.calls[0].args.quietPrompt.includes('Kongtalk own system'));
  a.unchanged(); b.unchanged();
});

test('missing or malformed global prompt order never invents enabled entries',()=>{
  const f=fixture();
  const ctx={...f.context,chatCompletionSettings:{...f.context.chatCompletionSettings,prompt_order:[]}};
  assert.deepEqual(f.functions.getKongtalkPresetPrompts(ctx,null,true).messages,[]);
});
