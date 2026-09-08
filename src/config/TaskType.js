// Gateway(RAG_Router)로 보내는 요청의 task_type 상수 목록.
export const TaskType = {
  // USER
  LOGIN: "LOGIN",
  REGISTER: "REGISTER",
  LOGOUT: "LOGOUT",
  SSO_LOGIN: "SSO_LOGIN",
  USER_LIST: "USER_LIST", // 권한 관리 화면의 계정 목록 조회
  USER_SET_ROLE: "USER_SET_ROLE", // 권한 관리 화면의 역할(관리자/일반사용자) 변경

  // RAG
  USER_QUERY: "USER_QUERY",
  MERGE_RESULTS: "MERGE_RESULTS",
  CHAT_SESSION_LIST: "CHAT_SESSION_LIST", // 좌측 사이드바 대화 목록 조회 (제목만, 메시지 내역 제외)
  CHAT_SESSION_MESSAGES: "CHAT_SESSION_MESSAGES", // 사이드바에서 대화를 클릭했을 때 그 대화의 메시지 내역 조회
  CHAT_SESSION_DELETE: "CHAT_SESSION_DELETE", // 좌측 사이드바 대화 삭제 버튼
  CHAT_ANSWER_SAVE: "CHAT_ANSWER_SAVE", // 다중 모델 비교/병합에서 최종 답변이 정해졌을 때(선택 또는 병합 완료) 서버에 저장
  FILE_UPLOAD: "FILE_UPLOAD",
  FILE_LIST: "FILE_LIST",
  FILE_DELETE: "FILE_DELETE",
  FILE_IMAGE_LIST: "FILE_IMAGE_LIST", // 문서 목록 > 이미지 보기: 문서별 페이지 이미지 목록 조회
  FILE_IMAGE_SAVE: "FILE_IMAGE_SAVE", // 이미지 보기 모달의 "저장" 버튼: 이미지 설명 저장
  FILE_IMAGE_UPLOAD: "FILE_IMAGE_UPLOAD", // 이미지 보기 모달의 "이미지 변경" 버튼: 이미지 파일 교체
  FILE_DOWNLOAD: "FILE_DOWNLOAD", // 문서 목록의 "다운로드" 버튼
  IMAGE_VECTORIZE: "IMAGE_VECTORIZE", // 이미지 편집기: PNG/JPG를 실제 벡터(선/도형 경로) SVG로 변환

  // DICTIONARY
  DICTIONARY_LIST: "DICTIONARY_LIST",
  DICTIONARY_SAVE: "DICTIONARY_SAVE", // 검색어 관리 화면의 "수정" 버튼

  // EXTERNAL_API
  EXTERNAL_API_LIST: "EXTERNAL_API_LIST", // 외부 API 등록 화면 목록 조회
  EXTERNAL_API_SAVE: "EXTERNAL_API_SAVE", // "추가"/"저장" 버튼: 등록 또는 수정
  EXTERNAL_API_DELETE: "EXTERNAL_API_DELETE", // 목록 행의 삭제 버튼
  EXTERNAL_API_SYNC: "EXTERNAL_API_SYNC", // 개별 갱신 주기가 지난 API를 실제로 다시 수집
};
