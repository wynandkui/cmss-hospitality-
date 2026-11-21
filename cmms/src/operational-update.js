import {randomUUID} from 'node:crypto';
import {requireAccess} from './role-policy.js';
import {validateRecord} from './validation.js';

// Pure, narrowly scoped mutation. Caller owns transaction, revision check and audit.
export function assignWorkOrder(source,session,input){
 requireAccess(session,'workOrders.assign');
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['workOrderId','assigneeId'].includes(k)))throw Object.assign(Error('Unexpected assignment fields'),{status:400});
 const id=input.workOrderId,assigneeId=input.assigneeId;
 if(typeof id!=='string'||!id||typeof assigneeId!=='string'||!assigneeId)throw Object.assign(Error('Work order and assignee required'),{status:400});
 const original=(source.workOrders||[]).find(w=>w.id===id);
 if(!original)throw Object.assign(Error('Work order not found'),{status:404});
 if(['Completed','Cancelled'].includes(original.status))throw Object.assign(Error('Closed work orders cannot be reassigned'),{status:409});
 if(!(source.people||[]).some(p=>p.id===assigneeId))throw Object.assign(Error('Technician not found'),{status:400});
 const next=structuredClone(source);
 const row=next.workOrders.find(w=>w.id===id);
 row.assigneeId=assigneeId;
 if(row.status==='Open')row.status='Assigned';
 const issues=validateRecord('workOrders',row,next,id);
 if(issues.length)throw Object.assign(Error(issues.map(i=>i.message).join(' ')),{status:400});
 return {next,before:original,after:row};
}

export function createManagerWorkOrder(source,session,input){
 requireAccess(session,'workOrders.create');
 const allowed=['title','description','priority','type','assetId','locationId','dueDate'];
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))throw Object.assign(Error('Unexpected work order fields'),{status:400});
 if(typeof input.title!=='string'||!input.title.trim()||input.title.length>200)throw Object.assign(Error('Valid title required'),{status:400});
 for(const key of allowed.filter(k=>k!=='title'))if(input[key]!==undefined&&typeof input[key]!=='string')throw Object.assign(Error('Invalid '+key),{status:400});
 if(input.priority!==undefined&&!['Critical','High','Medium','Low'].includes(input.priority))throw Object.assign(Error('Invalid priority'),{status:400});
 if(input.type!==undefined&&!['Corrective','Preventive'].includes(input.type))throw Object.assign(Error('Invalid type'),{status:400});
 const next=structuredClone(source);
 const id=randomUUID();
 const row={id,code:'WO-'+new Date().getUTCFullYear()+'-'+id.slice(0,8).toUpperCase(),type:'Corrective',status:'Open',priority:'Medium',createdAt:new Date().toISOString(),completedAt:'',laborHours:0,materialCost:0,...input,title:input.title.trim(),assigneeId:''};
 const issues=validateRecord('workOrders',row,next);
 if(issues.length)throw Object.assign(Error(issues.map(i=>i.message).join(' ')),{status:400});
 next.workOrders.push(row);
 return {next,after:row};
}
