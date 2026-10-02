import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { CATEGORY_KINDS } from "@/features/files/categories";

const emptyDraft = () => ({ parent: "", value: "", pair: "" });

/**
 * 카테고리 하나(업무구분 / 수행업무 / 수행부서 / 보고서명): 제목 + "+ 추가" + 스크롤 표.
 * "+ 추가"를 누르면 그 자리(제목 줄 오른쪽)에 추가될 카테고리 정보 입력칸과 "취소"가 열린다. Enter 로 저장.
 */
function CategoryTable({ kind, label, parentLabel, pairLabel, rows, workCategories }) {
  const addDocumentCategory = useAppState((s) => s.addDocumentCategory);
  const removeDocumentCategory = useAppState((s) => s.removeDocumentCategory);
  const [draft, setDraft] = useState(null); // null = 추가 줄 닫힘
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!draft.value.trim() || (parentLabel && !draft.parent)) return;
    setSaving(true);
    const ok = await addDocumentCategory({ kind, ...draft });
    setSaving(false);
    if (ok) setDraft(emptyDraft()); // 이어서 추가할 수 있게 줄은 열어 둔다
  };

  const remove = (row) => {
    const warning =
      kind === "work_category"
        ? `"${row.value}"을(를) 지우면 그 아래 수행업무·수행부서도 함께 지워집니다. 지울까요?`
        : `"${row.value}"을(를) 지울까요?`;
    if (window.confirm(warning)) removeDocumentCategory(row.id);
  };

  const gridClass = `admin-cat-grid ${parentLabel ? (pairLabel ? "cols-3" : "cols-2") : "cols-1"}`;

  return (
    <div className="admin-cat">
      <div className="admin-cat-head">
        <span className="admin-cat-title">
          {label} <span className="admin-cat-count">{rows.length}</span>
        </span>
        {draft ? (
          <form
            className="admin-cat-add"
            onSubmit={save}
            onKeyDown={(e) => e.key === "Escape" && setDraft(null)}
          >
            {parentLabel && (
              <select
                className="admin-pill-input"
                value={draft.parent}
                onChange={(e) => setDraft({ ...draft, parent: e.target.value })}
                required
              >
                <option value="">{parentLabel} 선택</option>
                {workCategories.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            )}
            <input
              autoFocus
              className="admin-pill-input"
              value={draft.value}
              onChange={(e) => setDraft({ ...draft, value: e.target.value })}
              placeholder={`추가될 ${label}`}
              disabled={saving}
              required
            />
            {pairLabel && (
              <input
                className="admin-pill-input"
                value={draft.pair}
                onChange={(e) => setDraft({ ...draft, pair: e.target.value })}
                placeholder="짝 수행부서 (선택)"
                disabled={saving}
              />
            )}
            {/* Enter 로 저장한다. 버튼은 화면에 안 보이지만 폼 제출을 위해 둔다. */}
            <button type="submit" hidden aria-hidden="true" />
            <button type="button" className="admin-pill-btn" onClick={() => setDraft(null)}>
              취소
            </button>
          </form>
        ) : (
          <button type="button" className="admin-pill-btn" onClick={() => setDraft(emptyDraft())}>
            <Plus size={12} /> 추가
          </button>
        )}
      </div>

      <div className="admin-users-table admin-scroll-table admin-cat-table">
        <div className={`admin-users-table-head ${gridClass}`}>
          {parentLabel && <span>{parentLabel}</span>}
          <span>{label}</span>
          {pairLabel && <span>{pairLabel}</span>}
          <span />
        </div>

        {rows.map((row) => (
          <div key={row.id} className={`admin-users-row ${gridClass}`}>
            {parentLabel && <span className="admin-cat-cell" title={row.parent}>{row.parent}</span>}
            <span className="admin-users-name" title={row.value}>{row.value}</span>
            {pairLabel && (
              <span className={`admin-cat-cell ${row.pair ? "" : "muted"}`} title={row.pair ?? ""}>{row.pair || "-"}</span>
            )}
            <button type="button" className="admin-icon-btn" onClick={() => remove(row)} title="삭제" aria-label={`${row.value} 삭제`}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {rows.length === 0 && <div className="admin-users-empty">등록된 {label}이(가) 없습니다.</div>}
      </div>
    </div>
  );
}

/** 문서 카테고리 관리: 문서 등록(비정형) 화면의 입력 선택지 */
export default function CategorySection() {
  const categories = useAppState((s) => s.documentCategories);
  const categoryError = useAppState((s) => s.categoryError);
  const fetchDocumentCategories = useAppState((s) => s.fetchDocumentCategories);

  useEffect(() => {
    fetchDocumentCategories();
  }, [fetchDocumentCategories]);

  const byKind = useMemo(() => {
    const rows = categories ?? [];
    return Object.fromEntries(CATEGORY_KINDS.map(({ kind }) => [kind, rows.filter((r) => r.kind === kind)]));
  }, [categories]);
  const workCategories = byKind.work_category.map((r) => r.value);

  return (
    <>
      <p className="admin-copy-status">
        문서 등록(비정형) 화면의 입력 선택지입니다. 수행업무의 짝 수행부서는 수행업무를 고르면 자동으로 채워집니다.
      </p>
      {categoryError && <p className="admin-search-error">{categoryError}</p>}
      {CATEGORY_KINDS.map((k) => (
        <CategoryTable key={k.kind} {...k} rows={byKind[k.kind]} workCategories={workCategories} />
      ))}
    </>
  );
}
