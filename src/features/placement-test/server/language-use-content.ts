import type { AssessmentQuestion, EvidenceBand } from "../types";
import { bandMetadata, options, question } from "./content-helpers";

type LanguageItem = {
  slotId: string;
  form: "A" | "B";
  evidenceBand: EvidenceBand;
  construct: string;
  prompt: string;
  optionTexts: readonly [string, string, string, string];
  correctOption: "A" | "B" | "C" | "D";
  timeLimitSeconds: number;
};

export const languageUseQuestions: readonly AssessmentQuestion[] = [
  language("LU01", "A", "A1", "There is / There are", "___ several useful lessons in this section.", ["There", "There is", "There are", "They're"], "C", 25),
  language("LU01", "B", "A1", "There is / There are", "___ two open seats near the window.", ["There", "There is", "There are", "They're"], "C", 25),
  language("LU02", "A", "A1", "negative agreement", '"I don\'t watch much TV."\n"I don\'t, ___."', ["too", "either", "so", "neither"], "B", 25),
  language("LU02", "B", "A1", "negative agreement", '"I can\'t study late at night."\n"I can\'t, ___."', ["too", "either", "so", "neither"], "B", 25),
  language("LU03", "A", "A2", "verb + gerund", "Mona enjoys ___ English podcasts on the way to work.", ["listen to", "listening to", "to listening", "listened to"], "B", 25),
  language("LU03", "B", "A2", "verb + gerund", "Omar avoids ___ his phone while he is driving.", ["use", "using", "to using", "used"], "B", 25),
  language("LU04", "A", "A2", "-ed / -ing adjective distinction", "The documentary was surprisingly ___.", ["interested", "interesting", "interest", "interestingly"], "B", 25),
  language("LU04", "B", "A2", "-ed / -ing adjective distinction", "The long lecture was quite ___.", ["bored", "boring", "bore", "boringly"], "B", 25),
  language("LU05", "A", "A2", "superlative", "This is ___ option for people who need a quick solution.", ["easier", "easiest", "the easiest", "the easier"], "C", 25),
  language("LU05", "B", "A2", "superlative", "That is ___ route to the city center.", ["shorter", "shortest", "the shortest", "the shorter"], "C", 25),
  language("LU06", "A", "B1", "tag question with present perfect", "You've met our new teacher before, ___?", ["don't you", "haven't you", "didn't you", "aren't you"], "B", 30),
  language("LU06", "B", "B1", "tag question with present perfect", "They've finished the report already, ___?", ["don't they", "haven't they", "didn't they", "aren't they"], "B", 30),
  language("LU07", "A", "B1", "wish + past perfect", "I missed the train. I wish I ___ home earlier.", ["leave", "left", "had left", "have left"], "C", 30),
  language("LU07", "B", "B1", "wish + past perfect", "I failed the exam. I wish I ___ more carefully.", ["study", "studied", "had studied", "have studied"], "C", 30),
  language("LU08", "A", "B1", "embedded question word order", "Could you tell me when ___?", ["does the course begin", "the course begins", "begins the course", "the course does begin"], "B", 30),
  language("LU08", "B", "B1", "embedded question word order", "Do you know where ___?", ["is the meeting", "the meeting is", "the meeting does be", "does the meeting be"], "B", 30),
  language("LU09", "A", "B1", "present perfect continuous", "Sara ___ English online for nearly two years.", ["studies", "studied", "has been studying", "is study"], "C", 30),
  language("LU09", "B", "B1", "present perfect continuous", "Ali ___ on this project since January.", ["works", "worked", "has been working", "is work"], "C", 30),
  language("LU10", "A", "B1", "second conditional", "If I had more time, I ___ another course.", ["take", "will take", "would take", "took"], "C", 30),
  language("LU10", "B", "B1", "second conditional", "If she knew the answer, she ___ us.", ["tells", "will tell", "would tell", "told"], "C", 30),
  language("LU11", "A", "B1", "would you mind + gerund", "Would you mind ___ the window?", ["close", "closing", "to close", "closed"], "B", 30),
  language("LU11", "B", "B1", "would you mind + gerund", "Would you mind ___ the music down?", ["turn", "turning", "to turn", "turned"], "B", 30),
  language("LU12", "A", "B2Entry", "passive infinitive", "The application needs ___ before the deadline.", ["submit", "submitting it", "to be submitted", "to submitting"], "C", 35),
  language("LU12", "B", "B2Entry", "passive infinitive", "These documents need ___ by a manager.", ["sign", "signing them", "to be signed", "to signing"], "C", 35),
  language("LU13", "A", "B2Entry", "future perfect", "By the end of this year, he ___ all four levels.", ["completes", "completed", "will have completed", "has completing"], "C", 35),
  language("LU13", "B", "B2Entry", "future perfect", "By next Friday, the team ___ the project.", ["finishes", "finished", "will have finished", "has finishing"], "C", 35),
  language("LU14", "A", "B2Entry", "modal perfect deduction", "Her laptop is here, but she isn't. She must ___ without it.", ["leave", "have left", "leaving", "left"], "B", 35),
  language("LU14", "B", "B2Entry", "modal perfect deduction", "His keys are gone. He must ___ them with him.", ["take", "have taken", "taking", "took"], "B", 35),
  language("LU15", "A", "B2Entry", "be used to + gerund", "He works from home now, so he's used to ___ online meetings.", ["attend", "attending", "attended", "have attended"], "B", 35),
  language("LU15", "B", "B2Entry", "be used to + gerund", "She presents every week, so she's used to ___ in public.", ["speak", "speaking", "spoke", "have spoken"], "B", 35),
  language("LU16", "A", "B2Entry", "defining relative clause", "The trainer ___ gave yesterday's workshop is from London.", ["which", "whose", "who", "whom he"], "C", 35),
  language("LU16", "B", "B2Entry", "defining relative clause", "The employee ___ leads this team speaks three languages.", ["which", "whose", "who", "whom she"], "C", 35),
  confirmation("C03", "third conditional", "If we ___ the warning earlier, we could have avoided the problem.", ["saw", "had seen", "would see", "have seen"], "B"),
  confirmation("C04", "mandative subjunctive", "The manager recommended that every employee ___ the training.", ["completes", "completed", "complete", "completing"], "C"),
];

