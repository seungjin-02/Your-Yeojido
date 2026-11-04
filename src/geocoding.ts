import {t} from './i18n';
import type {HomeBase} from './homeBase';
export type AddressResult={id:string;label:string;coordinates:[number,number]};
export function parseAddressResults(value:unknown):AddressResult[]{
 if(!Array.isArray(value))throw Error(t('주소 검색 응답을 읽을 수 없어요.'));
 return value.slice(0,5).flatMap(item=>{
  if(!item||typeof item.display_name!=='string'||typeof item.lat!=='string'||typeof item.lon!=='string')return [];
  const lat=Number(item.lat),lng=Number(item.lon);
  if(!item.lat.trim()||!item.lon.trim()||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>85||Math.abs(lng)>180||item.address?.country_code!=='au')return [];
  return [{id:String(item.place_id),label:item.display_name.slice(0,300),coordinates:[lng,lat] as [number,number]}];
 });
}
export async function searchAustralianAddresses(query:string,signal:AbortSignal):Promise<AddressResult[]>{
 const params=new URLSearchParams({q:query.trim(),format:'jsonv2',addressdetails:'1',countrycodes:'au',limit:'5','accept-language':'en'});
 const response=await fetch(`https://nominatim.openstreetmap.org/search?${params}`,{signal,referrerPolicy:'strict-origin-when-cross-origin'});
 if(!response.ok)throw Error(t('상세 주소 검색을 사용할 수 없어요. 잠시 후 다시 시도하거나 아래 좌표를 입력해 주세요.'));
 return parseAddressResults(await response.json());
}
export function baseFromAddress(result:AddressResult):HomeBase{return {coordinates:result.coordinates,approximate:true,locationName:result.label,locationNameEn:result.label,source:'address'}}
