import {completeGoogleLogin,setCookie,authConfig,authHeaders} from '../../../../lib/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:Request){
 const headers=new Headers(authHeaders);headers.append('Set-Cookie',setCookie('hp_oauth','',0));
 try{const token=await completeGoogleLogin(req);headers.append('Set-Cookie',setCookie('hp_session',token,28800));headers.set('Location',authConfig()+'/');}
 catch{headers.set('Location',new URL('/?login_error=failed',process.env.APP_URL||'http://localhost:3000').toString());}
 return new Response(null,{status:302,headers});
}
