import React, { useEffect } from "react";
import { ExternalLink, FileText, Globe, X } from "lucide-react";
import { toast } from "sonner";
import { resolveServerUrl } from "@/config/ApiService";
import * as fileService from "@/features/files/services/FileService";
import "../styles/SourceNotes.css";

// 답변 출처 각주.
//
// 서버는 답변 문장 끝에 [a] [b] ...(등록 문서) / [1] [2] ...(외부 데이터) 표시를 붙여 보내고,
// sources 에 같은 mark 를 단 출처를 실어 준다. 여기서 그 표시를 위첨자로 바꾸고(툴팁: 근거 문장),
// 말풍선 아래 각주 목록을 그린다. 누르면 등록 문서는 뷰어, 외부 데이터는 링크로 연다.

const CITE_HREF = "#cite-";

/** @param {{ kind?: string, mark?: string }} source */
export const sourceKey = (source) => `${source.kind}-${source.mark}`;

/** 화면에 보이는 표시. 등록 문서 (a), 외부 데이터 (1) */
export const sourceLabel = (source) => `(${source.mark})`;

/**
 * 본문의 [a] / [1] 표시를 각주 링크([a](#cite-internal-a))로 바꾼다. 실제로 있는 출처만 바꾼다 —
 * 모델이 지어낸 표시나, 마크다운 링크([글](주소))는 건드리지 않는다.
 * @param {string} content
 * @param {{ kind: string, mark: string }[]} sources
 * @returns {{ content: string, cited: Set<string> }} 바꾼 본문과 실제로 인용된 출처 key
 */
export function linkCitations(content, sources) {
  const byMark = new Map(sources.filter((s) => s.mark).map((s) => [s.mark, s]));
  const cited = new Set();
  if (byMark.size === 0) return { content, cited };

  const linked = content.replace(/\[([a-z]{1,2}|\d{1,3})\](?!\()/g, (whole, mark) => {
    const source = byMark.get(mark);
    if (!source) return whole;
    const key = sourceKey(source);
    cited.add(key);
    return `[${mark}](${CITE_HREF}${key})`;
  });
  return { content: linked, cited };
}

/** ReactMarkdown 의 a 렌더러가 각주 링크인지 가려낸다. 각주면 key, 아니면 null */
export const citationKey = (href) => (href?.startsWith(CITE_HREF) ? href.slice(CITE_HREF.length) : null);

/** 출처를 연다. 외부는 새 탭 링크, 등록 문서는 뷰어 */
export function openSource(source, onView) {
  if (source.kind === "external") {
    if (source.url) window.open(source.url, "_blank", "noopener,noreferrer");
    else toast.error("이 외부 데이터에는 열 수 있는 링크가 없습니다.");
    return;
  }
  onView(source);
}

/** 본문 속 위첨자 표시. 마우스를 올리면 근거 문장을 보여준다. */
export function CitationMark({ source, onOpen }) {
  return (
    <sup className={`cite-mark cite-${source.kind}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(source);
        }}
      >
        {source.mark}
      </button>
      <span className="cite-tooltip" role="tooltip">
        <span className="cite-tooltip-name">
          {sourceLabel(source)} {source.name}
          {source.heading && <span className="cite-tooltip-heading"> · {source.heading}</span>}
        </span>
        {source.text && <span className="cite-tooltip-text">{source.text}</span>}
      </span>
    </sup>
  );
}

/** 말풍선 아래 각주 목록 */
export function SourceNotes({ sources, onOpen }) {
  if (!sources.length) return null;
  return (
    <ol className="source-notes">
      {sources.map((source) => {
        const Icon = source.kind === "external" ? Globe : FileText;
        return (
          <li key={source.mark ? sourceKey(source) : source.id || source.name}>
            <button
              type="button"
              className="source-note"
              title={source.text || source.name}
              onClick={(e) => {
                e.stopPropagation();
                openSource(source, onOpen);
              }}
            >
              {source.mark && <span className={`source-note-mark cite-${source.kind}`}>{sourceLabel(source)}</span>}
              <Icon size={13} className="source-note-icon" />
              <span className="source-note-name">{source.name}</span>
              {source.heading && <span className="source-note-heading">{source.heading}</span>}
              {source.kind === "external" && source.url && <ExternalLink size={12} className="source-note-icon" />}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** 등록 문서 출처 뷰어: 인용된 단락을 보여주고, 원본 문서를 새 탭으로 연다 */
export function SourceViewerModal({ source, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const openOriginal = async () => {
    try {
      const data = await fileService.downloadFile(source.id);
      if (!data?.url) {
        toast.error(`${source.name}의 원본 파일을 찾을 수 없습니다.`);
        return;
      }
      window.open(resolveServerUrl(data.url), "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "원본 문서를 열지 못했습니다.");
    }
  };

  return (
    <div className="source-viewer-backdrop" onClick={onClose}>
      <div className="source-viewer" role="dialog" aria-label="출처 보기" onClick={(e) => e.stopPropagation()}>
        <div className="source-viewer-head">
          <div className="source-viewer-title">
            {source.mark && <span className="source-note-mark cite-internal">{sourceLabel(source)}</span>}
            <span>{source.name}</span>
          </div>
          <button type="button" className="source-viewer-close" onClick={onClose} title="닫기">
            <X size={16} />
          </button>
        </div>
        {source.heading && <p className="source-viewer-heading">{source.heading}</p>}
        {source.text && <blockquote className="source-viewer-quote">{source.text}</blockquote>}
        <div className="source-viewer-body">{source.content || source.text || "표시할 본문이 없습니다."}</div>
        <div className="source-viewer-actions">
          <button type="button" onClick={openOriginal}>
            <ExternalLink size={13} /> 원본 문서 열기
          </button>
        </div>
      </div>
    </div>
  );
}
