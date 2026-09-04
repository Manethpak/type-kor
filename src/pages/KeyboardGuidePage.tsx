import { NidaKeyboard } from "../components/NidaKeyboard";

const historyEvents = [
  {
    year: "2000",
    titleKm: "ការចាប់ផ្ដើមហេដ្ឋារចនាសម្ព័ន្ធឌីជីថល",
    titleEn: "A national digital foundation",
    bodyKm:
      "រាជរដ្ឋាភិបាលកម្ពុជាបានបង្កើតអាជ្ញាធរជាតិទទួលបន្ទុកការអភិវឌ្ឍបច្ចេកវិទ្យាគមនាគមន៍ និងព័ត៌មាន (NiDA) នៅទីស្ដីការគណៈរដ្ឋមន្ត្រី។",
    bodyEn:
      "Cambodia’s Royal Government established the National Information Communication Technology Development Authority (NiDA) at the Office of the Council of Ministers.",
  },
  {
    year: "2005",
    titleKm: "ស្តង់ដាររួមមួយ",
    titleEn: "One shared standard",
    bodyKm:
      "NiDA និងគម្រោង KhmerOS បានសហការគ្នាកំណត់ និងផ្សព្វផ្សាយក្ដារចុចយូនីកូដស្តង់ដារ NiDA ដោយផ្អែកលើការងារដែល KhmerOS បានធ្វើពីមុន។",
    bodyEn:
      "NiDA and the KhmerOS initiative collaborated to define and publicize the NiDA Standard Unicode Keyboard, building on KhmerOS’s earlier work.",
  },
  {
    year: "2006",
    titleKm: "ពីស្តង់ដារទៅការប្រើប្រាស់",
    titleEn: "From standard to everyday use",
    bodyKm:
      "KhmerOS បានរៀបចំការប្រកួតវាយអក្សរថ្នាក់ជាតិ និងបន្តបណ្ដុះបណ្ដាលមន្ត្រីរាជការ គ្រូបង្រៀន បុគ្គលិកអង្គការ និងសិស្សនិស្សិតឱ្យប្រើកម្មវិធីជាភាសាខ្មែរ។",
    bodyEn:
      "KhmerOS organized a national Unicode typing contest and expanded training for public officials, teachers, NGO workers, and students.",
  },
  {
    year: "បច្ចុប្បន្ន",
    yearEn: "TODAY",
    titleKm: "កេរដំណែលដែលបន្តរស់",
    titleEn: "A living digital legacy",
    bodyKm:
      "តារាងក្ដារចុចរបស់ Unicode CLDR នៅតែរក្សាបញ្ជីប្លង់ “Khmer (NIDA)” ជាមួយស្រទាប់ Base, Shift និង Right Alt ដែលកម្មវិធីនេះប្រើសម្រាប់ការរៀន និងសាកល្បង។",
    bodyEn:
      "Unicode CLDR continues to catalog the “Khmer (NIDA)” layout, including the Base, Shift, and Right Alt layers used by this learning tool.",
  },
];

const layerNotes = [
  {
    number: "01",
    key: "Base",
    titleKm: "ស្រទាប់គោល",
    bodyKm: "អក្សរ ស្រៈ លេខខ្មែរ និងសញ្ញាដែលប្រើញឹកញាប់។ គ្រាប់ចុច Space បញ្ចូល ZWSP សម្រាប់ព្រំដែនពាក្យ។",
    bodyEn:
      "Khmer letters, vowels, numerals, and frequent marks. The Space key inserts ZWSP as an invisible word boundary.",
  },
  {
    number: "02",
    key: "Shift",
    titleKm: "ស្រទាប់បន្ថែម",
    bodyKm: "ព្យញ្ជនៈ ស្រៈ និងសញ្ញាបន្ទាប់បន្សំ។ Shift + Space បញ្ចូលចន្លោះធម្មតាដែលអាចមើលឃើញ។",
    bodyEn:
      "Secondary consonants, vowels, and punctuation. Shift + Space produces a regular visible space.",
  },
  {
    number: "03",
    key: "Right Alt",
    titleKm: "ស្រទាប់ AltGr",
    bodyKm: "តួអក្សរកម្រ សញ្ញារូបិយប័ណ្ណ និងតួអក្សរគ្រប់គ្រងការភ្ជាប់។ Right Alt + Space បញ្ចូល NBSP។",
    bodyEn:
      "Less common characters, currency marks, and join controls. Right Alt + Space produces a non-breaking space.",
  },
];

