import { TaskType } from "./TaskType";

export const SERVER_URL = "https://rag.wsu.ac.kr";

// RAG_Router(Gateway)는 단일 엔드포인트만 가진다. 실제 분기는 task_type으로 이루어진다.
const TASK_ENDPOINT = "/api/task";

// 기능별 호출부는 여기서 자신의 task_type을 조회해서 쓴다.
export const API_ENDPOINTS = {
  USER: {
    LOGIN: TaskType.LOGIN,
    REGISTER: TaskType.REGISTER,
    LOGOUT: TaskType.LOGOUT,
    SSO_LOGIN: TaskType.SSO_LOGIN,
    LIST: TaskType.USER_LIST,
    SET_ROLE: TaskType.USER_SET_ROLE,
  },
  RAG: {
    CHAT: TaskType.USER_QUERY,
    MERGE: TaskType.MERGE_RESULTS,
    LIST_SESSIONS: TaskType.CHAT_SESSION_LIST,
    GET_SESSION_MESSAGES: TaskType.CHAT_SESSION_MESSAGES,
    DELETE_SESSION: TaskType.CHAT_SESSION_DELETE,
    UPLOAD_FILE: TaskType.FILE_UPLOAD,
    LIST_FILES: TaskType.FILE_LIST,
    DELETE_FILE: TaskType.FILE_DELETE,
    LIST_FILE_IMAGES: TaskType.FILE_IMAGE_LIST,
    SAVE_FILE_IMAGE: TaskType.FILE_IMAGE_SAVE,
    UPLOAD_FILE_IMAGE: TaskType.FILE_IMAGE_UPLOAD,
    DOWNLOAD_FILE: TaskType.FILE_DOWNLOAD,
  },
  DICTIONARY: {
    LIST: TaskType.DICTIONARY_LIST,
    SAVE: TaskType.DICTIONARY_SAVE,
  },
  EXTERNAL_API: {
    LIST: TaskType.EXTERNAL_API_LIST,
    SAVE: TaskType.EXTERNAL_API_SAVE,
    DELETE: TaskType.EXTERNAL_API_DELETE,
    SYNC: TaskType.EXTERNAL_API_SYNC,
  },
};

/** @returns {string} Gateway의 단일 통신 엔드포인트 URL */
export function getTaskUrl() {
  return `${SERVER_URL}${TASK_ENDPOINT}`;
}

/**
 * @param {keyof typeof API_ENDPOINTS} serverType
 * @param {string} endpointKey
 */
export function getTaskType(serverType, endpointKey) {
  const taskType = API_ENDPOINTS[serverType?.toUpperCase()]?.[endpointKey];
  if (!taskType) {
    throw new Error(`[getTaskType] 없는 task_type: ${serverType}.${endpointKey}`);
  }
  return taskType;
}

/**
 * Gateway에 { task_type, session_id, payload } 봉투로 요청하고,
 * { task_type, status, result, error_message } 응답에서 result만 반환한다.
 * status가 error/timeout이거나 HTTP 오류면 error_message로 throw한다.
 * @param {keyof typeof API_ENDPOINTS} serverType
 * @param {string} endpointKey
 * @param {{ sessionId?: string|null, payload?: Record<string, any>, token?: string }} [options]
 * @returns {Promise<any>}
 */
export async function postTask(serverType, endpointKey, options = {}) {
  const { sessionId, payload, token } = options;
  const task_type = getTaskType(serverType, endpointKey);

  const res = await fetch(getTaskUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ task_type, session_id: sessionId ?? null, payload: payload ?? {} }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.status === "error" || body.status === "timeout") {
    throw new Error(body.error_message ?? `요청 실패 (${res.status})`);
  }

  return body.result;
}
