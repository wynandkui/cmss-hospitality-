import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFinanceSummary} from '../src/finance-projection.js';
const state={workOrders:[{id:'w1',code:'WO-1'}],costEntries:[{id:'c1',workOrderId:'w1',category:'materials',amount:120,date:'2026-11-01'}],vendors:[{bankAccount:'secret'}],people:[{email:'private'}],settings:{secret:'hidden'}};
test('finance role sees cost report without source confidential collections',()=>{
 const result=projectFinanceSummary(state,{role:'finance_admin'},'2026-11-01','2026-11-30');
 assert.equal(result.start,'2026-11-01');assert.equal(result.end,'2026-11-30');
 assert.ok(!JSON.stringify(result).includes('secret'));assert.ok(!JSON.stringify(result).includes('private'));
});
test('manager, supervisor, coordinator, technician and unknown roles cannot read finance',()=>{
 for(const role of ['manager','supervisor','coordinator','technician','unknown'])assert.throws(()=>projectFinanceSummary(state,{role},'2026-11-01','2026-11-30'),{status:403});
});
test('finance reporting rejects invalid or reversed dates',()=>{
 for(const [a,b] of [['2026-11-30','2026-11-01'],['invalid','2026-11-30']])assert.throws(()=>projectFinanceSummary(state,{role:'finance_admin'},a,b),{status:400});
});