const invisibleCharacters = [
  {
    name: "ZWSP",
    unicode: "U+200B",
    shortcut: "Space",
    titleKm: "ព្រំដែនពាក្យដែលមើលមិនឃើញ",
    titleEn: "Invisible word boundary",
    bodyKm: "សម្គាល់ព្រំដែនពាក្យ និងអនុញ្ញាតឱ្យអត្ថបទបំបែកបន្ទាត់ ដោយមិនបង្ហាញចន្លោះ។",
    bodyEn: "Marks a Khmer word boundary and allows a line break without showing a space.",
  },
  {
    name: "Space",
    unicode: "U+0020",
    shortcut: "Shift + Space",
    titleKm: "ចន្លោះធម្មតា",
    titleEn: "Regular visible space",
    bodyKm: "បំបែកឃ្លា ក្រុមពាក្យ ឬផ្នែកនៃឈ្មោះ ហើយអាចបំបែកបន្ទាត់បាន។",
    bodyEn: "Separates clauses, phrases, or parts of a name and permits a line break.",
  },
  {
    name: "NBSP",
    unicode: "U+00A0",
    shortcut: "Right Alt + Space",
    titleKm: "ចន្លោះមិនបំបែកបន្ទាត់",
    titleEn: "Non-breaking space",
    bodyKm: "បង្ហាញដូចចន្លោះធម្មតា ប៉ុន្តែរក្សាអត្ថបទទាំងសងខាងឱ្យនៅលើបន្ទាត់តែមួយ។",
    bodyEn: "Looks like a regular space but keeps the text on both sides on the same line.",
  },
  {
    name: "ZWJ",
    unicode: "U+200D",
    shortcut: "Right Alt + `",
    titleKm: "ស្នើការភ្ជាប់តួអក្សរ",
    titleEn: "Request a joined form",
    bodyKm: "ស្នើឱ្យពុម្ពអក្សរបង្កើតទម្រង់អក្សរភ្ជាប់ ជាពិសេសនៅក្នុងពុម្ពអក្សរខ្មែរមូល។",
    bodyEn: "Requests a ligature or joined form, particularly in traditional Khmer Muul fonts.",
  },
  {
    name: "ZWNJ",
    unicode: "U+200C",
    shortcut: "Right Alt + 1",
    titleKm: "ទប់ស្កាត់ការភ្ជាប់តួអក្សរ",
    titleEn: "Prevent a joined form",
    bodyKm: "ទប់ស្កាត់អក្សរភ្ជាប់ និងអាចរក្សារូបរាងត្រឹមត្រូវរបស់សញ្ញាប្ដូរព្យញ្ជនៈ។",
    bodyEn: "Suppresses a ligature and can preserve the intended form of a consonant shifter.",
  },
];

const impactNotes = [
  {
    glyph: "អ",
    titleKm: "អត្ថបទដែលអាចប្រើបន្តបាន",
    titleEn: "Portable text",
    bodyKm: "យូនីកូដរក្សាទុកតួអក្សរ មិនមែនទីតាំងរូបរាងនៅក្នុងពុម្ពអក្សរចាស់ទេ ដូច្នេះអត្ថបទអាចស្វែងរក ចម្លង និងចែករំលែកបាន។",
    bodyEn:
      "Unicode stores characters rather than visual positions in a legacy font, allowing text to be searched, copied, and shared.",
  },
  {
    glyph: "ក",
    titleKm: "ផែនទីគ្រាប់ចុចរួម",
    titleEn: "A shared key map",
    bodyKm: "ប្លង់ស្តង់ដារផ្ដល់ចំណុចយោងរួមសម្រាប់ការបង្រៀន ឯកសារ និងប្រព័ន្ធដែលអនុវត្តប្លង់ NIDA។",
    bodyEn:
      "A standard layout gives teaching, documentation, and systems implementing NIDA one shared reference.",
  },
  {
    glyph: "្មែ",
    titleKm: "រចនាសម្រាប់អក្សរខ្មែរ",
    titleEn: "Made for Khmer script",
    bodyKm: "សញ្ញា និងជើងអក្សរត្រូវបានបញ្ចូលជាលំដាប់យូនីកូដ ហើយពុម្ពអក្សរខ្មែរជាអ្នកបង្ហាញពួកវាជាចង្កោមអក្សរតែមួយ។",
    bodyEn:
      "Signs and subscripts are entered as Unicode sequences, then shaped into a Khmer cluster by a compatible font.",
  },
];

