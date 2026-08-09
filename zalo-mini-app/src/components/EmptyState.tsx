import React from "react";

export default function EmptyState({ icon = "📭", text, children }: { icon?: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div className="icon">{icon}</div>
      <p>{text}</p>
      {children}
    </div>
  );
}
