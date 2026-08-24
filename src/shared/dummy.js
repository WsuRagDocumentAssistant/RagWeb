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

// ─── 파일 임베딩 (문서 업로드 메타데이터 포함) ────────────────────────────────
// "대학혁신지원사업 증빙자료 현황" 대장(엑셀) 시트의 분류 체계를 그대로 반영한 카테고리 목록.

export const DOCUMENT_AREAS = [
  "0. 성과보고서 요약",
  "1. 교육혁신성과",
  "2. 자체성과관리",
  "별첨. 2024년 사업계획",
];

export const DOCUMENT_TASKS = [
  "자율혁신 목표 및 추진방향",
  "주요내용",
  "2차년도 재정투자 현황",
  "2차년도 자율 성과 지표",
  "대학의 중장기 발전꼐획과 사업목표, 교육혁신 추진 로드맵('23~'25)",
  "교육혁신 추진전략 및 도출 과정",
  "유연한 학사 운영",
  "역량중심 전공교양 교육과정 내실화",
  "교수법 혁신 및 역량 강화",
  "생애주기 맞춤형 교육과정 운영 및 지원체계 혁신",
  "스마트 교육 프로그램 강화",
  "학생 지원 및 관리 체계",
  "취업 지원 프로그램 혁신",
  "창업 지원 프로그램 혁신",
  "학습역량 지원 프로그램 강화",
  "진로ㆍ심리상담 프로그램 강화",
  "학생역량강화 통합 관리 및 지원",
  "글로벌 커뮤니케이션 역량 강화 프로그램 운영",
  "글로벌 실전 취창업 프로그램 고도화",
  "전공자율선택제 모집 학생 관리 추진체계 및 추진전략",
  "역량중심 전공ㆍ교양교육과정 내실화",
  "생애주기 교육기반 구축",
  "대학혁신을 위한 교육과정 및 수업 추진체계",
  "대학혁신을 위한 교육과정 및 수업 추진전략",
  "추진 세부내용 및 과제별 실적 및 성과",
  "스마트 교육 환경 개선",
  "글로벌 틀별교육과정(프로그램) 운영)",
  "선진 교육과정/자료 개발 및 운영",
  "글로벌 자매대학과 네트워크 프로그램 강화",
  "글로벌 산학 연계 프로그램 강화",
  "교육혁신을 위한 학생 수요에 따른 제도 및 추진체계와 추진전략",
  "대학혁신지원사업을 위한 혁신 교원채용 및 활용",
  "지역사회 상생협력 프로그램 운영",
  "교육혁신 추진을 위한 학내 논의 체계",
  "교육혁신 전략 이행 점검",
  "자율성과지표",
  "자체 성과관리(환류)",
  "2024년 대학자율혁신계획 요약문",
];

export const DOCUMENT_TYPES = ["표", "그림", "사진", "이미지", "텍스트"];

export const DOCUMENT_SUB_TYPES = ["글", "표", "그림", "실적표", "텍스트", "이미지", "사진", "-", "성과지표"];

export const DOCUMENT_CATEGORIES = ["-", "기타", "교과", "비교과"];

export const DOCUMENT_SUB_CATEGORIES = [
  "-",
  "기타",
  "발전계획",
  "규정제·개정",
  "전공·교육과정",
  "교수법·교원역량",
  "학습지원",
  "취업",
  "창업",
  "상담·심리",
  "글로벌·국제화",
];

export const DUMMY_FILES = [
  {
    id: "dummy-file-1", name: "2025_Q3_회의록.pdf", size: 245000, mimeType: "application/pdf",
    status: "ready", uploadedAt: Date.parse("2026-06-01"),
    area: "1. 교육혁신성과", task: "취업 지원 프로그램 혁신", docType: "표", subType: "실적표",
    category: "비교과", subCategory: "취업", docDate: "2026-06-01",
    chunks: 61,
  },
  {
    id: "dummy-file-2", name: "2025_로드맵.docx", size: 128000, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    status: "processing", uploadedAt: Date.parse("2026-06-02"),
    area: "1. 교육혁신성과", task: "대학의 중장기 발전꼐획과 사업목표, 교육혁신 추진 로드맵('23~'25)", docType: "그림", subType: "그림",
    category: "기타", subCategory: "발전계획", docDate: "2026-06-02",
    chunks: 32,
  },
  {
    id: "dummy-file-3", name: "스캔본.png", size: 3100000, mimeType: "image/png",
    status: "error", uploadedAt: Date.parse("2026-06-03"), errorMessage: "업로드 실패 (400)",
    area: "2. 자체성과관리", task: "학생역량강화 통합 관리 및 지원", docType: "이미지", subType: "이미지",
    category: "비교과", subCategory: "학습지원", docDate: "2026-06-03",
  },
];

// ─── 문서 이미지 보기 (문서 내 페이지 이미지 + AI 설명) ────────────────────────

