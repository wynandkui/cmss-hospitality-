import {readFileSync,openSync,closeSync,chmodSync,statSync,unlinkSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const env={...process.env};
try{for(const line of readFileSync(new URL('../.env',import.meta.url),'utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_][A-Z_0-9]*)=(.*)$/);if(m&&!env[m[1]])env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');}}catch{}
const dir=resolve('backups');mkdirSync(dir,{recursive:true,mode:0o700});chmodSync(dir,0o700);
const date=new Date().toISOString().replace(/[:.]/g,'-');const path=resolve(dir,'cmms-pre-v1.2-roles-'+date+'.sql');const fd=openSync(path,'wx',0o600);
const args=['--single-transaction','--quick','--routines','--triggers','--events','--host',env.DB_HOST||'127.0.0.1','--port',String(env.DB_PORT||3306),'--user',env.DB_USER||'cmms','--databases',env.DB_NAME||'cmms'];
let result;
try{for(const bin of ['mariadb-dump','mysqldump']){result=spawnSync(bin,args,{stdio:['ignore',fd,'pipe'],env:{...process.env,MYSQL_PWD:env.DB_PASSWORD||''},encoding:'utf8'});if(result.error?.code==='ENOENT')continue;break;}}finally{closeSync(fd);}
if(result?.error||result?.status!==0||statSync(path).size===0){unlinkSync(path);console.error('Backup FAILED:',result?.stderr?.trim()||result?.error?.message||'No dump utility installed');process.exit(1);}
const content=readFileSync(path);if(!content.includes(Buffer.from('CREATE TABLE'))){unlinkSync(path);console.error('Backup FAILED: SQL dump has no CREATE TABLE statements');process.exit(1);}
console.log(JSON.stringify({result:'BACKUP_CREATED',path,bytes:content.length,sha256:createHash('sha256').update(content).digest('hex'),note:'Read-only export. Keep backup secure. Restore not yet tested.'},null,2));
