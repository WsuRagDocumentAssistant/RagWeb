import React, { useEffect, useRef, useState } from "react";
import { BookOpen, Search, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/DictionaryPanel.css";

const EMPTY_FORM = { term: "", meaning: "", note: "" };

export default function DictionaryPanel() {
  const entries = useAppState((s) => s.dictEntries);
  const dictPanelOpen = useAppState((s) => s.dictPanelOpen);
  const toggleDictPanel = useAppState((s) => s.toggleDictPanel);
  const closeDictPanel = useAppState((s) => s.closeDictPanel);
  const fetchDictEntries = useAppState((s) => s.fetchDictEntries);
  const createDictEntry = useAppState((s) => s.createDictEntry);
  const updateDictEntry = useAppState((s) => s.updateDictEntry);
  const deleteDictEntry = useAppState((s) => s.deleteDictEntry);

  const panelRef = useRef(null);
  const [query, setQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (dictPanelOpen) fetchDictEntries();
  }, [dictPanelOpen]);

  useEffect(() => {
    if (!dictPanelOpen) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) closeDictPanel();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dictPanelOpen]);

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
    <div className="dictionary-panel-wrapper" ref={panelRef}>
      <button className="titlebar-menu-btn" onClick={toggleDictPanel} title="동음이의어 사전">
        <BookOpen size={18} />
      </button>

      {dictPanelOpen && (
        <div className="dictionary-panel">
          <h3 className="dictionary-panel-title">동음이의어 사전</h3>

          <div className="dp-toolbar">
            <div className="dp-search">
              <Search size={13} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="검색..." />
            </div>
            <button className="dp-add-btn" onClick={() => setIsAdding((v) => !v)} title="단어 추가">
              <Plus size={14} />
            </button>
          </div>

          {isAdding && (
            <form className="dp-add-form" onSubmit={handleAddSubmit}>
              <input
                className="dp-form-input"
                placeholder="용어"
                value={addForm.term}
                onChange={(e) => setAddForm((f) => ({ ...f, term: e.target.value }))}
                autoFocus
              />
              <input
                className="dp-form-input"
                placeholder="뜻"
                value={addForm.meaning}
                onChange={(e) => setAddForm((f) => ({ ...f, meaning: e.target.value }))}
              />
              <input
                className="dp-form-input"
                placeholder="비고 (선택)"
                value={addForm.note}
                onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))}
              />
              <div className="dp-form-actions">
                <button type="submit" className="dp-form-submit">등록</button>
                <button type="button" className="dp-form-cancel" onClick={() => { setIsAdding(false); setAddForm(EMPTY_FORM); }}>취소</button>
              </div>
            </form>
          )}

          <div className="dictionary-panel-list">
            {filtered.length === 0 ? (
              <p className="dictionary-panel-empty">등록된 단어가 없습니다.</p>
            ) : (
              filtered.map((entry) => (
                <div key={entry.id} className="dp-row">
                  {editingId === entry.id ? (
                    <>
                      <div className="dp-row-edit-fields">
                        <input
                          className="dp-form-input"
                          value={editForm.term}
                          onChange={(e) => setEditForm((f) => ({ ...f, term: e.target.value }))}
                        />
                        <input
                          className="dp-form-input"
                          value={editForm.meaning}
                          onChange={(e) => setEditForm((f) => ({ ...f, meaning: e.target.value }))}
                        />
                      </div>
                      <div className="dp-row-actions">
                        <button className="dp-row-btn dp-row-confirm" onClick={() => submitEdit(entry.id)} title="저장">
                          <Check size={13} />
                        </button>
                        <button className="dp-row-btn" onClick={cancelEdit} title="취소">
                          <X size={13} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="dp-row-content">
                        <span className="dp-row-term">{entry.term}</span>
                        <span className="dp-row-meaning">{entry.meaning}</span>
                        {entry.note && <span className="dp-row-note">{entry.note}</span>}
                      </div>
                      <div className="dp-row-actions">
                        <button className="dp-row-btn" onClick={() => startEdit(entry)} title="수정">
                          <Pencil size={13} />
                        </button>
                        <button className="dp-row-btn dp-row-delete" onClick={() => deleteDictEntry(entry.id)} title="삭제">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
