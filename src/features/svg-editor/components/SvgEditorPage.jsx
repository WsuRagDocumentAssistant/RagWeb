import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FolderOpen, Download, Type, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  readSvgFile,
  convertImageToSvg,
  serializeSvgElement,
  downloadSvg,
} from "../services/SvgEditorService";
import "../styles/SvgEditorPage.css";

const SVG_NS = "http://www.w3.org/2000/svg";
const MIN_FONT_SIZE = 6;
const MAX_FONT_SIZE = 200;
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];

const getFontSizePx = (node) => parseFloat(window.getComputedStyle(node).fontSize) || 14;

const setFontSizePx = (node, px) => {
  node.setAttribute("font-size", px.toFixed(1));
  node.style.fontSize = `${px}px`;
};

const screenDeltaToUserDelta = (svg, x0, y0, x1, y1) => {
  const ctm = svg.getScreenCTM();
  if (!ctm) return { dx: x1 - x0, dy: y1 - y0 };
  const inv = ctm.inverse();
  const p0 = svg.createSVGPoint();
  p0.x = x0;
  p0.y = y0;
  const p1 = svg.createSVGPoint();
  p1.x = x1;
  p1.y = y1;
  const u0 = p0.matrixTransform(inv);
  const u1 = p1.matrixTransform(inv);
  return { dx: u1.x - u0.x, dy: u1.y - u0.y };
};

