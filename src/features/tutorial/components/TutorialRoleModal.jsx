import React from "react";
import { X, User, ShieldCheck } from "lucide-react";
import "../styles/TutorialRoleModal.css";

// 로그인 화면 "기능 둘러보기"를 누르면 뜨는 선택 창 — 일반 사용자 튜토리얼은 관리자 전용
// 화면(문서 등록·외부 API 등록·권한 관리)을 건너뛰고, 관리자 튜토리얼은 전체를 보여준다.
export default function TutorialRoleModal({ onClose, onSelect }) {
  return (
    <div className="trm-backdrop" onClick={onClose}>
      <div className="trm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="trm-close-btn" onClick={onClose} title="닫기">
          <X size={16} />
        </button>
        <h2>기능 둘러보기</h2>
        <p className="trm-desc">어떤 계정 기준으로 둘러보시겠어요?</p>

        <div className="trm-options">
          <button className="trm-option" onClick={() => onSelect("user")}>
            <User size={20} />
            <span className="trm-option-title">일반 사용자로 둘러보기</span>
            <span className="trm-option-desc">채팅, 문서 목록, 이미지 편집기, 검색어 관리</span>
          </button>
          <button className="trm-option" onClick={() => onSelect("admin")}>
            <ShieldCheck size={20} />
            <span className="trm-option-title">관리자로 둘러보기</span>
            <span className="trm-option-desc">일반 사용자 기능 + 문서 등록 · 외부 API 등록 · 권한 관리</span>
          </button>
        </div>
      </div>
    </div>
  );
}
