// 튜토리얼이 설명하는 화면(검색 문서 선택 · 이미지 보기 · 병합 결과)은 실제 서버 데이터에
// 의존하면 계정/환경에 따라 문서가 하나도 없어 모달 내용이 비어 보이는 문제가 있었다.
// 그래서 이 데이터는 실제 서버와 무관하게 항상 동일한 예시를 보여주기 위한 튜토리얼 전용 더미다.

export const TUTORIAL_DUMMY_FILES = [
  { id: "tutorial-file-1", name: "2024년 2학기 학사운영계획.pdf", productionYear: 2024 },
  { id: "tutorial-file-2", name: "우송대학교 취업률 통계 보고서.pdf", productionYear: 2023 },
  { id: "tutorial-file-3", name: "학생창업 지원사업 결과보고서.hwpx", productionYear: 2024 },
];

export const TUTORIAL_DUMMY_IMAGE_FILE_NAME = "2024년 2학기 학사운영계획.pdf";

export const TUTORIAL_DUMMY_IMAGES = [
  { id: "tutorial-img-1", index: 1, caption: "표지" },
  { id: "tutorial-img-2", index: 2, caption: "목차" },
  { id: "tutorial-img-3", index: 3, caption: "학사일정 안내" },
  { id: "tutorial-img-4", index: 4, caption: "수강신청 절차" },
];

export const TUTORIAL_DUMMY_IMAGE_META = {
  majorTitle: "학사운영",
  midTitle: "2024년 2학기",
  minorTitle: "추진 계획",
  note: "2024년 2학기 학사 운영 전반의 일정과 추진 계획을 정리한 문서입니다.",
  aiSummary: "2024년 2학기 학사 운영의 주요 일정과 수강신청 절차를 안내하는 자료입니다.",
  keyFacts: ["개강일: 2024-09-02", "수강신청 기간: 2024-08-19 ~ 08-23", "기말고사: 2024-12-09 ~ 12-13"],
  keyPhrases: ["학사운영", "수강신청", "2024년 2학기", "추진일정"],
};

export const TUTORIAL_MERGE_DEMO = {
  question: "우송대학교의 2024년 신입생 충원율은 어떻게 되나요?",
  answers: [
    {
      id: "tutorial-merge-gpt",
      provider: "gpt",
      role: "assistant",
      content: "2024학년도 신입생 충원율은 약 96.8%로, 전년 대비 소폭 상승했습니다.",
      sources: ["2024 신입생충원현황조회.hwpx"],
    },
    {
      id: "tutorial-merge-claude",
      provider: "claude",
      role: "assistant",
      content: "2024년 신입생 충원율은 96.8% 수준이며, 수도권 대비 지방대학 평균보다 높은 수치입니다.",
      sources: ["2024 신입생충원현황조회.hwpx", "대학비교통계_공공데이터포털.csv"],
    },
    {
      id: "tutorial-merge-gemini",
      provider: "gemini",
      role: "assistant",
      content: "2024년 기준 충원율은 96.8%로 집계되었고, 전년도(95.9%) 대비 0.9%p 상승했습니다.",
      sources: ["2024 신입생충원현황조회.hwpx"],
    },
  ],
  merged: {
    id: "tutorial-merge-result",
    provider: "merged",
    mergerProvider: "gpt",
    role: "assistant",
    content:
      "2024학년도 우송대학교 신입생 충원율은 약 96.8%로, 전년(95.9%) 대비 0.9%p 상승했습니다. 이는 수도권 대비 지방대학 평균을 상회하는 수치입니다.",
    sources: ["2024 신입생충원현황조회.hwpx", "대학비교통계_공공데이터포털.csv"],
  },
};
