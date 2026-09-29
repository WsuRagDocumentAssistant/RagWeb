import { postTask } from "@/config/ApiService";

import { getToken } from "@/config/authStorage";

/** @returns {Promise<{ apis: any[] }>} */
export async function listApis() {
  return postTask("EXTERNAL_API", "LIST", { token: getToken() });
}

/**
 * id가 있으면 수정, 없으면 신규 등록.
 * @param {{ id?: string, title: string, url: string, source: string, apiKey: string, refreshIntervalMinutes: number }} api
 * @returns {Promise<{ api: any }>}
 */
export async function saveApi(api) {
  return postTask("EXTERNAL_API", "SAVE", { token: getToken(), payload: api });
}

/** @param {string} id */
export async function deleteApi(id) {
  return postTask("EXTERNAL_API", "DELETE", { token: getToken(), payload: { id } });
}
