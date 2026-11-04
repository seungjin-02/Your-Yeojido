import {afterEach,describe,it,expect} from 'vitest';
import source from '../public/data/regions.json';
import geoText from '../public/data/regions.geojson?raw';
import {createPlaces} from './content';
import {createTravelGroups} from './travelGroups';
import {emptyData,parseBackup,DATASET,KEY,LEGACY_STATE_IDS} from './store';
import {getAchievements,mapRegionColors} from './travelProfile';
import {getTravelStats} from './travelStats';
import {DEFAULT_BASE,distanceKm,validBase} from './homeBase';
import {setLanguage,t,localizeRegion} from './i18n';
import type {Region,UserData,VisitRecord} from './types';
const regions=source as Region[],places=createPlaces(regions);
const perth=regions.find(r=>r.sourceCode==='57080')!,fremantle=regions.find(r=>r.sourceCode==='53430')!;
const record=(regionId=perth.id):VisitRecord=>({id:'visit:1',regionId,regionNameSnapshot:'퍼스',visitedOn:'2025-12-01',placeIds:[],note:'My memory · 나의 기록',createdAt:'2026-11-04T00:00:00Z',updatedAt:'2026-11-04T00:00:00Z'});
afterEach(()=>setLanguage('ko'));
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
