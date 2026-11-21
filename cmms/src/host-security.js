export function hostAllowed(host,allowedHosts){
 const entries=String(allowedHosts||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 return entries.length===0||entries.includes(String(host||'').toLowerCase());
}
