interface LottoBallProps {
  number: number;
  size?: "sm" | "md" | "lg";
}

function getBallColor(n: number): string {
  if (n <= 10) return "bg-yellow-400 text-yellow-900";
  if (n <= 20) return "bg-blue-500 text-white";
  if (n <= 30) return "bg-red-500 text-white";
  if (n <= 40) return "bg-gray-500 text-white";
  return "bg-green-500 text-white";
}

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-12 h-12 text-lg",
  lg: "w-16 h-16 text-2xl",
};

export default function LottoBall({ number, size = "md" }: LottoBallProps) {
  return (
    <div
      className={`${getBallColor(number)} ${sizeClasses[size]} rounded-full flex items-center justify-center font-bold shadow-md`}
    >
      {number}
    </div>
  );
}
