// 서버(컨테이너) 시간을 기준으로 타이머를 걸기 위한 유틸리티.
// 브라우저의 new Date()는 항상 "이 코드를 실행하는 클라이언트 PC"의 시계를 읽는다.
// 서버 시간 기준으로 동작을 맞추려면 HTTP 응답의 Date 헤더로 서버 시간을 받아와
// 클라이언트와의 오차(offset)를 구해야 한다.
// Date 헤더는 HTTP 표준(RFC 7231)에 따라 항상 GMT(UTC)로 내려오므로,
// 컨테이너(Pod)의 OS 타임존 설정과 무관하게 항상 정확하게 해석된다.

/** 서버(nginx)가 모든 응답에 기본으로 실어 보내는 Date 헤더로 현재 서버 시각을 가져온다. */
export async function getServerTime() {
  const res = await fetch(`${window.location.origin}/index.html`, {
    method: "HEAD",
    cache: "no-store",
  });
  const dateHeader = res.headers.get("Date");
  if (!dateHeader) throw new Error("서버 응답에 Date 헤더가 없습니다.");
  return new Date(dateHeader);
}

/** 서버 시각과 클라이언트 시각의 차이(ms)를 구한다. Date.now() + offset = 서버 기준 현재 시각. */
export async function getServerTimeOffset() {
  const serverTime = await getServerTime();
  return serverTime.getTime() - Date.now();
}

/**
 * 서버 시간 기준으로 일정 간격마다 콜백을 반복 실행한다.
 * setInterval 대신 재귀 setTimeout을 쓰고, 매 회차마다 서버 시간을 다시 확인해서
 * 클라이언트 시계 오차나 백그라운드 탭으로 인한 지연이 다음 실행 시점에 누적되지 않게 한다.
 * @param {number} intervalMs 실행 간격(ms)
 * @param {() => void | Promise<void>} callback
 * @returns {() => void} 반복을 멈추는 함수
 */
export function startServerSyncedInterval(intervalMs, callback) {
  let stopped = false;
  let timeoutId = null;

  const tick = async () => {
    if (stopped) return;
    try {
      await callback();
    } finally {
      if (!stopped) timeoutId = setTimeout(tick, intervalMs);
    }
  };

  timeoutId = setTimeout(tick, intervalMs);

  return () => {
    stopped = true;
    if (timeoutId) clearTimeout(timeoutId);
  };
}
