// Pure validation rules shared by all CMMS record forms.
// Returns {field, message} objects; no state mutation or browser dependencies.
const isIsoDate=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return false;const [y,m,d]=value.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d;};
const same=(a,b)=>String(a||'').trim().toLowerCase()===String(b||'').trim().toLowerCase();
export function validateRecord(module,row,state,editingId=null){
 const errors=[],add=(field,message)=>errors.push({field,message});
 const unique=(field,label)=>{if(row[field]&&state[module]?.some(x=>x.id!==editingId&&same(x[field],row[field])))add(field,label+' already exists. Use a unique value.');};
 const linked=(field,target,label)=>{if(row[field]&&!state[target]?.some(x=>x.id===row[field]))add(field,label+' no longer exists. Refresh and select a valid record.');};
 const date=(field,label)=>{if(row[field]&&!isIsoDate(row[field]))add(field,label+' must be a valid date.');};
 const nonnegative=(field,label)=>{if(row[field]!==''&&row[field]!=null&&(!Number.isFinite(Number(row[field]))||Number(row[field])<0))add(field,label+' must be zero or greater.');};
 switch(module){
  case 'assets':unique('code','Asset code');unique('serial','Serial number');linked('locationId','locations','Location');date('installDate','Installation date');break;
  case 'locations':unique('code','Location code');linked('parentId','locations','Parent location');if(row.parentId&&row.parentId===row.id)add('parentId','A location cannot be its own parent.');break;
  case 'people':unique('employeeNumber','Employee number');date('dateOfBirth','Date of birth');date('employmentDate','Employment start date');if(row.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))add('email','Enter a valid email address.');break;
  case 'parts':unique('code','Part code');for(const [f,l] of [['quantity','Stock quantity'],['reorderLevel','Reorder threshold'],['unitCost','Unit price']])nonnegative(f,l);break;
  case 'workOrders':
   linked('assetId','assets','Asset');linked('locationId','locations','Location');linked('assigneeId','people','Technician');date('dueDate','Due date');
   nonnegative('laborHours','Labour hours');nonnegative('materialCost','Material cost');
   if(['Assigned','In Progress'].includes(row.status)&&!row.assigneeId)add('assigneeId','Select an individual technician before setting the work order to '+row.status+'.');
   if(row.status==='Completed'&&!String(row.completionNotes||'').trim())add('completionNotes','Record the work performed or findings before marking this order completed.');
   break;
  case 'plans':
   linked('assetId','assets','Asset');linked('locationId','locations','Location');linked('assigneeId','people','Technician');
   date('startDate','First due date');date('endDate','End date');
   if(row.startDate&&row.endDate&&row.endDate<row.startDate)add('endDate','End date cannot precede the first due date.');
   if(!Number.isInteger(Number(row.interval))||Number(row.interval)<1||Number(row.interval)>365)add('interval','Enter a whole-number interval from 1 to 365.');
   break;
  case 'inspections':
   linked('assetId','assets','Asset');linked('locationId','locations','Location');date('inspectionDate','Inspection date');date('nextDueDate','Next due date');
   if(row.nextDueDate&&row.inspectionDate&&row.nextDueDate<row.inspectionDate)add('nextDueDate','Next due date cannot precede the inspection date.');
   if(row.result&&row.result!=='Pending'&&!row.inspectionDate)add('inspectionDate','Enter an inspection date for a completed inspection.');
   if(row.result&&row.result!=='Pending'&&!String(row.inspector||'').trim())add('inspector','Identify the responsible inspector.');
   break;
  case 'readings':
   linked('assetId','assets','Asset / meter');date('readingDate','Reading date');
   if(row.value===''||row.value==null||!Number.isFinite(Number(row.value)))add('value','Enter a valid numeric reading.');
   if(!row.readingDate)add('readingDate','Enter the date of the meter reading.');
   break;
 }
 return errors;
}
