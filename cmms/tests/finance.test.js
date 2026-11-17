import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,normalizeState} from '../src/core.js';
import {costReport} from '../src/finance.js';
test('legacy CMMS state imports with empty finance collections',()=>{const old=initialState();delete old.vendors;delete old.requisitions;delete old.purchaseOrders;delete old.costEntries;const result=normalizeState(old);for(const k of ['vendors','requisitions','purchaseOrders','costEntries'])assert.deepEqual(result[k],[]);});
test('new procurement records survive backup normalization',()=>{const s=initialState();s.vendors.push({id:'v1',name:'Supplier'});s.purchaseOrders.push({id:'po1',code:'PO-001'});assert.deepEqual(normalizeState(s).purchaseOrders,s.purchaseOrders);});
test('financial report totals by work order and date range',()=>{const s=initialState();s.workOrders=[{id:'w1',code:'WO-001'},{id:'w2',code:'WO-002'}];s.costEntries=[{id:'1',workOrderId:'w1',category:'materials',amount:120.25,date:'2026-11-01'},{id:'2',workOrderId:'w1',category:'labour',amount:30,date:'2026-11-02'},{id:'3',workOrderId:'w2',category:'services',amount:99,date:'2026-10-02'}];const r=costReport(s,'2026-11-01','2026-11-30');assert.equal(r.totals.total,150.25);assert.equal(r.totals.materials,120.25);assert.equal(r.byWorkOrder.length,1);assert.equal(r.byWorkOrder[0].workOrder,'WO-001');});
