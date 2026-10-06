// Gateway(RAG_Router)의 WebSocket(/api/ws) 연결 하나를 모든 요청이 같이 쓴다.
//
// 메시지 하나가 요청 하나다. 요청마다 id를 붙여 보내고, 서버는 끝나는 순서대로 같은 id를 붙여
// 답한다 — 오래 걸리는 질의가 뒤에 보낸 목록 조회를 막지 않는다.
// 작업이 도는 동안 서버는 같은 id로 중간 메시지(status "stream": 생성 중인 답변 조각, 진행 단계)를
// 여러 번 보내고, 마지막에 최종 응답(success/error/timeout)을 보낸다.
// 연결은 첫 요청 때 열고, 끊기면 그때 기다리던 요청만 실패시킨 뒤 다음 요청에서 다시 연다.

// 서버의 질의 타임아웃(600초)보다 조금 길게 — 서버가 timeout으로 먼저 답하는 게 정상 경로다.
const REQUEST_TIMEOUT_MS = 11 * 60 * 1000;
const PROGRESS_POLL_MS = 100;

export class TaskSocket {
  /** @param {string} url */
  constructor(url) {
    this.url = url;
    /** @type {WebSocket | null} */
    this.ws = null;
    /** @type {Promise<WebSocket> | null} */
    this.opening = null;
    /** @type {Map<string, { resolve: (v: any) => void, reject: (e: Error) => void, timer: number, onStream?: (event: any) => void }>} */
    this.pending = new Map();
    this.seq = 0;
  }

  /** @returns {Promise<WebSocket>} */
  open() {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve(this.ws);
    if (this.opening) return this.opening;

    this.opening = new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      ws.onopen = () => {
        this.ws = ws;
        this.opening = null;
        resolve(ws);
      };
      ws.onmessage = (e) => this.receive(e.data);
      // onerror 다음에는 항상 onclose가 온다. 정리는 onclose에서 한 번만 한다.
      ws.onclose = () => {
        if (this.ws !== ws) {
          this.opening = null;
          reject(new Error("서버에 연결하지 못했습니다."));
          return;
        }
        this.ws = null;
        this.failAll("서버 연결이 끊겼습니다. 다시 시도해 주세요.");
      };
    });
    return this.opening;
  }

  /**
   * @param {{ task_type: string, session_id: string | null, payload: Record<string, any>, token: string | null }} message
   * @param {{ onProgress?: (percent: number) => void, onStream?: (event: Record<string, any>) => void }} [options]
   *   onProgress: 큰 메시지(파일 업로드)의 전송 진행률 / onStream: 서버가 보내는 중간 메시지(스트리밍)
   * @returns {Promise<any>} 응답의 result
   */
  async request(message, { onProgress, onStream } = {}) {
    const ws = await this.open();
    const id = String(++this.seq);
    const text = JSON.stringify({ id, ...message });

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => this.settle(id, new Error("요청 시간 초과")), REQUEST_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer, onStream });

      const queuedBefore = ws.bufferedAmount;
      ws.send(text);
      if (onProgress) this.trackSend(ws, queuedBefore, text.length, onProgress);
    });
  }

  /** 아직 소켓 버퍼에 남은 양으로 전송 진행률을 계산한다(브라우저가 실제로 내보낸 만큼 줄어든다). */
  trackSend(ws, queuedBefore, size, onProgress) {
    const poll = () => {
      const left = Math.max(0, ws.bufferedAmount - queuedBefore);
      onProgress(Math.round((1 - left / size) * 100));
      if (left > 0 && ws.readyState === WebSocket.OPEN) window.setTimeout(poll, PROGRESS_POLL_MS);
    };
    poll();
  }

  receive(data) {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    // 중간 메시지. 끝난 요청(최종 응답 뒤에 늦게 온 조각)이면 버린다.
    if (msg.status === "stream") {
      this.pending.get(msg.id)?.onStream?.(msg.event);
      return;
    }
    // 형식 오류 응답은 id가 null이라 짝이 없다 — 원래 요청은 타임아웃으로 정리된다.
    if (msg.status === "success") this.settle(msg.id, null, msg.result);
    else this.settle(msg.id, new Error(msg.error_message ?? "요청 실패"));
  }

  settle(id, error, result) {
    const entry = this.pending.get(id);
    if (!entry) return;
    this.pending.delete(id);
    window.clearTimeout(entry.timer);
    if (error) entry.reject(error);
    else entry.resolve(result);
  }

  failAll(message) {
    for (const id of [...this.pending.keys()]) this.settle(id, new Error(message));
  }
}
