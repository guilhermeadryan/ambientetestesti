import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {database} from '../db';
export type Role='pending'|'viewer'|'editor'|'admin';
export type User={id:string;email:string;name:string;role:Role};
export const authHeaders={'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie'};
export function authConfig(){
 if(!process.env.AUTH_SECRET||process.env.AUTH_SECRET.length<32)throw Error('Configure AUTH_SECRET com pelo menos 32 caracteres.');
 if(!process.env.ADMIN_EMAIL)throw Error('Configure ADMIN_EMAIL com a conta Google do administrador.');
 const origin=new URL(process.env.APP_URL||'');
 if(origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password||(origin.protocol!=='https:'&&!(origin.protocol==='http:'&&origin.hostname==='localhost'&&process.env.NODE_ENV!=='production')))throw Error('APP_URL deve ser a origem HTTPS do site.');
 return origin.origin;
}
export function cookie(req:Request,name:string){return req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1)||'';}
export function setCookie(name:string,value:string,age:number){return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${process.env.NODE_ENV==='production'?'; Secure':''}`;}
export function hashToken(token:string){return createHmac('sha256',process.env.AUTH_SECRET||'').update(token).digest('hex');}
export function safeWrite(req:Request){try{return req.headers.get('x-head-write')==='1'&&req.headers.get('origin')===authConfig()&&req.headers.get('sec-fetch-site')!=='cross-site'}catch{return false}}
export async function currentUser(req:Request):Promise<User|null>{
 authConfig();const token=cookie(req,'hp_session');if(!/^[a-f0-9]{64}$/.test(token))return null;
 const db=await database();const {rows}=await db.query('SELECT u.id,u.email,u.name,u.role FROM hp_users u JOIN hp_sessions s ON s.user_id=u.id WHERE s.id=$1 AND s.expires>$2',[hashToken(token),Date.now()]);
 if(!rows[0])return null;
 const u=rows[0];return {...u,role:u.email.toLowerCase()===process.env.ADMIN_EMAIL!.trim().toLowerCase()?'admin':u.role};
}
export function canView(u:User|null){return !!u&&['viewer','editor','admin'].includes(u.role)}
export function canEdit(u:User|null){return !!u&&['editor','admin'].includes(u.role)}
export function denied(u:User|null){return Response.json({error:u?'O administrador ainda não concedeu esta permissão.':'Entre com sua conta Google para acessar.'},{status:u?403:401,headers:authHeaders})}
export function beginOAuth(){
 const origin=authConfig();if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET)throw Error('Configure as credenciais de login Google.');
 const state=randomBytes(32).toString('hex'),verifier=randomBytes(32).toString('base64url');
 const payload=Buffer.from(JSON.stringify({state,verifier,expires:Date.now()+600000})).toString('base64url');
 const signed=payload+'.'+hashToken(payload);
 const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
 url.search=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,response_type:'code',redirect_uri:origin+'/api/auth/callback',scope:'openid email profile',state,prompt:'select_account',code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
 return {url:url.toString(),signed};
}
export function validateOAuth(req:Request){
 authConfig();const [payload,signature]=cookie(req,'hp_oauth').split('.');
 if(!payload||!signature||signature.length!==64||!timingSafeEqual(Buffer.from(signature),Buffer.from(hashToken(payload))))throw Error('Sessão de login inválida.');
 const info=JSON.parse(Buffer.from(payload,'base64url').toString());
 const state=new URL(req.url).searchParams.get('state');if(!state||state!==info.state||info.expires<Date.now())throw Error('Sessão de login expirada.');
 return info as {state:string;verifier:string;expires:number};
}
export async function completeGoogleLogin(req:Request){
 const {verifier}=validateOAuth(req),code=new URL(req.url).searchParams.get('code');if(!code)throw Error('Login cancelado.');
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,code,code_verifier:verifier,grant_type:'authorization_code',redirect_uri:authConfig()+'/api/auth/callback'}),cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Google não autorizou o login.');
 const tokens=await response.json();if(!tokens.access_token)throw Error('Resposta inválida do Google.');
 const profile=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+tokens.access_token},cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!profile.ok)throw Error('Não foi possível verificar a conta Google.');
 const info=await profile.json();if(info.email_verified!==true||typeof info.sub!=='string'||typeof info.email!=='string')throw Error('Use uma conta Google com e-mail verificado.');
 if(!info.email.toLowerCase().endsWith('@gmail.com')&&!info.hd)throw Error('Use Gmail ou uma conta corporativa Google Workspace.');
 const db=await database(),now=new Date().toISOString();
 await db.query(`INSERT INTO hp_users (id,email,name,role,created,last_login) VALUES ($1,$2,$3,'pending',$4,$4) ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,name=EXCLUDED.name,last_login=EXCLUDED.last_login`,[info.sub,info.email.toLowerCase(),String(info.name||info.email).slice(0,200),now]);
 const token=randomBytes(32).toString('hex');await db.query('INSERT INTO hp_sessions (id,user_id,expires) VALUES ($1,$2,$3)',[hashToken(token),info.sub,Date.now()+28800000]);
 await db.query('DELETE FROM hp_sessions WHERE expires<$1',[Date.now()]);return token;
}
