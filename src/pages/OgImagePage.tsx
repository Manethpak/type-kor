const specimen = [
  ["ខ្មែរ", "មាន", "អក្សរ", "ស្រស់ស្អាត"],
  ["ហាត់វាយ", "រាល់ថ្ងៃ", "ដើម្បី", "កាន់តែលឿន"],
  ["រៀន", "សាកល្បង", "និង", "រីកចម្រើន"],
];

export function OgImagePage() {
  return (
    <main
      className="relative h-[630px] w-[1200px] overflow-hidden bg-[#171813] text-[#e8e3d7]"
      aria-label="TypeKor social preview"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 82% 28%, rgba(232,164,58,.15), transparent 31%), radial-gradient(circle at 12% 100%, rgba(232,164,58,.07), transparent 35%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[.055]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="absolute -right-8 -top-30 font-khmer text-[500px] leading-none text-[#e8a43a] opacity-[.045]">
        ក
      </div>
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#e8a43a]/35 to-transparent" />

      <header className="absolute left-17 right-17 top-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-[16px_16px_16px_5px] border border-[#e8a43a]/45 bg-[#e8a43a]/12 font-khmer text-[34px] leading-none text-[#e8a43a] shadow-[inset_0_0_28px_rgba(232,164,58,.1)]">
            ក
          </span>
          <span>
            <strong className="block text-[27px] font-bold leading-none tracking-[-.025em]">
              Type <span className="font-khmer font-normal">ក</span>
            </strong>
            <small className="mt-2 block text-[11px] font-bold tracking-[.3em] text-[#77776d]">
              TYPEKOR
            </small>
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-[#e8e3d7]/10 bg-[#23241d]/80 px-5 py-2.5 text-[12px] font-semibold tracking-[.16em] text-[#aaa79b]">
          <span className="size-1.5 rounded-full bg-[#e8a43a] shadow-[0_0_10px_rgba(232,164,58,.8)]" />
          KHMER TYPING PRACTICE
        </div>
      </header>

      <section className="absolute left-17 top-44 w-[590px]">
        <p className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#e8a43a]">
          រៀន · ហាត់ · រីកចម្រើន
        </p>
        <h1 className="font-khmer text-[58px] font-bold leading-[1.42] tracking-[-.025em]">
          វាយអក្សរខ្មែរ
          <br />
          <span className="text-[#e8a43a]">ឱ្យលឿន និងត្រឹមត្រូវ</span>
        </h1>
        <p className="mt-4 max-w-[520px] font-khmer text-[19px] leading-[1.8] text-[#aaa79b]">
          រៀនប្លង់ក្តារចុច ហាត់វាយ និងវាស់ល្បឿនរបស់អ្នកនៅកន្លែងតែមួយ។
        </p>
      </section>

      <section className="absolute bottom-15 right-17 w-[435px] rotate-[1.2deg] rounded-[22px] border border-[#e8e3d7]/10 bg-[#1d1e18]/92 px-8 pb-7 pt-6 shadow-[0_35px_90px_rgba(0,0,0,.34)]">
        <div className="mb-5 flex items-center justify-between border-b border-[#e8e3d7]/8 pb-4">
          <span className="text-[11px] font-bold tracking-[.18em] text-[#77776d]">TYPING TEST</span>
          <div className="flex items-center gap-5 text-[11px] font-semibold text-[#77776d]">
            <span>
              <b className="mr-1.5 text-[19px] font-medium text-[#e8a43a]">42</b> WPM
            </span>
            <span>
              <b className="mr-1.5 text-[19px] font-medium text-[#e8a43a]">98</b>%
            </span>
          </div>
        </div>

        <div className="space-y-2 font-khmer text-[25px] leading-[1.7] tracking-[.01em]">
          {specimen.map((line, lineIndex) => (
            <div key={lineIndex} className="whitespace-nowrap">
              {line.map((word, wordIndex) => {
                const completed = lineIndex === 0 || (lineIndex === 1 && wordIndex === 0);
                const active = lineIndex === 1 && wordIndex === 1;

                return (
                  <span
                    key={word}
                    className={
                      completed ? "text-[#d8d4c9]" : active ? "text-[#e8a43a]" : "text-[#66675e]"
                    }
                  >
                    {active && (
                      <span className="mr-1 inline-block h-7 w-[3px] translate-y-1 rounded-full bg-[#e8a43a] shadow-[0_0_13px_rgba(232,164,58,.7)]" />
                    )}
                    {word}
                    {wordIndex < line.length - 1 ? " " : ""}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
