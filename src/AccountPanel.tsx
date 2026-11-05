import {useState} from 'react';
import {Cloud,CloudOff,Mail,ShieldCheck} from 'lucide-react';
import Modal from './Modal';
import {t} from './i18n';
import {supabase} from './supabase';
import type {useCloudSync} from './useCloudSync';
import {download,today} from './store';
import {readActive} from './syncStorage';
const labels={guest:'로그인 전 · 기기에 저장',checking:'계정 기록 확인 중',syncing:'동기화 중',synced:'동기화 완료',offline:'오프라인 · 기기에 저장됨',conflict:'두 기기의 변경사항 확인 필요',error:'동기화 재시도 필요'};
export default function AccountPanel({sync,onClose}:{sync:ReturnType<typeof useCloudSync>;onClose:()=>void}){
 const [email,setEmail]=useState(''),[otp,setOtp]=useState(''),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[confirm,setConfirm]=useState<'local'|'cloud'|'guest'|null>(null);
 async function attempt(action:()=>Promise<void>){setBusy(true);setMessage('');try{await action()}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 function backup(){download(`travel-before-sync-${today()}.json`,JSON.stringify(readActive(),null,2))}
 async function resolve(){
  if(confirm==='local'&&sync.conflict)download(`cloud-before-sync-${today()}.json`,JSON.stringify(sync.conflict.payload,null,2));else backup();
  const action=confirm;setConfirm(null);if(action==='local')await sync.useLocal();else if(action==='cloud')await sync.useCloud();else await sync.importGuest();
 }
 return <Modal title={t('계정과 동기화')} onClose={onClose}>
  <div className="account-hero"><span><Cloud size={25}/></span><h3>{t('어디서든 이어지는 여행')}</h3><p>{t('웹과 앱에서 같은 이메일로 로그인하면 여행 기록을 함께 사용할 수 있어요.')}</p></div>
  {!sync.configured?<div className="account-note"><CloudOff size={20}/><strong>{t('클라우드 연결 준비 중')}</strong><p>{t('아직 서버가 연결되지 않았어요. 지금 기록은 이 기기에 보관되며 기존 기능은 계속 사용할 수 있어요.')}</p></div>:sync.session?<>
   <div className="account-identity"><Mail size={19}/><strong>{sync.session.user.email}</strong></div>
   <div className={`sync-status status-${sync.status}`} role="status"><span/>{t(labels[sync.status])}</div>
   {sync.error&&<p className="error-message" role="alert">{t('서버에 연결하지 못했어요. 이 기기의 기록은 유지됩니다.')}<small>{sync.error}</small></p>}
   {sync.status==='conflict'&&<div className="account-note"><strong>{t('다른 기기에서도 기록이 바뀌었어요.')}</strong><p>{t('자동으로 덮어쓰지 않았어요. 사용할 기록을 선택하세요. 교체 전 기록은 백업 파일로 내려받습니다.')}</p><div className="account-actions"><button className="secondary" onClick={()=>setConfirm('cloud')} disabled={!sync.conflict}>{t('클라우드 기록 사용')}</button><button className="secondary" onClick={()=>setConfirm('local')}>{t('이 기기 기록 사용')}</button></div></div>}
   <button className="primary account-full" disabled={busy||sync.status==='syncing'||sync.status==='checking'} onClick={()=>void attempt(sync.sync)}>{t('지금 동기화')}</button>
   {sync.guestAvailable&&<button className="secondary account-full" disabled={busy||sync.status==='syncing'||sync.status==='checking'} onClick={()=>setConfirm('guest')}>{t('로그인 전 기록 가져오기')}</button>}
   <p className="account-help">{t('로그인 전 기록은 별도로 보관됩니다. 로그아웃하면 다시 볼 수 있어요.')}</p>
   <button className="text-button" disabled={busy} onClick={()=>void attempt(async()=>{const {error}=await supabase!.auth.signOut({scope:'local'});if(error)throw error})}>{t('이 기기에서 로그아웃')}</button>
  </>:<form className="account-form" onSubmit={e=>{e.preventDefault();void attempt(async()=>{
    if(!sent){const {error}=await supabase!.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:true}});if(error)throw error;setSent(true)}
    else{const {error}=await supabase!.auth.verifyOtp({email:email.trim(),token:otp.trim(),type:'email'});if(error)throw error;setOtp('');setSent(false)}
   })}}>
   <label htmlFor="account-email">{t('이메일')}</label><input id="account-email" type="email" autoComplete="email" required maxLength={254} disabled={sent} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
   {sent&&<><p className="account-help">{t('이메일로 받은 인증 코드를 입력하세요. 웹과 앱 모두 같은 방식으로 로그인할 수 있어요.')}</p><label htmlFor="account-code">{t('인증 코드')}</label><input id="account-code" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6,10}" maxLength={10} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}/></>}
   <button className="primary account-full" disabled={busy}>{busy?t('처리 중…'):sent?t('로그인'):t('인증 코드 받기')}</button>{sent&&<button type="button" className="text-button" disabled={busy} onClick={()=>{setSent(false);setOtp('')}}>{t('이메일 변경 또는 코드 다시 받기')}</button>}
   <p className="account-help"><ShieldCheck size={15}/>{t('계정마다 기록이 분리됩니다. 이메일은 로그인과 계정 확인에 사용됩니다.')}</p>
  </form>}
  {message&&<p className="error-message" role="alert">{message}</p>}
  {confirm&&<div className="account-confirm"><h3>{t('기록을 교체할까요?')}</h3><p>{confirm==='guest'?t('로그인 전 기록으로 현재 계정의 여행 기록을 교체합니다. 먼저 현재 기록을 백업합니다.'):t('선택하지 않은 기록은 백업 파일로 보관하고, 선택한 기록을 웹과 앱에 동기화합니다.')}</p><div className="modal-actions"><button className="secondary" onClick={()=>setConfirm(null)}>{t('취소')}</button><button className="primary" disabled={busy} onClick={()=>void attempt(resolve)}>{t('백업 후 교체')}</button></div></div>}
 </Modal>;
}
