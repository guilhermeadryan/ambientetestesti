import {defaultMetrics,type Data} from './data';
export function addPeriod(data:Data,team:'sti'|'ism',label:string,id:string):Data{
 const name=label.trim();
 if(!name||name.length>200)throw Error('Informe um nome de período com até 200 caracteres.');
 const list=team==='sti'?data.stiPeriods:data.ismPeriods;
 if(list.length>=500)throw Error('Limite de 500 períodos por equipe.');
 if(list.some(p=>p.id===id))throw Error('Este período já existe.');
 const next=structuredClone(data);
 if(team==='sti'){
  const previous=[...data.stiPeriods].reverse().find(p=>p.metrics)?.metrics||defaultMetrics;
  next.stiPeriods.push({id,label:name,unico:0,mia:0,metrics:{...structuredClone(previous),analysts:previous.analysts.map(a=>({name:a.name,tickets:0})),satisfaction:[0,0,100,0,0],response:[0,0,0],resolution:[0,0,0]}});
 }else{
  next.ismPeriods.push({id,label:name,goal:data.ismPeriods.at(-1)?.goal||100});
  next.clients.forEach(c=>{c.values[id]=null});
 }
 return next;
}
export function latestPeriodId(periods:{id:string}[]){return periods.at(-1)?.id||''}
export function removePeriod(data:Data,team:'sti'|'ism',id:string):Data{
 const list=team==='sti'?data.stiPeriods:data.ismPeriods;
 if(!list.some(p=>p.id===id))throw Error('Período não encontrado.');
 if(list.length<=1)throw Error('Mantenha pelo menos um período na equipe.');
 const next=structuredClone(data);
 if(team==='sti')next.stiPeriods=next.stiPeriods.filter(p=>p.id!==id);
 else {next.ismPeriods=next.ismPeriods.filter(p=>p.id!==id);next.clients.forEach(c=>{delete c.values[id]})}
 return next;
}
