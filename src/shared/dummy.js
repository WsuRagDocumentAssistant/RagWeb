// 앱 전체에서 쓰는 더미(목업) 데이터를 한 곳에서 관리.
// 실제 백엔드 응답이 없거나 실패했을 때 화면을 계속 확인할 수 있도록 하는 용도.

// ─── 로그인 ───────────────────────────────────────────────────────────────

export const DUMMY_LOGIN_CREDENTIALS = { email: "111@111.com", password: "111" };

export const DUMMY_USER = {
  id: 0,
  email: "111@111.com",
  name: "테스트 사용자",
  provider: "dummy",
  created_at: "2026-01-01T00:00:00.000Z",
};

// ─── 채팅 ─────────────────────────────────────────────────────────────────

export const DUMMY_SOURCE_FILES = [
  { id: "dummy-src-1", name: "2025_Q3_회의록.pdf" },
  { id: "dummy-src-2", name: "2025_로드맵.docx" },
  { id: "dummy-src-3", name: "제품_기획서.pptx" },
];

export const DUMMY_CHAT_REPLIES = [
  "네, 말씀하신 내용을 확인했습니다. 업로드하신 문서를 참고해서 답변드리면 다음과 같습니다.\n\n- **핵심 요약**: 문서의 주요 내용을 정리했습니다.\n- **세부 사항**: 관련 항목을 순서대로 확인할 수 있습니다.\n\n> 추가로 궁금한 점이 있으면 말씀해주세요.",
  "해당 질문에 대한 답은 문서 기준으로 다음과 같이 정리할 수 있습니다.\n\n1. 첫 번째로 확인할 사항\n2. 두 번째로 확인할 사항\n3. 마지막으로 참고할 사항\n\n```text\n예시 코드/데이터 블록\n```",
  "죄송하지만 현재 문서에서는 관련 정보를 찾지 못했습니다. 다른 파일을 추가해보시겠어요?",
  "요청하신 내용을 요약하면 다음과 같은 **핵심 포인트**가 있습니다.\n\n| 항목 | 설명 |\n| --- | --- |\n| 개요 | 전체 맥락 요약 |\n| 결론 | 최종 정리 내용 |",
];

