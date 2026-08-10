// SVG 파일을 브라우저에서 직접 열고 저장하기 위한 로컬 파일 IO 헬퍼.
// 백엔드 연동 없이 File System Access API(FSA) 또는 <input type="file"> 폴백만 사용한다.

/** @returns {boolean} 현재 브라우저가 파일 직접 덮어쓰기(FSA)를 지원하는지 여부 */
export function supportsFileSystemAccess() {
  return typeof window !== "undefined" && typeof window.showOpenFilePicker === "function";
}

/**
 * FSA로 SVG 파일을 선택해 핸들과 텍스트를 함께 가져온다.
 * 사용자가 선택을 취소하면 showOpenFilePicker가 AbortError를 던진다 (호출부에서 처리).
 * @returns {Promise<{ handle: FileSystemFileHandle, name: string, text: string }>}
 */
export async function openSvgWithPicker() {
  const [handle] = await window.showOpenFilePicker({
    types: [{ description: "SVG files", accept: { "image/svg+xml": [".svg"] } }],
  });
  const file = await handle.getFile();
  const text = await file.text();
  return { handle, name: file.name, text };
}

/**
 * <input type="file">로 선택된 File을 텍스트로 읽는다.
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

/** @param {SVGSVGElement} svgEl @returns {string} */
export function serializeSvgElement(svgEl) {
  return new XMLSerializer().serializeToString(svgEl);
}

/**
 * FSA 핸들에 SVG 텍스트를 직접 덮어쓴다.
 * @param {FileSystemFileHandle} handle
 * @param {string} svgText
 */
export async function saveSvgToHandle(handle, svgText) {
  const writable = await handle.createWritable();
  await writable.write(svgText);
  await writable.close();
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
