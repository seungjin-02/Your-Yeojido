import {DEFAULT_BASE,validBase} from './homeBase';
import type {HomeBase} from './homeBase';
import {emptyData,parseBackup} from './store';
import type {Region,Place,UserData} from './types';
export type TravelSnapshot={data:UserData;base:HomeBase};
export type CloudSnapshot={payload:TravelSnapshot;revision:number};
export type SyncDecision='equal'|'push'|'pull'|'conflict';
export const blankSnapshot=():TravelSnapshot=>({data:emptyData(),base:DEFAULT_BASE});
export const snapshotText=(snapshot:TravelSnapshot)=>JSON.stringify(snapshot);
export function validateSnapshot(value:unknown,regions:Region[],places:Place[]):TravelSnapshot{
 const s=value as TravelSnapshot;
 if(!s||!validBase(s.base))throw Error('Invalid reference point in cloud data');
 if(JSON.stringify(value).length>5*1024*1024)throw Error('Cloud backup exceeds 5 MiB');
 return {data:parseBackup(JSON.stringify(s.data),regions,places),base:s.base};
}
export function decideSync(local:TravelSnapshot,baseline:string|null,remote:CloudSnapshot|null):SyncDecision{
 const text=snapshotText(local),server=remote?snapshotText(remote.payload):null;
 if(text===server)return 'equal';
 if(!remote)return baseline===null||baseline===snapshotText(blankSnapshot())?'push':'conflict';
 if(text===baseline)return 'pull';
 if(server===baseline)return 'push';
 return 'conflict';
}
