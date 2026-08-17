import type { AssessmentQuestion } from "../types";
import { bandMetadata, options, question } from "./content-helpers";

export const listeningQuestions: readonly AssessmentQuestion[] = [
  listening({
    id: "L01-A",
    slotId: "L01",
    form: "A",
    blockId: "L01",
    audioId: "a-q01",
    evidenceBand: "A1",
    situation: "David is talking with Tomomi when Monica comes into the room.",
    prompt: "___ are meeting for the first time.",
    optionTexts: [
      "David and Monica",
      "David and Tomomi",
      "Tomomi and Monica",
      "David, Monica, and Tomomi",
    ],
    correctOption: "C",
    construct: "basic social context / introductions",
    timeLimitSeconds: 25,
  }),
  listening({
    id: "L01-B",
    slotId: "L01",
    form: "B",
    blockId: "L01",
    audioId: "b-q01",
    evidenceBand: "A1",
    situation: "Tony and Alex are talking when Meriko comes in.",
    prompt: "___ are meeting for the first time.",
    optionTexts: [
      "Tony and Alex",
      "Tony and Meriko",
      "Alex and Meriko",
      "Tony, Alex, and Meriko",
    ],
    correctOption: "C",
    construct: "basic social context / introductions",
    timeLimitSeconds: 25,
  }),
  listening({
    id: "L02-A",
    slotId: "L02",
    form: "A",
    blockId: "L02",
    audioId: "a-q03",
    evidenceBand: "A1",
    situation: "Karen calls Jason's home. Jason's father answers the telephone.",
    prompt: "Karen is going to ___.",
    optionTexts: [
      "speak with Jason at work",
      "call back in an hour",
      "wait for Jason to call",
      "send a written message",
    ],
    correctOption: "C",
    construct: "telephone interaction / next action",
    timeLimitSeconds: 25,
  }),
  listening({
    id: "L02-B",
    slotId: "L02",
    form: "B",
    blockId: "L02",
    audioId: "b-q03",
    evidenceBand: "A1",
    situation: "Joe calls Ramon's home. Ramon's mother answers the telephone.",
    prompt: "Joe ___.",
    optionTexts: [
      "talks with Ramon",
      "leaves a message for Ramon",
      "will see Ramon in class",
      "will call Ramon at school",
    ],
    correctOption: "B",
    construct: "telephone interaction / next action",
    timeLimitSeconds: 25,
  }),
  ...listeningBlock("A", "L03-04", "a-q06-07", "A2", [
    {
      id: "L03-A",
      slotId: "L03",
      situation: "Bill invites Jennifer to go to dinner and a movie.",
      prompt: "Jennifer doesn't accept right away because she can't ___.",
      optionTexts: ["eat a late lunch", "leave work early", "go to dinner", "see the movie"],
      correctOption: "B",
      construct: "schedule conflict",
      timeLimitSeconds: 30,
    },
    {
      id: "L04-A",
      slotId: "L04",
      situation: "Bill invites Jennifer to go to dinner and a movie.",
      prompt: "They're going to ___.",
      optionTexts: [
        "leave work a little early",
        "go to the movie before dinner",
        "see the movie tomorrow",
        "have dinner at 7:00",
      ],
      correctOption: "B",
      construct: "final arrangement",
      timeLimitSeconds: 30,
    },
  ]),
  ...listeningBlock("B", "L03-04", "b-q06-07", "A2", [
    {
      id: "L03-B",
      slotId: "L03",
      situation: "Jeff calls Audrey about a business meeting.",
      prompt: "Audrey can't meet before 2:00 because she ___.",
      optionTexts: [
        "is leaving early tomorrow",
        "has another meeting",
        "is meeting all morning",
        "eats lunch at 2:00",
      ],
      correctOption: "B",
      construct: "schedule conflict",
      timeLimitSeconds: 30,
    },
    {
      id: "L04-B",
      slotId: "L04",
      situation: "Jeff calls Audrey about a business meeting.",
      prompt: "They're going to ___.",
      optionTexts: [
        "meet at 10:00 tomorrow",
        "eat a late lunch together",
        "have the meeting before lunch",
        "meet at night",
      ],
      correctOption: "B",
      construct: "final arrangement",
      timeLimitSeconds: 30,
    },
  ]),
  ...listeningBlock("A", "L05-07", "a-q10-12", "B1", [
    {
      id: "L05-A",
      slotId: "L05",
      situation: "Phil is talking with Susie about money.",
      prompt: "Phil is upset because ___.",
      optionTexts: [
        "Susie can't lend him any money",
        "his parents won't give him money",
        "Albert hasn't returned his money",
        "his friends never lend him money",
      ],
      correctOption: "C",
      construct: "problem",
      timeLimitSeconds: 30,
    },
    {
      id: "L06-A",
      slotId: "L06",
      situation: "Phil is talking with Susie about money.",
      prompt: "Albert ___.",
      optionTexts: [
        "didn't borrow $100",
        "isn't working now",
        "doesn't need the money",
        "can't return the money yet",
      ],
      correctOption: "D",
      construct: "consequence / current situation",
      timeLimitSeconds: 35,
    },
    {
      id: "L07-A",
      slotId: "L07",
      situation: "Phil is talking with Susie about money.",
      prompt: "Susie doesn't lend money to friends because ___.",
      optionTexts: [
        "she has just enough for herself",
        "lending money can change a friendship",
        "people won't lend her money",
        "her friends don't need it",
      ],
      correctOption: "B",
      construct: "attitude / rationale",
      timeLimitSeconds: 35,
    },
  ], true),
  ...listeningBlock("B", "L05-07", "b-q10-12", "B1", [
    {
      id: "L05-B",
      slotId: "L05",
      situation: "Peggy is talking to Tom about her car.",
      prompt: "Peggy is upset because ___.",
      optionTexts: [
        "she can't use her car",
        "her parents won't help her",
        "Karla doesn't like her car",
        "Tom doesn't understand her",
      ],
      correctOption: "A",
      construct: "problem",
      timeLimitSeconds: 30,
    },
    {
      id: "L06-B",
      slotId: "L06",
      situation: "Peggy is talking to Tom about her car.",
      prompt: "Karla ___.",
      optionTexts: [
        "borrowed her parents' car",
        "has her own car",
        "will fix Peggy's car",
        "is buying a new car",
      ],
      correctOption: "C",
      construct: "consequence / current situation",
      timeLimitSeconds: 35,
    },
    {
      id: "L07-B",
      slotId: "L07",
      situation: "Peggy is talking to Tom about her car.",
      prompt: "Peggy doesn't lend money to friends because ___.",
      optionTexts: [
        "it can change the relationship",
        "her friends have plenty of money",
        "she doesn't have much to lend",
        "her parents won't let her",
      ],
      correctOption: "A",
      construct: "attitude / rationale",
      timeLimitSeconds: 35,
    },
  ], true),
  ...listeningBlock("A", "L08-10", "a-q13-16", "B2Entry", [
    {
      id: "L08-A",
      slotId: "L08",
      situation: "Natalie and Chuck are talking about their experiences abroad.",
      prompt: "Chuck went backpacking ___.",
      optionTexts: ["in Brazil", "by himself", "after high school", "with his father"],
      correctOption: "C",
      construct: "supporting detail",
      timeLimitSeconds: 35,
    },
    {
      id: "L09-A",
      slotId: "L09",
      situation: "Natalie and Chuck are talking about their experiences abroad.",
      prompt: 'Chuck says he "would have liked to have seen Portugal." He means that he ___.',
      optionTexts: [
        "went there, and he liked it",
        "didn't go there, but he wanted to",
        "went there, but he didn't like it",
        "didn't go there, and he didn't want to",
      ],
      correctOption: "B",
      construct: "implied / unreal meaning",
      timeLimitSeconds: 35,
    },
    {
      id: "L10-A",
      slotId: "L10",
      situation: "Natalie and Chuck are talking about their experiences abroad.",
      prompt: "Chuck doesn't want to ___.",
      optionTexts: ["travel anymore", "learn a foreign language", "stay at home", "live abroad"],
      correctOption: "D",
      construct: "speaker attitude",
      timeLimitSeconds: 35,
    },
  ], true),
  ...listeningBlock("B", "L08-10", "b-q13-16", "B2Entry", [
    {
      id: "L08-B",
      slotId: "L08",
      situation: "Frank and Liz are talking about their trips abroad.",
      prompt: "Frank went to Argentina ___.",
      optionTexts: ["by himself", "to visit Chad", "after high school", "with his family"],
      correctOption: "D",
      construct: "supporting detail",
      timeLimitSeconds: 35,
    },
    {
      id: "L09-B",
      slotId: "L09",
      situation: "Frank and Liz are talking about their trips abroad.",
      prompt: 'Frank says he "would have liked to have seen Norway." He means that he ___.',
      optionTexts: [
        "wanted to go there, so he went",
        "didn't want to go there, but he went anyway",
        "wanted to go there, but he couldn't",
        "didn't want to go there, so he didn't",
      ],
      correctOption: "C",
      construct: "implied / unreal meaning",
      timeLimitSeconds: 35,
    },
    {
      id: "L10-B",
      slotId: "L10",
      situation: "Frank and Liz are talking about their trips abroad.",
      prompt: "Liz didn't ___.",
      optionTexts: ["live in Beijing", "like Chinese culture", "go to Thailand", "learn Chinese quickly"],
      correctOption: "D",
      construct: "experience / supporting detail",
      timeLimitSeconds: 35,
    },
  ], true),
  confirmationListening("A", {
    id: "C01-A",
    audioId: "a-q13-16",
    situation: "Natalie and Chuck are talking about their experiences abroad.",
    prompt: "While Natalie was in Japan, she ___.",
    optionTexts: [
      "traveled all over the country",
      "lived with a Japanese family",
      "learned Japanese quickly",
      "got very homesick",
    ],
    correctOption: "B",
  }),
  confirmationListening("B", {
    id: "C01-B",
    audioId: "b-q13-16",
    situation: "Frank and Liz are talking about their trips abroad.",
    prompt: "Liz went to China because of her ___.",
    optionTexts: ["job", "father", "school", "friends"],
    correctOption: "B",
  }),
];

