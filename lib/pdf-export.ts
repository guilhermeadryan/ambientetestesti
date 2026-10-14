import {monthReport} from './month-report';
import type {Data} from './data';
export async function createMonthPdf(data:Data,team:'sti'|'ism',id:string){
 const report=monthReport(data,team,id);
 const {jsPDF}=await import('jspdf');
 const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
 doc.setProperties({title:`Head Pulse · ${report.team} · ${report.period}`,author:report.head});
 let y=20;
 function heading(){
  doc.setFillColor(20,36,61);doc.rect(0,0,210,35,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('HEAD PULSE',16,14);
  doc.setFontSize(10);doc.setFont('helvetica','normal');
  const lines=doc.splitTextToSize(`${report.team} | ${report.period} | Head: ${report.head}`,178);doc.text(lines.slice(0,3),16,21);
  doc.setTextColor(30,42,60);y=44;
 }
 function room(height:number){if(y+height>278){doc.addPage();heading();}}
 heading();
 for(const section of report.sections){
  room(16);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(section.title,16,y);y+=8;
  if(!section.rows.length){doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text('Nenhum registro.',16,y);y+=9;}
  for(const [label,value] of section.rows){
   doc.setFontSize(10);doc.setFont('helvetica','normal');
   const left:string[]=doc.splitTextToSize(label,80),right:string[]=doc.splitTextToSize(value,90);
   for(let offset=0;offset<Math.max(left.length,right.length);offset+=40){
    const l=left.slice(offset,offset+40),r=right.slice(offset,offset+40);
    const height=Math.max(l.length,r.length)*5+5;room(height);
    doc.setFillColor(245,247,250);doc.rect(16,y-4,178,height,'F');doc.setTextColor(30,42,60);
    doc.text(l,19,y);doc.text(r,103,y);y+=height;
   }
  }
  y+=8;
 }
 const pages=doc.getNumberOfPages();
 for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(100,112,128);doc.text(`Head Pulse | ${report.team} | ${i} / ${pages}`,16,289);doc.text(new Date().toLocaleDateString('pt-BR'),194,289,{align:'right'});}
 return {doc,filename:`head-pulse-${team}-${report.period.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').toLowerCase()}.pdf`};
}
export async function downloadMonthPdf(data:Data,team:'sti'|'ism',id:string){const {doc,filename}=await createMonthPdf(data,team,id);doc.save(filename);}
