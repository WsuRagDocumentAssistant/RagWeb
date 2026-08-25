// 앱 전체에서 쓰는 더미(목업) 데이터를 한 곳에서 관리.
// 실제 백엔드 응답이 없거나 실패했을 때 화면을 계속 확인할 수 있도록 하는 용도.

// ─── 로그인 / 계정 ───────────────────────────────────────────────────────────
// role이 "admin"인 계정만 "문서 등록"과 "외부 API 등록" 화면에 접근할 수 있다.
// 권한 관리 화면에서 admin이 다른 계정의 역할(관리자/일반 사용자)을 바꿀 수 있다.

export const DUMMY_ACCOUNTS = [
  {
    id: 1,
    email: "admin@wsu.ac.kr",
    password: "1234",
    name: "관리자",
    role: "admin",
    provider: "dummy",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    email: "user@wsu.ac.kr",
    password: "1234",
    name: "일반 사용자",
    role: "user",
    provider: "dummy",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 3,
    email: "kim.prof@wsu.ac.kr",
    password: "1234",
    name: "김민준 교수",
    role: "user",
    provider: "dummy",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 4,
    email: "lee.staff@wsu.ac.kr",
    password: "1234",
    name: "이서연 조교",
    role: "user",
    provider: "dummy",
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

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
// "대학혁신지원사업 증빙자료 현황" 대장(엑셀)의 '서류분류' 시트 체계를 그대로 반영한 분류.
// 업무구분에 따라 수행업무/수행부서 선택지가 달라지는 종속 구조:
//   - 재정지원사업 / 대학평가 → 수행업무를 고르면 수행부서가 짝지어 채워짐
//   - 행정부서 / 행정부서(학과) → 수행업무 없이 수행부서만 직접 선택
//   - 기타 → 자유 입력

export const WORK_CATEGORIES = ["재정지원사업", "대학평가", "행정부서", "행정부서(학과)", "기타"];

// 업무구분이 "수행업무" 단계를 갖는 경우 (재정지원사업/대학평가) — 수행업무 ↔ 수행부서 짝
export const TASK_DEPARTMENT_PAIRS = {
  재정지원사업: [
    { task: "SW 중심대학사업", department: "SW 중심대학사업단" },
    { task: "바이오헬스(coss) 첨단분야 혁신융합대학", department: "바이오헬스(coss) 첨단분야 혁신융합대학 사업단" },
    { task: "CAMPUS Asia-AIMS", department: "엔디컷국제대학" },
    { task: "대학혁신지원사업", department: "대학혁신지원사업단" },
    { task: "글로벌철도 연수과정지원사업", department: "글로벌철도 연수과정지원사업단" },
    { task: "첨단산업 인재양성 부트캠프(반도체)", department: "부트캠프 사업단" },
    { task: "RISE 사업", department: "RISE 사업단" },
    { task: "바이오헬스 아카데미", department: "바이오헬스 아카데미 사업단" },
    { task: "4단계 학교기업지원사업", department: "외식조리학과" },
    { task: "고교-대학 연계 사업", department: "엔디컷국제대학" },
    { task: "글로벌 인재취업 선도대학사업", department: "취업지원센터" },
    { task: "채용연계형 SW전문인재양성사업", department: "SW 중심대학사업단" },
    { task: "지방대학활성화사업", department: "지방대학활성화사업단" },
    { task: "SW개발 벤처스타트업 사업", department: "SW 중심대학사업단" },
    { task: "LINC 3.0 사업", department: "RISE 사업단" },
  ],
  대학평가: [
    { task: "기관인증평가", department: "기획처" },
    { task: "세계대학평가", department: "기획처" },
    { task: "대학정보공시", department: "기획처" },
    { task: "고등교육통계", department: "고등교육통계센터" },
    { task: "대학편제단위", department: "기획처" },
  ],
};

// 업무구분이 수행업무 단계 없이 수행부서만 직접 고르는 경우
export const DEPARTMENTS_BY_WORK_CATEGORY = {
  행정부서: [
    "기획처", "대학혁신본부", "고등교육평가센터", "ESG센터", "인사기획처", "대외협력처", "교무처",
    "대학원", "교수학습개발센터", "입학처", "학생복지처", "학생상담센터", "장애학생지원센터", "사회봉사단",
    "인권센터", "RISE 혁신지원센터", "국제교류처", "총무처", "인사관리과", "시설처", "산학협력단",
    "취업지원센터", "창업자원종합관리센터", "유학생동문지원센터", "평생교육원", "우송정보센터", "외국어교육원",
    "우송IT교육센터", "우송비즈니스교육센터", "학생군사교육단", "지역상생협력센터", "동구 통합가족 지원센터",
    "한국어교육원", "현장실습지원센터",
  ],
  "행정부서(학과)": [
    "철도경영학과", "철도시스템학부 철도전기시스템전공", "철도시스템학부 철도소프트웨어전공",
    "철도건설시스템학부 철도건설시스템전공", "철도건설시스템학부 글로벌철도학과", "철도건설시스템학부 건축공학전공",
    "철도차량시스템학과", "철도자율전공", "소프트웨어학부 컴퓨터공학전공", "소프트웨어학부 컴퓨터·소프트웨어전공",
    "게임멀티미디어학부 게임소프트웨어전공", "게임멀티미디어학부 게임그래픽전공",
    "테크노미디어융합학부 미디어디자인·영상전공", "테크노미디어융합학부 글로벌미디어영상학과",
    "보건의료경영학과", "물리치료학과", "사회복지학과", "작업치료학과", "언어치료·청각재활학과",
    "스포츠건강재활학과", "유아교육과", "뷰티디자인경영학과", "응급구조학과", "소방·안전학부", "간호학과",
    "동물관리학부 동물의료관리학과", "동물관리학부 토탈펫케어학과", "보건복지자율전공",
    "외식조리학부 외식조리전공", "외식조리학부 한식·조리과학전공", "외식조리학부 외식,조리경영전공",
    "외식조리학부 제과제빵·조리전공", "외식조리영양학과", "호텔관광경영학과", "글로벌조리학부 글로벌조리전공",
    "글로벌조리학부 Lyfe조리전공", "글로벌조리학부 글로벌외식,조리경영", "외식조리자율전공",
    "휴먼디지털인터페이스학부(HADI)", "솔브릿지경영학부", "AI경영학과", "AI·빅데이터학과",
    "글로벌호스피탈리티·디지털매니지먼트학과", "자유전공학부",
  ],
};

// 수행업무 단계가 있는 업무구분(재정지원사업/대학평가)인지 여부
export const TASK_BASED_WORK_CATEGORIES = Object.keys(TASK_DEPARTMENT_PAIRS);

// 수행부서 콤보박스에서 "짝이 자동 채워진 뒤 직접 바꾸고 싶을 때" 쓰는 전체 부서 목록
export const ALL_DEPARTMENTS = [
  ...new Set([
    ...Object.values(TASK_DEPARTMENT_PAIRS).flatMap((pairs) => pairs.map((p) => p.department)),
    ...Object.values(DEPARTMENTS_BY_WORK_CATEGORY).flat(),
  ]),
];

export const REPORT_TYPES = [
  "신청계획서", "수정사업계획서", "사업계획서", "연간보고서", "성과보고서", "결과보고서", "우수사례 보고서",
  "모니터링보고서", "자체평가보고서", "승인신청서", "운영계획", "시행계획", "기타",
];

export const DUMMY_FILES = [
  {
    id: "dummy-file-1", name: "2025_Q3_회의록.pdf", size: 245000, mimeType: "application/pdf",
    status: "ready", uploadedAt: Date.parse("2026-06-01"),
    workCategory: "재정지원사업", task: "대학혁신지원사업", department: "대학혁신지원사업단",
    reportType: "연간보고서", productionYear: "2026",
    chunks: 61,
  },
  {
    id: "dummy-file-2", name: "2025_로드맵.docx", size: 128000, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    status: "processing", uploadedAt: Date.parse("2026-06-02"),
    workCategory: "대학평가", task: "대학정보공시", department: "기획처",
    reportType: "승인신청서", productionYear: "2026",
    chunks: 32,
  },
  {
    id: "dummy-file-3", name: "스캔본.png", size: 3100000, mimeType: "image/png",
    status: "error", uploadedAt: Date.parse("2026-06-03"), errorMessage: "업로드 실패 (400)",
    workCategory: "행정부서(학과)", task: "", department: "소프트웨어학부 컴퓨터공학전공",
    reportType: "결과보고서", productionYear: "2025",
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

// ─── 외부 API 등록 (정형) ────────────────────────────────────────────────────

export const EXTERNAL_API_FORMATS = ["XML", "JSON", "XLSX", "CSV", "기타"];

export const DUMMY_EXTERNAL_APIS = [
  { id: "1", title: "네이버 검색 API", url: "Naver.com/api/v1/....", site: "naver.com", source: "Naver", category: "검색", format: "JSON", fetchedAt: "2026-07-01", status: "ready" },
  { id: "2", title: "네이버 지도 API", url: "Naver.com/api/v1/....", site: "naver.com", source: "Naver", category: "검색", format: "JSON", fetchedAt: "2026-07-03", status: "ready" },
  { id: "3", title: "네이버 오픈 API", url: "Naver.com/api/v1/....", site: "naver.com", source: "Naver", category: "검색", format: "XML", fetchedAt: "2026-07-05", status: "ready" },
  { id: "4", title: "공공데이터 개방 포털", url: "정부24.co.kr/api.v1/...", site: "data.go.kr", source: "정부24", category: "행정", format: "XLSX", fetchedAt: "2026-07-10", status: "error" },
  { id: "5", title: "구글 커스텀 검색 API", url: "google.com/api/v1/...", site: "google.com", source: "Google", category: "검색", format: "JSON", fetchedAt: "2026-07-15", status: "processing" },
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
