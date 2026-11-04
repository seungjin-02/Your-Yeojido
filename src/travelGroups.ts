import type {Region} from './types';
export type TravelGroup={id:string;name:string;regionIds:string[];bbox:Region['bbox']};
export function createTravelGroups(regions:Region[]):TravelGroup[]{return [...new Set(regions.map(r=>r.provinceId))].map(id=>{const members=regions.filter(r=>r.provinceId===id);return {id,name:members[0].provinceName,regionIds:members.map(r=>r.id),bbox:[Math.min(...members.map(r=>r.bbox[0])),Math.min(...members.map(r=>r.bbox[1])),Math.max(...members.map(r=>r.bbox[2])),Math.max(...members.map(r=>r.bbox[3]))]}})}
