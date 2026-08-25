import React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export default function SortableHeaderCell({ label, sortKey, currentKey, currentDir, onSort, className }) {
  const active = currentKey === sortKey;
  return (
    <button
      type="button"
      className={["sortable-th", active && "active", className].filter(Boolean).join(" ")}
      onClick={() => onSort(sortKey)}
    >
      <span>{label}</span>
      {active ? (
        currentDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      ) : (
        <ChevronsUpDown size={12} className="sortable-th-idle-icon" />
      )}
    </button>
  );
}
