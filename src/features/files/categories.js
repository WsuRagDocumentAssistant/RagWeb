// 문서 등록(비정형) 화면의 입력 카테고리. 서버(document_categories 테이블)가 원본이고,
// 설정 관리 > 문서 카테고리 관리에서 추가·삭제한다.
// shared/dummy.js 의 고정값은 서버에서 못 받아왔을 때만 대신 쓴다.
import { postTask } from "@/config/ApiService";
import { getToken } from "@/config/authStorage";
import {
  WORK_CATEGORIES,
  TASK_DEPARTMENT_PAIRS,
  DEPARTMENTS_BY_WORK_CATEGORY,
  REPORT_TYPES,
} from "@/shared/dummy";

// 카테고리 종류 — 서버 kind 와 같다. 설정 관리 화면의 표 순서이기도 하다.
export const CATEGORY_KINDS = [
  { kind: "work_category", label: "업무구분" },
  { kind: "task", label: "수행업무", parentLabel: "업무구분", pairLabel: "수행부서(자동 채움)" },
  { kind: "department", label: "수행부서", parentLabel: "업무구분" },
  { kind: "report_type", label: "보고서명" },
];

/** @returns {Promise<{ categories: { id: string, kind: string, parent: string, value: string, pair: string | null }[] }>} */
export async function listCategories() {
  return postTask("CATEGORY", "LIST", { token: getToken() });
}

/** @param {{ kind: string, value: string, parent?: string, pair?: string }} category */
export async function saveCategory(category) {
  return postTask("CATEGORY", "SAVE", { token: getToken(), payload: category });
}

/** @param {string} id */
export async function deleteCategory(id) {
  return postTask("CATEGORY", "DELETE", { token: getToken(), payload: { id } });
}

/**
 * 서버 카테고리 행 -> 문서 등록 화면이 쓰는 선택지.
 * rows 가 없으면(서버 실패) dummy.js 고정값으로 같은 모양을 만든다.
 * @param {{ kind: string, parent: string, value: string, pair: string | null }[] | null} rows
 */
export function toCategoryOptions(rows) {
  if (!rows) {
    return withAllDepartments({
      workCategories: WORK_CATEGORIES,
      taskPairs: TASK_DEPARTMENT_PAIRS,
      departmentsByWorkCategory: DEPARTMENTS_BY_WORK_CATEGORY,
      reportTypes: REPORT_TYPES,
    });
  }
  const values = (kind) => rows.filter((r) => r.kind === kind).map((r) => r.value);
  const groupBy = (kind, toItem) =>
    rows
      .filter((r) => r.kind === kind)
      .reduce((acc, r) => ({ ...acc, [r.parent]: [...(acc[r.parent] ?? []), toItem(r)] }), {});
  return withAllDepartments({
    workCategories: values("work_category"),
    taskPairs: groupBy("task", (r) => ({ task: r.value, department: r.pair ?? "" })),
    departmentsByWorkCategory: groupBy("department", (r) => r.value),
    reportTypes: values("report_type"),
  });
}

// 수행업무가 있는 업무구분 목록과, "짝이 채워진 뒤 직접 바꾸고 싶을 때" 쓰는 전체 부서 목록을 덧붙인다.
function withAllDepartments(options) {
  const allDepartments = [
    ...new Set([
      ...Object.values(options.taskPairs).flatMap((pairs) => pairs.map((p) => p.department).filter(Boolean)),
      ...Object.values(options.departmentsByWorkCategory).flat(),
    ]),
  ];
  return { ...options, taskBasedWorkCategories: Object.keys(options.taskPairs), allDepartments };
}
