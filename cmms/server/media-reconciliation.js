// Read-only inventory reconciliation. Never deletes, modifies, or follows symlinks.
import {readdir,lstat} from 'node:fs/promises';
import {join} from 'node:path';
const MEDIA_ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export async function reconcileMediaDirectory(root,metadataIds){
 const referenced=new Set(metadataIds);
 const present=new Set(),orphaned=[],unexpected=[];
 for(const entry of await readdir(root,{withFileTypes:true})){
  const name=entry.name;
  if(!MEDIA_ID.test(name)){unexpected.push(name);continue;}
  const info=await lstat(join(root,name));
  if(!info.isFile()){unexpected.push(name);continue;}
  present.add(name);
  if(!referenced.has(name))orphaned.push(name);
 }
 return {orphaned:orphaned.sort(),missing:[...referenced].filter(id=>!present.has(id)).sort(),unexpected:unexpected.sort(),referenced:referenced.size,physical:present.size};
}
