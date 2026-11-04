import {afterEach,describe,it,expect,vi} from 'vitest';
import source from '../public/data/regions.json';
import geoText from '../public/data/regions.geojson?raw';
import {createPlaces} from './content';
import {createTravelGroups} from './travelGroups';
import {emptyData,parseBackup,DATASET,KEY,LEGACY_STATE_IDS} from './store';
import {getAchievements,mapRegionColors} from './travelProfile';
import {getTravelStats} from './travelStats';
import {DEFAULT_BASE,distanceKm,validBase,baseFromRegion,homeBaseLabel} from './homeBase';
import {setLanguage,t,localizeRegion} from './i18n';
import {baseFromAddress,parseAddressResults,searchAustralianAddresses} from './geocoding';
import type {Region,UserData,VisitRecord} from './types';
const regions=source as Region[],places=createPlaces(regions);
const perth=regions.find(r=>r.sourceCode==='57080')!,fremantle=regions.find(r=>r.sourceCode==='53430')!;
const record=(regionId=perth.id):VisitRecord=>({id:'visit:1',regionId,regionNameSnapshot:'퍼스',visitedOn:'2025-12-01',placeIds:[],note:'My memory · 나의 기록',createdAt:'2026-11-04T00:00:00Z',updatedAt:'2026-11-04T00:00:00Z'});
afterEach(()=>{setLanguage('ko');vi.unstubAllGlobals()});
describe('Detailed Australian atlas',()=>{
 it('contains 565 real named areas with matching selectable polygons',()=>{
  const ids=regions.map(r=>r.id),geo=JSON.parse(geoText);expect(new Set(ids).size).toBe(565);expect(geo.features.map((f:{id:string})=>f.id).sort()).toEqual([...ids].sort());
  for(const r of regions){expect(r.nameEn).toBeTruthy();expect(r.bbox[0]).toBeLessThan(r.bbox[2]);expect(r.bbox[1]).toBeLessThan(r.bbox[3]);expect(r.bbox[0]).toBeGreaterThan(90);expect(r.bbox[3]).toBeLessThan(0);expect(r.center).toHaveLength(2)}
 });
 it('partitions areas into nine states and territories without duplicate membership',()=>{
  const groups=createTravelGroups(regions);expect(groups).toHaveLength(9);expect(groups.flatMap(g=>g.regionIds).sort()).toEqual(regions.map(r=>r.id).sort());expect(groups.find(g=>g.id==='WA')!.regionIds.length).toBeGreaterThan(100);
 });
 it('separates nearby Perth local areas and links all 50 current places',()=>{
  const cottesloe=regions.find(r=>r.nameEn==='Cottesloe')!;expect(new Set([perth.id,fremantle.id,cottesloe.id]).size).toBe(3);
  const current=places.filter(p=>!LEGACY_STATE_IDS.has(p.regionId));expect(current).toHaveLength(50);
  for(const p of current)expect(regions.some(r=>r.id===p.regionId)).toBe(true);
  expect(current.filter(p=>p.regionId===fremantle.id).map(p=>p.name)).toContain('프리맨틀 마켓');
 });
 it('round trips a local visit, paints only that region and uses southern seasons',()=>{
  const d:UserData={...emptyData(),records:[record()]};const restored=parseBackup(JSON.stringify(d),regions,places);
  expect(restored.records).toEqual(d.records);expect(mapRegionColors(d,regions)[perth.id]).toBe(d.mapPreferences.visitedColor);expect(mapRegionColors(d,regions)[fremantle.id]).not.toBe(d.mapPreferences.visitedColor);
  expect(getTravelStats(d,regions,2025).visitedCount).toBe(1);expect(getAchievements(d,regions).find(x=>x.id==='summer')!.current).toBe(1);expect(getAchievements(d,regions).find(x=>x.id==='winter')!.current).toBe(0);
 });
 it('preserves old state visits, bookmarks, edits and classifications without crediting every LGA',()=>{
  const old={...emptyData(),datasetVersion:'australia-states-v1',records:[{...record('au:WA'),placeIds:['place:au-WA']}],bookmarkedPlaceIds:['place:au-WA'],placeOverrides:[{id:'custom:old',regionId:'au:WA',name:'친구와 갔던 카페',activityTags:[],icon:'coffee',sourceUrl:'',checkedAt:'2026-10-27'}],regionClassifications:[{regionId:'au:WA',categoryIds:['category:favorite'],primaryCategoryId:'category:favorite'}]};
  const restored=parseBackup(JSON.stringify(old),regions,places);expect(restored.datasetVersion).toBe(DATASET);expect(restored.records).toEqual(old.records);expect(restored.bookmarkedPlaceIds).toEqual(old.bookmarkedPlaceIds);expect(restored.placeOverrides).toEqual(old.placeOverrides);expect(restored.regionClassifications).toEqual(old.regionClassifications);expect(getTravelStats(restored,regions,2025).visitedCount).toBe(0);expect(getTravelStats(restored,regions,2025).unresolved).toBe(1);expect(getAchievements(restored,regions).find(x=>x.id==='first')!.achieved).toBe(false);
 });
 it('rejects unrelated map backups without changing the submitted data',()=>{
  const d={...emptyData(),datasetVersion:'travel-cities-2026-10-01-v2',records:[record()]};const before=JSON.stringify(d);expect(()=>parseBackup(before,regions,places)).toThrow();expect(JSON.stringify(d)).toBe(before);expect(KEY).toBe('footprint.australia.user.v1');
 });
});
describe('Perth home base',()=>{
 it('uses central Perth as an approximate reference and calculates great-circle distance',()=>{expect(DEFAULT_BASE.approximate).toBe(true);expect(distanceKm(DEFAULT_BASE.coordinates,DEFAULT_BASE.coordinates)).toBe(0);const km=distanceKm(DEFAULT_BASE.coordinates,fremantle.center!);expect(km).toBeGreaterThan(10);expect(km).toBeLessThan(25)});
 it('rejects invalid or incomplete coordinates',()=>{expect(validBase({coordinates:[115.8,-31.9],approximate:false})).toBe(true);expect(validBase({coordinates:[181,-31.9],approximate:false})).toBe(false);expect(validBase({coordinates:[115.8,Infinity],approximate:false})).toBe(false);expect(validBase({coordinates:[115.8],approximate:false})).toBe(false)});
});
describe('Korean and English',()=>{
 it('translates UI, interpolated messages and region names in both directions',()=>{setLanguage('en');expect(t('방문 기록 추가')).toBe('Add visit');expect(t('기준점에서 직선 약 15 km')).toBe('About 15 km from home base · straight line');expect(t('565개 지역 중 2곳에 추억을 남겼어요.')).toBe('You have memories in 2 of 565 local areas.');expect(localizeRegion(perth).name).toBe('Perth');setLanguage('ko');expect(t('방문 기록 추가')).toBe('방문 기록 추가');expect(localizeRegion(perth).name).toBe('퍼스')});
 it('does not translate user notes or mutate region data when switching language',()=>{const d={...emptyData(),records:[record()]};const before=JSON.stringify(d),original=JSON.stringify(perth);setLanguage('en');const localized=localizeRegion(perth);expect(localized.id).toBe(perth.id);expect(JSON.stringify(perth)).toBe(original);expect(parseBackup(JSON.stringify(d),regions,places).records[0].note).toBe(d.records[0].note);expect(JSON.stringify(d)).toBe(before)});
});

