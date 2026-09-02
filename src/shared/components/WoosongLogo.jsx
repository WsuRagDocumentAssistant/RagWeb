import React from "react";

// 우송대학교 로고 마크 — 원본 래스터 파일을 프로젝트에 넣을 수 없어 벡터로 재현.
// 실제 로고 이미지 파일을 받으면 이 컴포넌트를 <img src="..."> 로 교체하면 된다.
export default function WoosongLogo({ className, withText = true }) {
  return (
    <svg
      viewBox={withText ? "0 0 320 148" : "0 0 320 100"}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Woosong University"
    >
      <circle cx="62" cy="50" r="31" fill="none" stroke="#0b6b34" strokeWidth="21" />
      <polygon points="165,14 206,88 124,88" fill="none" stroke="#2a4a96" strokeWidth="19" strokeLinejoin="round" />
      <path d="M 269 17 H 219 V 83 H 269" fill="none" stroke="#a3203f" strokeWidth="21" strokeLinecap="square" />
      {withText && (
        <text
          x="160"
          y="128"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="800"
          fontSize="24"
          letterSpacing="0.5"
          fill="currentColor"
        >
          WOOSONG UNIVERSITY
        </text>
      )}
    </svg>
  );
}
