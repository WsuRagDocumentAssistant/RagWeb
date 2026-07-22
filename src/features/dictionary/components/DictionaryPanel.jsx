import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/DictionaryPanel.css";

const DEFAULT_POSITION = { x: 260, y: 90 };

export default function DictionaryPanel() {
  const entries = useAppState((s) => s.dictEntries);
  const dictPanelOpen = useAppState((s) => s.dictPanelOpen);
  const closeDictPanel = useAppState((s) => s.closeDictPanel);
  const fetchDictEntries = useAppState((s) => s.fetchDictEntries);

  const [query, setQuery] = useState("");
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const dragState = useRef(null);

  useEffect(() => {
    if (dictPanelOpen) fetchDictEntries();
  }, [dictPanelOpen]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragState.current) return;
      const { startX, startY, originX, originY } = dragState.current;
      setPosition({ x: originX + (e.clientX - startX), y: originY + (e.clientY - startY) });
    };
    const handleMouseUp = () => { dragState.current = null; };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleDragStart = (e) => {
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };
  };

  if (!dictPanelOpen) return null;

  const filtered = entries.filter((e) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return e.term.toLowerCase().includes(q) || e.meaning.toLowerCase().includes(q);
  });

  return (
    <div className="dictionary-panel" style={{ left: position.x, top: position.y }}>
      <div className="dictionary-panel-title" onMouseDown={handleDragStart}>
        <span>동음이의어 사전</span>
        <button className="dictionary-panel-close" onClick={closeDictPanel} title="닫기">
          <X size={14} />
        </button>
      </div>

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
