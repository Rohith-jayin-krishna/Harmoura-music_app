import { useEffect, useRef, useState } from "react";

interface HarmouraPortraitProps {
  emotionStats: Record<string, number>;
}

const emotionColors: Record<string, string> = {
  Happiness: "#FFC857",
  Sadness: "#2A4D69",
  Calmness: "#88B04B",
  Excitement: "#FF8C42",
  Love: "#E63946",
};

export default function HarmouraPortrait({ emotionStats }: HarmouraPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const drawPortrait = (canvas: HTMLCanvasElement | null, size: number) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    Object.entries(emotionStats).forEach(([emotion, count]) => {
      const baseColor = emotionColors[emotion] || "#000000";

      for (let i = 0; i < count; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = size * 0.3 + Math.random() * (size * 0.2);

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `${baseColor}AA`);
        gradient.addColorStop(0.15, `${baseColor}99`);
        gradient.addColorStop(0.3, `${baseColor}77`);
        gradient.addColorStop(0.5, `${baseColor}55`);
        gradient.addColorStop(0.7, `${baseColor}33`);
        gradient.addColorStop(1, `${baseColor}00`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });
  };

  // Draw small canvas
  useEffect(() => {
    drawPortrait(canvasRef.current, 250);
  }, [emotionStats]);

  // Draw modal canvas
  useEffect(() => {
    if (isExpanded) drawPortrait(modalCanvasRef.current, 500);
  }, [isExpanded, emotionStats]);

  return (
    <>
      <div
        className="flex flex-col sm:flex-row bg-white rounded-lg shadow-2xl p-4 max-w-full sm:max-w-2xl cursor-pointer transition-transform hover:scale-105"
        onClick={() => setIsExpanded(true)}
      >
        {/* Left: Portrait */}
        <canvas
          ref={canvasRef}
          width={250}
          height={250}
          className="rounded-lg shadow-md w-full sm:w-64 h-auto sm:h-64"
        />

        {/* Right: Title and description */}
        <div className="flex flex-col justify-center mt-4 sm:mt-0 ml-0 sm:ml-4 text-center sm:text-left">
          <h3 className="text-xl font-bold mb-2">Your Harmoura Portrait</h3>
          <p className="text-gray-700 text-sm">
            This portrait is a visual reflection of your emotions. Each color and gradient represents the emotions captured while listening to your selected song. The layered radial gradients create a dynamic and unique expression of your emotional state.
          </p>
        </div>
      </div>

      {/* Modal for expanded portrait */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-0"
          onClick={() => setIsExpanded(false)}
        >
          <canvas
            ref={modalCanvasRef}
            width={500}
            height={500}
            className="rounded-lg shadow-2xl max-w-full max-h-full"
          />
        </div>
      )}
    </>
  );
}