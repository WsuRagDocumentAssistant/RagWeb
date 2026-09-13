import { postTask } from "@/config/ApiService";

const getToken = () => localStorage.getItem("auth_token");

/**
 * 로컬에서 들고 있는 base64 data URL(`data:image/png;base64,....`)을 요청에 실을 모양
 * `{ mimeType, content }`(content는 data URL 접두어 없는 순수 base64)로 바꾼다.
 * @param {string | undefined} dataUrl
 */
function toImagePayload(dataUrl) {
  if (!dataUrl) return undefined;
  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!match) return undefined;
  return { mimeType: match[1], content: match[2] };
}

/**
 * image는 채팅에 첨부한 이미지다(원본 파일 그대로, 서버 업로드 없이 요청에 실어 보냄). 로컬 미리보기는
 * data URL로 들고 있다가, 요청 시에는 `{ mimeType, content }`(content는 순수 base64)로 바꿔서 보낸다.
 * file은 이미지가 아닌 첨부 파일로, 문서 등록(임베딩)과 무관하게 이 질문에만 참고자료로 실어 보낸다
 * (content는 마찬가지로 data URL 접두어 없는 순수 base64). 이미지·파일 모두 최대 1개씩이다.
 * provider는 비교할 모델이 여럿이면 배열로 한 번에 보낸다 — 서버가 한 요청 안에서 모델별로 각각
 * 호출하고 그 결과를 answers 배열로 묶어 돌려준다(모델별로 따로 요청을 보내지 않음).
 * 사용자가 그림을 찾아달라고 한 질의면 서버가 모델을 부르지 않고 answers를 하나만(provider: null)
 * 내려주며, 그 대신 images에 문서에서 찾은 그림(최대 2장)이 실려 온다.
 * turn은 이 세션의 누적 턴 정보다 — 비교 질의(provider 배열)처럼 아직 대화에 저장되지 않은 응답은
 * turn: null이고, 병합(mergeResults)이나 선택(saveAnswer)에서 실제 턴 번호가 온다.
 * turn.compacting이 true면 서버가 이 턴(20의 배수)에서 대화 압축을 막 시작한 것 — SESSION_COMPACT_STATUS로 폴링해야 한다.
 * @param {{ message: string, provider: string | string[], sessionId?: string, fileIds?: string[], image?: string, file?: { name: string, mimeType: string, content: string } }} payload
 * @returns {Promise<{
 *   reply: string, sessionId: string, sources?: { id: string, name: string }[],
 *   answers?: { provider: string | null, content: string, sources?: { id: string, name: string }[] }[],
 *   images?: { id: string, url: string, name: string, caption?: string | null, aiSummary?: string | null, documentId?: string, documentTitle?: string }[],
 *   turn?: { count: number, compacting: boolean } | null,
 * }>}
 */
export async function sendMessage({ message, provider, sessionId, fileIds, image, file }) {
  return postTask("RAG", "CHAT", {
    sessionId,
    token: getToken(),
    payload: { query: message, provider, fileIds, image: toImagePayload(image), file },
  });
}

/**
 * 서로 다른 모델의 답변 여러 개를 하나로 병합해서 받아온다.
 * answers마다 sources를 같이 보낸다 — 병합을 수행하는 모델이 각 답변이 어떤 문서를 참고했는지 알아야
 * 병합 결과에서도 출처를 올바르게 표시/인용할 수 있기 때문이다. image/file은 이 턴의 원래 질문에
 * 첨부됐던 것(USER_QUERY에 보낸 것과 동일)으로, 병합 모델도 원본 질문이 참고한 이미지·파일을
 * 텍스트 답변들과 마찬가지로 함께 볼 수 있어야 한다.
 * @param {{ query: string, answers: { provider: string, content: string, sources?: { id: string, name: string }[] }[], provider: string, sessionId?: string, image?: string, file?: { name: string, mimeType: string, content: string } }} payload provider는 병합 작업을 수행할 모델
 * @returns {Promise<{ reply: string, sources?: { id: string, name: string }[], turn?: { count: number, compacting: boolean } | null }>}
 */
export async function mergeResults({ query, answers, provider, sessionId, image, file }) {
  return postTask("RAG", "MERGE", {
    sessionId,
    token: getToken(),
    payload: { query, answers, provider, image: toImagePayload(image), file },
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
 * @returns {Promise<{ turn?: { count: number, compacting: boolean } | null }>}
 */
export async function saveAnswer({ sessionId, query, provider, content, sources }) {
  return postTask("RAG", "SAVE_ANSWER", {
    sessionId,
    token: getToken(),
    payload: { sessionId, query, provider, content, sources },
  });
}

/**
 * 20턴마다 서버가 백그라운드로 돌리는 대화 압축이 끝났는지 확인한다(폴링). 모르는 세션·압축한 적
 * 없는 세션·서버 재시작 뒤·압축 실패 등은 전부 done으로 온다 — 클라이언트는 done을 받으면 그냥
 * 폴링을 멈추면 된다.
 * @param {string} sessionId
 * @returns {Promise<{ status: "compacting" | "done" }>}
 */
export async function getCompactStatus(sessionId) {
  return postTask("RAG", "COMPACT_STATUS", { token: getToken(), payload: { sessionId } });
}
