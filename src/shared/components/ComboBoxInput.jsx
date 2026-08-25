import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import "../styles/ComboBoxInput.css";

/**
 * 목록에서 고르거나, 목록에 없는 값을 자유롭게 입력해 새 카테고리로 추가할 수 있는 입력창.
 * 네이티브 datalist는 브라우저가 팝업 색을 강제로 정해버려 앱 테마와 어긋나므로,
 * 앱 테마 토큰을 그대로 쓰는 커스텀 드롭다운으로 직접 그린다.
 */
export default function ComboBoxInput({ value, onChange, options = [], placeholder }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = useMemo(() => {
    const q = (value ?? "").trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, value]);

  const handleSelect = (opt) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <div className="combo-box-input" ref={wrapRef}>
      <input
        type="text"
        className="combo-box-input-field"
        value={value ?? ""}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <button
        type="button"
        className="combo-box-input-toggle"
        onClick={() => setOpen((v) => !v)}
        tabIndex={-1}
        aria-label="목록 열기"
      >
        <ChevronDown size={14} />
      </button>
      {open && filtered.length > 0 && (
        <ul className="combo-box-input-list">
          {filtered.map((opt) => (
            <li key={opt}>
              <button type="button" className="combo-box-input-option" onClick={() => handleSelect(opt)}>
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
