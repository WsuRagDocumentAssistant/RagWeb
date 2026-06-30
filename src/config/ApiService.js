export const SERVER_URL = "https://lowest-similarly-chemical-sam.trycloudflare.com";

export const API_ENDPOINTS = {
  USER: {
    LOGIN: "/users/login",
    REGISTER: "/users/create/user",
    LOGOUT: "/users/logout",
  },
  RAG: {
    HEALTH: "/health",
    CHAT: "/chat",
    UPLOAD_FILE: "/file/upload",
    LIST_FILES: "/file/list",
    DELETE_FILE: "/file/delete/:fileId",
  },
};

/**
 * @param {keyof typeof API_ENDPOINTS} serverType
 * @param {string} endpointKey
 * @param {Record<string, string|number>} replacements
 */
export function createApiUrl(serverType, endpointKey, replacements = {}) {
  const endpoints = API_ENDPOINTS[serverType?.toUpperCase()];
  if (!endpoints?.[endpointKey]) {
    throw new Error(`[createApiUrl] 없는 엔드포인트: ${serverType}.${endpointKey}`);
  }

  let path = endpoints[endpointKey];
  for (const [k, v] of Object.entries(replacements)) {
    path = path.replace(`:${k}`, String(v));
  }
  return `${SERVER_URL}${path}`;
}
