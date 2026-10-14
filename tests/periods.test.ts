import test from 'node:test';
import assert from 'node:assert/strict';
import {valid} from '../lib/data';import {initial} from '../lib/seed';
import {addPeriod,removePeriod} from '../lib/periods';

test('new STI period is editable immediately and does not change existing values',()=>{
 const before=structuredClone(initial);
 const first=addPeriod(initial,'sti',' Setembro / 2026 ','new-sti');
 const second=addPeriod(initial,'sti',' Setembro / 2026 ','new-sti');
 assert.deepEqual(first,second);
 assert.deepEqual(initial,before);
 const period=first.stiPeriods.at(-1)!;
 assert.equal(period.id,'new-sti');
 assert.equal(period.label,'Setembro / 2026');
 assert.ok(period.metrics);
 assert.equal(period.metrics.analysts[0].tickets,0);
 period.metrics.analysts.push({name:'Novo analista',tickets:5});
 period.unico=5;
 assert.ok(valid(first));
 assert.deepEqual(first.stiPeriods.slice(0,-1),initial.stiPeriods);
 assert.equal('stiGoal' in period.metrics,false);
 assert.deepEqual(removePeriod(first,'sti','new-sti'),initial);
});

test('ISM additions preserve history and initialize blank evolution for every client',()=>{
 const next=addPeriod(initial,'ism','Agosto / 2026','new-ism');
 next.clients.push({id:'new-client',name:'Novo cliente',values:Object.fromEntries(next.ismPeriods.map(p=>[p.id,null]))});
 next.clients.at(-1)!.values['new-ism']=40;
 assert.ok(valid(next));
 assert.equal(next.clients[0].values['new-ism'],null);
 assert.equal(initial.clients[0].values['new-ism'],undefined);
 assert.deepEqual(next.clients[0].values['ism-0'],initial.clients[0].values['ism-0']);
 assert.throws(()=>addPeriod(initial,'sti',' ','bad'),/nome/);
 assert.throws(()=>addPeriod(initial,'sti','a'.repeat(201),'bad'),/200/);
 assert.throws(()=>addPeriod(initial,'sti','Janeiro','sti-0'),/existe/);
});
