interface LottoBallProps {
  number: number;
  size?: "sm" | "md" | "lg";
  delay?: number;
}

interface BallTheme {
  gradient: string;
  text: string;
}

function getBallTheme(n: number): BallTheme {
  if (n <= 10)
    return {
      gradient: "radial-gradient(circle at 35% 30%, #fef08a, #facc15 50%, #ca8a04)",
      text: "text-yellow-900",
    };
  if (n <= 20)
    return {
      gradient: "radial-gradient(circle at 35% 30%, #93c5fd, #3b82f6 50%, #1d4ed8)",
      text: "text-white",
    };
  if (n <= 30)
    return {
      gradient: "radial-gradient(circle at 35% 30%, #fca5a5, #ef4444 50%, #b91c1c)",
      text: "text-white",
    };
  if (n <= 40)
    return {
      gradient: "radial-gradient(circle at 35% 30%, #d1d5db, #6b7280 50%, #374151)",
      text: "text-white",
    };
  return {
    gradient: "radial-gradient(circle at 35% 30%, #86efac, #22c55e 50%, #15803d)",
    text: "text-white",
  };
}

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-12 h-12 text-lg",
  lg: "w-16 h-16 text-2xl",
};

export default function LottoBall({ number, size = "md", delay = 0 }: LottoBallProps) {
  const theme = getBallTheme(number);

  return (
    <div
      className={`${theme.text} ${sizeClasses[size]} rounded-full flex items-center justify-center font-bold shadow-lg animate-scale-in`}
      style={{
        background: theme.gradient,
        boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.2)",
        animationDelay: `${delay}ms`,
      }}
    >
      {number}
    </div>
  );
}
