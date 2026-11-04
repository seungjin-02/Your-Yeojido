import {useEffect} from 'react';

// Safari's visual viewport shrinks for the keyboard while the layout viewport may not.
export function useVisualViewport(){
 useEffect(()=>{
  const viewport=window.visualViewport;
  if(!viewport)return;
  let frame=0;
  const update=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    const root=document.documentElement;
    const inset=Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop);
    root.style.setProperty('--visual-height',`${viewport.height}px`);
    root.style.setProperty('--keyboard-inset',`${inset}px`);
    root.classList.toggle('keyboard-open',window.innerHeight-viewport.height>140);
   });
  };
  update();viewport.addEventListener('resize',update);viewport.addEventListener('scroll',update);
  return()=>{cancelAnimationFrame(frame);viewport.removeEventListener('resize',update);viewport.removeEventListener('scroll',update);document.documentElement.classList.remove('keyboard-open');document.documentElement.style.removeProperty('--visual-height');document.documentElement.style.removeProperty('--keyboard-inset')};
 },[]);
}
