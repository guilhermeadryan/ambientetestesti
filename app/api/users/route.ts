import {currentUser,safeWrite,denied,authHeaders} from '../../../lib/auth';import {database,transaction} from '../../../db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:Request){try{const actor=await currentUser(req);if(actor?.role!=='admin')return denied(actor);const db=await database();const {rows}=await db.query('SELECT id,email,name,role,created,last_login FROM hp_users ORDER BY created DESC');return Response.json({users:rows.map(u=>({...u,role:u.email.toLowerCase()===process.env.ADMIN_EMAIL!.trim().toLowerCase()?'admin':u.role}))},{headers:authHeaders})}catch{return Response.json({error:'Não foi possível consultar os usuários.'},{status:503,headers:authHeaders})}}
export async function PATCH(req:Request){
 try{
  const actor=await currentUser(req);if(actor?.role!=='admin')return denied(actor);
  if(!safeWrite(req))return Response.json({error:'Solicitação inválida.'},{status:403,headers:authHeaders});
  const body=await req.json();if(typeof body.id!=='string'||!['pending','viewer','editor'].includes(body.role))return Response.json({error:'Permissão inválida.'},{status:400,headers:authHeaders});
  const db=await database();const result=await transaction(db,async c=>{
   const {rows}=await c.query('SELECT id,email FROM hp_users WHERE id=$1 FOR UPDATE',[body.id]);if(!rows[0])return 404;
   if(rows[0].email.toLowerCase()===process.env.ADMIN_EMAIL!.trim().toLowerCase())return 400;
   await c.query('UPDATE hp_users SET role=$1 WHERE id=$2',[body.role,body.id]);
   await c.query('INSERT INTO hp_audit (description,created) VALUES ($1,$2)',[`Permissão ${body.role}: ${rows[0].email} · por ${actor.email}`,new Date().toISOString()]);return 200;
  });
  return Response.json(result===200?{ok:true}:{error:result===404?'Usuário não encontrado.':'O administrador principal não pode ser alterado aqui.'},{status:result,headers:authHeaders});
 }catch{return Response.json({error:'Não foi possível alterar a permissão.'},{status:503,headers:authHeaders})}
}
export async function DELETE(req:Request){
 try{
  const actor=await currentUser(req);if(actor?.role!=='admin')return denied(actor);
  if(!safeWrite(req))return Response.json({error:'Solicitação inválida.'},{status:403,headers:authHeaders});
  const body=await req.json();if(typeof body.id!=='string'||!body.id)return Response.json({error:'Usuário inválido.'},{status:400,headers:authHeaders});
  const db=await database();const status=await transaction(db,async c=>{
   const {rows}=await c.query('SELECT id,email FROM hp_users WHERE id=$1 FOR UPDATE',[body.id]);if(!rows[0])return 404;
   if(rows[0].email.toLowerCase()===process.env.ADMIN_EMAIL!.trim().toLowerCase())return 400;
   await c.query('DELETE FROM hp_users WHERE id=$1',[body.id]);
   await c.query('INSERT INTO hp_audit (description,created) VALUES ($1,$2)',[`Acesso excluído: ${rows[0].email} · por ${actor.email}`,new Date().toISOString()]);return 200;
  });
  return Response.json(status===200?{ok:true}:{error:status===404?'Usuário não encontrado.':'O administrador principal não pode ser excluído.'},{status,headers:authHeaders});
 }catch{return Response.json({error:'Não foi possível excluir o acesso.'},{status:503,headers:authHeaders})}
}
