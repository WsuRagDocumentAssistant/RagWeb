import { postTask } from "@/config/ApiService";

const getToken = () => localStorage.getItem("auth_token");

/**
 * @param {string} [search]
 * @returns {Promise<{ entries: any[] }>}
 */
export async function listEntries(search) {
  return postTask("DICTIONARY", "LIST", { token: getToken(), payload: { search } });
}

/**
 * @param {{ id: string|number, term: string, synonyms: string }[]} entries
 */
export async function saveEntries(entries) {
  return postTask("DICTIONARY", "SAVE", { token: getToken(), payload: { entries } });
}
