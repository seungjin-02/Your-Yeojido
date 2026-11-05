import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {blankSnapshot} from './syncCore';
let db:PGlite,account:string;
const alice='00000000-0000-0000-0000-000000000001',bob='00000000-0000-0000-0000-000000000002';
async function login(id:string){account=id;await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub = '${id}';`)}
async function save(name:string,revision:number){const s=blankSnapshot();s.base.name=name;return db.query<{revision:number}>('select revision from public.save_travel_snapshot($1::jsonb,$2::bigint,$3::uuid)',[JSON.stringify(s),revision,account||null])}
beforeAll(async()=>{db=new PGlite();await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); insert into auth.users values ('${alice}'),('${bob}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);await db.exec(readFileSync('supabase/migrations/202611050001_travel_sync.sql','utf8'))},30000);
afterAll(async()=>{await db?.close()});
describe('PostgreSQL ownership and atomic revision checks',()=>{
 it('creates only the authenticated user snapshot',async()=>{await login(alice);expect(Number((await save('Alice',0)).rows[0].revision)).toBe(1);const rows=await db.query<{user_id:string}>('select user_id from public.travel_snapshots');expect(rows.rows.map(x=>x.user_id)).toEqual([alice])});
 it('rejects a stale revision rather than losing another device update',async()=>{await login(alice);expect(Number((await save('Alice PWA',1)).rows[0].revision)).toBe(2);await expect(save('stale web',1)).rejects.toMatchObject({code:'40001'});const rows=await db.query<{payload:{base:{name:string}}}>('select payload from public.travel_snapshots');expect(rows.rows[0].payload.base.name).toBe('Alice PWA')});
 it('prevents a second user from reading or replacing Alice data',async()=>{await login(bob);expect((await db.query('select * from public.travel_snapshots')).rows).toHaveLength(0);await expect(save('Bob targeting revision',2)).rejects.toMatchObject({code:'40001'});await save('Bob',0);const rows=await db.query<{user_id:string}>('select user_id from public.travel_snapshots');expect(rows.rows.map(x=>x.user_id)).toEqual([bob])});
 it('rejects a request if the login changed while it was in flight',async()=>{await login(bob);const s=blankSnapshot();await expect(db.query('select * from public.save_travel_snapshot($1::jsonb,1,$2::uuid)',[JSON.stringify(s),alice])).rejects.toMatchObject({code:'28000'})});
 it('denies direct writes that bypass compare-and-swap',async()=>{await login(bob);await expect(db.query("update public.travel_snapshots set revision=99")).rejects.toMatchObject({code:'42501'});await expect(db.query('delete from public.travel_snapshots')).rejects.toMatchObject({code:'42501'})});
 it('requires a verified user and a structurally valid snapshot',async()=>{await login('');await expect(save('anonymous',0)).rejects.toMatchObject({code:'28000'});await login(bob);await expect(db.query("select * from public.save_travel_snapshot('{}'::jsonb,1,'00000000-0000-0000-0000-000000000002'::uuid)")).rejects.toThrow('Invalid travel snapshot')});
});
