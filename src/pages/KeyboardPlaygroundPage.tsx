import { NidaKeyboard } from "../components/NidaKeyboard";

const layerNotes = [
  { key: "Base", note: "Khmer letters and vowels" },
  { key: "Shift", note: "Secondary characters" },
  { key: "Right Alt", note: "AltGr combinations" },
];

export function KeyboardPlaygroundPage() {
  return (
    <section
      className="mx-auto w-[min(920px,100%)] animate-arrive"
      aria-labelledby="keyboard-playground-title"
    >
      <div className="mb-7 grid grid-cols-[1fr_auto] items-end gap-6 border-b border-app-line pb-6 max-[680px]:grid-cols-1">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.19em] text-app-accent">
            NIDA keyboard playground
          </p>
          <h1
            id="keyboard-playground-title"
            className="m-0 font-khmer text-[clamp(32px,5vw,42px)] font-medium"
          >
            សាកល្បងក្ដារចុចខ្មែរ
          </h1>
          <p className="mb-0 mt-2 max-w-2xl text-sm leading-relaxed text-app-dim">
            Press your physical keyboard or click a key below. Hold Shift or Right Alt to reveal
            every NIDA layer and see the character each key produces.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[22px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_82%,transparent)] px-4 py-6 shadow-[0_28px_80px_var(--shadow)] md:px-6 md:py-8">
        <span
          className="pointer-events-none absolute -right-5 -top-16 font-khmer text-[150px] leading-none text-app-accent opacity-[.035]"
          aria-hidden="true"
        >
          ក
        </span>
        <NidaKeyboard active={undefined} mode="interactable" />
        <div className="hidden rounded-xl border border-app-line bg-app-surface px-5 py-7 text-center max-md:block">
          <strong className="font-khmer text-lg font-medium">បើកនៅលើកុំព្យូទ័រ</strong>
          <p className="mb-0 mt-2 text-[11px] leading-relaxed text-app-dim">
            The complete NIDA keyboard playground is available on a larger screen.
          </p>
        </div>
      </div>
    </section>
  );
}
