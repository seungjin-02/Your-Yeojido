import {t,getLanguage} from './i18n';
import {useEffect,useState} from 'react';
import type {Region} from './types';
export type HomeBase={name?:string;coordinates:[number,number];approximate:boolean;locationName?:string;locationNameEn?:string;regionId?:string;source?:'region'|'address'|'coordinates'};
export const DEFAULT_BASE:HomeBase={coordinates:[115.8613,-31.9523],approximate:true};
export const BASE_KEY='footprint.australia.base.v1';
const KEY=BASE_KEY;
export function validBase(value:unknown):value is HomeBase{
 const b=value as HomeBase;
 return !!b&&Array.isArray(b.coordinates)&&b.coordinates.length===2&&b.coordinates.every(Number.isFinite)&&Math.abs(b.coordinates[0])<=180&&Math.abs(b.coordinates[1])<=85&&typeof b.approximate==='boolean'&&
  [b.name,b.locationName,b.locationNameEn,b.regionId].every(v=>v===undefined||(typeof v==='string'&&v.length<=300))&&(b.source===undefined||['region','address','coordinates'].includes(b.source));
}
export function baseFromRegion(region:Region):HomeBase{return {coordinates:region.center||[(region.bbox[0]+region.bbox[2])/2,(region.bbox[1]+region.bbox[3])/2],approximate:true,locationName:region.fullName,locationNameEn:`${region.provinceNameEn||region.provinceName} · ${region.nameEn||region.name}`,regionId:region.id,source:'region'}}
export function homeBaseLabel(base:HomeBase){if(base.locationName)return getLanguage()==='en'?base.locationNameEn||base.locationName:base.locationName;return base.approximate?t('퍼스 중심 · 임시 위치'):t('내가 설정한 위치')}
export function useHomeBase(){const [base,setBase]=useState<HomeBase>(()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return validBase(v)?v:DEFAULT_BASE}catch{return DEFAULT_BASE}});useEffect(()=>{function update(e:StorageEvent){if(e.key!==KEY)return;try{const value=JSON.parse(e.newValue||'null');setBase(validBase(value)?value:DEFAULT_BASE)}catch{/* Keep the last valid position. */}}window.addEventListener('storage',update);return()=>window.removeEventListener('storage',update)},[]);return [base,(next:HomeBase)=>{if(!validBase(next))throw Error(t('기준점 좌표를 확인해 주세요.'));localStorage.setItem(KEY,JSON.stringify(next));setBase(next);window.dispatchEvent(new Event('footprint:local-change'))}] as const}
export function distanceKm(a:[number,number],b:[number,number]){const rad=(n:number)=>n*Math.PI/180;const dlat=rad(b[1]-a[1]),dlng=rad(b[0]-a[0]);const h=Math.sin(dlat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dlng/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)))}

export function homeBaseName(base:HomeBase){return base.name?.trim()||t('안준하')}
