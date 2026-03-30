"use client";

import { useState, type ReactNode } from "react";

const tabList = [
  { id: "recommend", label: "추천" },
  { id: "analysis", label: "분석" },
  { id: "charts", label: "차트" },
  { id: "lookup", label: "조회" },
] as const;

type TabId = (typeof tabList)[number]["id"];

interface MainContentProps {
  recommendTab: ReactNode;
  analysisTab: ReactNode;
  chartsTab: ReactNode;
  lookupTab: ReactNode;
  footer: ReactNode;
}

export default function MainContent({
  recommendTab,
  analysisTab,
  chartsTab,
  lookupTab,
  footer,
}: MainContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>("recommend");

  let content: ReactNode;
  if (activeTab === "recommend") content = recommendTab;
  else if (activeTab === "analysis") content = analysisTab;
  else if (activeTab === "charts") content = chartsTab;
  else content = lookupTab;

  return (
    <>
      <nav className="flex bg-[var(--color-card)] rounded-xl p-1 shadow-sm border border-[var(--color-card-border)] mb-4">
        {tabList.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-blue-500 text-white shadow-md"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="space-y-4 animate-fade-in" key={activeTab}>
        {content}
      </div>
      <div className="pt-4">{footer}</div>
    </>
  );
}
