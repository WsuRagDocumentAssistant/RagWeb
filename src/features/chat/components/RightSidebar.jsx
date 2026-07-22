import React from "react";
import { FileText, PanelRightClose, PanelRightOpen } from "lucide-react";
import "../styles/RightSidebar.css";

export default function RightSidebar({ message, collapsed, onToggleCollapsed }) {
  return (
    <aside className={["right-sidebar", collapsed && "collapsed"].filter(Boolean).join(" ")}>
      <div className="right-sidebar-header">
        {!collapsed && <span>출처</span>}
        <button
          className="right-sidebar-toggle"
          onClick={onToggleCollapsed}
          title={collapsed ? "펼치기" : "접기"}
        >
          {collapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
        </button>
      </div>

      {!collapsed && (
        !message ? (
          <p className="right-sidebar-empty">답변을 클릭하면 참고한 출처가 여기에 표시됩니다.</p>
        ) : !message.sources || message.sources.length === 0 ? (
          <p className="right-sidebar-empty">이 답변에는 참고한 출처가 없습니다.</p>
        ) : (
          <div className="right-sidebar-list">
            {message.sources.map((source) => (
              <div key={source.id} className="right-sidebar-item">
                <FileText size={16} className="right-sidebar-item-icon" />
                <span className="right-sidebar-item-name">{source.name}</span>
              </div>
            ))}
          </div>
        )
      )}
    </aside>
  );
}