export default function SvgEditorPage() {
  const location = useLocation();
  const [loaded, setLoaded] = useState(false);
  const [fileName, setFileName] = useState("edited.svg");
  const [selection, setSelection] = useState(null); // { content, fontSize } — 상단 패널에 표시되는 선택된 텍스트 속성

  const hostRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const fileInputRef = useRef(null);
  const panelRef = useRef(null); // 상단 인스펙터 패널 컨테이너 — 포커스가 여기 있으면 블러로 편집기를 닫지 않는다
  const activeEditorRef = useRef(null); // { node, input, selBox, resizeHandle, moveHandle, deleteHandle, originalContent }
  const dragStateRef = useRef({ isResizing: false, isMoving: false });
  const loadedFromStateRef = useRef(false);

  /* =========================================================
     플로팅 오버레이(입력창 + 핸들) 위치 계산 — 상단 패널 수정 시에도 재사용
     ========================================================= */
  const positionOverlay = useCallback((node, ed) => {
    const wrap = canvasWrapRef.current;
    const hostRect = wrap.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const left = nodeRect.left - hostRect.left + wrap.scrollLeft;
    const top = nodeRect.top - hostRect.top + wrap.scrollTop;

    ed.input.style.left = `${left - 4}px`;
    ed.input.style.top = `${top - 4}px`;
    ed.selBox.style.left = `${left - 6}px`;
    ed.selBox.style.top = `${top - 6}px`;
    ed.selBox.style.width = `${nodeRect.width + 12}px`;
    ed.selBox.style.height = `${nodeRect.height + 12}px`;
    ed.resizeHandle.style.left = `${left + nodeRect.width + 2}px`;
    ed.resizeHandle.style.top = `${top + nodeRect.height + 2}px`;
    ed.moveHandle.style.left = `${left - 8}px`;
    ed.moveHandle.style.top = `${top - 8}px`;
    ed.deleteHandle.style.left = `${left + nodeRect.width + 2}px`;
    ed.deleteHandle.style.top = `${top - 8}px`;
  }, []);

  const refreshSelectionPanel = useCallback((node) => {
    setSelection({ content: node.textContent, fontSize: Math.round(getFontSizePx(node)) });
  }, []);

  const closeEditor = useCallback(() => {
    const ed = activeEditorRef.current;
    if (!ed) return;
    ed.input.remove();
    ed.selBox.remove();
    ed.resizeHandle.remove();
    ed.moveHandle.remove();
    ed.deleteHandle.remove();
    activeEditorRef.current = null;
    setSelection(null);
  }, []);

  const deleteSelected = useCallback(() => {
    const ed = activeEditorRef.current;
    if (!ed) return;
    ed.node.remove();
    closeEditor();
    toast.success("텍스트를 삭제했습니다.");
  }, [closeEditor]);

  /* =========================================================
     크기 조절 / 이동 드래그
     ========================================================= */
  const attachResizeDrag = useCallback(
    (handle, ed) => {
      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragStateRef.current.isResizing = true;
        const startX = e.clientX;
        const startY = e.clientY;
        const startFont = getFontSizePx(ed.node);

        function onMove(ev) {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          const delta = (dx + dy) / 2;
          const newFont = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, startFont + delta * 0.3));
          setFontSizePx(ed.node, newFont);
          ed.input.style.fontSize = `${newFont}px`;
          positionOverlay(ed.node, ed);
        }
        function onUp() {
          dragStateRef.current.isResizing = false;
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          ed.input.focus();
          refreshSelectionPanel(ed.node);
        }
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    },
    [positionOverlay, refreshSelectionPanel]
  );

  const attachMoveDrag = useCallback(
    (handle, ed) => {
      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragStateRef.current.isMoving = true;
        const node = ed.node;
        const svg = node.ownerSVGElement;
        const startClientX = e.clientX;
        const startClientY = e.clientY;
        const startX = parseFloat(node.getAttribute("x")) || 0;
        const startY = parseFloat(node.getAttribute("y")) || 0;
        const tspans = Array.from(node.querySelectorAll("tspan"));
        const tspanStartX = tspans.map((ts) => (ts.hasAttribute("x") ? parseFloat(ts.getAttribute("x")) : null));

        function onMove(ev) {
          const delta = screenDeltaToUserDelta(svg, startClientX, startClientY, ev.clientX, ev.clientY);
          node.setAttribute("x", (startX + delta.dx).toFixed(1));
          node.setAttribute("y", (startY + delta.dy).toFixed(1));
          tspans.forEach((ts, i) => {
            if (tspanStartX[i] !== null) ts.setAttribute("x", (tspanStartX[i] + delta.dx).toFixed(1));
          });
          positionOverlay(node, ed);
        }
        function onUp() {
          dragStateRef.current.isMoving = false;
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          ed.input.focus();
        }
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    },
    [positionOverlay]
  );

  /* =========================================================
     텍스트 편집기 열기 (플로팅 입력 + 상단 패널 동시 활성화)
     ========================================================= */
  const openEditorFor = useCallback(
    (node) => {
      closeEditor();
      const wrap = canvasWrapRef.current;
      const hostRect = wrap.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const left = nodeRect.left - hostRect.left + wrap.scrollLeft;
      const top = nodeRect.top - hostRect.top + wrap.scrollTop;

      const input = document.createElement("input");
      input.className = "svged-cell-input";
      input.value = node.textContent;
      input.style.width = `${Math.max(nodeRect.width + 30, 60)}px`;
      input.style.left = `${left - 4}px`;
      input.style.top = `${top - 4}px`;
      wrap.appendChild(input);

      const selBox = document.createElement("div");
      selBox.className = "svged-sel-box";
      wrap.appendChild(selBox);

      const resizeHandle = document.createElement("div");
      resizeHandle.className = "svged-resize-handle";
      wrap.appendChild(resizeHandle);

      const moveHandle = document.createElement("div");
      moveHandle.className = "svged-move-handle";
      wrap.appendChild(moveHandle);

      const deleteHandle = document.createElement("div");
      deleteHandle.className = "svged-delete-handle";
      deleteHandle.textContent = "×";
      wrap.appendChild(deleteHandle);

      const ed = { node, input, selBox, resizeHandle, moveHandle, deleteHandle, originalContent: node.textContent };
      activeEditorRef.current = ed;
      positionOverlay(node, ed);
      input.focus();
      input.select();

      input.addEventListener("input", () => {
        node.textContent = input.value;
        positionOverlay(node, ed);
        setSelection((s) => (s ? { ...s, content: input.value } : s));
      });
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          closeEditor();
        }
        if (ev.key === "Escape") {
          node.textContent = ed.originalContent;
          closeEditor();
        }
      });
      input.addEventListener("blur", () => {
        if (dragStateRef.current.isResizing || dragStateRef.current.isMoving) return;
        setTimeout(() => {
          if (activeEditorRef.current !== ed) return; // 그 사이 다른 텍스트가 선택됨 — 이 편집기는 이미 정리됨
          if (dragStateRef.current.isResizing || dragStateRef.current.isMoving) return;
          // 포커스가 상단 인스펙터 패널로 이동한 경우는 계속 편집 중인 것으로 간주하고 닫지 않는다
          if (panelRef.current && panelRef.current.contains(document.activeElement)) return;
          closeEditor();
        }, 0);
      });

      deleteHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      deleteHandle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteSelected();
      });

      attachResizeDrag(resizeHandle, ed);
      attachMoveDrag(moveHandle, ed);

      refreshSelectionPanel(node);
    },
    [closeEditor, positionOverlay, attachResizeDrag, attachMoveDrag, deleteSelected, refreshSelectionPanel]
  );

  const attachClickHandler = useCallback(
    (node) => {
      node.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditorFor(node);
      });
    },
    [openEditorFor]
  );

  const attachTextHandlers = useCallback(() => {
    hostRef.current?.querySelectorAll("text, tspan").forEach(attachClickHandler);
  }, [attachClickHandler]);

  /* =========================================================
     상단 패널 입력 → 선택된 노드에 실시간 반영
     ========================================================= */
  const handlePanelContentChange = useCallback(
    (value) => {
      const ed = activeEditorRef.current;
      if (!ed) return;
      ed.node.textContent = value;
      ed.input.value = value;
      positionOverlay(ed.node, ed);
      setSelection((s) => (s ? { ...s, content: value } : s));
    },
    [positionOverlay]
  );

  const handlePanelFontSizeChange = useCallback(
    (value) => {
      const ed = activeEditorRef.current;
      if (!ed || Number.isNaN(value)) return;
      const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, value));
      setFontSizePx(ed.node, clamped);
      ed.input.style.fontSize = `${clamped}px`;
      positionOverlay(ed.node, ed);
      setSelection((s) => (s ? { ...s, fontSize: clamped } : s));
    },
    [positionOverlay]
  );

  /* =========================================================
     파일 로드 / 다운로드
     ========================================================= */
  const serializeSvg = useCallback(() => {
    const svg = hostRef.current?.querySelector("svg");
    return svg ? serializeSvgElement(svg) : "";
  }, []);

  const loadSvgText = useCallback(
    (text, name) => {
      const host = hostRef.current;
      if (!host) return;
      closeEditor();
      host.innerHTML = text;

      const svg = host.querySelector("svg");
      if (!svg) {
        toast.error("유효한 SVG 파일이 아닙니다.");
        return;
      }
      svg.style.maxWidth = "100%";
      attachTextHandlers();

      if (name) setFileName(name);
      setLoaded(true);
    },
    [attachTextHandlers, closeEditor]
  );

  // 문서 목록의 "이미지 보기"에서 특정 이미지를 열고 넘어온 경우, 그 이미지를 바로 불러온다.
  useEffect(() => {
    if (loadedFromStateRef.current) return;
    const incoming = location.state?.svgText;
    if (!incoming) return;
    loadedFromStateRef.current = true;
    loadSvgText(incoming, location.state?.fileName ?? "image.svg");
    toast.success("이미지 편집기에서 불러왔습니다.");
  }, [location.state, loadSvgText]);

  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
      const isImage = IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

      if (isSvg) {
        readSvgFile(file)
          .then((text) => {
            loadSvgText(text, file.name);
            toast.success(`${file.name} 불러옴 — 텍스트를 클릭해서 편집하세요.`);
          })
          .catch((err) => toast.error(`파일 읽기 실패: ${err.message}`));
        return;
      }

      if (isImage) {
        toast.loading("이미지를 SVG로 변환 중입니다...", { id: "svg-convert" });
        convertImageToSvg(file)
          .then((svgText) => {
            const svgName = file.name.replace(/\.[^.]+$/, ".svg");
            loadSvgText(svgText, svgName);
            toast.success("이미지를 SVG로 변환했습니다. (변환 로직은 추후 서버와 연동됩니다)", { id: "svg-convert" });
          })
          .catch((err) => toast.error(`변환 실패: ${err.message}`, { id: "svg-convert" }));
        return;
      }

      toast.error("SVG 또는 이미지 파일(PNG/JPG/GIF/WEBP)만 지원합니다.");
    },
    [loadSvgText]
  );

  const handleDownload = useCallback(() => {
    closeEditor();
    downloadSvg(serializeSvg(), fileName);
  }, [closeEditor, serializeSvg, fileName]);

  const handleAddText = useCallback(() => {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    closeEditor();
    const newText = document.createElementNS(SVG_NS, "text");

    let cx = 100;
    let cy = 100;
    const vb = svg.viewBox && svg.viewBox.baseVal;
    if (vb && vb.width) {
      cx = vb.x + vb.width / 2;
      cy = vb.y + vb.height / 2;
    }
    newText.setAttribute("x", cx.toFixed(1));
    newText.setAttribute("y", cy.toFixed(1));
    newText.setAttribute("font-size", "16");
    newText.setAttribute("fill", "currentColor");
    newText.textContent = "새 텍스트";

    svg.appendChild(newText);
    attachClickHandler(newText);
    setTimeout(() => openEditorFor(newText), 0);
  }, [closeEditor, attachClickHandler, openEditorFor]);

  return (
    <div className="svged-page">
      <div className="svged-topbar">
        <div className="svged-toolbar-row">
          <button className="svged-btn" onClick={handleOpenFile}>
            <FolderOpen size={14} />
            파일 열기
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".svg,image/svg+xml,image/png,image/jpeg,image/gif,image/webp,image/bmp"
            style={{ display: "none" }}
            onChange={handleFileInputChange}
          />
          <button className="svged-btn" onClick={handleDownload} disabled={!loaded}>
            <Download size={14} />
            다운로드
          </button>
          <button className="svged-btn" onClick={handleAddText} disabled={!loaded}>
            <Type size={14} />
            텍스트 추가
          </button>
          <span className="svged-filename">{loaded ? fileName : "파일을 열어주세요"}</span>
        </div>

        {selection && (
          <div className="svged-inspector-row" ref={panelRef}>
            <label className="svged-inspector-field svged-inspector-field-grow">
              <span>텍스트 내용</span>
              <input type="text" value={selection.content} onChange={(e) => handlePanelContentChange(e.target.value)} />
            </label>
            <label className="svged-inspector-field">
              <span>글자 크기 (px)</span>
              <input
                type="number"
                min={MIN_FONT_SIZE}
                max={MAX_FONT_SIZE}
                value={selection.fontSize}
                onChange={(e) => handlePanelFontSizeChange(Number(e.target.value))}
              />
            </label>
            <button className="svged-btn svged-btn-danger" onClick={deleteSelected}>
              <Trash2 size={14} />
              삭제
            </button>
            <button className="svged-btn svged-btn-ghost" onClick={closeEditor}>
              <X size={14} />
              선택 해제
            </button>
          </div>
        )}

        <p className="svged-hint">
          SVG 파일은 그대로 열리고, PNG/JPG 등 이미지 파일은 SVG로 변환되어 열립니다(변환 로직은 서버와 연동될 예정입니다).
          텍스트를 클릭하면 위 패널과 캔버스에서 동시에 내용/크기/위치를 편집할 수 있습니다.
          (파란 점: 크기 조절, 주황 사각형: 이동, 빨간 ×: 삭제)
        </p>
      </div>

      <div ref={canvasWrapRef} className="svged-canvas-wrap" style={{ display: loaded ? "block" : "none" }}>
        <div ref={hostRef} className="svged-host" />
      </div>

      {!loaded && (
        <div className="svged-empty">
          <p>이미지를 열면 여기에서 텍스트를 클릭해 바로 수정할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}
