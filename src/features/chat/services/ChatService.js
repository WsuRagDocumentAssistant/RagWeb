import { postTask } from "@/config/ApiService";

const getToken = () => localStorage.getItem("auth_token");

/**
 * image는 채팅에 첨부한 이미지의 base64 data URL이다(원본 파일 그대로, 서버 업로드 없이 요청에 실어 보냄).
 * @param {{ message: string, provider: string, sessionId?: string, fileIds?: string[], image?: string }} payload
 * @returns {Promise<{ reply: string, sessionId: string, sources?: { id: string, name: string }[] }>}
 */
export async function sendMessage({ message, provider, sessionId, fileIds, image }) {
  return postTask("RAG", "CHAT", {
    sessionId,
    token: getToken(),
    payload: { query: message, provider, fileIds, image },
  });
}

/**
 * 서로 다른 모델의 답변 여러 개를 하나로 병합해서 받아온다.
 * answers마다 sources를 같이 보낸다 — 병합을 수행하는 모델이 각 답변이 어떤 문서를 참고했는지 알아야
 * 병합 결과에서도 출처를 올바르게 표시/인용할 수 있기 때문이다. image는 이 턴의 원래 질문에 첨부됐던
 * 이미지(USER_QUERY에 보낸 것과 동일한 base64 data URL)로, 병합 모델도 원본 질문이 참고한 이미지를
 * 텍스트 답변들과 마찬가지로 함께 볼 수 있어야 한다.
 * @param {{ query: string, answers: { provider: string, content: string, sources?: { id: string, name: string }[] }[], provider: string, sessionId?: string, image?: string }} payload provider는 병합 작업을 수행할 모델
 * @returns {Promise<{ reply: string, sources?: { id: string, name: string }[] }>}
 */
export async function mergeResults({ query, answers, provider, sessionId, image }) {
  return postTask("RAG", "MERGE", {
    sessionId,
    token: getToken(),
    payload: { query, answers, provider, image },
  });
}

/**
 * 로그인한 사용자의 이전 대화 목록을 가져온다. 목록은 가볍게 유지하기 위해 메시지 내역은 포함하지 않는다
 * (내역은 getSessionMessages로 클릭 시 별도 조회).
 * @returns {Promise<{ sessions: { sessionId: string, title?: string, createdAt?: number }[] }>}
 */
export async function listSessions() {
  return postTask("RAG", "LIST_SESSIONS", { token: getToken() });
}

/**
 * 사이드바에서 특정 대화를 클릭했을 때 그 대화의 메시지 내역을 가져온다.
 * sessionId는 payload뿐 아니라 요청 봉투(session_id)에도 함께 실어 보낸다 — CHAT/MERGE와 동일하게
 * 게이트웨이가 어떤 대화 세션에 대한 요청인지 봉투 레벨에서도 알 수 있어야 하기 때문이다.
 * @param {string} sessionId
 * @returns {Promise<{ messages: any[] }>}
 */
export async function getSessionMessages(sessionId) {
  return postTask("RAG", "GET_SESSION_MESSAGES", { sessionId, token: getToken(), payload: { sessionId } });
}

/**
 * 사이드바에서 대화를 삭제했을 때 서버에도 반영한다. sessionId를 요청 봉투(session_id)에도 함께 싣는다.
 * @param {string} sessionId
 */
export async function deleteSession(sessionId) {
  return postTask("RAG", "DELETE_SESSION", { sessionId, token: getToken(), payload: { sessionId } });
}

/**
 * 다중 모델 비교에서 사용자가 답변 하나를 선택하거나, 병합이 끝나서 최종 답변이 정해졌을 때
 * 그 답변을 대화 내역에 저장하도록 서버에 알린다. sessionId를 요청 봉투(session_id)에도 함께 싣는다.
 * @param {{ sessionId?: string, query: string, provider: string, content: string, sources?: { id: string, name: string }[] }} payload provider는 사용자가 고른(또는 병합을 수행한) 모델
 */
export async function saveAnswer({ sessionId, query, provider, content, sources }) {
  return postTask("RAG", "SAVE_ANSWER", {
    sessionId,
    token: getToken(),
    payload: { sessionId, query, provider, content, sources },
  });
}
