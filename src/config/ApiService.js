import { TaskType } from "./TaskType";
import { TaskSocket } from "./TaskSocket";

export const SERVER_URL = "https://rag.wsu.ac.kr";

// RAG_Router(Gateway)와는 WebSocket 연결 하나로 통신한다. 실제 분기는 task_type으로 이루어진다.
const TASK_SOCKET_URL = `${SERVER_URL.replace(/^http/, "ws")}/api/ws`;
const taskSocket = new TaskSocket(TASK_SOCKET_URL);

// 기능별 호출부는 여기서 자신의 task_type을 조회해서 쓴다.
export const API_ENDPOINTS = {
  USER: {
    LOGIN: TaskType.LOGIN,
    REGISTER: TaskType.REGISTER,
    LOGOUT: TaskType.LOGOUT,
    SSO_LOGIN: TaskType.SSO_LOGIN,
    LIST: TaskType.USER_LIST,
    SET_ROLE: TaskType.USER_SET_ROLE,
    SCHOOL_SEARCH: TaskType.SCHOOL_USER_SEARCH,
    SCHOOL_STATUS: TaskType.SCHOOL_USER_STATUS,
    SCHOOL_SYNC: TaskType.SCHOOL_USER_SYNC,
    SET_PERMISSION: TaskType.USER_SET_PERMISSION,
  },
  RAG: {
    CHAT: TaskType.USER_QUERY,
    MERGE: TaskType.MERGE_RESULTS,
    LIST_SESSIONS: TaskType.CHAT_SESSION_LIST,
    GET_SESSION_MESSAGES: TaskType.CHAT_SESSION_MESSAGES,
    DELETE_SESSION: TaskType.CHAT_SESSION_DELETE,
    SAVE_ANSWER: TaskType.CHAT_ANSWER_SAVE,
    COMPACT_STATUS: TaskType.SESSION_COMPACT_STATUS,
    UPLOAD_FILE: TaskType.FILE_UPLOAD,
    JOB_STATUS: TaskType.JOB_STATUS,
    LIST_FILES: TaskType.FILE_LIST,
    DELETE_FILE: TaskType.FILE_DELETE,
    LIST_FILE_IMAGES: TaskType.FILE_IMAGE_LIST,
    SAVE_FILE_IMAGE: TaskType.FILE_IMAGE_SAVE,
    UPLOAD_FILE_IMAGE: TaskType.FILE_IMAGE_UPLOAD,
    DOWNLOAD_FILE: TaskType.FILE_DOWNLOAD,
    FILE_CONTENT: TaskType.FILE_CONTENT,
    VECTORIZE_IMAGE: TaskType.IMAGE_VECTORIZE,
  },
  DICTIONARY: {
    LIST: TaskType.DICTIONARY_LIST,
    SAVE: TaskType.DICTIONARY_SAVE,
  },
  EXTERNAL_API: {
    LIST: TaskType.EXTERNAL_API_LIST,
    SAVE: TaskType.EXTERNAL_API_SAVE,
    DELETE: TaskType.EXTERNAL_API_DELETE,
  },
  CATEGORY: {
    LIST: TaskType.DOCUMENT_CATEGORY_LIST,
    SAVE: TaskType.DOCUMENT_CATEGORY_SAVE,
    DELETE: TaskType.DOCUMENT_CATEGORY_DELETE,
  },
  NOTIFICATION: {
    LIST: TaskType.NOTIFICATION_LIST,
    READ: TaskType.NOTIFICATION_READ,
    CREATE: TaskType.NOTIFICATION_CREATE,
  },
  FEATURE_REQUEST: {
    LIST: TaskType.FEATURE_REQUEST_LIST,
    SAVE: TaskType.FEATURE_REQUEST_SAVE,
    DELETE: TaskType.FEATURE_REQUEST_DELETE,
    REPLY: TaskType.FEATURE_REQUEST_REPLY,
  },
};

/**
 * FILE_DOWNLOAD/FILE_IMAGE_LIST 등이 내려주는 "/api/documents/...", "/api/images/..." 같은
 * (게이트웨이 기준) 상대 경로를 절대 URL로 만든다. 이미 http(s)/blob/data URL이면 그대로 둔다.
 * @param {string | null | undefined} path
 * @returns {string | null | undefined}
 */
export function resolveServerUrl(path) {
  if (!path) return path;
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  return `${SERVER_URL}${path}`;
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
 * Gateway WebSocket으로 { task_type, session_id, payload, token } 메시지를 보내고,
 * { id, task_type, status, result, error_message } 응답에서 result만 반환한다.
 * status가 error/timeout이거나 연결이 끊기면 error_message로 throw한다.
 * 토큰은 헤더 대신 메시지에 싣는다(브라우저 WebSocket은 헤더를 실을 수 없음).
 * @param {keyof typeof API_ENDPOINTS} serverType
 * @param {string} endpointKey
 * @param {{ sessionId?: string|null, payload?: Record<string, any>, token?: string, onProgress?: (percent: number) => void, onStream?: (event: Record<string, any>) => void }} [options]
 *   onProgress는 큰 요청(파일 업로드)의 전송 진행률, onStream은 작업 중 서버가 보내는 중간 메시지
 *   (질의 답변 조각 { type: "delta", provider, text }, 진행 단계 { type: "stage", stage, message } 등)
 * @returns {Promise<any>}
 */
export async function postTask(serverType, endpointKey, options = {}) {
  const { sessionId, payload, token, onProgress, onStream } = options;
  return taskSocket.request(
    {
      task_type: getTaskType(serverType, endpointKey),
      session_id: sessionId ?? null,
      payload: payload ?? {},
      token: token ?? null,
    },
    { onProgress, onStream },
  );
}
