import {upgrade} from './data';
const legacy = {
 year:'', unit:'Não informada', head:'Jessica', satisfactionGoal:95, ismGoal:100,
 analysts:[{name:'Andrio',tickets:174},{name:'Ariane',tickets:173},{name:'Kleber',tickets:134},{name:'Aline',tickets:114},{name:'Caroline',tickets:98},{name:'José',tickets:48},{name:'Jéssica',tickets:29},{name:'Eduardo',tickets:16}],
 sti: [721,655,719,770,679,652,860,762].map((unico,i)=>({month:i,unico,mia:[70,18,36,41,26,32,59,27][i]})),
 satisfaction:[95.5,4.5,0,0,0], response:[0.23,1.17,1.31],resolution:[0.44,2.02,2.54], responseGoals:[1,2,4],resolutionGoals:[6,8,16],
 ismMonths:['Abril','Maio','Junho','Julho'], ismPeople:['Jessica','Bob','Rudinei'], clients:[
 {name:'IkatuPlast',values:[94,95,95,96]}, {name:'Fecularia Eldorado',values:[83,85,86,87]}, {name:'Alimentos Agroçales',values:[61,63,63,64]}, {name:'Eletroterras',values:[56,62,68,66]}, {name:'Goias Alimentos',values:[50,56,60,62]}, {name:'JB Mascote',values:[63,63,80,100]}, {name:'Filial BRC',values:[10,50,50,100]}, {name:'Filial Nerial',values:[5,85,100,100]}, {name:'Filial 3 Fronteiras',values:[0,0,70,100]}], notes:''
};

export const initial=upgrade(legacy);
