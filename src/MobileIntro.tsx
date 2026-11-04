import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,MapPin} from 'lucide-react';
import {t} from './i18n';
const KEY='footprint.mobile-intro.v1';
function shouldShow(){
 if(!matchMedia('(max-width:767px), (max-width:1023px) and (pointer:coarse)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
 try{return sessionStorage.getItem(KEY)!=='seen'}catch{return true}
}
export default function MobileIntro(){
 const [visible,setVisible]=useState(shouldShow),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  if(!visible)return;
  try{sessionStorage.setItem(KEY,'seen')}catch{/* The intro still works without storage. */}
  const el=dialog.current;el?.showModal();const timer=setTimeout(()=>setVisible(false),3000);
  return()=>{clearTimeout(timer);el?.close()};
 },[visible]);
 if(!visible)return null;
 return <dialog ref={dialog} className="mobile-intro" aria-labelledby="intro-heading" onCancel={()=>setVisible(false)}>
  <div className="intro-glow intro-glow-one"/><div className="intro-glow intro-glow-two"/>
  <svg className="intro-contours" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="currentColor">{[0,1,2,3,4,5].map(i=><ellipse key={i} cx="360" cy="510" rx={110+i*38} ry={160+i*48} transform="rotate(-28 360 510)"/>)}</g><path className="intro-route" d="M55 670 C180 610 70 460 225 390 S350 230 290 160" fill="none"/><circle className="intro-destination" cx="290" cy="160" r="6"/></svg>
  <div className="intro-topline"><span>AUSTRALIA · YOUR JOURNEY</span><button type="button" onClick={()=>setVisible(false)}>{t('건너뛰기')}<ArrowUpRight size={15}/></button></div>
  <div className="intro-copy"><div className="intro-emblem" aria-hidden="true"><MapPin size={27} strokeWidth={1.5}/><span/></div><p className="intro-eyebrow">{t('나의 여행 지도')}</p><h1 id="intro-heading"><span>{t('다녀온 곳은 추억으로,')}</span><span>{t('가고 싶은 곳은 설렘으로.')}</span></h1><div className="intro-rule"/><p className="intro-caption">EVERY STEP, A STORY.</p></div>
  <div className="intro-bottom" aria-hidden="true"><span>01 / EXPLORE</span><span className="intro-progress"><i/></span><span>✦</span></div>
 </dialog>;
}
