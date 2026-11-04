import {t} from './i18n';
import {useState} from 'react';
export type HomeBase={coordinates:[number,number];approximate:boolean};
export const DEFAULT_BASE:HomeBase={coordinates:[115.8613,-31.9523],approximate:true};
const KEY='footprint.australia.base.v1';
export function validBase(value:unknown):value is HomeBase{const b=value as HomeBase;return !!b&&Array.isArray(b.coordinates)&&b.coordinates.length===2&&b.coordinates.every(Number.isFinite)&&Math.abs(b.coordinates[0])<=180&&Math.abs(b.coordinates[1])<=85&&typeof b.approximate==='boolean'}
export function useHomeBase(){const [base,setBase]=useState<HomeBase>(()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return validBase(v)?v:DEFAULT_BASE}catch{return DEFAULT_BASE}});return [base,(next:HomeBase)=>{if(!validBase(next))throw Error(t("기준점 좌표를 확인해 주세요."));localStorage.setItem(KEY,JSON.stringify(next));setBase(next)}] as const}
export function distanceKm(a:[number,number],b:[number,number]){const rad=(n:number)=>n*Math.PI/180;const dlat=rad(b[1]-a[1]),dlng=rad(b[0]-a[0]);const h=Math.sin(dlat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dlng/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)))}
