import test from 'node:test';import assert from 'node:assert/strict';import {initialState} from '../src/core.js';import {createPmPlan} from '../src/pm-update.js';
const input={title:'Air handling unit inspection',startDate:'2026-12-01',interval:30};
test('coordinator can create valid PM plan without modifying source',()=>{const state=initialState(),r=createPmPlan(state,{role:'coordinator'},input);assert.equal(r.next.plans.length,1);assert.equal(r.after.interval,30);assert.equal(state.plans.length,0)});
test('all non-coordinator pending roles denied PM create',()=>{for(const role of ['manager','supervisor','finance_admin','technician'])assert.throws(()=>createPmPlan(initialState(),{role},input),{status:403})});
test('PM input rejects unexpected fields and invalid interval',()=>{for(const plan of [{...input,approved:true},{...input,interval:0},{...input,startDate:'2026-02-31'}])assert.throws(()=>createPmPlan(initialState(),{role:'coordinator'},plan),{status:400})});
