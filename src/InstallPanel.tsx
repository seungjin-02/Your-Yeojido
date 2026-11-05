import {useState} from 'react';
import {Download,Check,Share,WifiOff} from 'lucide-react';
import Modal from './Modal';
import {t} from './i18n';
import {usePwa} from './pwa';
export default function InstallPanel({onClose}:{onClose:()=>void}){
 const pwa=usePwa(),[error,setError]=useState('');
 return <Modal title={t('앱처럼 사용하기')} onClose={onClose}>
  <div className="account-hero"><span><img src="./icons/icon-192.png" width="58" height="58" alt=""/></span><h3>{t('나의 여행 지도를 홈 화면에')}</h3><p>{t('웹주소로 바로 사용하거나, 홈 화면에 추가해 앱처럼 열어보세요.')}</p></div>
  {pwa.installed?<div className="account-note"><Check size={21}/><strong>{t('앱 화면으로 사용 중이에요.')}</strong></div>:pwa.installable?<button className="primary account-full" onClick={()=>void pwa.install().catch(()=>setError(t('설치 메뉴에서 홈 화면에 추가해 주세요.')))}><Download size={18}/>{t('홈 화면에 설치')}</button>:<div className="account-note"><strong>{t('휴대폰에서 홈 화면에 추가')}</strong><p><b>Android Chrome</b><br/>{t('브라우저 메뉴 ⋮ → 홈 화면에 추가 → 설치')}</p><p><b>iPhone Safari</b><br/><Share size={14}/> {t('공유 → 홈 화면에 추가 → 추가')}</p><p>{t('카카오톡 등 앱 안에서 열었다면 먼저 Chrome이나 Safari로 열어주세요.')}</p></div>}
  <p className="account-help"><WifiOff size={16}/>{t('처음 접속할 때 지도 파일을 저장한 뒤에는 인터넷이 없어도 지도와 기록을 열 수 있어요. 상세 주소 검색과 계정 동기화에는 인터넷이 필요해요.')}</p>
  <p className="account-help">{t('홈 화면 앱과 브라우저, 다른 휴대폰 사이의 기록 공유는 같은 계정으로 로그인한 뒤 사용할 수 있어요.')}</p>
  {pwa.updateAvailable&&<div className="account-note"><strong>{t('새 버전이 준비됐어요.')}</strong><p>{t('작성 중인 기록을 저장한 뒤 업데이트하세요. 화면을 다시 엽니다.')}</p><button className="primary account-full" onClick={()=>void pwa.update()}>{t('새 버전으로 업데이트')}</button></div>}
  {error&&<p className="error-message" role="alert">{error}</p>}
 </Modal>;
}
