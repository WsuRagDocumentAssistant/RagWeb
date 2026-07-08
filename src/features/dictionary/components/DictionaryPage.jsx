import React, { useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/DictionaryPage.css";

const EMPTY_FORM = { term: "", meaning: "", note: "" };

export default function DictionaryPage() {
  const entries = useAppState((s) => s.dictEntries);
  const dictLoading = useAppState((s) => s.dictLoading);
  const fetchDictEntries = useAppState((s) => s.fetchDictEntries);
  const createDictEntry = useAppState((s) => s.createDictEntry);
  const updateDictEntry = useAppState((s) => s.updateDictEntry);
  const deleteDictEntry = useAppState((s) => s.deleteDictEntry);

  const [query, setQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchDictEntries(); }, []);

  const filtered = entries.filter((e) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return e.term.toLowerCase().includes(q) || e.meaning.toLowerCase().includes(q);
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.term.trim() || !addForm.meaning.trim()) return;
    await createDictEntry(addForm.term.trim(), addForm.meaning.trim(), addForm.note.trim() || undefined);
    setAddForm(EMPTY_FORM);
    setIsAdding(false);
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditForm({ term: entry.term, meaning: entry.meaning, note: entry.note ?? "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  const submitEdit = async (id) => {
    if (!editForm.term.trim() || !editForm.meaning.trim()) return;
    await updateDictEntry(id, editForm.term.trim(), editForm.meaning.trim(), editForm.note.trim() || undefined);
    cancelEdit();
  };

  return (
    <div className="dictionary-page">
      <div className="dict-toolbar">
        <div className="dict-search">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="용어 또는 뜻 검색..."
          />
        </div>
        <button className="dict-add-btn" onClick={() => setIsAdding((v) => !v)}>
          <Plus size={14} />
          단어 추가
        </button>
      </div>

      {isAdding && (
        <form className="dict-add-form" onSubmit={handleAddSubmit}>
          <input
            className="dict-form-input"
            placeholder="용어"
            value={addForm.term}
            onChange={(e) => setAddForm((f) => ({ ...f, term: e.target.value }))}
            autoFocus
          />
          <input
            className="dict-form-input"
            placeholder="뜻"
            value={addForm.meaning}
            onChange={(e) => setAddForm((f) => ({ ...f, meaning: e.target.value }))}
          />
          <input
            className="dict-form-input dict-form-note"
            placeholder="비고 (선택)"
            value={addForm.note}
            onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))}
          />
          <div className="dict-form-actions">
            <button type="submit" className="dict-form-submit">등록</button>
            <button type="button" className="dict-form-cancel" onClick={() => { setIsAdding(false); setAddForm(EMPTY_FORM); }}>취소</button>
          </div>
        </form>
      )}

      <div className="dict-list">
        {dictLoading && entries.length === 0 ? (
          <p className="dict-empty">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="dict-empty">등록된 단어가 없습니다.</p>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className="dict-row">
              {editingId === entry.id ? (
                <>
                  <div className="dict-row-edit-fields">
                    <input
                      className="dict-form-input"
                      value={editForm.term}
                      onChange={(e) => setEditForm((f) => ({ ...f, term: e.target.value }))}
                    />
                    <input
                      className="dict-form-input"
                      value={editForm.meaning}
                      onChange={(e) => setEditForm((f) => ({ ...f, meaning: e.target.value }))}
                    />
                    <input
                      className="dict-form-input dict-form-note"
                      placeholder="비고"
                      value={editForm.note}
                      onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                    />
                  </div>
                  <div className="dict-row-actions">
                    <button className="dict-row-btn dict-row-confirm" onClick={() => submitEdit(entry.id)} title="저장">
                      <Check size={14} />
                    </button>
                    <button className="dict-row-btn" onClick={cancelEdit} title="취소">
                      <X size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="dict-row-content">
                    <span className="dict-row-term">{entry.term}</span>
                    <span className="dict-row-meaning">{entry.meaning}</span>
                    {entry.note && <span className="dict-row-note">{entry.note}</span>}
                  </div>
                  <div className="dict-row-actions">
                    <button className="dict-row-btn" onClick={() => startEdit(entry)} title="수정">
                      <Pencil size={14} />
                    </button>
                    <button className="dict-row-btn dict-row-delete" onClick={() => deleteDictEntry(entry.id)} title="삭제">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
