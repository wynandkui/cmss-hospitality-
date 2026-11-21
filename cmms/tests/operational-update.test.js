import test from 'node:test';import assert from 'node:assert/strict';
import {assignWorkOrder,createManagerWorkOrder} from '../src/operational-update.js';
const base={workOrders:[{id:'w1',status:'Open',assigneeId:'p1',title:'Pump'},{id:'w2',status:'Completed',assigneeId:'p1'}],people:[{id:'p1'},{id:'p2'}],assets:[],locations:[],vendors:[{id:'v1',bankAccount:'private'}]};
test('supervisor assigns open work without altering unrelated records',()=>{const old=structuredClone(base);const {next}=assignWorkOrder(base,{role:'supervisor'},{workOrderId:'w1',assigneeId:'p2'});assert.equal(next.workOrders[0].assigneeId,'p2');assert.equal(next.workOrders[0].status,'Assigned');assert.deepEqual(next.workOrders[1],base.workOrders[1]);assert.deepEqual(base,old);});
test('other roles cannot assign work orders',()=>{for(const role of ['manager','coordinator','finance_admin','technician','unknown'])assert.throws(()=>assignWorkOrder(base,{role},{workOrderId:'w1',assigneeId:'p2'}),{status:403});});
test('closed work, nonexistent employees, and extra fields fail closed',()=>{assert.throws(()=>assignWorkOrder(base,{role:'supervisor'},{workOrderId:'w2',assigneeId:'p2'}),{status:409});assert.throws(()=>assignWorkOrder(base,{role:'supervisor'},{workOrderId:'w1',assigneeId:'missing'}),{status:400});assert.throws(()=>assignWorkOrder(base,{role:'supervisor'},{workOrderId:'w1',assigneeId:'p2',status:'Completed'}),{status:400});});

test('manager creates an unassigned open work order without altering source',()=>{
 const old=structuredClone(base);const {next,after}=createManagerWorkOrder(base,{role:'manager'},{title:'Inspect pump',priority:'High'});
 assert.equal(after.status,'Open');assert.equal(after.assigneeId,'');assert.equal(after.priority,'High');assert.match(after.code,/^WO-\d{4}-[A-F0-9]{8}$/);assert.equal(next.workOrders.length,3);assert.deepEqual(base,old);
});
test('unauthorized roles cannot create manager work orders',()=>{for(const role of ['supervisor','coordinator','finance_admin','technician','unknown'])assert.throws(()=>createManagerWorkOrder(base,{role},{title:'Forged'}),{status:403});});
test('manager cannot forge assignee, status, financial fields or invalid references',()=>{
 for(const extra of [{assigneeId:'p2'},{status:'Completed'},{materialCost:200},{id:'forged'},{priority:'Urgent'},{assetId:'missing'}])assert.throws(()=>createManagerWorkOrder(base,{role:'manager'},{title:'Inspect',...extra}),{status:400});
});
