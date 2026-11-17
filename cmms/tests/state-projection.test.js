import test from 'node:test';import assert from 'node:assert/strict';
import {projectStateForSession,mergeTechnicianState} from '../src/state-projection.js';
const source={workOrders:[{id:'a',assigneeId:'p1',assetId:'asset1'},{id:'b',assigneeId:'p2',assetId:'asset2'}],assets:[{id:'asset1'},{id:'asset2'}],locations:[],people:[{id:'p1',name:'A',email:'private@example.com'},{id:'p2',name:'B'}],vendors:[{id:'v'}],requisitions:[{id:'r'}],purchaseOrders:[{id:'po'}],costEntries:[{id:'c'}],parts:[{id:'p'}],inspections:[{id:'i'}],readings:[{id:'m'}],plans:[{id:'pm'}]};
test('technician sees only assigned work orders and referenced assets',()=>{const s=projectStateForSession(source,{role:'technician',personId:'p1'});assert.deepEqual(s.workOrders.map(w=>w.id),['a']);assert.deepEqual(s.assets.map(a=>a.id),['asset1']);assert.deepEqual(s.people,[{id:'p1',name:'A',trade:undefined,jobTitle:undefined}]);for(const k of ['vendors','requisitions','purchaseOrders','costEntries','parts','inspections','readings','plans'])assert.deepEqual(s[k],[]);});
test('technician without employee link sees no work orders',()=>assert.deepEqual(projectStateForSession(source,{role:'technician',personId:''}).workOrders,[]));
test('unknown and unimplemented roles fail closed',()=>{for(const role of ['manager','supervisor','coordinator','finance_admin','unknown'])assert.throws(()=>projectStateForSession(source,{role}),{status:403});});
test('admin retains full snapshot',()=>assert.deepEqual(projectStateForSession(source,{role:'admin'}),source));
test('projection does not mutate original',()=>{projectStateForSession(source,{role:'technician',personId:'p1'});assert.equal(source.workOrders.length,2);assert.equal(source.people[0].email,'private@example.com');});

test('technician merge preserves hidden work orders and other modules',()=>{
 const original={...source,settings:{secret:'preserve'}};
 const projected=projectStateForSession(original,{role:'technician',personId:'p1'});
 projected.workOrders[0].status='Completed';
 projected.vendors=[{id:'malicious'}];projected.settings={secret:'changed'};
 const merged=mergeTechnicianState(original,projected,{role:'technician',personId:'p1'});
 assert.equal(merged.workOrders.length,2);assert.equal(merged.workOrders[0].status,'Completed');
 assert.deepEqual(merged.workOrders[1],original.workOrders[1]);
 assert.deepEqual(merged.vendors,original.vendors);assert.deepEqual(merged.settings,original.settings);
 assert.equal(original.workOrders[0].status,undefined);
});
test('technician merge rejects changed assignment',()=>{
 const p=projectStateForSession(source,{role:'technician',personId:'p1'});
 p.workOrders[0].assigneeId='p2';
 assert.throws(()=>mergeTechnicianState(source,p,{role:'technician',personId:'p1'}),{status:403});
});
test('technician merge rejects missing, foreign or duplicate work orders',()=>{
 const session={role:'technician',personId:'p1'};
 for(const rows of [[],[{id:'b'}],[{id:'a'},{id:'a'}]])assert.throws(()=>mergeTechnicianState(source,{workOrders:rows},session),{status:403});
});
test('technician merge rejects unlinked accounts and nontechnician roles',()=>{
 assert.throws(()=>mergeTechnicianState(source,{workOrders:[]},{role:'technician'}),{status:403});
 assert.throws(()=>mergeTechnicianState(source,{workOrders:[]},{role:'manager',personId:'p1'}),{status:403});
});

test('technician state excludes audit history and private settings',()=>{
 const original={...source,audit:[{event:'secret'}],settings:{facility:'Resort',bankAccount:'secret'}};
 const p=projectStateForSession(original,{role:'technician',personId:'p1'});
 assert.deepEqual(p.audit,[]);
 assert.deepEqual(p.settings,{facility:'Resort'});
});