type ListeningItem = {
  id: string;
  slotId: string;
  situation: string;
  prompt: string;
  optionTexts: readonly [string, string, string, string];
  correctOption: "A" | "B" | "C" | "D";
  construct: string;
  timeLimitSeconds: number;
};

function listening(value: ListeningItem & {
  form: "A" | "B";
  blockId: string;
  audioId: string;
  evidenceBand: "A1" | "A2" | "B1" | "B2Entry";
  isAnchor?: boolean;
}) {
  return question({
    ...bandMetadata(value.evidenceBand),
    id: value.id,
    slotId: value.slotId,
    section: "listening",
    form: value.form,
    evidenceBand: value.evidenceBand,
    blockId: value.blockId,
    construct: value.construct,
    timeLimitSeconds: value.timeLimitSeconds,
    audioId: value.audioId,
    situation: value.situation,
    prompt: value.prompt,
    options: options(value.optionTexts),
    correctOption: value.correctOption,
    isAnchor: value.isAnchor,
  });
}

function listeningBlock(
  form: "A" | "B",
  blockId: string,
  audioId: string,
  evidenceBand: "A2" | "B1" | "B2Entry",
  items: readonly ListeningItem[],
  isAnchor = false,
) {
  return items.map((item) =>
    listening({ ...item, form, blockId, audioId, evidenceBand, isAnchor }),
  );
}

function confirmationListening(
  form: "A" | "B",
  value: Omit<ListeningItem, "slotId" | "construct" | "timeLimitSeconds"> & { audioId: string },
) {
  return question({
    ...bandMetadata("B2Entry"),
    id: value.id,
    slotId: "C01",
    section: "listening",
    form,
    evidenceBand: "B2Entry",
    blockId: "C01",
    construct: "upper-band supporting detail",
    timeLimitSeconds: 35,
    audioId: value.audioId,
    situation: value.situation,
    prompt: value.prompt,
    options: options(value.optionTexts),
    correctOption: value.correctOption,
    isConfirmation: true,
  });
}
