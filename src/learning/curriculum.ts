import { keySequenceFor } from "./nida";
import type { Lesson, LessonStep, LessonUnit } from "./types";

function lesson(
  unitId: string,
  id: string,
  title: string,
  description: string,
  prompts: string[],
): Lesson {
  const steps: LessonStep[] = prompts.map((prompt, index) => ({
    id: `${id}-${index + 1}`,
    prompt,
    keySequence: keySequenceFor(prompt),
  }));
  return { id, unitId, title, description, steps };
}

export const curriculum: LessonUnit[] = [
  {
    id: "home-row",
    index: 1,
    title: "ជួរគោល",
    description: "ស្គាល់គ្រាប់ចុចមូលដ្ឋាន និងចលនាម្រាមដៃខ្លីៗ។",
    lessons: [
      lesson("home-row", "home-anchors", "ក · ល · ស · ហ", "គ្រាប់ចុចគោលសម្រាប់ដៃទាំងពីរ។", [
        "ក",
        "ល",
        "ស",
        "ហ",
        "កល",
        "សក",
        "ហល",
        "សាលា",
      ]),
      lesson("home-row", "home-reach", "ម · ន · ប · វ", "ពង្រីកចលនាទៅជួរខាងក្រោម។", [
        "ម",
        "ន",
        "ប",
        "វ",
        "មក",
        "នាង",
        "បាន",
        "វាល",
      ]),
    ],
  },
  {
    id: "consonants",
    index: 2,
    title: "ព្យញ្ជនៈ",
    description: "បន្ថែមព្យញ្ជនៈធម្មតា និងគ្រាប់ចុច Shift។",
    lessons: [
      lesson("consonants", "common-consonants", "ត · រ · យ · ច", "ព្យញ្ជនៈដែលជួបញឹកញាប់ក្នុងពាក្យខ្មែរ។", [
        "ត",
        "រ",
        "យ",
        "ច",
        "តារា",
        "ចាន",
        "រងា",
        "យាន",
      ]),
      lesson(
        "consonants",
        "shift-consonants",
        "គ · ជ · ទ · ព",
        "ប្រើ Shift ដើម្បីទៅដល់ព្យញ្ជនៈស្រទាប់ទីពីរ។",
        ["គ", "ជ", "ទ", "ព", "គិត", "ជាតិ", "ទឹក", "ពិត"],
      ),
    ],
  },
  {
    id: "vowels",
    index: 3,
    title: "ស្រៈ និងសញ្ញា",
    description: "បង្កើតចង្កោមជាមួយស្រៈលើ ក្រោម មុខ និងក្រោយ។",
    lessons: [
      lesson("vowels", "simple-vowels", "ា · ិ · ុ · េ", "ភ្ជាប់ស្រៈមូលដ្ឋានជាមួយព្យញ្ជនៈ។", [
        "កា",
        "កិ",
        "កុ",
        "គេ",
        "និ",
        "សុ",
        "មេ",
        "តា",
      ]),
      lesson("vowels", "shift-vowels", "ី · ូ · ែ · ៅ", "ហាត់ស្រៈដែលប្រើ Shift និងចម្ងាយម្រាមដៃ។", [
        "ទី",
        "គូ",
        "ខែ",
        "នៅ",
        "ដី",
        "មួយ",
        "ទៅ",
        "ពៅ",
      ]),
    ],
  },
  {
    id: "clusters",
    index: 4,
    title: "ជើងអក្សរ",
    description: "រៀនគ្រាប់ចុច ្ និងលំដាប់បង្កើតចង្កោមខ្មែរ។",
    lessons: [
      lesson("clusters", "coeng-basics", "្ + ព្យញ្ជនៈ", "បញ្ចូលជើងអក្សរមួយដោយរក្សាលំដាប់ Unicode។", [
        "ក្ក",
        "ក្ខ",
        "ង្ក",
        "ន្ត",
        "ម្ម",
        "ស្ស",
        "ល្ប",
        "ម្ព",
      ]),
      lesson("clusters", "cluster-words", "ចង្កោមក្នុងពាក្យ", "អនុវត្តជើងអក្សរក្នុងពាក្យប្រើប្រាស់ជាក់ស្តែង។", [
        "ខ្មែរ",
        "ស្តី",
        "ច្បាស់",
        "កម្ម",
        "អង្គរ",
        "សម្រាប់",
        "បន្ត",
        "ល្អ",
      ]),
    ],
  },
  {
    id: "words",
    index: 5,
    title: "ពាក្យ និងឃ្លា",
    description: "ភ្ជាប់ជំនាញទាំងអស់ទៅជាពាក្យ និងឃ្លាខ្លីៗ។",
    lessons: [
      lesson("words", "common-words", "ពាក្យប្រចាំថ្ងៃ", "ហាត់ចង្វាក់លើពាក្យដែលប្រើញឹកញាប់។", [
        "សួស្តី",
        "អរគុណ",
        "សាលា",
        "គ្រួសារ",
        "ការងារ",
        "សៀវភៅ",
        "សប្បាយ",
        "កម្ពុជា",
      ]),
      lesson("words", "short-phrases", "ឃ្លាខ្លីៗ", "រក្សាចង្វាក់ពេលវាយពាក្យជាប់គ្នា។", [
        "សួស្តី អ្នក",
        "ខ្ញុំ សុខសប្បាយ",
        "អរគុណ ច្រើន",
        "រៀន ភាសាខ្មែរ",
        "អាន សៀវភៅ",
        "ទៅ សាលា",
        "ស្រឡាញ់ កម្ពុជា",
        "វាយ ច្បាស់",
      ]),
    ],
  },
];

export const lessons = curriculum.flatMap((unit) => unit.lessons);

export function getLesson(lessonId: string | undefined): Lesson | undefined {
  return lessons.find((item) => item.id === lessonId);
}

export function getNextLesson(lessonId: string): Lesson | undefined {
  const index = lessons.findIndex((item) => item.id === lessonId);
  return index >= 0 ? lessons[index + 1] : undefined;
}
