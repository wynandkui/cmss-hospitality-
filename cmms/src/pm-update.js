import {randomUUID} from 'node:crypto';
import {requireAccess} from './role-policy.js';
import {validateRecord} from './validation.js';
export function createPmPlan(source,session,input){
 requireAccess(session,'pm.manage');
 const allowed=['title','description','assetId','locationId','assigneeId','startDate','endDate','interval'];
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))throw Object.assign(Error('Unexpected PM plan fields'),{status:400});
 if(typeof input.title!=='string'||!input.title.trim()||input.title.length>200)throw Object.assign(Error('Valid PM plan title required'),{status:400});
 for(const key of allowed.filter(k=>!['title','interval'].includes(k)))if(input[key]!==undefined&&typeof input[key]!=='string')throw Object.assign(Error('Invalid '+key),{status:400});
 if(typeof input.startDate!=='string'||!input.startDate)throw Object.assign(Error('Start date required'),{status:400});
 if(!Number.isInteger(Number(input.interval))||Number(input.interval)<1||Number(input.interval)>365)throw Object.assign(Error('Interval must be 1 to 365 days'),{status:400});
 const next=structuredClone(source),row={id:randomUUID(),...input,title:input.title.trim(),interval:Number(input.interval)};
 const issues=validateRecord('plans',row,next);if(issues.length)throw Object.assign(Error(issues.map(x=>x.message).join(' ')),{status:400});
 next.plans.push(row);return {next,after:row};
}
