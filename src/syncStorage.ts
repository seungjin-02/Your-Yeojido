import {KEY} from './store';
import {BASE_KEY,DEFAULT_BASE} from './homeBase';
import {blankSnapshot,snapshotText} from './syncCore';
import type {TravelSnapshot} from './syncCore';
export const SCOPE_KEY='footprint.sync.scope.v1';
export const CHANGE_EVENT='footprint:local-change';
const prefix='footprint.sync.cache.v1.';
export type SyncCache={snapshot:TravelSnapshot;baseline:string|null;revision:number};
export function readActive():TravelSnapshot{
 const raw=localStorage.getItem(KEY),base=localStorage.getItem(BASE_KEY);
 return {data:raw?JSON.parse(raw):blankSnapshot().data,base:base?JSON.parse(base):DEFAULT_BASE};
}
export function readCache(scope:string):SyncCache|null{const raw=localStorage.getItem(prefix+scope);return raw?JSON.parse(raw):null}
export function saveCache(scope:string,cache:SyncCache){localStorage.setItem(prefix+scope,JSON.stringify(cache))}
export function writeActive(snapshot:TravelSnapshot){
 const beforeData=localStorage.getItem(KEY),beforeBase=localStorage.getItem(BASE_KEY);
 try{localStorage.setItem(KEY,JSON.stringify(snapshot.data));localStorage.setItem(BASE_KEY,JSON.stringify(snapshot.base))}
 catch(error){if(beforeData===null)localStorage.removeItem(KEY);else localStorage.setItem(KEY,beforeData);if(beforeBase===null)localStorage.removeItem(BASE_KEY);else localStorage.setItem(BASE_KEY,beforeBase);throw error}
 window.dispatchEvent(new StorageEvent('storage',{key:KEY,newValue:localStorage.getItem(KEY),storageArea:localStorage}));
 window.dispatchEvent(new StorageEvent('storage',{key:BASE_KEY,newValue:localStorage.getItem(BASE_KEY),storageArea:localStorage}));
}
export function activateScope(scope:string){
 const previous=localStorage.getItem(SCOPE_KEY)||'guest';
 if(previous===scope)return;
 const current=readActive(),cache=readCache(previous);
 // Archive the outgoing account before replacing the working copy.
 saveCache(previous,{snapshot:current,baseline:cache?.baseline??null,revision:cache?.revision??0});
 const incoming=readCache(scope)||{snapshot:blankSnapshot(),baseline:snapshotText(blankSnapshot()),revision:0};
 saveCache(scope,incoming);localStorage.setItem(SCOPE_KEY,scope);
 try{writeActive(incoming.snapshot)}catch(error){localStorage.setItem(SCOPE_KEY,previous);throw error}
 window.dispatchEvent(new Event('footprint:scope-change'));
}
