import React from "react";
import logoSrc from "@/assets/woosong-logo.png";
import "../styles/WoosongLogo.css";

// 우송대학교 실제 로고 이미지. 파일 배경이 흰색이라, 다크 모드에서도 항상 흰 배경 위에
// 놓이도록 얇은 흰색 칩으로 감싼다. 크기는 className으로 감싸는 쪽(높이)만 지정하면 된다.
export default function WoosongLogo({ className }) {
  return (
    <span className={`woosong-logo-chip ${className ?? ""}`}>
      <img src={logoSrc} alt="Woosong University" />
    </span>
  );
}
