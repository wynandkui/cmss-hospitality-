import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
const root = resolve(import.meta.dirname, '..', process.argv[2] || '.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.md':'text/markdown; charset=utf-8','.json':'application/json; charset=utf-8'};
const port=Number(process.env.PORT)||5173;
createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(join(root, pathname==='/'?'index.html':pathname.slice(1)));
  if(file!==root && !file.startsWith(root+sep)){res.writeHead(403).end('Forbidden');return;}
  try{const info=await stat(file);if(!info.isFile())throw Error('Not file');res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(file));}
  catch{res.writeHead(404).end('Not found');}
}).listen(port,'0.0.0.0',()=>console.log(`CMMS available at http://localhost:${port}/`));