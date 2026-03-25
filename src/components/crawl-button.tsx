"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CrawlButtonProps {
  lastRound: number;
}

export default function CrawlButton({ lastRound }: CrawlButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "crawling" | "done" | "error">("idle");
  const [result, setResult] = useState("");

  async function handleCrawl() {
    setStatus("crawling");

    try {
      const res = await fetch("/api/crawl", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Crawl failed");

      if (data.added === 0) {
        setStatus("done");
        setResult("이미 최신 데이터입니다.");
        return;
      }

      setStatus("done");
      setResult(`${data.added}개 회차 수집 완료!`);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setResult(`오류 발생: ${error}`);
    }
  }

  return (
    <div className="text-center">
      {status === "idle" && (
        <button
          onClick={handleCrawl}
          className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 active:scale-95 transition"
        >
          {lastRound > 0 ? "데이터 업데이트" : "데이터 수집 시작"}
        </button>
      )}

      {status === "crawling" && (
        <div>
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-[var(--color-muted)]">lottoen.com에서 데이터 수집 중...</p>
        </div>
      )}

      {status === "done" && (
        <p className="text-sm text-green-600 font-semibold">{result}</p>
      )}

      {status === "error" && (
        <div>
          <p className="text-sm text-red-600 mb-3">{result}</p>
          <button
            onClick={() => setStatus("idle")}
            className="text-sm text-blue-500 underline"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
