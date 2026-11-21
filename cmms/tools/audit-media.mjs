// Explicitly opt-in, read-only media consistency report. No file deletions.
import mysql from 'mysql2/promise';
import {resolve} from 'node:path';
import {reconcileMediaDirectory} from '../server/media-reconciliation.js';
if(process.env.CMMS_MEDIA_AUDIT!=='READ_ONLY')throw Error('Set CMMS_MEDIA_AUDIT=READ_ONLY to inspect media');
const root=process.env.CMMS_MEDIA_DIR;
if(!root||!process.env.DB_NAME||!process.env.DB_HOST||!process.env.DB_USER)throw Error('Explicit CMMS_MEDIA_DIR and DB connection environment required');
const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
try{
 const [rows]=await db.query('SELECT id FROM cmms_files');
 const report=await reconcileMediaDirectory(resolve(root),rows.map(r=>r.id));
 console.log(JSON.stringify({mode:'READ_ONLY',...report},null,2));
 if(report.orphaned.length||report.missing.length||report.unexpected.length)process.exitCode=2;
}finally{await db.end();}
