import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/DictionaryPanel.css";

export default function DictionaryPanel() {
  const entries = useAppState((s) => s.dictEntries);
  const dictPanelOpen = useAppState((s) => s.dictPanelOpen);
  const closeDictPanel = useAppState((s) => s.closeDictPanel);
  const fetchDictEntries = useAppState((s) => s.fetchDictEntries);

  const panelRef = useRef(null);
  const [query, setQuery] = useState("");

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

  if (!dictPanelOpen) return null;

  const filtered = entries.filter((e) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return e.term.toLowerCase().includes(q) || e.meaning.toLowerCase().includes(q);
  });

  return (
    <div className="dictionary-panel" ref={panelRef}>
      <h3 className="dictionary-panel-title">동음이의어 사전</h3>

      <div className="dp-toolbar">
        <div className="dp-search">
          <Search size={13} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="검색..." />
        </div>
      </div>

      <div className="dictionary-panel-list">
        {filtered.length === 0 ? (
          <p className="dictionary-panel-empty">등록된 단어가 없습니다.</p>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className="dp-row">
              <div className="dp-row-content">
                <span className="dp-row-term">{entry.term}</span>
                <span className="dp-row-meaning">{entry.meaning}</span>
                {entry.note && <span className="dp-row-note">{entry.note}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
