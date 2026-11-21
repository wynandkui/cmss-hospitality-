import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {reconcileMediaDirectory} from '../server/media-reconciliation.js';
test('crash-like orphan and missing media are reported without mutation',async()=>{
 const root=await mkdtemp(join(tmpdir(),'cmms-media-audit-'));
 const orphan='11111111-1111-4111-8111-111111111111';
 const missing='22222222-2222-4222-8222-222222222222';
 const healthy='33333333-3333-4333-8333-333333333333';
 try{
  await writeFile(join(root,orphan),'orphan');await writeFile(join(root,healthy),'healthy');
  await symlink(join(root,healthy),join(root,'44444444-4444-4444-8444-444444444444'));
  const result=await reconcileMediaDirectory(root,[healthy,missing]);
  assert.deepEqual(result.orphaned,[orphan]);assert.deepEqual(result.missing,[missing]);
  assert.deepEqual(result.unexpected,['44444444-4444-4444-8444-444444444444']);
  assert.equal(result.referenced,2);assert.equal(result.physical,2);
  assert.equal(await (await import('node:fs/promises')).readFile(join(root,orphan),'utf8'),'orphan');
 }finally{await rm(root,{recursive:true,force:true});}
});

test('SIGKILL after physical write leaves a detectable orphan for operator review',async()=>{
 const {spawn}=await import('node:child_process');
 const {once}=await import('node:events');
 const {readFile}=await import('node:fs/promises');
 const root=await mkdtemp(join(tmpdir(),'cmms-media-kill-'));
 const orphan='55555555-5555-4555-8555-555555555555';
 const marker=join(root,'ready.marker');
 const script=`const fs=require('node:fs');const path=require('node:path');fs.writeFileSync(path.join(process.argv[1],process.argv[2]),'uncommitted-attachment');fs.writeFileSync(path.join(process.argv[1],'ready.marker'),'written');setInterval(()=>{},1000);`;
 const child=spawn(process.execPath,['-e',script,root,orphan],{stdio:'ignore'});
 try{
  let ready=false;
  for(let attempt=0;attempt<100;attempt++){
   if(child.exitCode!==null)throw Error('Writer exited before crash injection');
   try{if(await readFile(marker,'utf8')==='written'){ready=true;break;}}catch{}
   await new Promise(r=>setTimeout(r,20));
  }
  assert.ok(ready,'writer must confirm bytes persisted before kill');
  child.kill('SIGKILL');
  const [code,signal]=await once(child,'exit');
  assert.equal(code,null);assert.equal(signal,'SIGKILL');
  const report=await reconcileMediaDirectory(root,[]);
  assert.deepEqual(report.orphaned,[orphan]);
  assert.deepEqual(report.missing,[]);
  assert.deepEqual(report.unexpected,['ready.marker']);
  assert.equal(await readFile(join(root,orphan),'utf8'),'uncommitted-attachment');
 }finally{if(child.exitCode===null&&!child.killed)child.kill('SIGKILL');await rm(root,{recursive:true,force:true});}
});
