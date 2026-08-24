// 이미지 편집기(구 SVG 편집기)의 로컬 파일 IO 헬퍼.
// 백엔드 연동 없이 <input type="file">로 받은 파일만 다룬다. 저장은 다운로드로만 지원한다.

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
