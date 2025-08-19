// src/components/SmoothScrollWrapper.tsx
import { useEffect, useRef } from "react";
import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/dist/locomotive-scroll.css";

interface Props {
  children: React.ReactNode;
}

export default function SmoothScrollWrapper({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;

    // TypeScript doesn't recognize 'inertia', so cast as any
    const scroll = new LocomotiveScroll({
      el: scrollRef.current,
      smooth: true,
      multiplier: 1, // scroll speed
      inertia: 0.75, // smoothness
    } as any);

    const handleResize = () => scroll.update();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      scroll.destroy();
    };
  }, []);

  return (
    <div ref={scrollRef} data-scroll-container className="custom-scrollbar">
      {children}
    </div>
  );
}