describe('Home-base location search',()=>{
 it('chooses a named local region and keeps both language labels',()=>{
  const base=baseFromRegion(fremantle);expect(base.coordinates).toEqual(fremantle.center);expect(base.regionId).toBe(fremantle.id);expect(base.approximate).toBe(true);expect(validBase(base)).toBe(true);expect(homeBaseLabel(base)).toContain('프리맨틀');setLanguage('en');expect(homeBaseLabel(base)).toContain('Fremantle');expect(base.locationName).toContain('프리맨틀');
 });
 it('rejects corrupt optional location metadata while accepting old coordinate settings',()=>{expect(validBase({coordinates:[115.8,-31.9],approximate:false})).toBe(true);expect(validBase({...DEFAULT_BASE,locationName:123})).toBe(false);expect(validBase({...DEFAULT_BASE,source:'unknown'})).toBe(false)});
 it('accepts only valid Australian geocoding results and preserves location detail',()=>{
  const valid={place_id:42,display_name:'Northbridge, Perth, Western Australia',lat:'-31.946',lon:'115.859',address:{country_code:'au'}};
  const results=parseAddressResults([valid,{...valid,address:{country_code:'us'}},{...valid,lat:'NaN'},{...valid,lon:''},{...valid,lat:'91'},null]);expect(results).toHaveLength(1);const base=baseFromAddress(results[0]);expect(base.coordinates).toEqual([115.859,-31.946]);expect(base.source).toBe('address');expect(base.locationName).toBe(valid.display_name);expect(base.approximate).toBe(true);expect(validBase(base)).toBe(true);expect(()=>parseAddressResults({error:'invalid'})).toThrow();
 });
 it('uses an explicit country-scoped query with cancellation and surfaces service failures',async()=>{
  const mock=vi.fn().mockResolvedValue({ok:true,json:async()=>[{place_id:1,display_name:'Perth, Australia',lat:'-31.95',lon:'115.86',address:{country_code:'au'}}]});vi.stubGlobal('fetch',mock);const controller=new AbortController();expect(await searchAustralianAddresses('Hay St, Perth',controller.signal)).toHaveLength(1);const [url,options]=mock.mock.calls[0];expect(new URL(url).searchParams.get('countrycodes')).toBe('au');expect(new URL(url).searchParams.get('q')).toBe('Hay St, Perth');expect(options.signal).toBe(controller.signal);mock.mockResolvedValueOnce({ok:false});await expect(searchAustralianAddresses('Perth',controller.signal)).rejects.toThrow();
 });
});

