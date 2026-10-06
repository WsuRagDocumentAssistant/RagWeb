import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, ExternalLink, FileText, Globe, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { resolveServerUrl } from "@/config/ApiService";
import * as fileService from "@/features/files/services/FileService";
import "../styles/SourceNotes.css";

// 답변 출처 각주.
//
// 서버는 답변 문장 끝에 [a] [b] ...(등록 문서) / [1] [2] ...(외부 데이터) 표시를 붙여 보내고,
// sources 에 같은 mark 를 단 출처를 실어 준다. 여기서 그 표시를 위첨자로 바꾸고(툴팁: 근거 문장),
// 말풍선 아래 각주 목록을 그린다. 누르면 등록 문서는 문서 뷰어(화면 안), 외부 데이터는 링크(새 탭)로 연다.

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

/** 출처를 연다. 외부는 새 탭 링크, 등록 문서는 문서 뷰어 */
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

const squash = (text) => (text ?? "").replace(/\s+/g, " ").trim();

// 인용 조각(source.text)에서 찾을 때 쓸 앞부분. 서버가 길면 "…"로 잘라 보낸다.
const quoteHead = (source) => squash(source.text || source.content).replace(/…$/, "").slice(0, 60);

/**
 * 문서 단락들 중 인용된 단락의 위치. 인용 조각이 들어 있는 단락이 먼저, 없으면 제목 경로가 같은 단락.
 * @returns {number} 못 찾으면 -1
 */
function findCited(sections, source) {
  const head = quoteHead(source);
  if (head) {
    const byText = sections.findIndex((s) => squash(s.content).includes(head));
    if (byText >= 0) return byText;
  }
  const heading = squash(source.heading);
  return heading ? sections.findIndex((s) => squash(s.breadcrumb || s.heading) === heading) : -1;
}

/** 단락 본문에서 인용 조각을 <mark>로 감싼다. 공백 차이는 무시하고 찾는다. */
function Highlighted({ content, head }) {
  const match = useMemo(() => {
    if (!head) return null;
    const pattern = head.split(" ").map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
    return new RegExp(pattern).exec(content);
  }, [content, head]);
  if (!match) return content;
  const end = match.index + match[0].length;
  return (
    <>
      {content.slice(0, match.index)}
      <mark className="doc-viewer-mark">{match[0]}</mark>
      {content.slice(end)}
    </>
  );
}

/**
 * 등록 문서 출처 뷰어. 원본 문서 전체를 색인할 때와 같은 단락으로 화면 안에 보여주고,
 * 인용된 단락으로 스크롤해 강조한다. 원본이 없거나 열 수 없는 형식이면 인용 단락만 보여준다.
 */
export function SourceViewerModal({ source, onClose }) {
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);
  const citedRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    setDoc(null);
    setError(null);
    fileService
      .getFileContent(source.id)
      .then((data) => alive && setDoc(data))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "문서를 불러오지 못했습니다."));
    return () => {
      alive = false;
    };
  }, [source.id]);

  const sections = doc?.sections ?? [];
  const cited = useMemo(() => findCited(sections, source), [sections, source]);

  useEffect(() => {
    citedRef.current?.scrollIntoView({ block: "center" });
  }, [cited, doc]);

  const download = () => {
    if (doc?.url) window.open(resolveServerUrl(doc.url), "_blank", "noopener,noreferrer");
    else toast.error(`${source.name}의 원본 파일이 서버에 없습니다.`);
  };

  // 원본을 못 여는 경우의 대체 화면: 서버가 준 인용 단락
  const fallback = (note) => (
    <>
      {note && <p className="doc-viewer-note">{note}</p>}
      {source.heading && <p className="source-viewer-heading">{source.heading}</p>}
      <div className="source-viewer-body">{source.content || source.text || "표시할 본문이 없습니다."}</div>
    </>
  );

  return (
    <div className="source-viewer-backdrop" onClick={onClose}>
      <div className="source-viewer doc-viewer" role="dialog" aria-label="문서 보기" onClick={(e) => e.stopPropagation()}>
        <div className="source-viewer-head">
          <div className="source-viewer-title">
            {source.mark && <span className="source-note-mark cite-internal">{sourceLabel(source)}</span>}
            <FileText size={15} className="source-note-icon" />
            <span className="doc-viewer-name">{doc?.name || source.name}</span>
          </div>
          <div className="doc-viewer-tools">
            {doc?.url && (
              <button type="button" className="doc-viewer-download" onClick={download} title="원본 파일 내려받기">
                <Download size={13} /> 원본 내려받기
              </button>
            )}
            <button type="button" className="source-viewer-close" onClick={onClose} title="닫기">
              <X size={16} />
            </button>
          </div>
        </div>

        {error ? (
          fallback(`문서를 불러오지 못했습니다 — ${error}`)
        ) : !doc ? (
          <p className="doc-viewer-loading">
            <Loader2 size={16} className="animate-spin" /> 문서를 불러오는 중
          </p>
        ) : sections.length === 0 ? (
          fallback(doc.reason)
        ) : (
          <>
            {cited < 0 && <p className="doc-viewer-note">인용된 단락의 위치를 찾지 못했습니다. 문서 전체를 보여줍니다.</p>}
            <div className="doc-viewer-body">
              {sections.map((section, i) => (
                <section
                  key={i}
                  ref={i === cited ? citedRef : undefined}
                  className={`doc-viewer-section${i === cited ? " is-cited" : ""}`}
                >
                  {(section.breadcrumb || section.heading) && (
                    <h4 className="doc-viewer-heading">{section.breadcrumb || section.heading}</h4>
                  )}
                  <div className="doc-viewer-content">
                    {i === cited ? <Highlighted content={section.content} head={quoteHead(source)} /> : section.content}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
