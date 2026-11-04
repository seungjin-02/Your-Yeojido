import {t} from './i18n';
import {useEffect,useRef,useId} from 'react';
import type {ReactNode} from 'react';
import {X} from 'lucide-react';
function revealField(target:EventTarget|null){
 if(target instanceof HTMLElement&&target.matches('input:not([type=checkbox]):not([type=radio]),textarea,select')&&matchMedia('(max-width:767px), (max-width:1023px) and (pointer:coarse)').matches){
  requestAnimationFrame(()=>{if(target.isConnected)target.scrollIntoView({block:'center',behavior:'instant'})});
 }
}
export default function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
 const titleId=useId();
 const ref=useRef<HTMLDialogElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const d=ref.current;d?.showModal();const resize=()=>{if(d?.contains(document.activeElement))revealField(document.activeElement)};window.visualViewport?.addEventListener('resize',resize);return()=>{window.visualViewport?.removeEventListener('resize',resize);d?.close();previous?.focus()}},[]);
 return <dialog onFocusCapture={e=>revealField(e.target)} ref={ref} aria-labelledby={titleId} className={`modal ${wide?'wide':''}`} onCancel={e=>{e.preventDefault();close.current()}} onClick={e=>{if(e.target===e.currentTarget)close.current()}}><div className="modal-header"><div><span className="eyebrow">MY TRAVEL MAP</span><h2 id={titleId}>{title}</h2></div><button className="icon-button" aria-label={t("대화상자 닫기")} onClick={onClose}><X size={22}/></button></div>{children}</dialog>
}
