// 앱 전체에서 쓰는 더미(목업) 데이터를 한 곳에서 관리.
// 실제 백엔드 응답이 없거나 실패했을 때 화면을 계속 확인할 수 있도록 하는 용도.

// ─── 채팅 ─────────────────────────────────────────────────────────────────

export const DUMMY_SOURCE_FILES = [
  { id: "dummy-src-1", name: "2025_Q3_회의록.pdf" },
  { id: "dummy-src-2", name: "2025_로드맵.docx" },
  { id: "dummy-src-3", name: "제품_기획서.pptx" },
];

export const DUMMY_CHAT_REPLIES = [
  "네, 말씀하신 내용을 확인했습니다. 업로드하신 문서를 참고해서 답변드리면 다음과 같습니다.",
  "해당 질문에 대한 답은 문서 기준으로 다음과 같이 정리할 수 있습니다.",
  "죄송하지만 현재 문서에서는 관련 정보를 찾지 못했습니다. 다른 파일을 추가해보시겠어요?",
  "요청하신 내용을 요약하면 다음과 같은 핵심 포인트가 있습니다.",
];

/** @returns {{ reply: string, sources: { id: string, name: string }[] }} */
export function getDummyChatReply() {
  const reply = DUMMY_CHAT_REPLIES[Math.floor(Math.random() * DUMMY_CHAT_REPLIES.length)];
  const sourceCount = Math.floor(Math.random() * 3); // 0~2개
  const sources = DUMMY_SOURCE_FILES.slice(0, sourceCount);
  return { reply, sources };
}

// ─── 파일 임베딩 ──────────────────────────────────────────────────────────

export const DUMMY_FILES = [
  { id: "dummy-file-1", name: "2025_Q3_회의록.pdf", size: 245000, mimeType: "application/pdf", status: "ready", uploadedAt: Date.parse("2026-06-01") },
  { id: "dummy-file-2", name: "2025_로드맵.docx", size: 128000, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", status: "processing", uploadedAt: Date.parse("2026-06-02") },
  { id: "dummy-file-3", name: "스캔본.png", size: 3100000, mimeType: "image/png", status: "error", uploadedAt: Date.parse("2026-06-03"), errorMessage: "업로드 실패 (400)" },
];

// ─── 문서 보기 ────────────────────────────────────────────────────────────

export const DUMMY_DOCUMENTS = [
  { id: "1", period: "2026.06.01 ~ 2026.08.31", name: "RAG 기반 어쩌구 프로젝트.hwpx", team: "학생 지원팀", category: "SW 지원 문서" },
  { id: "2", period: "2026.06.01 ~ 2026.08.31", name: "RAG 기반 어쩌구 프로젝트.hwpx", team: "학생 지원팀", category: "SW 지원 문서" },
  { id: "3", period: "2026.06.01 ~ 2026.08.31", name: "RAG 기반 어쩌구 프로젝트.hwpx", team: "학생 지원팀", category: "SW 지원 문서" },
];

// ─── 외부 API 연동 ─────────────────────────────────────────────────────────

export const DUMMY_EXTERNAL_APIS = [
  { id: "1", url: "Naver.com/api/v1/....", source: "Naver", category: "검색", status: "ready" },
  { id: "2", url: "Naver.com/api/v1/....", source: "Naver", category: "검색", status: "ready" },
  { id: "3", url: "Naver.com/api/v1/....", source: "Naver", category: "검색", status: "ready" },
  { id: "4", url: "정부24.co.kr/api.v1/...", source: "정부24", category: "행정", status: "error" },
  { id: "5", url: "google.com/api/v1/...", source: "Google", category: "검색", status: "processing" },
];

// ─── 사전 보기 ────────────────────────────────────────────────────────────

export const DUMMY_DICTIONARY_ENTRIES = [
  { id: 1, term: "배", meaning: "먹는 과일 (배나무의 열매)", note: "예문: 배를 깎아 먹었다", created_at: "", updated_at: "" },
  { id: 2, term: "배", meaning: "물 위를 떠다니는 교통수단", note: "예문: 배를 타고 강을 건넜다", created_at: "", updated_at: "" },
  { id: 3, term: "배", meaning: "사람의 신체 부위 (복부)", note: "예문: 배가 아프다", created_at: "", updated_at: "" },
];