// 특정 질문 패턴에 매칭되면, 모델별로 실제와 유사한 더미 답변을 돌려주기 위한 시나리오 목록.
// keywords 중 하나라도 질문에 포함되면 매칭됨. replies에 없는 provider는 일반 랜덤 더미로 대체.
export const DUMMY_QA_SCENARIOS = [
  {
    keywords: ["취업률", "졸업생 취업"],
    sources: [{ id: "dummy-src-employment", name: "2023_대학정보공시_취업률.pdf" }],
    replies: {
      claude:
        "제공된 Context에 따르면, 졸업생 취업률은 다음과 같습니다.\n\n## 졸업생 취업률\n\n**졸업생 취업률 *70.2%***  (2023년 대학정보공시 기준, '나' 그룹)\n\n### 관련 세부 내용\n- 이는 **대전·충청권 2위**에 해당하는 수치로, \"전국 최상위권\" 수준으로 언급되어 있습니다.\n- 이러한 성과는 다음의 지원체계를 통해 달성된 것으로 설명되어 있습니다.\n  - 학생역량통합관리시스템(SolDream+) 기반의 체계적인 학생역량 관리\n  - 수요자 역량기반 단계별 교과·비교과 통합 취업프로그램(Sol Career Academy: SCA) 운영\n  - 산업 분야별 산학네트워크(가족회사 *3,000개* 이상) 기반의 진로 개발 지원\n\n참고로 관련 지표로 학생창업 매출액은 충청권 *2위*, 학생창업유망팀300 선발대회는 *7팀* 선정(전국 *3위*)의 성과도 함께 제시되어 있습니다.",
      gpt:
        "졸업생 취업률은 *70.2*%입니다.  \n제공된 Context에 따르면 이는 *2023년 대학정보공시* 기준으로, 대전·충청권 *2위*에 해당합니다.",
      gemini:
        "제공된 문서에 따르면 졸업생 취업률은 *70.2*%입니다. (2023년 대학정보공시 기준, 대전·충청권 '나' 그룹 2위)",
    },
    // provider 2개를 알파벳순으로 정렬해 "+"로 이은 키(예: "claude+gemini")별 병합 답변
    merged: {
      "claude+gemini":
        "제공된 문서에 따르면 졸업생 취업률은 *70.2*%입니다.\n\n이는 *2023*년 대학정보공시 기준('나' 그룹) 자료로, 대전·충청권 *2*위에 해당하는 성과이며 전국 최상위권 수준으로 명시되어 있습니다.\n\n이러한 성과는 다음과 같은 요인에 기반한 것으로 설명되어 있습니다:\n- 수요자 역량기반 단계별 교과·비교과 통합 취업프로그램(Sol Career Academy: SCA) 운영\n- 학생역량통합관리시스템(SolDream+) 내 취·창업종합시스템 구축을 통한 체계적 관리\n- 산업 분야별 산학네트워크 기반(가족회사 *3,000개* 이상) 진로 개발 지원",
      "gemini+gpt":
        "제공된 문서에 따르면 졸업생 취업률은 *70.2*%입니다. 이는 *2023년 대학정보공시* 기준으로 대전·충청권 *2위*에 해당합니다.",
      "claude+gpt":
        "졸업생 취업률은 *70.2*%입니다.\n\n제공된 Context에 따르면, 이는 *2023년* 대학정보공시 기준('나' 그룹) 대전·충청권 *2위*에 해당하는 전국 최상위권 성과입니다. 이러한 우수한 성과는 다음과 같은 요인에 기반한 것으로 설명됩니다.\n\n- 학생역량통합관리시스템(SolDream+) 기반 체계적인 학생역량 관리\n- 취·창업종합시스템을 통한 산업 분야별 산학네트워크(가족회사 *3,000개* 이상) 기반 체계적인 진로 개발 지원\n- 수요자 역량기반 단계별 교과·비교과 통합 취업프로그램(Sol Career Academy: SCA) 운영",
    },
  },
];

function findDummyScenario(query) {
  if (!query) return null;
  return DUMMY_QA_SCENARIOS.find((s) => s.keywords.some((k) => query.includes(k))) ?? null;
}

function mergedPairKey(providers) {
  return [...new Set((providers ?? []).filter(Boolean))].sort().join("+");
}

/**
 * @param {string} [query] 사용자 질문 — 특정 시나리오 매칭용
 * @param {string} [provider] 답변 제공 모델 — 시나리오 내 모델별 답변 선택용
 * @returns {{ reply: string, sources: { id: string, name: string }[] }}
 */
export function getDummyChatReply(query, provider) {
  const scenario = findDummyScenario(query);
  const scenarioReply = scenario?.replies?.[provider];
  if (scenarioReply) {
    return { reply: scenarioReply, sources: scenario.sources ?? [] };
  }

  const reply = DUMMY_CHAT_REPLIES[Math.floor(Math.random() * DUMMY_CHAT_REPLIES.length)];
  const sourceCount = Math.floor(Math.random() * 3); // 0~2개
  const sources = DUMMY_SOURCE_FILES.slice(0, sourceCount);
  return { reply, sources };
}

/**
 * 매칭되는 시나리오에 해당 provider 조합용 미리 정의된 병합 답변이 있으면 반환하고, 없으면 null.
 * @param {string} [query]
 * @param {string[]} [providers] 병합 대상 provider 목록 (예: ["claude", "gemini"])
 * @returns {string | null}
 */
export function getDummyMergedReply(query, providers) {
  const scenario = findDummyScenario(query);
  if (!scenario?.merged) return null;
  const key = mergedPairKey(providers);
  return scenario.merged[key] ?? null;
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
