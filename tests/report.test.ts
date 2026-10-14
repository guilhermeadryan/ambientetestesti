import test from 'node:test';
import assert from 'node:assert/strict';
import {initial} from '../lib/seed';
import {monthReport} from '../lib/month-report';
import {createMonthPdf} from '../lib/pdf-export';
test('STI report exports only the selected period, without a ticket goal',async()=>{
 const r=monthReport(initial,'sti','sti-7');
 assert.equal(r.period,'Agosto');
 assert.deepEqual(r.sections[0].rows,[['Tickets resolvidos (Unico + MIA)','789'],['Tickets Unico','762'],['Tickets MIA','27']]);
 assert.ok(r.sections.some(s=>s.title==='Tickets por analista'));
 assert.equal(JSON.stringify(r).includes('Janeiro'),false);
 assert.equal(JSON.stringify(r).includes('Meta de tickets'),false);
 const {doc,filename}=await createMonthPdf(initial,'sti','sti-7');
 assert.equal(filename,'head-pulse-sti-agosto.pdf');
 assert.ok(doc.output().startsWith('%PDF-'));
 assert.throws(()=>monthReport(initial,'sti','missing'),/válido/);
});
test('ISM report distinguishes missing evolution from zero and paginates long reports',async()=>{
 const data=structuredClone(initial);data.clients[0].values['ism-3']=null;data.clients[1].values['ism-3']=0;
 const r=monthReport(data,'ism','ism-3');
 assert.equal(r.sections.at(-1)!.rows[0][1],'Não informada');
 assert.match(r.sections.at(-1)!.rows[1][1],/^0%/);
 data.clients=Array.from({length:100},(_,i)=>({...data.clients[0],id:String(i),name:'Cliente '+i}));
 const {doc}=await createMonthPdf(data,'ism','ism-3');
 assert.ok(doc.getNumberOfPages()>2);
});
