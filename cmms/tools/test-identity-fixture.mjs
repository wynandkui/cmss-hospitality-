/** Read-only identity integrity check of known isolated fixture; never writes to MariaDB. */
import {readFileSync} from 'node:fs';
import mysql from 'mysql2/promise';
import {inspectIdentityIntegrity} from '../src/identity-integrity.js';
if(process.env.CMMS_RUN_READONLY_IDENTITY_FIXTURE!=='YES')throw Error('Explicit read-only fixture opt-in required');
const env=Object.fromEntries(readFileSync(new URL('../.env',import.meta.url),'utf8').split(/\r?\n/).filter(x=>/^[A-Z_][A-Z_0-9]*=/.test(x)).map(x=>{const [k,...v]=x.split('=');return [k,v.join('=').replace(/^['"]|['"]$/g,'')]}));
if(env.DB_NAME!=='CMMS_putterdb')throw Error('Unexpected configured database; stop');
const SOURCE='CMMS_v12_restore_test';
if(SOURCE===env.DB_NAME)throw Error('Fixture must not be configured database');
const conn=await mysql.createConnection({host:env.DB_HOST,port:Number(env.DB_PORT||3306),user:env.DB_USER,password:env.DB_PASSWORD,database:SOURCE,multipleStatements:false});
try{
 await conn.query('SET SESSION TRANSACTION READ ONLY');
 await conn.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
 const [users]=await conn.query('SELECT id,role,person_id AS personId FROM cmms_users');
 const [[state]]=await conn.query('SELECT data FROM cmms_state WHERE id=1');
 if(!state)throw Error('Fixture has no CMMS state');
 const people=JSON.parse(state.data).people;
 const report=inspectIdentityIntegrity(users,people);
 console.log(JSON.stringify({source:'disposable-fixture-only',...report},null,2));
 if(!report.passed)process.exitCode=1;
}finally{await conn.rollback();await conn.end()}
