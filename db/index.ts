import {Pool} from 'pg';
import {schema} from './schema';import {initial} from '../lib/seed';
export interface QueryResult {rows:any[];rowCount:number|null}
export interface Client {query(sql:string,values?:any[]):Promise<QueryResult>;release():void}
export interface Database {query(sql:string,values?:any[]):Promise<QueryResult>;connect():Promise<Client>}
let pool:Pool|undefined;let ready:Promise<void>|undefined;let testDatabase:Database|undefined;
export function useTestDatabase(db:Database){if(process.env.NODE_ENV==='production')throw Error('Test database forbidden');testDatabase=db;ready=undefined;}
export function configError(){if(!process.env.DATABASE_URL&&!process.env.POSTGRES_URL)return 'Conecte um banco Postgres (Neon) à Vercel e confira a variável DATABASE_URL. Depois publique novamente.';return null}
function getPool():Database {if(testDatabase)return testDatabase;const connectionString=process.env.DATABASE_URL||process.env.POSTGRES_URL;if(!connectionString)throw Error('DATABASE_URL is missing');pool??=new Pool({connectionString,max:3,connectionTimeoutMillis:10000,idleTimeoutMillis:20000,allowExitOnIdle:true});return pool as unknown as Database;}
export async function transaction<T>(db:Database,fn:(client:Client)=>Promise<T>):Promise<T>{const c=await db.connect();try{await c.query('BEGIN');const result=await fn(c);await c.query('COMMIT');return result}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
export async function database():Promise<Database>{const db=getPool();ready??=transaction(db,async c=>{await c.query('SELECT pg_advisory_xact_lock(78230541)');for(const sql of schema)await c.query(sql);await c.query('INSERT INTO hp_dashboard (id,payload,revision,updated) VALUES ($1,$2::jsonb,1,$3) ON CONFLICT (id) DO NOTHING',['main',JSON.stringify(initial),new Date().toISOString()]);}).catch(e=>{ready=undefined;throw e});await ready;return db;}
