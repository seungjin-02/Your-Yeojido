import {t} from './i18n';
import {useState} from 'react';
import Modal from './Modal';
import {DEFAULT_BASE} from './homeBase';
import type {HomeBase} from './homeBase';
export function FriendPhoto(){return <span className="friend-photo"><img src="./images/perth-friend.jpg" alt={t("퍼스 친구의 얼굴")}/></span>}
export default function BaseSettings({base,onClose,onSave}:{base:HomeBase;onClose:()=>void;onSave:(base:HomeBase)=>void}){
 const [lng,setLng]=useState(String(base.coordinates[0])),[lat,setLat]=useState(String(base.coordinates[1])),[error,setError]=useState('');
 return <Modal title={t("친구 집 · 나의 기준점")} onClose={onClose}><div className="base-profile"><FriendPhoto/><div><h3>{t("퍼스에서 시작하는 여행")}</h3><p>{t("친구 집을 여행의 출발점으로 삼아요.")}</p></div></div><p className="base-location-note">{base.approximate?t("정확한 집 주소가 없어 현재 퍼스 중심을 기준으로 표시해요. 좌표를 입력하면 실제 위치로 옮길 수 있어요. 거리는 도로 경로가 아닌 직선거리예요."):t('저장한 좌표를 기준점으로 사용하고 있어요. 위치는 이 브라우저에만 저장됩니다.')}</p><form onSubmit={e=>{e.preventDefault();try{if(!lng.trim()||!lat.trim())throw Error(t("위도와 경도를 입력해 주세요."));onSave({coordinates:[Number(lng),Number(lat)],approximate:false});onClose()}catch(e){setError((e as Error).message)}}}><div className="base-coordinate-fields"><label>{t("경도")}<input type="number" step="any" min={-180} max={180} required value={lng} onChange={e=>setLng(e.target.value)}/></label><label>{t("위도")}<input type="number" step="any" min={-85} max={85} required value={lat} onChange={e=>setLat(e.target.value)}/></label></div><p className="profile-help">{t("이 기기의 브라우저에만 저장하며 서버로 전송하지 않아요.")}</p><button type="button" className="text-button" onClick={()=>{try{onSave(DEFAULT_BASE);onClose()}catch(e){setError((e as Error).message)}}}>{t("퍼스 중심으로 초기화")}</button>{error&&<p className="error-message" role="alert">{t(error)}</p>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>{t("취소")}</button><button className="primary">{t("기준점 저장")}</button></div></form></Modal>
}
