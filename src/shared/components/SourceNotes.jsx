import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "./Markdown";
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

// 비교용 글자열: 공백과 마크다운 기호(표의 |, 구분선 -, 강조 * 등)를 모두 뺀다.
// 단락 본문은 표가 마크다운으로 들어 있고, 인용 조각은 공백을 줄여 잘라 온 것이라 그대로는 안 맞는다.
// HTML 태그(<u> 등)도 뺀다 — 화면에 그려진 줄의 글자에는 태그가 없다.
const bare = (text) => (text ?? "").replace(/…$/, "").replace(/<[^>]*>/g, "").replace(/[\s|*#>`_~\-–—:]+/g, "");

const PROBE = 20; // 한 번에 찾아볼 글자 수
/**
 * 인용 조각에서 찾아볼 조각들. 서버의 인용 조각(text)은 검색용이라 앞에 제목 경로가 붙어 있다
 * ("3 장 > 3.1 ...\n본문") — 그 부분을 떼고 앞·가운데·끝에서 하나씩 뽑는다. 조각 하나가 표 경계에
 * 걸려 안 맞아도 다른 것이 맞는다.
 */
function probes(source) {
  const heading = bare(source.heading);
  return [source.text, source.content].flatMap((raw) => {
    let text = bare(raw);
    if (heading && text.startsWith(heading)) text = text.slice(heading.length);
    if (text.length <= PROBE) return text ? [text] : [];
    const mid = Math.floor((text.length - PROBE) / 2);
    return [text.slice(0, PROBE), text.slice(mid, mid + PROBE), text.slice(-PROBE)];
  });
}

/**
 * 문서 단락들 중 인용된 단락의 위치. 인용 조각이 가장 많이 들어 있는 단락, 없으면 제목 경로가 같은 단락.
 * @returns {number} 못 찾으면 -1
 */
function findCited(sections, source) {
  const keys = probes(source);
  let best = -1;
  let bestHits = 0;
  sections.forEach((section, i) => {
    const body = bare(section.content);
    const hits = keys.filter((key) => body.includes(key)).length;
    if (hits > bestHits) [best, bestHits] = [i, hits];
  });
  if (best >= 0) return best;
  const heading = bare(source.heading);
  return heading ? sections.findIndex((s) => bare(s.breadcrumb || s.heading) === heading) : -1;
}

/**
 * 강조할 원문. 검색에 걸린 조각들(quotes)이 가장 정확하고, 옛 기록(quotes 없음)은 툴팁용 조각(text,
 * 300자로 잘림)으로 대신한다. 비교용 글자열(bare)로 돌려준다.
 */
function citedTexts(source) {
  const heading = bare(source.heading);
  const raw = source.quotes?.length ? source.quotes : [source.text];
  return raw
    .map((text) => {
      const b = bare(text);
      return heading && b.startsWith(heading) ? b.slice(heading.length) : b;
    })
    .filter(Boolean);
}

const MIN_BLOCK = 6; // 이보다 짧은 줄(표 머리 "구분|내용" 등)은 우연히 겹치기 쉬워 강조하지 않는다
const STEP = 15; // 블록이 조각 경계에 걸쳐 있을 때를 위해 조각을 이 간격으로 잘라 본다

/** 블록(문단·목록·표의 행) 글자가 인용 조각과 겹치는지 */
function overlaps(block, quotes) {
  if (block.length < MIN_BLOCK) return false;
  return quotes.some((quote) => {
    if (quote.includes(block) || block.includes(quote)) return true;
    for (let i = 0; i + PROBE <= quote.length; i += STEP) {
      if (block.includes(quote.slice(i, i + PROBE))) return true;
    }
    return false;
  });
}

/** 마크다운 트리(hast) 노드의 글자 */
const nodeText = (node) =>
  node?.type === "text" ? node.value : (node?.children ?? []).map(nodeText).join("");

const CITE_BLOCKS = ["p", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"];

/** 인용 조각과 겹치는 블록에 doc-viewer-cite 를 붙이는 렌더러들 */
function citeComponents(quotes) {
  return Object.fromEntries(
    CITE_BLOCKS.map((Tag) => [
      Tag,
      // eslint-disable-next-line no-unused-vars
      ({ node, className, ...props }) => {
        const hit = overlaps(bare(nodeText(node)), quotes);
        return <Tag className={[className, hit && "doc-viewer-cite"].filter(Boolean).join(" ") || undefined} {...props} />;
      },
    ]),
  );
}

const isTableLine = (line) => line.trimStart().startsWith("|");
const isDelimiter = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
// 칸 수. 이스케이프된 \| 는 칸 경계가 아니다.
const cellCount = (line) => line.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "").split(/(?<!\\)\|/).length;

/**
 * 문서 본문을 마크다운으로 그리기 전에 표를 바로잡는다.
 *
 * 문서 본문은 블록(문단·표)을 줄바꿈 하나로 이어 붙인 것이라(색인과 같은 내용) 마크다운으로 읽으면 두 가지가 깨진다.
 *  - 표 바로 뒤의 문장·표가 앞 표의 행으로 빨려 들어간다 → 표 앞뒤에 빈 줄을 넣는다
 *  - 머리 행과 구분 행(|---|)의 칸 수가 다르면 표로 인식되지 않고, 줄바꿈이 공백으로 바뀐 한 문단이 된다
 *    → 구분 행을 머리 행 칸 수에 맞춰 다시 쓴다. 구분 행이 없으면 첫 행 뒤에 넣는다
 * 색인 내용은 그대로 두고 화면에서만 고친다.
 */
export function normalizeTables(markdown) {
  const out = [];
  let table = [];
  const flush = () => {
    if (!table.length) return;
    const [head, second, ...rest] = table;
    const delimiter = `|${" --- |".repeat(cellCount(head))}`;
    // 머리 행이 여럿인 표는 구분 행이 중간에도 있다(파서가 머리 행마다 넣는다). 하나만 남긴다.
    const body = (second === undefined ? [] : [second, ...rest]).filter((line) => !isDelimiter(line));
    if (out.length && out[out.length - 1] !== "") out.push("");
    out.push(head, delimiter, ...body, "");
    table = [];
  };
  for (const line of (markdown ?? "").split("\n")) {
    if (isTableLine(line)) table.push(line);
    else {
      flush();
      out.push(line);
    }
  }
  flush();
  return out.join("\n");
}

/**
 * 단락 본문. 표가 마크다운이라 마크다운으로 그린다. 문서가 길어 다시 그리지 않게 memo.
 * quotes 를 주면(인용된 단락) 그 조각과 겹치는 문단·표의 행만 강조한다.
 */
const SectionBody = memo(function SectionBody({ content, quotes }) {
  const components = useMemo(() => (quotes?.length ? citeComponents(quotes) : undefined), [quotes]);
  return (
    <div className="markdown-body doc-viewer-content">
      <Markdown components={components}>{normalizeTables(content)}</Markdown>
    </div>
  );
});

/**
 * 원본을 못 열 때(또는 불러오는 동안) 보여줄 인용 부분. 줄바꿈이 살아 있는 검색 조각(quotes)이 있으면
 * 그것을, 옛 기록이면 서버가 준 단락 요약(content/text)을 문서 본문과 같은 마크다운으로 그린다.
 */
function CitedText({ source }) {
  const text = source.quotes?.length ? source.quotes.join("\n\n") : source.content || source.text;
  return (
    <div className="source-viewer-body markdown-body doc-viewer-content">
      {text ? <Markdown>{normalizeTables(text)}</Markdown> : "표시할 본문이 없습니다."}
    </div>
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
  const quotes = useMemo(() => citedTexts(source), [source]);
  // 인용된 단락 안에서 강조된 줄이 하나도 없으면 단락 전체를 강조한다(조각이 표 경계 등에서 안 맞을 때)
  const [blockHit, setBlockHit] = useState(true);

  useEffect(() => {
    const section = citedRef.current;
    if (!section) return;
    const first = section.querySelector(".doc-viewer-cite");
    setBlockHit(!!first);
    (first ?? section).scrollIntoView({ block: "center" });
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
      <CitedText source={source} />
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
          <>
            <p className="doc-viewer-loading">
              <Loader2 size={16} className="animate-spin" /> 문서 전체를 불러오는 중 — 인용 단락을 먼저 보여드립니다
            </p>
            {source.heading && <p className="source-viewer-heading">{source.heading}</p>}
            <CitedText source={source} />
          </>
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
                  className={`doc-viewer-section${i === cited ? (blockHit ? " is-cited" : " is-cited is-cited-all") : ""}`}
                >
                  {(section.breadcrumb || section.heading) && (
                    <h4 className="doc-viewer-heading">{section.breadcrumb || section.heading}</h4>
                  )}
                  <SectionBody content={section.content} quotes={i === cited ? quotes : undefined} />
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
