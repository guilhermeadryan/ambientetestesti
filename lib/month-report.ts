import type {Data} from './data';
export type ReportSection={title:string;rows:[string,string][]};
const num=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:2});
export function monthReport(data:Data,team:'sti'|'ism',id:string){
 const sections:ReportSection[]=[];
 const period=(team==='sti'?data.stiPeriods:data.ismPeriods).find(p=>p.id===id);
 if(!period)throw Error('Selecione um período válido para exportar.');
 if(team==='sti'){
  const p=data.stiPeriods.find(p=>p.id===id)!;
  sections.push({title:'Tickets do período',rows:[['Tickets resolvidos (Unico + MIA)',num(p.unico+p.mia)],['Tickets Unico',num(p.unico)],['Tickets MIA',num(p.mia)]]});
  const m=p.metrics;
  if(m){
   sections.push({title:'Tickets por analista',rows:m.analysts.map(a=>[a.name,num(a.tickets)])});
   sections.push({title:'Satisfação',rows:[...['Ótimo','Bom','Neutro','Ruim','Péssimo'].map((s,i)=>[s,num(m.satisfaction[i])+'%'] as [string,string]),['Avaliações positivas',num(m.satisfaction[0]+m.satisfaction[1])+'%'],['Meta de satisfação',num(m.satisfactionGoal)+'%']]});
   sections.push({title:'Tempos e metas · '+data.unit,rows:['Alta','Média','Baixa'].flatMap((s,i)=>[[s+' · primeira resposta',num(m.response[i])+' / meta: '+num(m.responseGoals[i])],[s+' · resolução',num(m.resolution[i])+' / meta: '+num(m.resolutionGoals[i])]] as [string,string][])});
  }else sections.push({title:'Demais indicadores',rows:[['Analistas, satisfação e tempos','Não informados neste período']]});
 }else{
  const p=data.ismPeriods.find(p=>p.id===id)!;
  const values=data.clients.map(c=>c.values[id]).filter((v):v is number=>v!=null);
  sections.push({title:'Resumo ISM',rows:[['Evolução média',values.length?num(values.reduce((a,b)=>a+b,0)/values.length)+'%':'Não informada'],['Meta de evolução',num(p.goal)+'%'],['Clientes na meta',values.filter(v=>v>=p.goal).length+' / '+data.clients.length],['Clientes com dados',String(values.length)]]});
  sections.push({title:'Especialistas',rows:data.ismPeople.map(name=>[name,'ISM'])});
  sections.push({title:'Evolução por cliente',rows:data.clients.map(c=>[c.name,c.values[id]==null?'Não informada':num(c.values[id]!)+'% · '+(c.values[id]!>=p.goal?'Meta alcançada':'Em evolução')])});
 }
 if(data.notes.trim())sections.push({title:'Notas da liderança (gerais)',rows:[['Observações',data.notes]]});
 return {team:team.toUpperCase(),period:period.label,head:data.head,sections};
}
