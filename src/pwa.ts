import {useSyncExternalStore} from 'react';
import {registerSW} from 'virtual:pwa-register';
type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
let prompt:InstallPrompt|null=null;
let state={installable:false,installed:matchMedia('(display-mode: standalone)').matches||!!(navigator as Navigator&{standalone?:boolean}).standalone,updateAvailable:false};
const listeners=new Set<()=>void>();
function update(next:Partial<typeof state>){state={...state,...next};listeners.forEach(fn=>fn())}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event as InstallPrompt;update({installable:true})});
window.addEventListener('appinstalled',()=>{prompt=null;update({installable:false,installed:true})});
const updateWorker=registerSW({immediate:true,onNeedRefresh:()=>update({updateAvailable:true})});
export function usePwa(){
 const value=useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn)}},()=>state);
 return {...value,install:async()=>{if(!prompt)return;const event=prompt;await event.prompt();await event.userChoice;prompt=null;update({installable:false})},update:()=>updateWorker(true)};
}
