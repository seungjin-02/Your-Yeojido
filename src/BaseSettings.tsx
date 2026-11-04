import {t} from './i18n';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Search,MapPin,Check} from 'lucide-react';
import Modal from './Modal';
import {DEFAULT_BASE,baseFromRegion,homeBaseLabel} from './homeBase';
import type {HomeBase} from './homeBase';
import type {Region} from './types';
import {baseFromAddress,searchAustralianAddresses} from './geocoding';
import type {AddressResult} from './geocoding';
export function FriendPhoto(){return <span className="friend-photo"><img src="./images/perth-friend.jpg" alt={t('안준하의 얼굴')}/></span>}
export default function BaseSettings({base,regions,onClose,onSave}:{base:HomeBase;regions:Region[];onClose:()=>void;onSave:(base:HomeBase)=>void}){
 const [draft,setDraft]=useState(base),[lng,setLng]=useState(String(base.coordinates[0])),[lat,setLat]=useState(String(base.coordinates[1])),[error,setError]=useState('');
 const [query,setQuery]=useState(''),[addresses,setAddresses]=useState<AddressResult[]>([]),[searchError,setSearchError]=useState(''),[searched,setSearched]=useState(false),[searching,setSearching]=useState(false);
 const request=useRef<AbortController|null>(null),lastRequest=useRef(0),mounted=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;request.current?.abort()}},[]);
 const localResults=useMemo(()=>{const text=query.trim().replace(/\s/g,'').toLowerCase();if(!text)return [];return regions.filter(r=>[r.fullName,r.nameEn||'',...r.aliases].some(name=>name.replace(/\s/g,'').toLowerCase().includes(text))).sort((a,b)=>Number(b.name.toLowerCase()===text||b.nameEn?.toLowerCase()===text)-Number(a.name.toLowerCase()===text||a.nameEn?.toLowerCase()===text)).slice(0,8)},[query,regions]);
 function choose(next:HomeBase){request.current?.abort();request.current=null;setSearching(false);setDraft(next);setLng(String(next.coordinates[0]));setLat(String(next.coordinates[1]));setError('');}
 function editCoordinate(axis:'lng'|'lat',value:string){if(axis==='lng')setLng(value);else setLat(value);setDraft({coordinates:draft.coordinates,approximate:false,source:'coordinates'});}
 async function search(){
  if(!query.trim()||searching)return;
  if(Date.now()-lastRequest.current<1100){setSearchError(t('검색은 1초 간격으로 다시 시도해 주세요.'));return;}
  request.current?.abort();const controller=new AbortController();request.current=controller;lastRequest.current=Date.now();setSearching(true);setSearchError('');setSearched(false);setAddresses([]);
  const timeout=setTimeout(()=>controller.abort(),12000);
  try{const results=await searchAustralianAddresses(query,controller.signal);if(mounted.current&&!controller.signal.aborted){setAddresses(results);setSearched(true)}}
  catch(e){if(mounted.current&&request.current===controller){setSearchError(controller.signal.aborted?t('검색 시간이 초과됐어요. 다시 검색하거나 지역 목록을 선택해 주세요.'):(e as Error).message)}}
  finally{clearTimeout(timeout);if(mounted.current&&request.current===controller)setSearching(false)}
 }
 function changeQuery(value:string){request.current?.abort();request.current=null;setSearching(false);setQuery(value);setAddresses([]);setSearched(false);setSearchError('');}
 return <Modal title={t('안준하 · 나의 기준점')} onClose={onClose}>
  <div className="base-profile"><FriendPhoto/><div><h3>{t('안준하')}</h3><p>{t('지역명을 검색해 여행의 기준점을 정하세요.')}</p></div></div>
  <form className="base-location-search" onSubmit={e=>{e.preventDefault();void search()}}>
   <label htmlFor="base-region-query">{t('기준점 지역·주소 검색')}</label>
   <div className="base-search-field"><Search size={19}/><input id="base-region-query" maxLength={200} value={query} placeholder={t('예: 프리맨틀, Cottesloe, Perth의 상세 주소')} onChange={e=>changeQuery(e.target.value)}/></div>
   {query.trim()&&<div className="base-local-results"><p>{t('지도 내 지역 · 대표 지점')}</p>{localResults.length?localResults.map(region=><button type="button" key={region.id} aria-pressed={draft.regionId===region.id} className={draft.regionId===region.id?'selected':''} onClick={()=>choose(baseFromRegion(region))}><MapPin size={16}/><span><strong>{t(region.name)}</strong><small>{t(region.provinceName)}</small></span>{draft.regionId===region.id&&<Check size={16}/>}</button>):<p>{t('일치하는 지도 구역이 없어요. 아래 상세 주소 검색을 이용해 주세요.')}</p>}</div>}
   <button className="secondary address-search-button" type="submit" disabled={!query.trim()||searching}>{searching?t('검색 중…'):t('상세 지역·주소 검색')}</button>
   <p className="address-search-note">{t('상세 검색 버튼을 누르면 검색어가 OpenStreetMap 검색 서비스로 전송됩니다. 호주 내 지역과 주소를 검색해요.')}</p>
   <div aria-live="polite">{searchError&&<p className="error-message" role="alert">{searchError}</p>}{searched&&!addresses.length&&<p className="profile-help">{t('상세 검색 결과가 없어요. 지역명에 주 이름을 함께 입력해 주세요.')}</p>}</div>
   {!!addresses.length&&<div className="base-address-results">{addresses.map(result=><button type="button" key={result.id} aria-pressed={draft.source==='address'&&draft.locationName===result.label} onClick={()=>choose(baseFromAddress(result))}><MapPin size={16}/><span>{result.label}</span></button>)}</div>}
   <a className="geocoding-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
  </form>
  <div className="base-selected-location" role="status"><strong>{t('선택한 기준점')}</strong><span>{homeBaseLabel(draft)}</span><small>{draft.source==='region'?t('지역의 대표 지점이에요. 정확한 집 위치는 상세 주소나 좌표로 지정하세요.'):draft.source==='address'?t('검색 서비스가 제공한 위치예요. 저장 전에 위치를 확인하세요.'):draft.approximate?t('퍼스 중심 · 임시 위치'):t('내가 설정한 위치')}</small></div>
  <form onSubmit={e=>{e.preventDefault();try{if(!lng.trim()||!lat.trim())throw Error(t('위도와 경도를 입력해 주세요.'));onSave({...draft,coordinates:[Number(lng),Number(lat)]});onClose()}catch(e){setError((e as Error).message)}}}>
   <details className="base-manual-coordinates"><summary>{t('좌표 직접 입력')}</summary><div className="base-coordinate-fields"><label>{t('경도')}<input type="number" onInvalid={e=>e.currentTarget.closest('details')?.setAttribute('open','')} step="any" min={-180} max={180} required value={lng} onChange={e=>editCoordinate('lng',e.target.value)}/></label><label>{t('위도')}<input type="number" onInvalid={e=>e.currentTarget.closest('details')?.setAttribute('open','')} step="any" min={-85} max={85} required value={lat} onChange={e=>editCoordinate('lat',e.target.value)}/></label></div></details>
   <p className="profile-help">{t('선택한 기준점은 이 브라우저에 저장돼요. 거리는 도로 경로가 아닌 직선거리예요.')}</p>
   <button type="button" className="text-button" onClick={()=>choose(DEFAULT_BASE)}>{t('퍼스 중심으로 초기화')}</button>
   {error&&<p className="error-message" role="alert">{t(error)}</p>}
   <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>{t('취소')}</button><button className="primary">{t('기준점 저장')}</button></div>
  </form>
 </Modal>
}
