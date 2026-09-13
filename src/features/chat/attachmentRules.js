// 채팅 첨부(이미지/파일) 공통 제약 — "+" 버튼과 드래그&드롭 두 경로 모두에서 지켜야 한다.

// 이미지·파일 첨부는 인라인 base64로 요청에 실리므로, 요청 본문이 지나치게 커지지 않도록
// 전송 전에 클라이언트에서 먼저 상한을 건다(서버에는 별도 상한이 없음).
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

// 이미지 질의는 이 4개 형식만 받는다 — 파일(file) 첨부는 형식 제한이 없는 것과 다르다.
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