function language(
  slotId: string,
  form: "A" | "B",
  evidenceBand: EvidenceBand,
  construct: string,
  prompt: string,
  optionTexts: readonly [string, string, string, string],
  correctOption: "A" | "B" | "C" | "D",
  timeLimitSeconds: number,
) {
  return createLanguage({
    slotId,
    form,
    evidenceBand,
    construct,
    prompt,
    optionTexts,
    correctOption,
    timeLimitSeconds,
  });
}

function createLanguage(value: LanguageItem): AssessmentQuestion {
  return question({
    ...bandMetadata(value.evidenceBand),
    id: `${value.slotId}-${value.form}`,
    slotId: value.slotId,
    section: "languageUse",
    form: value.form,
    evidenceBand: value.evidenceBand,
    blockId: value.slotId,
    construct: value.construct,
    timeLimitSeconds: value.timeLimitSeconds,
    prompt: value.prompt,
    options: options(value.optionTexts),
    correctOption: value.correctOption,
    isAnchor: value.evidenceBand === "B1",
  });
}

function confirmation(
  slotId: "C03" | "C04",
  construct: string,
  prompt: string,
  optionTexts: readonly [string, string, string, string],
  correctOption: "A" | "B" | "C" | "D",
) {
  return question({
    ...bandMetadata("B2Entry"),
    id: slotId,
    slotId,
    section: "languageUse",
    form: "confirmation",
    evidenceBand: "B2Entry",
    blockId: slotId,
    construct,
    timeLimitSeconds: 35,
    prompt,
    options: options(optionTexts),
    correctOption,
    isConfirmation: true,
  });
}
