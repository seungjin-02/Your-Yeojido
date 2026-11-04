import Modal from './Modal';
import {t} from './i18n';
export default function DeveloperContact({onClose,onInfo}:{onClose:()=>void;onInfo:()=>void}){
 return <Modal title={t('개발자에게 문의')} onClose={onClose} wide><section className="developer-contact"><figure className="developer-contact-photo"><img src="./images/developer-contact.jpg" alt={t('개발자 소개 사진')} width={1024} height={1280}/></figure><p className="developer-contact-message">{t('거기 흑인...잘생기고 몸 좋고 일 잘하는 개발자에게 앱에 기능이나 오류에 대해 문의할 일이 생기셨나요? 디엠주세요')}</p><button type="button" className="developer-info-link" onClick={onInfo}>{t('지도와 여행 정보')}</button></section></Modal>
}
