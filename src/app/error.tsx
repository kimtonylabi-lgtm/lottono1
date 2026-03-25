"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">!</div>
        <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-2">
          오류가 발생했습니다
        </h2>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          {error.message || "알 수 없는 오류가 발생했습니다."}
        </p>
        <button
          onClick={reset}
          className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 active:scale-95 transition"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
