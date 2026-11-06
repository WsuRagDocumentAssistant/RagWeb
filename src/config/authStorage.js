// 로그인 정보는 sessionStorage에 둔다 — 새로고침에는 유지되고, 탭/브라우저를 닫으면 사라진다.
// (localStorage에 두면 브라우저를 껐다 켜도 로그인 상태가 그대로 남는다.)
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// 예전 버전이 localStorage에 남겨둔 로그인 정보는 더 이상 쓰지 않으므로 지운다.
localStorage.removeItem(TOKEN_KEY);
localStorage.removeItem(USER_KEY);

// 문서 원본·그림 주소(/api/documents, /api/images)는 로그인한 사람에게만 열린다. <img>·<a> 는
// Authorization 헤더를 못 실어서, 같은 토큰을 쿠키로도 둔다(서버 files.py 가 이 쿠키를 확인한다).
// Path=/api 로 API 요청에만 붙고, SameSite=Strict 라 다른 사이트에서 보낸 요청에는 실리지 않는다.
const FILE_COOKIE = "rag_file_token";
const setFileCookie = (token) => {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = token
    ? `${FILE_COOKIE}=${encodeURIComponent(token)}; Path=/api; SameSite=Strict${secure}`
    : `${FILE_COOKIE}=; Path=/api; Max-Age=0; SameSite=Strict${secure}`;
};

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);

// 새로고침해도 sessionStorage 의 토큰은 남지만 쿠키는 브라우저를 닫으면 없어지므로 다시 맞춘다.
setFileCookie(getToken());

export const getStoredUser = () => {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveAuth = (token, user) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  setFileCookie(token);
};

export const clearAuth = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  setFileCookie(null);
};
