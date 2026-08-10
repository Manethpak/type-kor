import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

export interface CaretPosition {
  x: number;
  y: number;
  height: number;
  visible: boolean;
}

export function useCaretPosition(
  containerRef: RefObject<HTMLElement | null>,
  activeRef: RefObject<HTMLElement | null>,
  dependency: unknown,
): CaretPosition {
  const [position, setPosition] = useState<CaretPosition>({ x: 0, y: 0, height: 44, visible: false });

  useLayoutEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const active = activeRef.current;
      if (!container || !active) return;
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      setPosition({
        x: activeRect.left - containerRect.left + container.scrollLeft - 2,
        y: activeRect.top - containerRect.top + container.scrollTop + activeRect.height * 0.08,
        height: activeRect.height * 0.84,
        visible: true,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", update);
    document.fonts?.ready.then(update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [activeRef, containerRef, dependency]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }, [activeRef, dependency]);

  return position;
}
