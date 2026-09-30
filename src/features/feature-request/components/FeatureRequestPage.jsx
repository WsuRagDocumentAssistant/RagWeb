import React, { useEffect, useMemo, useState } from "react";
import { Lock, MessageSquareReply, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/core/AppState";
import * as featureRequestService from "../services/FeatureRequestService";
import "../styles/FeatureRequestPage.css";

const STATUS_LABEL = {
  received: "접수",
  in_progress: "검토 중",
  done: "반영 완료",
  rejected: "반려",
};
const STATUS_OPTIONS = Object.keys(STATUS_LABEL);

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const useEscapeToClose = (onClose) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
};

function StatusPill({ status }) {
  return <span className={`fr-status fr-status-${status}`}>{STATUS_LABEL[status] ?? status}</span>;
}

function EditorModal({ initial, saving, onClose, onSubmit }) {
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [isSecret, setIsSecret] = useState(initial.isSecret);
  useEscapeToClose(onClose);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !saving;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ id: initial.id, title: title.trim(), content: content.trim(), isSecret });
  };

  return (
    <div className="fr-backdrop" onClick={onClose}>
      <form className="fr-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="fr-modal-header">
          <h2>{initial.id ? "요청 수정" : "기능 개선 요청 작성"}</h2>
          <button type="button" className="fr-close-btn" onClick={onClose} title="닫기">
            <X size={16} />
          </button>
        </div>

        <div className="fr-modal-body">
          <label className="fr-field">
            <span>제목</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="어떤 기능이 필요하거나 개선되면 좋을까요?"
              maxLength={100}
              autoFocus
            />
          </label>
          <label className="fr-field">
            <span>내용</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="불편했던 점, 원하는 동작, 사용 상황 등을 자세히 적어주세요."
              rows={8}
            />
          </label>
          <label className="fr-secret-toggle">
            <input type="checkbox" checked={isSecret} onChange={(e) => setIsSecret(e.target.checked)} />
            <Lock size={13} />
            비밀글
            <span className="fr-secret-hint">작성자 본인과 관리자만 볼 수 있습니다</span>
          </label>
        </div>

        <div className="fr-modal-footer">
          <button type="button" className="fr-btn-secondary" onClick={onClose}>취소</button>
          <button type="submit" className="fr-btn-primary" disabled={!canSubmit}>
            {saving ? "저장 중..." : initial.id ? "저장" : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DetailModal({ request, isAdmin, isMine, onClose, onEdit, onDelete, onReply }) {
  const [status, setStatus] = useState(request.status);
  const [answer, setAnswer] = useState(request.answer ?? "");
  const [replying, setReplying] = useState(false);
  useEscapeToClose(onClose);

  const handleReply = async () => {
    setReplying(true);
    const ok = await onReply({ id: request.id, status, answer: answer.trim() });
    setReplying(false);
    if (ok) onClose();
  };

  return (
    <div className="fr-backdrop" onClick={onClose}>
      <div className="fr-modal fr-modal-detail" onClick={(e) => e.stopPropagation()}>
        <div className="fr-modal-header">
          <div className="fr-detail-title">
            <div className="fr-detail-badges">
              <StatusPill status={request.status} />
              {request.isSecret && (
                <span className="fr-secret-badge">
                  <Lock size={11} /> 비밀글
                </span>
              )}
            </div>
            <h2>{request.title}</h2>
            <p className="fr-detail-meta">
              {request.authorName} · {formatDate(request.createdAt)}
            </p>
          </div>
          <button type="button" className="fr-close-btn" onClick={onClose} title="닫기">
            <X size={16} />
          </button>
        </div>

        <div className="fr-modal-body">
          <p className="fr-detail-content">{request.content}</p>

          {request.answer && !isAdmin && (
            <div className="fr-answer">
              <div className="fr-answer-head">
                <MessageSquareReply size={14} />
                관리자 답변
                <span className="fr-answer-date">{formatDate(request.answeredAt)}</span>
              </div>
              <p>{request.answer}</p>
            </div>
          )}

          {isAdmin && (
            <div className="fr-reply-form">
              <div className="fr-answer-head">
                <MessageSquareReply size={14} />
                처리 상태 · 답변 (관리자)
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="요청자에게 보여줄 답변을 입력하세요."
                rows={4}
              />
              <div className="fr-reply-actions">
                <button type="button" className="fr-btn-primary" onClick={handleReply} disabled={replying}>
                  {replying ? "저장 중..." : "답변 저장"}
                </button>
              </div>
            </div>
          )}
        </div>

        {(isMine || isAdmin) && (
          <div className="fr-modal-footer">
            <button type="button" className="fr-btn-danger" onClick={() => onDelete(request.id)}>
              <Trash2 size={13} /> 삭제
            </button>
            {isMine && (
              <button type="button" className="fr-btn-secondary" onClick={() => onEdit(request)}>
                <Pencil size={13} /> 수정
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeatureRequestPage() {
  const user = useAppState((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editor, setEditor] = useState(null); // null이면 닫힘, { id?, title, content, isSecret }면 작성/수정 중
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState(null);

  // 비밀글은 작성자 본인과 관리자만 열람할 수 있다(서버도 그 외 사용자에게는 content를 비워서 내려준다).
  const canView = (r) => !r.isSecret || isAdmin || r.authorId === user?.id;

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await featureRequestService.listRequests();
      setRequests(data?.requests ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "요청 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      // 열람 권한이 없는 비밀글은 제목이 가려져 있으므로 검색어로는 걸리지 않게 한다.
      .filter((r) => !q || (canView(r) && r.title.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, query, statusFilter, isAdmin, user?.id]);

  const detail = requests.find((r) => r.id === detailId) ?? null;

  const handleOpenRow = (r) => {
    if (!canView(r)) {
      toast.info("비밀글은 작성자와 관리자만 볼 수 있습니다.");
      return;
    }
    setDetailId(r.id);
  };

  const handleSubmitEditor = async (draft) => {
    setSaving(true);
    try {
      const { request: saved } = await featureRequestService.saveRequest(draft);
      setRequests((prev) => (draft.id ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev]));
      toast.success(draft.id ? "요청을 수정했습니다." : "요청을 등록했습니다.");
      setEditor(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "요청을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (r) => {
    setDetailId(null);
    setEditor({ id: r.id, title: r.title, content: r.content ?? "", isSecret: r.isSecret });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 요청을 삭제할까요?")) return;
    const prev = requests;
    setRequests((list) => list.filter((r) => r.id !== id));
    setDetailId(null);
    try {
      await featureRequestService.deleteRequest(id);
      toast.success("요청을 삭제했습니다.");
    } catch (err) {
      setRequests(prev);
      toast.error(err instanceof Error ? err.message : "요청을 삭제하지 못했습니다.");
    }
  };

  const handleReply = async (reply) => {
    try {
      const { request: saved } = await featureRequestService.replyRequest(reply);
      setRequests((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      toast.success("답변을 저장했습니다.");
      return true;
    } catch (err) {
      // 실패하면 모달을 닫지 않아 입력한 답변이 그대로 남는다.
      toast.error(err instanceof Error ? err.message : "답변을 저장하지 못했습니다.");
      return false;
    }
  };

  return (
    <div className="feature-request-page">
      <div className="fr-page-header">
        <div>
          <h1>기능 개선 요청</h1>
          <p>필요한 기능이나 불편한 점을 남겨주세요. 비밀글은 작성자 본인과 관리자만 볼 수 있습니다.</p>
        </div>
        <button
          className="fr-btn-primary fr-write-btn"
          onClick={() => setEditor({ title: "", content: "", isSecret: false })}
        >
          <Plus size={15} /> 요청 작성
        </button>
      </div>

      <div className="fr-toolbar">
        <div className="fr-search">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="제목 검색" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">전체 상태</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <button className="fr-refresh-btn" onClick={fetchRequests} title="새로고침" disabled={loading}>
          <RefreshCw size={14} className={loading ? "fr-spin" : ""} />
        </button>
      </div>

      <div className="fr-table">
        <div className="fr-table-head">
          <span>상태</span>
          <span>제목</span>
          <span>작성자</span>
          <span>작성일</span>
        </div>
        <div className="fr-table-body">
          {filtered.length === 0 ? (
            <p className="fr-empty">{loading ? "불러오는 중..." : "등록된 요청이 없습니다."}</p>
          ) : (
            filtered.map((r) => {
              const viewable = canView(r);
              return (
                <button
                  key={r.id}
                  type="button"
                  className={["fr-table-row", !viewable && "locked"].filter(Boolean).join(" ")}
                  onClick={() => handleOpenRow(r)}
                >
                  <span><StatusPill status={r.status} /></span>
                  <span className="fr-row-title">
                    {r.isSecret && <Lock size={12} className="fr-row-lock" />}
                    <span className="fr-row-title-text">{viewable ? r.title : "비밀글입니다."}</span>
                    {r.answer && viewable && <span className="fr-row-answered">답변</span>}
                  </span>
                  <span className="fr-row-author">
                    {r.authorName}
                    {r.authorId === user?.id && <span className="fr-row-mine">내 글</span>}
                  </span>
                  <span className="fr-row-date">{formatDate(r.createdAt)}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {editor && (
        <EditorModal initial={editor} saving={saving} onClose={() => setEditor(null)} onSubmit={handleSubmitEditor} />
      )}

      {detail && (
        <DetailModal
          key={detail.id}
          request={detail}
          isAdmin={isAdmin}
          isMine={detail.authorId === user?.id}
          onClose={() => setDetailId(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReply={handleReply}
        />
      )}
    </div>
  );
}
