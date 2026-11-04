import {setLanguage,useLanguage,t} from './i18n';
export default function LocaleSwitch(){const language=useLanguage();return <div className="locale-switch" role="group" aria-label={t('언어 선택')}><button aria-pressed={language==='ko'} onClick={()=>setLanguage('ko')} lang="ko">한국어</button><button aria-pressed={language==='en'} onClick={()=>setLanguage('en')} lang="en">EN</button></div>}
