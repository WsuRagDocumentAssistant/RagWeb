// 문서 등록(FILE_UPLOAD, 임베딩)으로 받는 형식. hwpx는 브라우저가 MIME 타입을 제대로 못 붙이는 경우가
// 많아서 확장자로 판별한다.
export const ALLOWED_DOCUMENT_EXTENSIONS = [".hwpx", ".docx", ".pdf", ".xlsx"];

export const DOCUMENT_ACCEPT = ALLOWED_DOCUMENT_EXTENSIONS.join(",");

export const isAllowedDocument = (file) =>
  ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

export const DOCUMENT_REJECT_MESSAGE = "해당 문서는 지원하지 않는 포맷 입니다";

// 등록이 거부된 파일 이름과 허용 형식은 알림 아래 설명 줄로 보여준다.
export const documentRejectDescription = (files) =>
  `${files.map((f) => f.name).join(", ")} — HWPX/DOCX/PDF/XLSX만 등록할 수 있습니다.`;
