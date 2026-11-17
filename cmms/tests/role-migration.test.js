import test from 'node:test';import assert from 'node:assert/strict';
import {ROLE_COLUMN_SQL,migrationNeeded,applyRoleMigration} from '../server/role-migration.js';
const legacy={Field:'role',Type:"enum('admin','technician')",Null:'NO'};
const upgraded={Field:'role',Type:"enum('admin','manager','supervisor','coordinator','finance_admin','technician')",Null:'NO'};
test('legacy role enum requires migration',()=>assert.equal(migrationNeeded(legacy),true));
test('v1.2 role enum is idempotent',()=>assert.equal(migrationNeeded(upgraded),false));
test('unexpected role schema fails closed',()=>assert.throws(()=>migrationNeeded({...legacy,Type:'varchar(48)'}),/Unknown role schema/));
test('role migration cannot run without explicit confirmation',async()=>{await assert.rejects(()=>applyRoleMigration({},{}),/Explicit confirmation/);});
test('migration statement expands enum without dropping account table',()=>{assert.match(ROLE_COLUMN_SQL,/ALTER TABLE cmms_users MODIFY COLUMN role/);assert.doesNotMatch(ROLE_COLUMN_SQL,/DROP|TRUNCATE|DELETE/i);});
