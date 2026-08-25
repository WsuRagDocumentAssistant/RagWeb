import React, { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/core/AppState";
import "../styles/DictionaryPage.css";

export default function DictionaryPage() {
  const entries = useAppState((s) => s.dictEntries);
  const dictLoading = useAppState((s) => s.dictLoading);
  const dictSaving = useAppState((s) => s.dictSaving);
  const fetchDictEntries = useAppState((s) => s.fetchDictEntries);
  const updateDictEntry = useAppState((s) => s.updateDictEntry);
  const saveDictEntries = useAppState((s) => s.saveDictEntries);

  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchDictEntries();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) => e.term.toLowerCase().includes(q) || e.synonyms.toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <div className="dict-page">
      <div className="dict-page-header">
        <h1>검색어 관리</h1>
        <p className="dict-page-desc">
          등록된 검색어는 자동으로 사용자 질문과 매칭되어 더 정확한 답을 찾는 데 쓰입니다. 이 화면에서는 등록된
          검색어를 확인하고 내용만 수정할 수 있습니다.
        </p>
      </div>

      <div className="dict-toolbar">
        <span className="dict-count">
          등록한 검색어 <strong>{entries.length}</strong>건
        </span>
        <div className="dict-toolbar-actions">
          <input
            className="dict-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="등록된 검색어 찾기"
          />
        </div>
      </div>

      <p className="dict-hint">
        <strong>기준 검색어</strong>는 대표로 쓰이는 단어이고, <strong>같이 인식할 단어</strong>는 같은 뜻으로 다르게
        부르는 다른 표현입니다. 여러 개일 경우 쉼표(,)로 구분해서 자유롭게 입력하세요. 내용을 바꾼 뒤에는
        <strong>수정</strong> 버튼을 눌러야 반영됩니다.
      </p>

      <div className="dict-table">
        <div className="dict-table-head">
          <span>기준 검색어</span>
          <span>같이 인식할 단어</span>
        </div>

        <div className="dict-table-body">
          {dictLoading ? (
            <p className="dict-empty">불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <p className="dict-empty">등록된 검색어가 없습니다.</p>
          ) : (
            filtered.map((entry) => (
              <div key={entry.id} className="dict-row">
                <textarea
                  className="dict-row-term"
                  value={entry.term}
                  onChange={(e) => updateDictEntry(entry.id, { term: e.target.value })}
                  rows={1}
                  placeholder="기준 검색어"
                />
                <textarea
                  className="dict-row-synonyms"
                  value={entry.synonyms}
                  onChange={(e) => updateDictEntry(entry.id, { synonyms: e.target.value })}
                  rows={1}
                  placeholder="같이 인식할 단어 (쉼표로 구분)"
                />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dict-save-row">
        <button className="dict-save-btn" onClick={saveDictEntries} disabled={dictSaving}>
          {dictSaving ? "수정 중..." : "수정"}
        </button>
      </div>
    </div>
  );
}
