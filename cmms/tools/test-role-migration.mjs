import mysql from 'mysql2/promise';
import {readFileSync} from 'node:fs';
import {randomBytes,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {inspectRoleMigration,applyRoleMigration,LEGACY_ROLE_COLUMN_SQL} from '../server/role-migration.js';
if(process.env.CMMS_RUN_DISPOSABLE_MIGRATION!=='YES')throw Error('Disposable migration opt-in required');
const env={...process.env};for(const line of readFileSync(new URL('../.env',import.meta.url),'utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_][A-Z_0-9]*)=(.*)$/);if(m&&!env[m[1]])env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}
const source='CMMS_v12_restore_test',temp='CMMS_ROLE_IT_'+randomBytes(5).toString('hex');
assert.notEqual(temp,env.DB_NAME);assert.notEqual(source,env.DB_NAME);
const c=await mysql.createConnection({host:env.DB_HOST,port:Number(env.DB_PORT||3306),user:env.DB_USER,password:env.DB_PASSWORD});let made=false,passed=0;
const pass=s=>{console.log('PASS '+s);passed++};
try{
 await c.query('CREATE DATABASE `'+temp+'`');made=true;
 const [tables]=await c.query('SHOW TABLES FROM `'+source+'`');for(const r of tables){const t=Object.values(r)[0];assert.match(t,/^[\w]+$/);await c.query('CREATE TABLE `'+temp+'`.`'+t+'` LIKE `'+source+'`.`'+t+'`');await c.query('INSERT INTO `'+temp+'`.`'+t+'` SELECT * FROM `'+source+'`.`'+t+'`')}
 await c.query('USE `'+temp+'`');
 const [original]=await c.query('SELECT id,username,password_hash,role,person_id,permissions,active FROM cmms_users ORDER BY id');
 const digest=rows=>createHash('sha256').update(JSON.stringify(rows)).digest('hex');const baseline=digest(original);
 const current=await inspectRoleMigration(c);assert.equal(current.needed,false);pass('six-role schema matches target');
 const noop=await applyRoleMigration(c,{confirm:true});assert.equal(noop.changed,false);pass('already-upgraded schema is idempotent');
 await c.query("ALTER TABLE cmms_users MODIFY COLUMN role ENUM('admin','technician') NOT NULL");assert.equal((await inspectRoleMigration(c)).needed,true);pass('legacy schema detected');
 await assert.rejects(()=>applyRoleMigration(c),/Explicit confirmation/);pass('unconfirmed migration rejected');
 const migrated=await applyRoleMigration(c,{confirm:true});assert.equal(migrated.changed,true);assert.equal(migrated.after.needed,false);pass('legacy schema migrates to six roles');
 const again=await applyRoleMigration(c,{confirm:true});assert.equal(again.changed,false);pass('repeated migration makes no changes');
 const [after]=await c.query('SELECT id,username,password_hash,role,person_id,permissions,active FROM cmms_users ORDER BY id');assert.equal(digest(after),baseline);pass('account hashes, links and permissions preserved');
 await c.query("UPDATE cmms_users SET role='manager' WHERE id=?",[original[0].id]);await assert.rejects(()=>c.query("ALTER TABLE cmms_users MODIFY COLUMN role ENUM('admin','technician') NOT NULL"));pass('rollback safely blocked while new role in use');
 await c.query('UPDATE cmms_users SET role=? WHERE id=?',[original[0].role,original[0].id]);await c.query("ALTER TABLE cmms_users MODIFY COLUMN role ENUM('admin','technician') NOT NULL");assert.equal((await inspectRoleMigration(c)).needed,true);pass('rollback succeeds after new role removed');
 const [restored]=await c.query('SELECT id,username,password_hash,role,person_id,permissions,active FROM cmms_users ORDER BY id');assert.equal(digest(restored),baseline);pass('rollback preserves all original account values');
 console.log('MIGRATION PASS '+passed+'/'+passed);
}catch(e){console.error('MIGRATION FAIL after '+passed+': '+e.message);process.exitCode=1}finally{if(made)await c.query('DROP DATABASE `'+temp+'`');await c.end();console.log('Disposable migration database removed')}
