import {useEffect,useRef,useState} from 'react';
import * as maplibregl from 'maplibre-gl';
import type {Map as MapInstance,ExpressionSpecification} from 'maplibre-gl';
import type {FeatureCollection} from 'geojson';
import {Plus,Minus,Maximize} from 'lucide-react';
import type {Region} from './types';
import type {TravelGroup} from './travelGroups';
import type {HomeBase} from './homeBase';
import {t,useLanguage} from './i18n';
import states from './data/states.json';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
maplibregl.setWorkerUrl(workerUrl);
export type Filter='all'|'visited'|'unvisited';
type Props={regions:Region[];visited:Set<string>;selected:Region|null;filter:Filter;onSelect:(r:Region|null)=>void;reset:number;expanded:boolean;group:TravelGroup|null;regionColors:Record<string,string>;active:boolean;base:HomeBase;baseFocus:number;onEditBase:()=>void};
export default function MapView(props:Props){
 const {regions,visited,selected,filter,onSelect,reset,expanded,group,regionColors,active,base,baseFocus,onEditBase}=props;
 const language=useLanguage();
 const host=useRef<HTMLDivElement>(null),map=useRef<MapInstance|null>(null),friendMarker=useRef<maplibregl.Marker|null>(null),latest=useRef(props);
 latest.current=props;
 const lastBaseFocus=useRef(baseFocus);
 const [ready,setReady]=useState(false),[error,setError]=useState('');
 const duration=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?0:450;
 function fit(m:MapInstance,bounds:[[number,number],[number,number]],maxZoom=14,reference=false){
  const mobile=matchMedia('(max-width:767px), (max-width:1023px) and (pointer:coarse)').matches,workspace=host.current?.closest('.workspace');
  const height=m.getContainer().clientHeight,width=m.getContainer().clientWidth,rect=m.getContainer().getBoundingClientRect();
  const tools=workspace?.querySelector('.map-tools')?.getBoundingClientRect(),sheet=workspace?.querySelector('.region-panel,.travel-group-card,.mobile-overview')?.getBoundingClientRect();
  const top=mobile?Math.min((tools?tools.bottom-rect.top+12:24)+(reference?76:0),height*(reference?.5:.28)):38;
  const bottom=mobile?Math.min(sheet?rect.bottom-sheet.top+16:24,Math.max(24,height-top-90)):65;
  const side=mobile?20:Math.min(width*.29,350);
  host.current?.setAttribute('data-rendered','false');m.once('idle',()=>host.current?.setAttribute('data-rendered','true'));
  m.fitBounds(bounds,{padding:{top,bottom,left:side,right:side},maxZoom,duration:duration()});
 }
 function home(m:MapInstance){const [x,y]=latest.current.base.coordinates;fit(m,[[x-.42,y-.32],[x+.42,y+.32]],11,true)}
 function all(m:MapInstance){fit(m,[[112,-44],[154,-10]],6)}
 useEffect(()=>{
  if(!host.current)return;
  let disposed=false;let m:MapInstance|undefined;const markers:maplibregl.Marker[]=[];let localLabels:maplibregl.Marker[]=[];
  setReady(false);setError('');
  try{
   m=new maplibregl.Map({container:host.current,style:{version:8,sources:{},layers:[{id:'sea',type:'background',paint:{'background-color':'#e9f3f6'}}]},center:[134,-27],zoom:3,attributionControl:false,minZoom:2,maxZoom:16,renderWorldCopies:false,pitchWithRotate:false,dragRotate:false,touchPitch:false});
   const current=m;map.current=current;current.addControl(new maplibregl.ScaleControl({maxWidth:90,unit:'metric'}),'bottom-right');
   current.on('load',async()=>{try{
    const [res,outline]=await Promise.all([fetch('./data/regions.geojson'),fetch('./data/states.geojson')]);if(!res.ok||!outline.ok)throw Error(t('경계 파일을 불러올 수 없어요.'));
    const [geo,stateGeo]=await Promise.all([res.json(),outline.json()]) as FeatureCollection[];if(disposed)return;
    current.addSource('regions',{type:'geojson',data:geo,promoteId:'id'});
    const color:ExpressionSpecification=['case',['boolean',['feature-state','hover'],false],'#aacfc3',['coalesce',['feature-state','regionColor'],'#dce8d3']];
    current.addLayer({id:'regions-fill',type:'fill',source:'regions',paint:{'fill-color':color,'fill-opacity':['case',['boolean',['feature-state','muted'],false],0.25,1]}});
    current.addLayer({id:'regions-line',type:'line',source:'regions',paint:{'line-color':'#ffffff','line-width':['interpolate',['linear'],['zoom'],3,.2,7,.7,11,1.4]}});
    current.addSource('states',{type:'geojson',data:stateGeo});current.addLayer({id:'state-lines',type:'line',source:'states',paint:{'line-color':'#90aaa1','line-width':['interpolate',['linear'],['zoom'],3,.7,7,1.2],'line-opacity':.6}});
    current.addLayer({id:'selected-line',type:'line',source:'regions',paint:{'line-color':'#1c6560','line-width':2.5,'line-opacity':['case',['boolean',['feature-state','selected'],false],1,0]}});
    for(const s of states){const el=document.createElement('span');el.className='state-label';el.textContent=language==='en'?s.nameEn:s.name;el.setAttribute('aria-hidden','true');markers.push(new maplibregl.Marker({element:el}).setLngLat(s.center as [number,number]).addTo(current))}
    const updateLabels=()=>{if(disposed)return;const detail=current.getZoom()>=6;markers.forEach(marker=>marker.getElement().style.visibility=detail?'hidden':'visible');localLabels.forEach(marker=>marker.remove());localLabels=[];if(!detail)return;const bounds=current.getBounds(),reference=current.project(latest.current.base.coordinates),occupied=[{left:reference.x-60,right:reference.x+60,top:reference.y-100,bottom:reference.y+10}];for(const r of regions){const point=r.center||[(r.bbox[0]+r.bbox[2])/2,(r.bbox[1]+r.bbox[3])/2] as [number,number];if(!bounds.contains(point))continue;const screen=current.project(point),estimated=[...r.name].reduce((n,c)=>n+(/[가-힣]/.test(c)?11:6.5),0),w=Math.min(130,estimated)+14,h=estimated>130?34:22,box={left:screen.x-w/2,right:screen.x+w/2,top:screen.y-h/2,bottom:screen.y+h/2};if(occupied.some(b=>box.left<b.right&&box.right>b.left&&box.top<b.bottom&&box.bottom>b.top))continue;occupied.push(box);const el=document.createElement('span');el.className='local-region-label';el.textContent=r.name;el.setAttribute('aria-hidden','true');localLabels.push(new maplibregl.Marker({element:el}).setLngLat(point).addTo(current));if(localLabels.length>=80)break;}};
    current.on('moveend',updateLabels);updateLabels();
    const friend=document.createElement('button');friend.className='friend-marker';friend.type='button';friend.setAttribute('aria-label',t('안준하 · 나의 기준점'));friend.innerHTML='<span class="friend-photo"><img src="./images/perth-friend.jpg" alt=""/></span><span class="friend-marker-label"></span>';
    friend.querySelector('.friend-marker-label')!.textContent=t('안준하');friend.onclick=e=>{e.stopPropagation();latest.current.onEditBase()};friendMarker.current=new maplibregl.Marker({element:friend,anchor:'bottom'}).setLngLat(latest.current.base.coordinates).addTo(current);
    let hover:string|undefined;const popup=new maplibregl.Popup({closeButton:false,closeOnClick:false,offset:12,className:'region-tooltip'});
    current.on('mousemove','regions-fill',e=>{if(matchMedia('(pointer:coarse)').matches)return;const id=String(e.features?.[0]?.id||'');if(hover&&hover!==id)current.setFeatureState({source:'regions',id:hover},{hover:false});hover=id;if(!id)return;current.getCanvas().style.cursor='pointer';current.setFeatureState({source:'regions',id},{hover:true});const r=regions.find(r=>r.id===id);if(r)popup.setLngLat(e.lngLat).setText(`${r.fullName} · ${t(latest.current.visited.has(id)?'방문 완료':'미방문')}`).addTo(current)});
    current.on('mouseleave','regions-fill',()=>{if(hover)current.setFeatureState({source:'regions',id:hover},{hover:false});hover=undefined;popup.remove();current.getCanvas().style.cursor=''});
    current.on('click','regions-fill',e=>{popup.remove();const r=regions.find(r=>r.id===String(e.features?.[0]?.id));if(r)latest.current.onSelect(r)});
    all(current);setReady(true);
   }catch(e){if(!disposed)setError((e as Error).message)}});
   current.on('error',e=>{if(!disposed&&/WebGL|context|GPU|Worker/i.test(e.error.message))setError(t('이 브라우저에서 지도를 표시할 수 없어요. 지역 검색과 여행 기록은 계속 사용할 수 있어요.'))});
  }catch{setError(t('WebGL 지도를 시작하지 못했어요. 지역 검색으로 여행 기록을 남길 수 있어요.'))}
  let width=host.current.clientWidth,height=host.current.clientHeight;
  const ro=new ResizeObserver(()=>{const current=map.current;if(!current||!host.current)return;if(width===host.current.clientWidth&&height===host.current.clientHeight)return;width=host.current.clientWidth;height=host.current.clientHeight;current.resize();if(current.getSource('regions')){const focus=latest.current.selected||latest.current.group;if(focus){const [x,y,a,b]=focus.bbox;fit(current,[[x,y],[a,b]])}else all(current)}});ro.observe(host.current);
  return()=>{disposed=true;ro.disconnect();markers.forEach(x=>x.remove());localLabels.forEach(x=>x.remove());friendMarker.current?.remove();friendMarker.current=null;m?.remove();map.current=null};
 },[regions,language]);
 useEffect(()=>{const m=map.current;if(!ready||!m?.getSource('regions'))return;regions.forEach(r=>m.setFeatureState({source:'regions',id:r.id},{selected:selected?.id===r.id,regionColor:regionColors[r.id],muted:(group&&!group.regionIds.includes(r.id))||(filter==='visited'?!visited.has(r.id):filter==='unvisited'?visited.has(r.id):false)}))},[visited,filter,ready,regions,group,selected,regionColors]);
 useEffect(()=>{const m=map.current;if(ready&&m&&selected){const [x,y,a,b]=selected.bbox;fit(m,[[x,y],[a,b]],14)}},[selected,ready,expanded]);
 useEffect(()=>{if(ready&&map.current&&reset>0&&!latest.current.selected&&!latest.current.group)all(map.current)},[reset,ready]);
 useEffect(()=>{if(ready&&map.current&&baseFocus!==lastBaseFocus.current){lastBaseFocus.current=baseFocus;home(map.current)}},[baseFocus,ready]);
 useEffect(()=>{friendMarker.current?.setLngLat(base.coordinates)},[base]);
 useEffect(()=>{const m=map.current;if(!ready||!m||!group||selected)return;const [x,y,a,b]=group.bbox;fit(m,[[x,y],[a,b]],10)},[group,selected,ready]);
 return <div className="map-scene" aria-hidden={!active} inert={!active}><div className="map-canvas" ref={host} aria-label={t('호주 여행 지도')}/>{!ready&&!error&&<div className="map-loading">{t('지도를 펼치고 있어요…')}</div>}{error&&<div className="map-error" role="alert">{error}</div>}<div className="map-controls"><button aria-label={t('호주 전체 보기')} title={t('호주 전체 보기')} onClick={()=>{onSelect(null);if(map.current)all(map.current)}}><Maximize size={18}/></button><div><button aria-label={t('지도 확대')} onClick={()=>map.current?.zoomIn({duration:duration()})}><Plus size={21}/></button><button aria-label={t('지도 축소')} onClick={()=>map.current?.zoomOut({duration:duration()})}><Minus size={21}/></button></div></div></div>
}
