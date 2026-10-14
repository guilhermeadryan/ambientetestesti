import {currentUser,canEdit,authHeaders} from '../../../lib/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:Request){try{const user=await currentUser(req);return Response.json({admin:canEdit(user)},{headers:authHeaders})}catch{return Response.json({admin:false},{status:503,headers:authHeaders})}}
export function POST(){return Response.json({error:'O acesso por senha foi substituído pelo login Google.'},{status:405,headers:authHeaders})}
