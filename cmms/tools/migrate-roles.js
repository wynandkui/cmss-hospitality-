import mysql from 'mysql2/promise';
import {readFileSync} from 'node:fs';
import {inspectRoleMigration,applyRoleMigration} from '../server/role-migration.js';
const env={...process.env};
try{for(const line of readFileSync(new URL('../.env',import.meta.url),'utf8').split(/\r?\n/)){const match=line.match(/^([A-Z_][A-Z_0-9]*)=(.*)$/);if(match&&!env[match[1]])env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');}}catch{}
const apply=process.argv.includes('--apply');
const connection=await mysql.createConnection({host:env.DB_HOST||'127.0.0.1',port:Number(env.DB_PORT||3306),user:env.DB_USER||'cmms',password:env.DB_PASSWORD||'',database:env.DB_NAME||'cmms'});
try{
 if(apply){const result=await applyRoleMigration(connection,{confirm:true});console.log(JSON.stringify({mode:'APPLY',...result},null,2));}
 else {const result=await inspectRoleMigration(connection);console.log(JSON.stringify({mode:'DRY_RUN',...result},null,2));console.log('No database changes made. Use --apply only after approved backup.');}
}finally{await connection.end();}
