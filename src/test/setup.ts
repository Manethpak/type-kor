import "@testing-library/jest-dom/vitest";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", { value: ResizeObserverStub, writable: true });
Object.defineProperty(Element.prototype, "scrollIntoView", {
  value: () => undefined,
  writable: true,
});
