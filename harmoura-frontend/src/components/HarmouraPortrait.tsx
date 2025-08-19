import { useEffect, useRef } from "react";

interface HarmouraPortraitProps {
  emotion: string; // current emotion
}

const emotionColors: Record<string, string> = {
  Happiness: "#FFD700", // Gold
  Sadness: "#1E90FF",   // Blue
  Calmness: "#32CD32",  // Green
  Excitement: "#FF4500",// Red-Orange
  Love: "#FF69B4",      // Pink
};

export default function HarmouraPortrait({ emotion }: HarmouraPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initial blank portrait
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Random brush function
    const brush = () => {
      const color = emotionColors[emotion] || "#000000";
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 50 + 20;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
    };

    const interval = setInterval(brush, 500); // brush every 0.5s
    return () => clearInterval(interval);
  }, [emotion]);

  return <canvas ref={canvasRef} width={500} height={500} className="border" />;
}