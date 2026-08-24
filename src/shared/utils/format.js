import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** @param {number} bytes */
export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** @param {...import("clsx").ClassValue} inputs */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** "1. 교육혁신성과" → "교육혁신성과" — 카테고리 표시용, 앞의 숫자 넘버링만 제거 (예: "별첨."은 유지) */
export function stripNumberPrefix(text) {
  if (!text) return text;
  return text.replace(/^\d+\.\s*/, "");
}

/** @param {number} timestamp epoch ms → "방금 전" / "5분 전" / "3시간 전" / "2일 전" 형태의 상대 시간 */
export function formatRelativeTime(timestamp) {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(timestamp).toISOString().slice(0, 10);
}
