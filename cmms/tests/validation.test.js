import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/core.js';
import {validateRecord} from '../src/validation.js';
const check=(module,row,state=initialState(),id=null)=>validateRecord(module,row,state,id);
test('unique asset code and serial are rejected but unchanged edit allowed',()=>{
 const state=initialState();state.assets.push({id:'a',code:'GEN-01',serial:'123'});
 assert.ok(check('assets',{id:'b',code:'gen-01',serial:'123'},state).some(x=>x.field==='code'));
 assert.equal(check('assets',{id:'a',code:'GEN-01',serial:'123'},state,'a').length,0);
});
test('work order assignment and completion are validated',()=>{
 assert.ok(check('workOrders',{status:'Assigned',assigneeId:'',completionNotes:''}).some(x=>x.field==='assigneeId'));
 assert.ok(check('workOrders',{status:'Completed',completionNotes:''}).some(x=>x.field==='completionNotes'));
});
test('PM dates and intervals are validated',()=>{
 const errors=check('plans',{interval:0,startDate:'2026-12-15',endDate:'2026-11-01'});
 assert.ok(errors.some(x=>x.field==='interval'));assert.ok(errors.some(x=>x.field==='endDate'));
});
test('inventory quantities and duplicate part codes are validated',()=>{
 const state=initialState();state.parts.push({id:'p1',code:'FUSE'});
 const errors=check('parts',{id:'p2',code:'fuse',quantity:-1,reorderLevel:0,unitCost:-2},state);
 assert.deepEqual(new Set(errors.map(x=>x.field)),new Set(['code','quantity','unitCost']));
});
test('compliance requires inspection date and inspector when finalized',()=>{
 const errors=check('inspections',{result:'Pass',inspectionDate:'',inspector:''});
 assert.ok(errors.some(x=>x.field==='inspectionDate'));assert.ok(errors.some(x=>x.field==='inspector'));
});
test('meter readings validate numeric values and dates',()=>{
 const errors=check('readings',{value:'NaN',readingDate:'2026-02-30'});
 assert.ok(errors.some(x=>x.field==='value'));assert.ok(errors.some(x=>x.field==='readingDate'));
});
test('employee number uniqueness and valid dates',()=>{
 const state=initialState();state.people.push({id:'p1',employeeNumber:'E100'});
 const errors=check('people',{id:'p2',employeeNumber:'e100',dateOfBirth:'2026-02-30'},state);
 assert.ok(errors.some(x=>x.field==='employeeNumber'));assert.ok(errors.some(x=>x.field==='dateOfBirth'));
});
test('location parent cannot be self',()=>assert.ok(check('locations',{id:'l1',parentId:'l1'}).some(x=>x.field==='parentId')));
