import type {Place,Region} from './types';
import data from './data/travel-guides.json';
import legacy from './data/legacy-states.json';
import {t} from './i18n';
export type GuidePlace={id:string;regionId:string;region:string;name:string;tags:string[];icon:Place['icon'];description:string;sourceUrl:string};
export type TravelGuide={title:string;summary:string;paragraphs:string[];themes:string[];activities:{title:string;description:string}[];places:GuidePlace[];tip:string};
const raw=data as Record<string,TravelGuide>;
export const travelGuides=new Proxy(raw,{get(target,key:string){const g=target[key];if(!g)return undefined;return {...g,title:t(g.title),summary:t(g.summary),paragraphs:g.paragraphs.map(t),themes:g.themes.map(t),activities:g.activities.map(a=>({title:t(a.title),description:t(a.description)})),places:g.places.map(p=>({...p,name:t(p.name),region:t(p.region),tags:p.tags.map(t),description:t(p.description)})),tip:t(g.tip)}}});
export function guidePlaces(_regions:Region[]):Place[]{const current=Object.values(raw).flatMap(g=>g.places).map(p=>({id:p.id,regionId:p.regionId,name:p.name,activityTags:p.tags,icon:p.icon,sourceUrl:p.sourceUrl,checkedAt:'2026-11-04'}));
 // Keep old built-in place IDs available for state-level backups, without placing them in new LGAs.
 const oldNames=['시드니 오페라 하우스','그레이트 오션 로드','그레이트 배리어 리프','애들레이드','킹스 파크','크레이들 마운틴','울루루','호주 국립박물관'];
 return [...current,...legacy.map((r,i)=>({id:`place:au-${r.sourceCode}`,regionId:r.id,name:oldNames[i],activityTags:['여행'],icon:'landmark' as const,sourceUrl:'https://www.australia.com/',checkedAt:'2026-10-27'}))]}
export function regionGuideDescription(name:string){const places=Object.values(travelGuides).flatMap(g=>g.places).filter(p=>p.region===name);return places.length?places.map(p=>p.name).join(' · '):null}
