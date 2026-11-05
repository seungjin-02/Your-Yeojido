import {describe,it,expect} from 'vitest';
import source from '../public/data/regions.json';
import type {Region} from './types';
import {createPlaces} from './content';
import {blankSnapshot,decideSync,snapshotText,validateSnapshot} from './syncCore';
const regions=source as Region[],places=createPlaces(regions);
function changed(name:string){const s=blankSnapshot();s.base={...s.base,name};return s}
describe('Cross-device synchronization decisions',()=>{
 it('uploads a new account cache to an empty cloud',()=>expect(decideSync(changed('offline'),snapshotText(blankSnapshot()),null)).toBe('push'));
 it('pulls remote changes if this device has not edited its baseline',()=>expect(decideSync(blankSnapshot(),snapshotText(blankSnapshot()),{payload:changed('web'),revision:2})).toBe('pull'));
 it('pushes offline changes only when the server still matches the baseline',()=>expect(decideSync(changed('PWA'),snapshotText(blankSnapshot()),{payload:blankSnapshot(),revision:1})).toBe('push'));
 it('pauses instead of overwriting concurrent device changes',()=>expect(decideSync(changed('PWA'),snapshotText(blankSnapshot()),{payload:changed('web'),revision:2})).toBe('conflict'));
 it('accepts matching data even if both devices have a stale baseline',()=>expect(decideSync(changed('same'),null,{payload:changed('same'),revision:9})).toBe('equal'));
 it('does not resurrect deleted server data silently',()=>expect(decideSync(changed('PWA'),snapshotText(changed('old')),null)).toBe('conflict'));
 it('rejects malformed cloud snapshots before replacing local records',()=>{expect(()=>validateSnapshot({data:{},base:{coordinates:[999,0]}},regions,places)).toThrow();expect(()=>validateSnapshot({data:{schemaVersion:99},base:blankSnapshot().base},regions,places)).toThrow()});
 it('validates a complete snapshot without changing reference names or record dates',()=>{const s=changed('<script>not HTML</script>');s.data.records=[{id:'r1',regionId:regions[0].id,regionNameSnapshot:regions[0].fullName,visitedOn:'2030-01-01',placeIds:[],note:'future',createdAt:'2026-11-05T00:00:00Z',updatedAt:'2026-11-05T00:00:00Z'}];expect(validateSnapshot(s,regions,places)).toEqual(s)});
});
