import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,demoState,normalizeState,MODULES} from '../src/core.js';

test('empty state has every registered module',()=>{
 const state=initialState();
 for(const module of MODULES)assert.ok(Array.isArray(state[module]),module);
});
test('existing operational demo dataset covers core workflows without a database',()=>{
 const state=demoState();
 for(const module of ['locations','assets','people','workOrders','plans','parts'])assert.ok(state[module].length>0,'Missing demo '+module);
 assert.equal(normalizeState(state).schemaVersion,1);
});
test('demo state generation does not mutate the empty initial state',()=>{
 const empty=initialState();demoState();
 for(const module of MODULES)assert.equal(empty[module].length,0,module);
});
