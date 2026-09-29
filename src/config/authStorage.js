// 로그인 정보는 sessionStorage에 둔다 — 새로고침에는 유지되고, 탭/브라우저를 닫으면 사라진다.
// (localStorage에 두면 브라우저를 껐다 켜도 로그인 상태가 그대로 남는다.)
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// 예전 버전이 localStorage에 남겨둔 로그인 정보는 더 이상 쓰지 않으므로 지운다.
localStorage.removeItem(TOKEN_KEY);
localStorage.removeItem(USER_KEY);

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);

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
};

export const clearAuth = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};
