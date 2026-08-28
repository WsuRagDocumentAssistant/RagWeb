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
  FILE_UPLOAD: "FILE_UPLOAD",
  FILE_LIST: "FILE_LIST",
  FILE_DELETE: "FILE_DELETE",
  FILE_IMAGE_LIST: "FILE_IMAGE_LIST", // 문서 목록 > 이미지 보기: 문서별 페이지 이미지 목록 조회
  FILE_IMAGE_SAVE: "FILE_IMAGE_SAVE", // 이미지 보기 모달의 "저장" 버튼: 이미지 설명 저장
  FILE_IMAGE_UPLOAD: "FILE_IMAGE_UPLOAD", // 이미지 보기 모달의 "이미지 변경" 버튼: 이미지 파일 교체
  FILE_DOWNLOAD: "FILE_DOWNLOAD", // 문서 목록의 "다운로드" 버튼

  // DICTIONARY
  DICTIONARY_LIST: "DICTIONARY_LIST",
  DICTIONARY_SAVE: "DICTIONARY_SAVE", // 검색어 관리 화면의 "수정" 버튼

  // EXTERNAL_API
  EXTERNAL_API_LIST: "EXTERNAL_API_LIST", // 외부 API 등록 화면 목록 조회
  EXTERNAL_API_SAVE: "EXTERNAL_API_SAVE", // "추가"/"저장" 버튼: 등록 또는 수정
  EXTERNAL_API_DELETE: "EXTERNAL_API_DELETE", // 목록 행의 삭제 버튼
  EXTERNAL_API_SYNC: "EXTERNAL_API_SYNC", // 개별 갱신 주기가 지난 API를 실제로 다시 수집
};
