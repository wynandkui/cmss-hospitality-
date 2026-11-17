import qrcode from './vendor/qrcode.mjs';

// QR payloads contain the record details directly; scanning needs no network connection.
// Never include account credentials, database settings, employee DOB or private contact data.
export function assetPayload(asset,location=null,facility=''){
 if(!asset?.id)throw Error('Save the asset before generating a QR code.');
 return JSON.stringify({kind:'CMMS_ASSET',version:1,facility,asset:{...asset},location:location?{code:location.code||'',name:location.name||''}:null});
}
export function workOrderPayload(order,asset=null,location=null,technician=null,facility=''){
 if(!order?.id)throw Error('Save the work order before generating a QR code.');
 return JSON.stringify({kind:'CMMS_WORK_ORDER',version:1,facility,id:order.id,code:order.code||'',title:order.title||'',status:order.status||'',priority:order.priority||'',type:order.type||'',dueDate:order.dueDate||'',assetCode:asset?.code||'',location:location?.name||'',assignedTechnician:technician?.name||''});
}
export function qrSvg(payload,cell=4){
 if(typeof payload!=='string'||!payload)throw Error('QR data is empty.');
 // Auto version, lowest error-correction level to support detailed offline asset records.
 let qr;try{qr=qrcode(0,'L');qr.addData(payload,'Byte');qr.make();}catch(error){throw Error('QR data exceeds the maximum scannable capacity. Shorten the asset notes or remove unnecessary text. '+error.message);}
 const count=qr.getModuleCount(),margin=4,size=(count+margin*2)*cell;
 let paths='';for(let y=0;y<count;y++)for(let x=0;x<count;x++)if(qr.isDark(y,x))paths+='M'+((x+margin)*cell)+' '+((y+margin)*cell)+'h'+cell+'v'+cell+'h-'+cell+'z';
 return '<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR code" width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'"><rect width="100%" height="100%" fill="#fff"/><path d="'+paths+'" fill="#000"/></svg>';
}
