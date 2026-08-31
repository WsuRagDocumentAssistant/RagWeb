// 이미지 편집기(구 SVG 편집기)의 로컬 파일 IO 헬퍼 + 서버 벡터화 연동.
// 서버 연결이 안 되면(또는 아직 미구현이면) 로컬 전용 함수(convertImageToSvg/wrapImageUrlAsSvg)로 대체한다.

import { postTask } from "@/config/ApiService";

const getToken = () => localStorage.getItem("auth_token");

/** @param {File} file @returns {Promise<string>} */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsDataURL(file);
  });
}

/**
 * PNG/JPG 등 래스터 이미지를 서버에서 실제 벡터(선/도형 경로)로 변환한 SVG를 받아온다.
 * 로컬에서 새로 고른 파일이면 file을, 이미 서버에 있는 이미지(문서 이미지 등)면 imageUrl을 넘긴다.
 * @param {{ file?: File, imageUrl?: string }} source
 * @returns {Promise<{ svg: string }>}
 */
export async function vectorizeImage({ file, imageUrl }) {
  const payload = file
    ? { content: await readFileAsBase64(file), mimeType: file.type }
    : { imageUrl };
  return postTask("RAG", "VECTORIZE_IMAGE", { token: getToken(), payload });
}

/**
 * <input type="file">로 선택된 SVG 파일을 텍스트로 읽는다.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readSvgFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target.result);
    reader.onerror = () => reject(reader.error ?? new Error("파일을 읽을 수 없습니다."));
    reader.readAsText(file);
  });
}

/**
 * JPG/PNG 등 래스터 이미지를 SVG로 감싸서 편집기에서 열 수 있게 변환한다.
 * 실제 벡터화(선/도형 추출) 변환은 서버에서 처리될 예정이며, 여기서는 원본 이미지를
 * <image> 요소로 감싼 SVG 래퍼를 만들어 텍스트 추가 등 편집 기능을 바로 쓸 수 있게 한다.
 * @param {File} file
 * @returns {Promise<string>} SVG 텍스트
 */
export function convertImageToSvg(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || 800;
        const height = img.naturalHeight || 600;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><image href="${dataUrl}" x="0" y="0" width="${width}" height="${height}" /></svg>`;
        resolve(svg);
      };
      img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(reader.error ?? new Error("파일을 읽을 수 없습니다."));
    reader.readAsDataURL(file);
  });
}

/**
 * 이미 서버(혹은 로컬 blob)에 있는 이미지 URL을 SVG로 감싸서 편집기에서 바로 열 수 있게 한다.
 * convertImageToSvg와 달리 File이 아니라 URL 문자열(문서 이미지 뷰어의 imageUrl 등)을 받는다.
 * crossOrigin을 지정하지 않는다 — 화면에 표시만 할 뿐 캔버스 픽셀 접근이 필요 없어서, 이미지
 * 서버가 CORS 헤더를 아직 안 보내줘도(현재 그렇다) 문제없이 열 수 있게 하기 위함이다.
 * @param {string} url
 * @returns {Promise<string>} SVG 텍스트
 */
export function wrapImageUrlAsSvg(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 800;
      const height = img.naturalHeight || 600;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><image href="${url}" x="0" y="0" width="${width}" height="${height}" /></svg>`;
      resolve(svg);
    };
    img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
    img.src = url;
  });
}

/** @param {SVGSVGElement} svgEl @returns {string} */
export function serializeSvgElement(svgEl) {
  return new XMLSerializer().serializeToString(svgEl);
}

/**
 * SVG 텍스트를 파일로 다운로드한다.
 * @param {string} svgText
 * @param {string} fileName
 */
export function downloadSvg(svgText, fileName) {
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