const sources = [
  {
    label: "Royal Government of Cambodia",
    detail: "Digital Government Policy 2022–2035 · NiDA established in 2000",
    href: "https://www.khmersme.gov.kh/wp-content/uploads/2022/10/cambodia_digital_government_policy_2022_2035_english.pdf",
  },
  {
    label: "WIPO · KhmerOS case study",
    detail: "NiDA collaboration, standard keyboard, training, and the 2006 typing contest",
    href: "https://www.wipo.int/edocs/mdocs/copyright/en/wipo_cr_wk_ge_11/wipo_cr_wk_ge_11_3.pdf",
  },
  {
    label: "Unicode CLDR",
    detail: "Khmer (NIDA) Base, Shift, and AltGr key mappings",
    href: "https://unicode.org/cldr/charts/40/keyboards/layouts/km.html",
  },
  {
    label: "Unicode Core Specification",
    detail: "Khmer spacing, consonant shifters, and Muul ligature controls",
    href: "https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-16/",
  },
  {
    label: "KhmerOS archive",
    detail: "NiDA Khmer Unicode Keyboard V1.0 files and original layout sheet",
    href: "https://sourceforge.net/projects/khmer/files/Keyboard%20-%20Khmer%20Unicode/NiDA%20Khmer%20Unicode%20Keyboard%20V1.0/",
  },
];

function SectionHeading({
  number,
  titleKm,
  titleEn,
  id,
}: {
  number: string;
  titleKm: string;
  titleEn: string;
  id: string;
}) {
  return (
    <div className="mb-7 grid grid-cols-[48px_1fr] items-start gap-4 border-app-line">
      <span
        className="pt-1 text-xs font-bold tracking-[.18em] text-app-accent"
        aria-hidden="true"
      >
        {number}
      </span>
      <div>
        <h2
          id={id}
          className="m-0 font-khmer text-3xl font-medium leading-tight md:text-4xl"
        >
          {titleKm}
        </h2>
        <p className="mb-0 mt-1 text-xs font-semibold uppercase tracking-[.16em] text-app-dim">
          {titleEn}
        </p>
      </div>
    </div>
  );
}

