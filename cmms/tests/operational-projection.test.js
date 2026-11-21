import test from 'node:test';
import assert from 'node:assert/strict';
import {projectOperationalWorkOrders} from '../src/operational-projection.js';
const source={workOrders:[{id:'wo1',number:'WO-1',code:'WO-2026-0001',title:'Pump inspection',status:'Open',assetId:'a1',locationId:'l1',assigneeId:'p1',completionNotes:'private',materialCost:500,internalSecret:'never expose'}],assets:[{id:'a1',name:'Pump',code:'P1',purchasePrice:10000},{id:'a2',name:'Other'}],locations:[{id:'l1',name:'Plant',privateNotes:'secret'}],people:[{id:'p1',name:'Employee',email:'private@example.com'}],vendors:[{id:'v1',bankAccount:'private'}],settings:{password:'private'}};
test('manager, supervisor and coordinator receive minimal operational records only',()=>{
 for(const role of ['manager','supervisor','coordinator']){
  const output=projectOperationalWorkOrders(source,{role});
  assert.deepEqual(output.workOrders,[{id:'wo1',number:'WO-1',code:'WO-2026-0001',title:'Pump inspection',status:'Open',priority:undefined,description:undefined,assetId:'a1',locationId:'l1',assigneeId:'p1',createdAt:undefined,dueDate:undefined,completedAt:undefined}]);
  assert.deepEqual(output.assets,[{id:'a1',name:'Pump',code:'P1'}]);
  assert.deepEqual(output.locations,[{id:'l1',name:'Plant'}]);
  assert.deepEqual(Object.keys(output),['workOrders','assets','locations']);
 }
});
test('finance, technician, unknown and missing roles cannot read all work orders',()=>{
 for(const session of [{role:'finance_admin'},{role:'technician',personId:'p1'},{role:'unknown'},null])assert.throws(()=>projectOperationalWorkOrders(source,session),{status:403});
});
test('projection cannot mutate original data',()=>{const snapshot=structuredClone(source);const output=projectOperationalWorkOrders(source,{role:'manager'});output.workOrders[0].status='Changed';assert.deepEqual(source,snapshot);});
