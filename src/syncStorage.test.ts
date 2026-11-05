import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {KEY} from './store';
import {BASE_KEY} from './homeBase';
import {activateScope,readActive,readCache,saveCache,writeActive,SCOPE_KEY} from './syncStorage';
import {blankSnapshot,snapshotText} from './syncCore';
let memory:Map<string,string>;
beforeEach(()=>{memory=new Map();vi.stubGlobal('localStorage',{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)});vi.stubGlobal('window',new EventTarget());vi.stubGlobal('StorageEvent',class extends Event{constructor(type:string,init:object){super(type);Object.assign(this,init)}})});
afterEach(()=>vi.unstubAllGlobals());
describe('Device account isolation and recovery',()=>{
 it('archives existing guest records and restores them on logout',()=>{const guest=blankSnapshot();guest.base.name='guest home';writeActive(guest);activateScope('alice');expect(readActive()).toEqual(blankSnapshot());expect(readCache('guest')?.snapshot).toEqual(guest);activateScope('guest');expect(readActive()).toEqual(guest)});
 it('keeps different account caches separate across logins',()=>{activateScope('alice');const alice=blankSnapshot();alice.base.name='Alice';writeActive(alice);activateScope('bob');expect(readActive()).toEqual(blankSnapshot());activateScope('alice');expect(readActive()).toEqual(alice);expect(localStorage.getItem(SCOPE_KEY)).toBe('alice')});
 it('retains unsynced edits and their baseline across logout',()=>{activateScope('alice');const local=blankSnapshot();local.base.name='offline';saveCache('alice',{snapshot:local,baseline:snapshotText(blankSnapshot()),revision:4});writeActive(local);activateScope('guest');activateScope('alice');expect(readActive()).toEqual(local);expect(readCache('alice')?.revision).toBe(4)});
 it('does not switch accounts if the outgoing backup cannot be saved',()=>{writeActive(blankSnapshot());const before=localStorage.getItem(KEY);vi.stubGlobal('localStorage',{getItem:(k:string)=>memory.get(k)??null,setItem:()=>{throw Error('quota')},removeItem:(k:string)=>memory.delete(k)});expect(()=>activateScope('alice')).toThrow('quota');expect(memory.get(KEY)).toBe(before);expect(memory.get(SCOPE_KEY)).toBeUndefined()});
 it('rejects damaged local data instead of overwriting it on login',()=>{memory.set(KEY,'damaged');expect(()=>activateScope('alice')).toThrow();expect(memory.get(KEY)).toBe('damaged');expect(memory.get(SCOPE_KEY)).toBeUndefined()});
 it('notifies the map and record view when a remote snapshot is applied',()=>{const events:string[]=[];window.addEventListener('storage',e=>events.push((e as StorageEvent).key!));writeActive(blankSnapshot());expect(events).toEqual([KEY,BASE_KEY])});
});
