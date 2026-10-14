import {beginOAuth,setCookie,authHeaders} from '../../../../lib/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(){try{const {url,signed}=beginOAuth();return new Response(null,{status:302,headers:{...authHeaders,Location:url,'Set-Cookie':setCookie('hp_oauth',signed,600)}})}catch{return Response.redirect(new URL('/?login_error=config',process.env.APP_URL||'http://localhost:3000'),302)}}
