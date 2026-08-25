import { useMemo, useState } from "react";

/**
 * 표 형태 목록에 "속성명을 누르면 오름차순/내림차순 정렬" 기능을 붙이는 훅.
 * 같은 헤더를 3번째 누르면 정렬 전(원래 순서)으로 복구된다. (1클릭=오름차순, 2클릭=내림차순, 3클릭=원상복구)
 * @param {any[]} rows
 * @param {string|null} [initialKey]
 * @param {"asc"|"desc"} [initialDir]
 */
export function useSortableRows(rows, initialKey = null, initialDir = "asc") {
  const [sortKey, setSortKey] = useState(initialKey);
  const [sortDir, setSortDir] = useState(initialDir);

  const toggleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") {
      setSortDir("desc");
      return;
    }
    setSortKey(null);
    setSortDir("asc");
  };

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), "ko");
    });
    if (sortDir === "desc") copy.reverse();
    return copy;
  }, [rows, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, toggleSort };
}
