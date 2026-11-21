import {requireAccess} from './role-policy.js';
import {validateRecord} from './validation.js';
// Coordinator may maintain contact details, never identity, role, payroll or account credentials.
export function updateEmployeeContact(source,session,input){
 requireAccess(session,'people.update');
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['personId','email','phone'].includes(k)))throw Object.assign(Error('Unexpected employee fields'),{status:400});
 if(typeof input.personId!=='string'||!input.personId||(!Object.hasOwn(input,'email')&&!Object.hasOwn(input,'phone')))throw Object.assign(Error('Employee and contact change required'),{status:400});
 for(const key of ['email','phone'])if(Object.hasOwn(input,key)&&(typeof input[key]!=='string'||input[key].length>150))throw Object.assign(Error('Invalid '+key),{status:400});
 const original=(source.people||[]).find(p=>p.id===input.personId);if(!original)throw Object.assign(Error('Employee not found'),{status:404});
 const next=structuredClone(source),person=next.people.find(p=>p.id===input.personId);
 if(Object.hasOwn(input,'email'))person.email=input.email.trim();if(Object.hasOwn(input,'phone'))person.phone=input.phone.trim();
 const issues=validateRecord('people',person,next,person.id);if(issues.length)throw Object.assign(Error(issues.map(i=>i.message).join(' ')),{status:400});
 return {next,before:original,after:person};
}
export function projectEmployeeDirectory(source,session){requireAccess(session,'people.update');return {people:(source.people||[]).map(p=>({id:p.id,name:p.name,employeeNumber:p.employeeNumber,email:p.email,phone:p.phone}))};}
