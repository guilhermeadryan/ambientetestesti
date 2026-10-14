import {currentUser,authHeaders} from '../../../../lib/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:Request){try{return Response.json({user:await currentUser(req)},{headers:authHeaders})}catch{return Response.json({error:'O acesso seguro ainda não está configurado. Confira as variáveis de ambiente.'},{status:503,headers:authHeaders})}}
