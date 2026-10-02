// 역할(관리자/일반 사용자)과 별개로 계정마다 켜고 끄는 권한.
// 이름은 서버(sql/user_permissions.sql, user_functions.PERMISSIONS)와 같아야 한다.
export const PERMISSIONS = {
  DOCUMENT_INPUT: "document_input", // 문서 정보 입력 — 문서 등록(비정형) 화면
};

export const PERMISSION_LABEL = {
  [PERMISSIONS.DOCUMENT_INPUT]: "문서 정보 입력",
};

/**
 * 관리자는 모든 권한을 가진다. 일반 사용자는 따로 받은 권한만.
 * @param {{ role?: string, permissions?: string[] } | null | undefined} user
 * @param {string} permission
 */
export const hasPermission = (user, permission) =>
  user?.role === "admin" || !!user?.permissions?.includes(permission);
