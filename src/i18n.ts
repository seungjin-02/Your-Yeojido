import {useSyncExternalStore} from 'react';
import dictionary from './data/en.json';
import type {Region} from './types';
export type Language='ko'|'en';
const KEY='footprint.language';
const messages=dictionary as Record<string,string>;
let current:Language='ko';
try{if(typeof localStorage!=='undefined'&&localStorage.getItem(KEY)==='en')current='en'}catch{/* Storage can be unavailable in private mode. */}
const listeners=new Set<()=>void>();
export function getLanguage(){return current}
export function setLanguage(language:Language){current=language;try{localStorage.setItem(KEY,language)}catch{/* Language switching still works without storage. */}if(typeof document!=='undefined'){document.documentElement.lang=language;document.title=language==='en'?'My Travel Atlas · Australia':'나의 여지도 · 호주'}listeners.forEach(fn=>fn())}
export function useLanguage(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn)}},getLanguage,()=> 'ko' as Language)}
const escape=(s:string)=>s.split('').map(c=>'\\^$.*+?()[]{}|'.includes(c)?'\\'+c:c).join('');
const patterns=Object.entries(messages).filter(([key])=>/\{\d+\}/.test(key)).map(([key,value])=>({regex:new RegExp('^'+key.split(/\{\d+\}/).map(escape).join('([\\s\\S]*?)')+'$'),value}));
export function t(value:string|null|undefined):string{
 if(value==null)return '';
 if(current==='ko')return value;
 const text=value.trim(),leading=value.match(/^\s*/)?.[0]||'',trailing=value.match(/\s*$/)?.[0]||'';
 if(messages[text]!==undefined)return leading+messages[text]+trailing;
 for(const {regex,value:translated} of patterns){const match=text.match(regex);if(match)return leading+translated.replace(/\{(\d+)\}/g,(_,index)=>t(match[Number(index)+1]||''))+trailing}
 return value;
}
export function localizeRegion(region:Region):Region{return current==='ko'?region:{...region,name:region.nameEn||region.name,provinceName:region.provinceNameEn||region.provinceName,fullName:`${region.provinceNameEn||region.provinceName} · ${region.nameEn||region.name}`}}