describe('Expanded travel stamps',()=>{
 it('provides 77 uniquely identified achievements in both languages',()=>{const badges=getAchievements(emptyData(),regions);expect(badges).toHaveLength(77);expect(new Set(badges.map(b=>b.id)).size).toBe(77);expect(badges.every(b=>!b.achieved)).toBe(true);setLanguage('en');for(const b of getAchievements(emptyData(),regions)){expect(/[가-힣]/.test(b.name)).toBe(false);expect(/[가-힣]/.test(b.description)).toBe(false)}});
 it('requires distinct regions for Perth and state stamps; broad legacy visits earn no regional stamps',()=>{const d={...emptyData(),records:[record(),{...record(),id:'repeat'},{...record(fremantle.id),id:'fremantle'},{...record('au:WA'),id:'legacy'}]};const badges=getAchievements(d,regions);expect(badges.find(b=>b.id==='perth-harbours')!.achieved).toBe(true);expect(badges.find(b=>b.id==='perth-coast')!.current).toBe(2);expect(badges.find(b=>b.id==='wa-5')!.current).toBe(2);expect(getAchievements({...emptyData(),records:[record('au:WA')]},regions).find(b=>b.id==='perth-first')!.achieved).toBe(false)});
 it('counts consecutive dates across month boundaries without counting duplicates or unknown dates',()=>{const make=(day:string|null,id:string)=>({...record(),id,visitedOn:day});const d={...emptyData(),records:[make('2025-12-31','one'),make('2026-01-01','two'),make('2026-01-01','duplicate'),make('2026-01-02','three'),make(null,'unknown')]};expect(getAchievements(d,regions).find(b=>b.id==='consecutive-3')!.achieved).toBe(true);d.records=d.records.filter(r=>r.id!=='two'&&r.id!=='duplicate');expect(getAchievements(d,regions).find(b=>b.id==='consecutive-2')!.achieved).toBe(false)});
 it('rounds area coverage thresholds up and recalculates long-note progress after deletion',()=>{const badges=getAchievements(emptyData(),regions);expect(badges.find(b=>b.id==='coverage-10')!.target).toBe(57);expect(badges.find(b=>b.id==='coverage-25')!.target).toBe(142);const d={...emptyData(),records:[0,1,2].map(i=>({...record(),id:String(i),note:'a'.repeat(100)}))};expect(getAchievements(d,regions).find(b=>b.id==='long-notes-3')!.achieved).toBe(true);d.records.pop();expect(getAchievements(d,regions).find(b=>b.id==='long-notes-3')!.achieved).toBe(false)});
});
