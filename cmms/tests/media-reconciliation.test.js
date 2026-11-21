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