const DUMMY_DOCUMENT_IMAGE_DESCRIPTIONS = [
  {
    caption: "표지 이미지 — 문서 제목과 기관 로고가 포함되어 있습니다.",
    majorTitle: "0. 성과보고서 요약",
    midTitle: "표지",
    minorTitle: "문서 표지",
    note: "",
    aiSummary: "이 이미지는 문서의 표지로, 보고서 제목과 발행 기관의 로고, 발행 연도가 상단에 배치되어 있다.",
    keyFacts: [
      "문서 제목이 상단 중앙에 굵은 글씨로 표시되어 있다.",
      "기관 로고와 창립 연혁(주년 표기)이 함께 노출되어 있다.",
    ],
    keyPhrases: ["대학혁신지원사업", "연차평가보고서"],
    imageUrl: null,
  },
  {
    caption: "비전 및 핵심역량 구조를 도식화한 다이어그램입니다.",
    majorTitle: "1. 교육혁신성과",
    midTitle: "대학의 중장기 발전계획과 사업목표",
    minorTitle: "비전 및 핵심역량 다이어그램",
    note: "",
    aiSummary:
      "이 이미지는 대학의 비전과 인재상, 핵심역량, 특성화 전략 및 교육 방향을 구조적으로 도식화한 다이어그램이다. 상단에는 비전이 제시되고, 하위에는 인재상과 이를 뒷받침하는 핵심역량, 특성화 전략, 교육 강화 방향이 계층적으로 정리되어 있다.",
    keyFacts: [
      "비전은 최상단에 하나의 문구로 명시되어 있다.",
      "인재상 및 핵심역량에는 도덕성과 인성, 의사소통 능력, 글로벌 마인드, 분석적 사고력 등이 포함된다.",
      "특성화 방향은 지역발전 연계, 실무중심, 글로벌 기반, 디지털 융합 교육 강화로 구분된다.",
    ],
    keyPhrases: ["창의융합인재", "글로벌인재", "4.0IR 신실용인재", "특성화 (3 Wheels)"],
    imageUrl: null,
  },
  {
    caption: "세부 추진 일정 및 조직 구성도를 나타낸 표입니다.",
    majorTitle: "1. 교육혁신성과",
    midTitle: "교육혁신 추진전략 및 도출 과정",
    minorTitle: "추진 일정 및 조직 구성도",
    note: "",
    aiSummary: "이 이미지는 사업의 세부 추진 일정과 담당 조직의 구성을 표 형태로 정리한 자료이다.",
    keyFacts: [
      "연도별 추진 일정이 좌측 열에 정리되어 있다.",
      "담당 부서와 역할이 우측 열에 명시되어 있다.",
    ],
    keyPhrases: ["추진체계", "연차별 계획"],
    imageUrl: null,
  },
  {
    caption: "성과 지표를 그래프로 시각화한 이미지입니다.",
    majorTitle: "2. 자체성과관리",
    midTitle: "자율성과지표",
    minorTitle: "연도별 성과 그래프",
    note: "",
    aiSummary: "이 이미지는 사업 성과를 막대/원형 그래프 형태로 시각화하여 연도별 변화 추이를 보여준다.",
    keyFacts: [
      "취업률, 충원율 등 핵심 지표가 그래프로 제시되어 있다.",
      "전년 대비 증감률이 색상으로 구분되어 있다.",
    ],
    keyPhrases: ["핵심성과지표(KPI)", "전년 대비"],
    imageUrl: null,
  },
];

/**
 * 문서(EmbeddingFile)에 대한 더미 페이지 이미지 목록을 생성한다.
 * 실제 페이지 이미지가 없으므로 문서의 chunk 수를 기반으로 페이지 수를 추정해 목업 데이터를 만든다.
 * @param {{ id: string, chunks?: number }} file
 * @returns {{ id: string, index: number, caption: string, aiSummary: string, keyFacts: string[], keyPhrases: string[] }[]}
 */
export function getDummyDocumentImages(file) {
  const count = Math.min(12, Math.max(4, Math.round((file?.chunks ?? 12) / 6)));
  return Array.from({ length: count }, (_, i) => ({
    id: `${file?.id ?? "doc"}-img-${i + 1}`,
    index: i + 1,
    ...DUMMY_DOCUMENT_IMAGE_DESCRIPTIONS[i % DUMMY_DOCUMENT_IMAGE_DESCRIPTIONS.length],
  }));
}

// ─── 외부 API 연동 ─────────────────────────────────────────────────────────

export const DUMMY_EXTERNAL_APIS = [
  { id: "1", url: "Naver.com/api/v1/....", source: "Naver", category: "검색", status: "ready" },
  { id: "2", url: "Naver.com/api/v1/....", source: "Naver", category: "검색", status: "ready" },
  { id: "3", url: "Naver.com/api/v1/....", source: "Naver", category: "검색", status: "ready" },
  { id: "4", url: "정부24.co.kr/api.v1/...", source: "정부24", category: "행정", status: "error" },
  { id: "5", url: "google.com/api/v1/...", source: "Google", category: "검색", status: "processing" },
];

// ─── 검색어 관리 ──────────────────────────────────────────────────────────

export const DUMMY_DICTIONARY_ENTRIES = [
  { id: 1, term: "woosong teaching program", synonyms: "woosong teaching program, wtp (woosong teaching program), wtp 프로그램, wtp(woosong teaching program)", created_at: "", updated_at: "" },
  { id: 2, term: "woosong learning program", synonyms: "woosong learning program, wlp, wlp(woosong learning program), wlp프로그램", created_at: "", updated_at: "" },
  { id: 3, term: "학생역량통합관리시스템", synonyms: "학생역량통합관리시스템, my soldream+ go, sol-dream+, soldream, soldream+, 우송대학교 학생역량통합 시스템, 학생역량통합관리 시스템, 학생역량통합관리시스템 [soldream+]", created_at: "", updated_at: "" },
  { id: 4, term: "우송대학교", synonyms: "우송대학교, woosong, woosong university, wsu, wsu 대학원생, 우송대", created_at: "", updated_at: "" },
  { id: 5, term: "창의융합자유전공학부", synonyms: "창의융합자유전공학부, 자유전공학부", created_at: "", updated_at: "" },
  { id: 6, term: "ai미래혁신추진단", synonyms: "ai미래혁신추진단, ai 교육과정혁신위원회, ai미래혁신위원회", created_at: "", updated_at: "" },
];
