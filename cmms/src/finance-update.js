import {randomUUID} from 'node:crypto';
import {requireAccess} from './role-policy.js';
const dateValid=x=>{if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;const d=new Date(x+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===x;};
// Append-only maintenance subledger entry. No bank, vendor, VAT or payroll changes.
export function postMaintenanceCost(source,session,input){
 requireAccess(session,'finance.manage');
 const fields=['workOrderId','category','date','description','amount','reference'];
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!fields.includes(k)))throw Object.assign(Error('Unexpected financial fields'),{status:400});
 if(typeof input.workOrderId!=='string'||!(source.workOrders||[]).some(w=>w.id===input.workOrderId))throw Object.assign(Error('Valid work order required'),{status:400});
 if(!['labour','services','other'].includes(input.category))throw Object.assign(Error('Invalid cost category'),{status:400});
 if(!dateValid(input.date))throw Object.assign(Error('Invalid posting date'),{status:400});
 if(typeof input.description!=='string'||!input.description.trim()||input.description.length>500)throw Object.assign(Error('Valid description required'),{status:400});
 if(typeof input.reference!=='undefined'&&(typeof input.reference!=='string'||input.reference.length>150))throw Object.assign(Error('Invalid reference'),{status:400});
 if(typeof input.amount!=='number'||!Number.isFinite(input.amount)||input.amount<=0||input.amount>100000000||Math.round(input.amount*100)/100!==input.amount)throw Object.assign(Error('Amount must be positive ZAR with two decimals'),{status:400});
 const next=structuredClone(source),entry={id:randomUUID(),workOrderId:input.workOrderId,category:input.category,date:input.date,description:input.description.trim(),amount:input.amount,reference:input.reference||'',source:'FinanceAdmin',postedAt:new Date().toISOString()};next.costEntries.push(entry);return {next,after:entry};
}
