"use client";

import { useState } from "react";
import DrawHistory from "./draw-history";
import NumberChecker from "./number-checker";

const subTabs = [
  { id: "history", label: "이력 조회" },
  { id: "checker", label: "번호 확인" },
] as const;

type SubTabId = (typeof subTabs)[number]["id"];

export default function LookupTab() {
  const [activeTab, setActiveTab] = useState<SubTabId>("history");

  return (
    <div className="space-y-4">
      <div className="flex bg-[var(--color-surface)] rounded-lg p-0.5">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === tab.id
                ? "bg-blue-500 text-white shadow-sm"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in" key={activeTab}>
        {activeTab === "history" ? <DrawHistory /> : <NumberChecker />}
      </div>
    </div>
  );
}
