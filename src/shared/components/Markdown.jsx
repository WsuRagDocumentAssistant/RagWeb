import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// 채팅 답변과 문서 뷰어가 같이 쓰는 마크다운 렌더러. 둘이 같은 모양으로 보이게 한곳에 둔다.
//
// 본문에 <u>/<mark>/<br> 같은 원본 HTML 태그가 섞여 오는 경우가 있어 렌더링해줘야 하지만,
// 외부 검색 결과·업로드 문서를 그대로 보여주는 것이라 XSS 방지를 위해 허용 태그만 화이트리스트로 통과시킨다.
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u", "mark"],
};

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeRaw, [rehypeSanitize, sanitizeSchema]];

/**
 * @param {{ children: string, components?: import("react-markdown").Components }} props
 *   components: 태그별 렌더러 (채팅의 각주 링크, 뷰어의 인용 줄 강조 등)
 */
export default function Markdown({ children, components }) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS} components={components}>
      {children}
    </ReactMarkdown>
  );
}
