// Isolated backup/restore acceptance. Never writes to configured or source database.
import mysql from 'mysql2/promise';
import {readFileSync,mkdtempSync,rmSync,statSync,createReadStream,createWriteStream,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {reconcileMediaDirectory} from '../server/media-reconciliation.js';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
if(process.env.CMMS_RUN_DISPOSABLE_RESTORE!=='YES')throw Error('Explicit disposable restore opt-in required');
const env={...process.env};for(const line of readFileSync(new URL('../.env',import.meta.url),'utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_][A-Z_0-9]*)=(.*)$/);if(m&&!env[m[1]])env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}
const SOURCE='CMMS_v12_restore_test',TARGET='CMMS_RESTORE_IT_'+randomBytes(5).toString('hex');
assert.equal(env.DB_NAME,'CMMS_putterdb','Configured database differs from expected; stop');assert.notEqual(SOURCE,env.DB_NAME);assert.notEqual(TARGET,env.DB_NAME);
const opts={host:env.DB_HOST,port:Number(env.DB_PORT||3306),user:env.DB_USER,password:env.DB_PASSWORD};
const root=await mysql.createConnection(opts);let created=false;const temp=mkdtempSync(join(tmpdir(),'cmms-restore-it-'));const dump=join(temp,'isolated.sql');let passed=0;
const pass=x=>{passed++;console.log('PASS '+x)};
async function command(bin,args,{input,output}={}){return new Promise((resolve,reject)=>{const proc=spawn(bin,args,{env:{...process.env,MYSQL_PWD:env.DB_PASSWORD},stdio:['pipe','pipe','pipe']});let stderr='';proc.stderr.on('data',b=>{stderr+=b.toString().slice(0,2000)});proc.on('error',reject);if(input)createReadStream(input).pipe(proc.stdin);else proc.stdin.end();if(output){const stream=createWriteStream(output,{flags:'wx',mode:0o600});proc.stdout.pipe(stream);stream.on('error',reject)}else proc.stdout.resume();proc.on('close',code=>code===0?resolve():reject(Error(bin+' exited '+code+': '+stderr.slice(0,800))))})}
const connArgs=['--host',opts.host,'--port',String(opts.port),'--user',opts.user];
const digest=rows=>createHash('sha256').update(JSON.stringify(rows,(k,v)=>Buffer.isBuffer(v)?v.toString('hex'):v)).digest('hex');
try{
 const [sourceTables]=await root.query('SHOW FULL TABLES FROM `'+SOURCE+'`');const tables=sourceTables.filter(r=>Object.values(r)[1]==='BASE TABLE').map(r=>Object.values(r)[0]);assert.ok(tables.length>0);for(const t of tables)assert.match(t,/^[a-zA-Z0-9_]+$/);
 const source=await mysql.createConnection({...opts,database:SOURCE});const baseline={};for(const t of tables){const [rows]=await source.query('SELECT * FROM `'+t+'`');baseline[t]={count:rows.length,sha256:digest(rows)}}await source.end();pass('source test database baseline captured without modification');
 await command('mariadb-dump',['--single-transaction','--quick','--skip-lock-tables','--skip-add-drop-table','--no-tablespaces',...connArgs,SOURCE],{output:dump});const bytes=statSync(dump).size;assert.ok(bytes>100);const checksum=createHash('sha256').update(readFileSync(dump)).digest('hex');pass('consistent SQL dump created and SHA-256 recorded');
 // Gate 27: a changed backup must fail the recorded SHA-256 integrity check before import.
 const tampered=Buffer.from(readFileSync(dump));tampered[tampered.length-1]^=1;
 assert.notEqual(createHash('sha256').update(tampered).digest('hex'),checksum,'altered backup rejected by checksum');
 assert.equal(createHash('sha256').update(readFileSync(dump)).digest('hex'),checksum,'actual backup still matches recorded checksum');
 pass('SHA-256 detects modified backup before restore');
 await root.query('CREATE DATABASE `'+TARGET+'`');created=true;
 await command('mariadb',[...connArgs,TARGET],{input:dump});pass('SQL dump restored to uniquely named disposable database');
 const restored=await mysql.createConnection({...opts,database:TARGET});const [targetTables]=await restored.query('SHOW FULL TABLES');const names=targetTables.filter(r=>Object.values(r)[1]==='BASE TABLE').map(r=>Object.values(r)[0]);assert.deepEqual(names.slice().sort(),tables.slice().sort());pass('restored table inventory matches source');
 for(const t of tables){const [rows]=await restored.query('SELECT * FROM `'+t+'`');assert.equal(rows.length,baseline[t].count,'count '+t);assert.equal(digest(rows),baseline[t].sha256,'checksum '+t)}pass('every restored table matches source row counts and SHA-256');
 for(const t of ['cmms_users','cmms_state','cmms_transactions','cmms_audit_events'])assert.ok(names.includes(t),'critical table '+t);pass('users, application state, transaction journal and audit tables restored');
 const [[state]]=await restored.query('SELECT data FROM cmms_state WHERE id=1');const data=JSON.parse(state.data);assert.ok(data&&typeof data==='object');pass('restored CMMS state parses as JSON');
 // Gate 27: independently recover synthetic media and reconcile it with restored metadata IDs.
 // Never access or alter live media. The file inventory is entirely disposable.
 const mediaSource=join(temp,'media-source'),mediaRestored=join(temp,'media-restored');
 mkdirSync(mediaSource,{mode:0o700});mkdirSync(mediaRestored,{mode:0o700});
 const attachedId=randomUUID(),orphanId=randomUUID(),missingId=randomUUID();
 const content=Buffer.from('gate27-synthetic-maintenance-attachment');
 writeFileSync(join(mediaSource,attachedId),content,{mode:0o600});
 writeFileSync(join(mediaSource,orphanId),'unreferenced synthetic file',{mode:0o600});
 // Add synthetic metadata only to the disposable restored database, never to source.
 for(const id of [attachedId,missingId])await restored.execute('INSERT INTO cmms_files (id,entity_type,entity_id,original_name,mime,size_bytes,uploaded_by) VALUES (?,?,?,?,?,?,?)',[id,'assets','gate27-test','synthetic.txt','text/plain',content.length,'gate27-test']);
 const [recoveredRows]=await restored.query('SELECT id FROM cmms_files WHERE entity_id=?',['gate27-test']);
 const recoveredIds=recoveredRows.map(r=>r.id);
 const baselineMedia=await reconcileMediaDirectory(mediaSource,recoveredIds);
 assert.deepEqual(baselineMedia.orphaned,[orphanId]);assert.deepEqual(baselineMedia.missing,[missingId]);
 writeFileSync(join(mediaRestored,attachedId),readFileSync(join(mediaSource,attachedId)),{mode:0o600});
 const recoveredChecksum=createHash('sha256').update(readFileSync(join(mediaRestored,attachedId))).digest('hex');
 assert.equal(recoveredChecksum,createHash('sha256').update(content).digest('hex'));
 const mediaReport=await reconcileMediaDirectory(mediaRestored,recoveredIds);
 assert.deepEqual(mediaReport.orphaned,[]);assert.deepEqual(mediaReport.missing,[missingId]);
 assert.equal(mediaReport.physical,1);assert.equal(mediaReport.referenced,2);
 pass('synthetic media recovery preserves SHA-256 and flags missing metadata references');
 await restored.end();console.log('RESTORE PASS '+passed+'/'+passed);console.log('DUMP SHA256 '+checksum+'; bytes '+bytes+'; tables '+tables.length);console.log('This validates the known test database, not a current production backup.');
}catch(e){console.error('RESTORE FAIL after '+passed+' checks: '+e.message);process.exitCode=1}finally{if(created)await root.query('DROP DATABASE `'+TARGET+'`');await root.end();rmSync(temp,{recursive:true,force:true});console.log('Disposable restore database and temporary SQL dump removed')}
