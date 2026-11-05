import {useEffect,useRef,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import type {Region,Place} from './types';
import {supabase} from './supabase';
import {decideSync,snapshotText,validateSnapshot} from './syncCore';
import type {CloudSnapshot} from './syncCore';
import {activateScope,CHANGE_EVENT,readActive,readCache,saveCache,SCOPE_KEY,writeActive} from './syncStorage';
import {KEY} from './store';
import {BASE_KEY} from './homeBase';
export type SyncStatus='guest'|'checking'|'syncing'|'synced'|'offline'|'conflict'|'error';
export function useCloudSync(regions:Region[],places:Place[]){
 const [session,setSession]=useState<Session|null>(null),[status,setStatus]=useState<SyncStatus>('guest'),[error,setError]=useState(''),[guestAvailable,setGuestAvailable]=useState(false);
 const [conflict,setConflict]=useState<CloudSnapshot|null>(null);
 const runner=useRef<(choice?:'local'|'cloud'|'guest')=>Promise<void>>(async()=>{});
 useEffect(()=>{
  if(!supabase||!regions.length)return;const client=supabase;
  let disposed=false,current:Session|null=null,generation=0,running=false,again=false,timer:ReturnType<typeof setTimeout>|undefined;
  const valid=(value:unknown)=>validateSnapshot(value,regions,places);
  function cacheLocal(){const scope=localStorage.getItem(SCOPE_KEY)||'guest',cache=readCache(scope);saveCache(scope,{snapshot:valid(readActive()),baseline:cache?.baseline??null,revision:cache?.revision??0})}
  async function run(choice?:'local'|'cloud'|'guest'){
   if(disposed||!current)return;
   if(running){again=true;return}
   const user=current.user.id,epoch=generation;
   if(localStorage.getItem(SCOPE_KEY)!==user)return;
   running=true;setError('');setStatus(navigator.onLine?'syncing':'offline');
   const active=()=>!disposed&&generation===epoch&&current?.user.id===user&&localStorage.getItem(SCOPE_KEY)===user;
   try{
    cacheLocal();
    const beforeRequest=snapshotText(valid(readActive()));
    if(!navigator.onLine)return;
    const {data:row,error:fetchError}=await client.from('travel_snapshots').select('payload,revision').eq('user_id',user).maybeSingle();
    if(fetchError)throw fetchError;if(!active())return;
    const remote:CloudSnapshot|null=row?{payload:valid(row.payload),revision:Number(row.revision)}:null;
    const local=valid(readActive()),cache=readCache(user);
    if(choice&&snapshotText(local)!==beforeRequest){setConflict(remote);setStatus('conflict');return}
    if(choice==='guest'){
     const guest=readCache('guest');if(!guest)throw Error('No guest backup');
     const imported=valid(guest.snapshot);
     // Both sides remain recoverable; the UI asks before replacing the account.
     saveCache(user,{snapshot:imported,baseline:remote?snapshotText(remote.payload):null,revision:remote?.revision??0});writeActive(imported);
    }
    const outgoing=choice==='guest'?valid(readActive()):local;
    const decision=choice==='local'||choice==='guest'?'push':choice==='cloud'?(remote?'pull':'conflict'):decideSync(outgoing,cache?.baseline??null,remote);
    if(decision==='conflict'){setConflict(remote);setStatus('conflict');return}
    if(decision==='pull'&&remote){
     // Never overwrite an edit made while the network request was in flight.
     if(snapshotText(readActive())!==snapshotText(outgoing)){again=true;return}
     writeActive(remote.payload);saveCache(user,{snapshot:remote.payload,baseline:snapshotText(remote.payload),revision:remote.revision});
    }else if(decision==='push'){
     const {data:saved,error:saveError}=await client.rpc('save_travel_snapshot',{p_payload:outgoing,p_expected_revision:remote?.revision??0,p_account_id:user}).single();
     if(saveError){if(!active())return;if(saveError.code==='40001'){setStatus('conflict');setConflict(remote);return}throw saveError}
     if(!active())return;
     const row=saved as {payload:unknown;revision:number};const checked=valid(row.payload);
     saveCache(user,{snapshot:valid(readActive()),baseline:snapshotText(checked),revision:Number(row.revision)});
     if(snapshotText(readActive())!==snapshotText(outgoing))again=true;
    }else if(remote)saveCache(user,{snapshot:outgoing,baseline:snapshotText(remote.payload),revision:remote.revision});
    setConflict(null);setStatus('synced');
   }catch(e){if(active()){setError(e instanceof Error?e.message:String((e as {message?:string})?.message||e));setStatus(navigator.onLine?'error':'offline')}}
   finally{running=false;if(again&&!disposed){again=false;timer=setTimeout(()=>void run(),500)}}
  }
  runner.current=run;
  function changed(){try{cacheLocal()}catch(e){setError(String(e));setStatus('error');return}if(current){setStatus(navigator.onLine?'syncing':'offline');clearTimeout(timer);timer=setTimeout(()=>void run(),900)}}
  function storage(e:StorageEvent){if([KEY,BASE_KEY].includes(e.key||'')&&e.isTrusted)changed()}
  async function auth(next:Session|null){
   if(disposed)return;
   // Token refresh does not replace the local working copy.
   if(current?.user.id===next?.user.id&&current!==null){current=next;setSession(next);return}
   generation++;current=next;setSession(next);setConflict(null);setError('');
   try{
    activateScope(next?.user.id||'guest');
    setGuestAvailable(!!readCache('guest')?.snapshot.data.records.length);
    if(next){setStatus('checking');void run()}else setStatus('guest');
   }catch(e){setError(String(e));setStatus('error')}
  }
  // Avoid awaiting Supabase requests inside its auth callback lock.
  const {data:{subscription}}=client.auth.onAuthStateChange((_event,next)=>{setTimeout(()=>void auth(next),0)});
  void client.auth.getSession().then(({data,error})=>{if(error){setError(error.message);setStatus('error')}else void auth(data.session)});
  function refresh(){void run()}
  function offline(){if(current)setStatus('offline')}
  const interval=setInterval(refresh,20000);
  window.addEventListener(CHANGE_EVENT,changed);window.addEventListener('storage',storage);window.addEventListener('offline',offline);window.addEventListener('online',refresh);window.addEventListener('focus',refresh);
  return()=>{disposed=true;generation++;clearTimeout(timer);clearInterval(interval);subscription.unsubscribe();window.removeEventListener(CHANGE_EVENT,changed);window.removeEventListener('storage',storage);window.removeEventListener('offline',offline);window.removeEventListener('online',refresh);window.removeEventListener('focus',refresh);runner.current=async()=>{}};
 },[regions,places]);
 return {configured:!!supabase,session,status,error,conflict,guestAvailable,sync:()=>runner.current(),useLocal:()=>runner.current('local'),useCloud:()=>runner.current('cloud'),importGuest:()=>runner.current('guest')};
}
