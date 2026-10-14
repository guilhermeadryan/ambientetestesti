'use client';
import {useState,useEffect,useRef} from 'react';
import {ChevronLeft,ChevronRight,RotateCcw} from 'lucide-react';
import type {Data} from '../lib/data';
const palette=['#488ad9','#69b5e8','#9b85dd','#e8a75c','#da7499','#58b3aa'];
type Point=[number,number,number];
export default function IsmChart3D({data}:{data:Data}){
 const root=useRef<HTMLDivElement>(null),[pageSize,setPageSize]=useState(6);
 useEffect(()=>{if(!root.current)return;const observer=new ResizeObserver(entries=>setPageSize(entries[0].contentRect.width<420?3:6));observer.observe(root.current);return()=>observer.disconnect()},[]);
 const [angle,setAngle]=useState(32),[tilt,setTilt]=useState(28),[page,setPage]=useState(0),[hidden,setHidden]=useState<string[]>([]),[active,setActive]=useState<{name:string;period:string;value:number}|null>(null);
 const pages=Math.max(1,Math.ceil(data.clients.length/pageSize)),safePage=Math.min(page,pages-1),clients=data.clients.slice(safePage*pageSize,safePage*pageSize+pageSize),allPeriods=data.ismPeriods.slice(-6),periods=allPeriods.filter(p=>!hidden.includes(p.id));
 const yaw=angle*Math.PI/180,pitch=tilt*Math.PI/180;
 const project=([x,y,z]:Point)=>[x*Math.cos(yaw)-z*Math.sin(yaw),(x*Math.sin(yaw)+z*Math.cos(yaw))*Math.sin(pitch)-y*Math.cos(pitch)];
 const depth=([x,y,z]:Point)=>(x*Math.sin(yaw)+z*Math.cos(yaw))*Math.cos(pitch)+y*Math.sin(pitch);
 const width=Math.max(clients.length,1)*35,deep=Math.max(periods.length,1)*19;
 const corners=([0,100] as number[]).flatMap(y=>[0,width].flatMap(x=>[0,deep].map(z=>project([x,y,z]))));
 const minX=Math.min(...corners.map(p=>p[0]))-40,maxX=Math.max(...corners.map(p=>p[0]))+25,minY=Math.min(...corners.map(p=>p[1]))-24,maxY=Math.max(...corners.map(p=>p[1]))+35;
 const coords=(ps:Point[])=>ps.map(p=>project(p).join(',')).join(' ');
 const bars=clients.flatMap((client,c)=>periods.flatMap((period,p)=>{
  const value=client.values[period.id];if(value==null)return [];
  const x=c*35+8,z=p*19+5,w=18,d=10;
  const a:Point=[x,0,z],b:Point=[x+w,0,z],cc:Point=[x+w,0,z+d],dd:Point=[x,0,z+d],e:Point=[x,value,z],f:Point=[x+w,value,z],g:Point=[x+w,value,z+d],h:Point=[x,value,z+d];
  return [{id:client.id+'-'+period.id,client,period,value,color:palette[allPeriods.findIndex(v=>v.id===period.id)],distance:depth([x+w/2,value/2,z+d/2]),faces:[{ps:[a,b,f,e],opacity:.88},{ps:[b,cc,g,f],opacity:.58},{ps:[dd,a,e,h],opacity:.7},{ps:[e,f,g,h],opacity:1}]}];
 })).sort((a,b)=>b.distance-a.distance);
 function reset(){setAngle(32);setTilt(28);setHidden([]);setActive(null)}
 return <div className="ism-3d" ref={root}><div className="ism-3d-controls"><label>Rotação <input aria-label="Rotação do gráfico" type="range" min="12" max="65" value={angle} onChange={e=>setAngle(Number(e.target.value))}/></label><label>Inclinação <input aria-label="Inclinação do gráfico" type="range" min="15" max="45" value={tilt} onChange={e=>setTilt(Number(e.target.value))}/></label><button onClick={reset} aria-label="Restaurar perspectiva"><RotateCcw size={16}/></button></div>
 <div className="ism-3d-stage"><svg viewBox={`${minX} ${minY} ${maxX-minX} ${maxY-minY}`} role="group" aria-label="Evolução 3D por cliente e período; altura representa percentuais de zero a cem" preserveAspectRatio="xMidYMid meet">
 <polygon points={coords([[0,0,0],[width,0,0],[width,0,deep],[0,0,deep]])} className="ism-3d-floor"/>
 {[0,25,50,75,100].map(v=><g key={v}><polyline points={coords([[0,v,0],[0,v,deep],[width,v,deep]])} className="ism-3d-grid"/><text x={project([0,v,0])[0]-7} y={project([0,v,0])[1]+3} textAnchor="end" className="ism-3d-axis">{v}%</text></g>)}
 {bars.map(bar=><g key={bar.id} role="button" tabIndex={0} aria-label={`${bar.client.name}, ${bar.period.label}, ${bar.value}%`} onMouseEnter={()=>setActive({name:bar.client.name,period:bar.period.label,value:bar.value})} onFocus={()=>setActive({name:bar.client.name,period:bar.period.label,value:bar.value})} onClick={()=>setActive({name:bar.client.name,period:bar.period.label,value:bar.value})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setActive({name:bar.client.name,period:bar.period.label,value:bar.value})}}} className="ism-3d-bar"><title>{bar.client.name} · {bar.period.label}: {bar.value}%</title>{bar.faces.map((face,i)=><polygon key={i} points={coords(face.ps)} fill={bar.color} fillOpacity={face.opacity}/>)}</g>)}
 {clients.map((client,i)=><text key={client.id} x={project([i*35+17,0,0])[0]} y={project([i*35+17,0,0])[1]+15} textAnchor="middle" className="ism-3d-axis">{safePage*pageSize+i+1}</text>)}
 </svg></div>
 <div className="ism-3d-detail" aria-live="polite">{active?<><strong>{active.name}</strong><span>{active.period}</span><b>{active.value.toLocaleString('pt-BR')}%</b></>:<span>Selecione uma barra para ver cliente, período e evolução.</span>}</div>
 <div className="ism-3d-periods">{allPeriods.map((p,i)=><button key={p.id} aria-pressed={!hidden.includes(p.id)} onClick={()=>{setHidden(old=>old.includes(p.id)?old.filter(id=>id!==p.id):[...old,p.id]);setActive(null)}}><i style={{background:palette[i]}}/>{p.label}</button>)}</div>
 <div className="ism-3d-clients">{clients.map((c,i)=><span key={c.id}><b>{safePage*pageSize+i+1}</b> {c.name}</span>)}</div>
 {pages>1&&<div className="ism-3d-pages"><button disabled={safePage===0} onClick={()=>{setPage(safePage-1);setActive(null)}}><ChevronLeft size={16}/>Anterior</button><span>{safePage+1} / {pages}</span><button disabled={safePage===pages-1} onClick={()=>{setPage(safePage+1);setActive(null)}}>Próximos<ChevronRight size={16}/></button></div>}
 <p className="data-note">Altura = evolução (%). Cores = períodos. Clientes sem dados não têm barra; 0% aparece na base. Use as legendas para mostrar ou ocultar períodos.</p>
 </div>;
}