export function KeyboardGuidePage() {
  return (
    <article
      className="mx-auto w-[min(1000px,100%)] animate-arrive pb-8"
      aria-labelledby="keyboard-guide-title"
    >
      <header className="relative mb-16 overflow-hidden border-y border-app-line py-9 md:py-12">
        <span
          className="pointer-events-none absolute -right-8 -top-20 font-khmer text-9xl leading-none text-app-accent opacity-[.025]"
          aria-hidden="true"
        >
          អ
        </span>
        <div className="relative grid grid-cols-[minmax(0,1.25fr)_minmax(220px,.75fr)] items-end gap-10 max-[720px]:grid-cols-1">
          <div>
            <h1
              id="keyboard-guide-title"
              aria-label="មគ្គុទ្ទេសក៍ក្ដារចុច / Keyboard Guide"
              className="m-0 text-app-accent"
            >
              <span className="block font-khmer text-4xl font-medium leading-[1.12] tracking-[-.025em] md:text-5xl">
                មគ្គុទ្ទេសក៍ក្ដារចុច
              </span>
              <span className="mt-3 block font-ui text-xl font-medium leading-tight tracking-[-.02em] text-app-text md:text-3xl">
                Keyboard Guide
              </span>
            </h1>
          </div>
          <div className="relative mt-10 grid grid-cols-3 border-app-line pt-4 max-[520px]:grid-cols-1 max-[520px]:gap-3">
            {["STANDARD", "3 LAYERS", "UNICODE"].map((value) => (
              <div
                className="border-r border-app-line px-4 first:pl-0 last:border-r-0 max-[520px]:border-r-0 max-[520px]:px-0"
                key={value}
              >
                <strong className="block text-xs font-bold tracking-[.16em] text-app-accent">
                  {value}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="mb-18" aria-labelledby="history-title">
        <SectionHeading
          number="01"
          titleKm="ពីគំនិតមួយ ទៅជាស្តង់ដាររួម"
          titleEn="From an idea to a shared standard"
          id="history-title"
        />

        <div className="relative ml-6 before:absolute before:bottom-4 before:left-[46px] before:top-4 before:w-px before:bg-app-line max-[640px]:ml-0 max-[640px]:before:left-[35px]">
          {historyEvents.map((event) => (
            <article
              className="group relative grid grid-cols-[94px_1fr_1fr] gap-6 pb-10 last:pb-0 max-[740px]:grid-cols-[82px_1fr] max-[740px]:gap-x-4 max-[740px]:gap-y-2"
              key={event.year}
            >
              <div className="relative z-[1] flex items-start">
                <span className="inline-flex min-h-7 min-w-17 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-app-bg px-2 text-xs font-bold uppercase tracking-[.08em] text-app-accent transition-colors group-hover:bg-app-accent-soft">
                  <span className="font-khmer">{event.year}</span>
                  {event.yearEn && <span className="sr-only"> {event.yearEn}</span>}
                </span>
              </div>
              <div>
                <h3 className="m-0 font-khmer text-lg font-medium leading-relaxed text-app-text">
                  {event.titleKm}
                </h3>
                <p className="mb-0 mt-2 font-khmer text-sm leading-[1.9] text-app-soft">
                  {event.bodyKm}
                </p>
              </div>
              <div className="pt-1 max-[740px]:col-start-2">
                <h3 className="m-0 text-sm font-semibold text-app-text">{event.titleEn}</h3>
                <p className="mb-0 mt-2 text-xs leading-[1.75] text-app-dim">{event.bodyEn}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-18" aria-labelledby="explore-title">
        <SectionHeading
          number="02"
          titleKm="ប្លង់ដែលអាចសាកល្បងបាន"
          titleEn="The living layout"
          id="explore-title"
        />

        <div className="relative overflow-hidden rounded-[24px] border border-[color-mix(in_srgb,var(--accent)_20%,var(--line))] bg-[color-mix(in_srgb,var(--bg-raised)_82%,transparent)] px-4 py-6 shadow-[0_28px_80px_var(--shadow)] md:px-7 md:py-8">
          <span
            className="pointer-events-none absolute -right-5 -top-16 font-khmer text-9xl leading-none text-app-accent opacity-[.035]"
            aria-hidden="true"
          >
            ក
          </span>
          <div className="relative mb-6 grid grid-cols-2 gap-6 border-b border-app-line pb-5 max-[650px]:grid-cols-1 max-[650px]:gap-2">
            <p className="m-0 font-khmer text-sm leading-[1.8] text-app-soft">
              ចុចគ្រាប់ចុចលើក្ដារចុចរបស់អ្នក ឬចុចលើប្លង់ខាងក្រោម។ សង្កត់ Shift ឬ Right Alt ដើម្បីមើលស្រទាប់ផ្សេងទៀត។
            </p>
            <p className="m-0 text-xs leading-relaxed text-app-dim">
              Press your physical keyboard or click a key below. Hold Shift or Right Alt to reveal
              every NIDA layer and see its output.
            </p>
          </div>
          <NidaKeyboard active={undefined} mode="interactable" />
          <div className="hidden rounded-xl border border-app-line bg-app-surface px-5 py-7 text-center max-md:block">
            <strong className="font-khmer text-lg font-medium">បើកនៅលើកុំព្យូទ័រ</strong>
            <p className="mb-0 mt-2 font-khmer text-xs leading-relaxed text-app-dim">
              ប្លង់ក្ដារចុច NIDA ពេញលេញអាចសាកល្បងបាននៅលើអេក្រង់ធំ។
            </p>
            <p className="mb-0 mt-1 text-xs leading-relaxed text-app-dim">
              The complete interactive keyboard is available on a larger screen.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-18" aria-labelledby="layers-title">
        <SectionHeading
          number="03"
          titleKm="របៀបអានស្រទាប់ទាំងបី"
          titleEn="How to read the three layers"
          id="layers-title"
        />

        <div className="grid grid-cols-3 gap-3 max-[760px]:grid-cols-1">
          {layerNotes.map((layer) => (
            <article
              className="group relative min-h-[280px] overflow-hidden rounded-[18px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_78%,transparent)] p-5 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--accent)_38%,var(--line))]"
              key={layer.key}
            >
              <div className="mb-10 flex items-center justify-between">
                <span className="text-xs font-bold tracking-[.16em] text-app-accent">
                  {layer.number}
                </span>
                <kbd className="rounded-md border border-app-line bg-app-surface px-2 py-1 text-xs font-semibold text-app-dim shadow-[0_2px_0_var(--line)]">
                  {layer.key}
                </kbd>
              </div>
              <h3 className="m-0 font-khmer text-xl font-medium">{layer.titleKm}</h3>
              <p className="mb-0 mt-3 font-khmer text-sm leading-[1.85] text-app-soft">
                {layer.bodyKm}
              </p>
              <p className="mb-12 mt-3 text-xs leading-[1.7] text-app-dim">{layer.bodyEn}</p>
            </article>
          ))}
        </div>

        <details className="group mt-4 overflow-hidden rounded-[18px] border border-[color-mix(in_srgb,var(--accent)_28%,var(--line))] bg-[color-mix(in_srgb,var(--bg-raised)_72%,transparent)]">
          <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-6 bg-app-accent-soft px-6 py-6 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_12%,var(--bg-raised))] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-app-accent [&::-webkit-details-marker]:hidden">
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[.18em] text-app-accent">
                Invisible Unicode characters
              </p>
              <h3 className="mb-0 mt-3 font-khmer text-2xl font-medium leading-relaxed text-app-text">
                ហេតុអ្វីក្ដារចុចខ្មែរត្រូវការ Invisible Unicode?
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-right text-xs font-semibold uppercase tracking-[.12em] text-app-dim max-[520px]:hidden">
                5 controls · Open guide
              </span>
              <span
                className="grid size-9 place-items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-app-bg text-lg leading-none text-app-accent transition-transform duration-300 group-open:rotate-45"
                aria-hidden="true"
              >
                +
              </span>
            </div>
          </summary>

          <div className="grid grid-cols-2 gap-8 border-y border-app-line px-6 py-5 max-[700px]:grid-cols-1 max-[700px]:gap-3">
            <p className="m-0 font-khmer text-xs leading-[1.9] text-app-soft">
              ភាសាខ្មែរជាទូទៅមិនប្រើចន្លោះរវាងពាក្យទេ ហើយពុម្ពអក្សរអាចប្ដូររូបរាង ឬភ្ជាប់តួអក្សរ។
              តួអក្សរទាំងនេះគ្រប់គ្រងព្រំដែនពាក្យ ការបំបែកបន្ទាត់ និងការភ្ជាប់អក្សរ។
            </p>
            <p className="m-0 text-xs leading-[1.7] text-app-dim">
              Khmer normally has no visible spaces between words, and fonts can reshape or join
              characters. These controls manage word boundaries, line wrapping, and shaping.
            </p>
          </div>

          <div className="divide-y divide-app-line px-5">
            {invisibleCharacters.map((character) => (
              <article
                className="grid grid-cols-[74px_150px_1fr_1fr] gap-5 py-5 max-[820px]:grid-cols-[64px_130px_1fr] max-[620px]:grid-cols-[64px_1fr]"
                key={character.name}
              >
                <div>
                  <strong className="block text-xs font-bold tracking-[.08em] text-app-accent">
                    {character.name}
                  </strong>
                  <span className="mt-1 block text-xs tracking-[.08em] text-app-dim">
                    {character.unicode}
                  </span>
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-[.14em] text-app-dim">
                    NIDA key
                  </span>
                  <kbd className="inline-block rounded-md border border-app-line bg-app-surface px-2 py-1 text-xs font-semibold text-app-text shadow-[0_2px_0_var(--line)]">
                    {character.shortcut}
                  </kbd>
                </div>
                <div className="max-[620px]:col-start-2">
                  <h4 className="m-0 font-khmer text-sm font-medium leading-relaxed text-app-text">
                    {character.titleKm}
                  </h4>
                  <p className="mb-0 mt-1 font-khmer text-xs leading-[1.8] text-app-soft">
                    {character.bodyKm}
                  </p>
                </div>
                <div className="max-[820px]:col-start-3 max-[620px]:col-start-2">
                  <h4 className="m-0 text-xs font-semibold text-app-text">
                    {character.titleEn}
                  </h4>
                  <p className="mb-0 mt-1.5 text-xs leading-[1.7] text-app-dim">
                    {character.bodyEn}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <p className="m-0 border-t border-app-line px-5 py-4 text-xs leading-relaxed text-app-dim">
            ZWSP and regular Space cover most everyday typing. ZWJ and ZWNJ are advanced controls
            used when a Khmer font needs explicit shaping instructions.
          </p>
        </details>
      </section>

      <section className="mb-18" aria-labelledby="impact-title">
        <SectionHeading
          number="04"
          titleKm="ហេតុអ្វីប្លង់នេះសំខាន់"
          titleEn="Why the layout matters"
          id="impact-title"
        />

        <div className="grid grid-cols-[1.05fr_1.95fr] gap-3 max-[760px]:grid-cols-1">
          <aside className="relative overflow-hidden rounded-[18px] border border-[color-mix(in_srgb,var(--accent)_32%,var(--line))] bg-app-accent-soft p-6">
            <span
              className="absolute -bottom-10 -right-6 font-khmer text-9xl leading-none text-app-accent opacity-[.08]"
              aria-hidden="true"
            >
              ក
            </span>
            <p className="m-0 text-xs font-bold uppercase tracking-[.18em] text-app-accent">
              Keyboard ≠ Font
            </p>
            <p className="relative mb-0 mt-10 font-khmer text-lg leading-[1.8] text-app-text">
              ក្ដារចុចកំណត់ថាអ្នកបញ្ចូលតួអក្សរអ្វី។ ពុម្ពអក្សរកំណត់ថាតួអក្សរនោះបង្ហាញរូបរាងយ៉ាងដូចម្ដេច។
            </p>
            <p className="relative mb-0 mt-4 text-xs leading-relaxed text-app-dim">
              A keyboard decides which character you enter. A font decides how that character is
              drawn.
            </p>
          </aside>

          <div className="divide-y divide-app-line rounded-[18px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_72%,transparent)] px-5">
            {impactNotes.map((note) => (
              <article
                className="grid grid-cols-[50px_1fr_1fr] gap-4 py-5 max-[640px]:grid-cols-[42px_1fr]"
                key={note.titleEn}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-app-accent-soft font-khmer text-lg text-app-accent">
                  {note.glyph}
                </span>
                <div>
                  <h3 className="m-0 font-khmer text-base font-medium">{note.titleKm}</h3>
                  <p className="mb-0 mt-1.5 font-khmer text-xs leading-[1.8] text-app-soft">
                    {note.bodyKm}
                  </p>
                </div>
                <div className="max-[640px]:col-start-2">
                  <h3 className="m-0 text-xs font-semibold">{note.titleEn}</h3>
                  <p className="mb-0 mt-1.5 text-xs leading-[1.7] text-app-dim">
                    {note.bodyEn}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="sources-title">
        <SectionHeading
          number="05"
          titleKm="ឯកសារយោង និងអានបន្ថែម"
          titleEn="Sources and further reading"
          id="sources-title"
        />

        <ol className="m-0 grid list-none grid-cols-2 gap-x-8 gap-y-1 p-0 max-[700px]:grid-cols-1">
          {sources.map((source, index) => (
            <li key={source.href}>
              <a
                className="group grid grid-cols-[30px_1fr_auto] items-start gap-3 border-b border-app-line py-4 text-app-text transition-colors hover:text-app-accent"
                href={source.href}
                target="_blank"
                rel="noreferrer"
              >
                <span className="pt-0.5 text-xs font-bold tracking-[.12em] text-app-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong className="block text-xs font-semibold">{source.label}</strong>
                  <small className="mt-1 block text-xs leading-relaxed text-app-dim">
                    {source.detail}
                  </small>
                </span>
                <span
                  className="text-xs text-app-dim transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-app-accent"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
