import React from "react";
import { X } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/SettingsModal.css";

export default function SettingsModal() {
  const settingsOpen = useAppState((s) => s.settingsOpen);
  const closeSettings = useAppState((s) => s.closeSettings);
  const user = useAppState((s) => s.user);
  const logout = useAppState((s) => s.logout);
  const theme = useAppState((s) => s.theme);
  const setTheme = useAppState((s) => s.setTheme);

  if (!settingsOpen) return null;

  const displayName = user?.name || user?.email || "사용자";
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    closeSettings();
    logout();
  };

  return (
    <div className="settings-backdrop" onClick={closeSettings}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <div>
            <h2>설정</h2>
            <p>내 계정 정보와 화면 모드를 관리합니다.</p>
          </div>
          <button className="settings-close-btn" onClick={closeSettings} title="닫기">
            <X size={16} />
          </button>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <h3>계정 정보</h3>
          <div className="settings-account-row">
            <div className="settings-account-info">
              <span className="settings-avatar">{initial}</span>
              <div className="settings-account-text">
                <span className="settings-account-name">{displayName}</span>
                <span className="settings-account-role">{user?.role === "admin" ? "관리자" : "일반 사용자"}</span>
              </div>
            </div>
            <div className="settings-account-actions">
              <button className="settings-outline-btn">프로필 변경</button>
              <button className="settings-outline-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <h3>화면 설정</h3>
          <div className="settings-theme-row">
            <div>
              <span className="settings-theme-label">화면 모드</span>
              <p className="settings-theme-desc">
                지금은 {theme === "dark" ? "어두운" : "밝은"} 화면으로 보고 있어요.
              </p>
            </div>
            <div className="settings-theme-toggle">
              <button
                className={theme === "light" ? "active" : ""}
                onClick={() => setTheme("light")}
              >
                밝게
              </button>
              <button
                className={theme === "dark" ? "active" : ""}
                onClick={() => setTheme("dark")}
              >
                어둡게
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
