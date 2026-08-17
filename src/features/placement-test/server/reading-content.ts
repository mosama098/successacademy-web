import type { AssessmentQuestion, ReadingPassage } from "../types";
import { bandMetadata, options, question } from "./content-helpers";

export const readingPassages: readonly ReadingPassage[] = [
  passage("R01-A", "A", "Mariam usually cooks dinner at home. Today, she has a late meeting at work, so she ordered a meal through an app. She will pick it up on her way home."),
  passage("R01-B", "B", "Youssef usually takes the bus to work. This morning, he woke up late, so he booked a car through a ride app. The driver will arrive at his building at eight thirty."),
  passage("R02-A", "A", "Karim is taking an online English course. He studies for thirty minutes after work on Monday, Wednesday, and Thursday. Every Saturday, he joins a live speaking session with his teacher."),
  passage("R02-B", "B", "Salma follows a fitness program on her phone. She exercises at home on Tuesday and Thursday evenings. On Sunday morning, she attends a group class at a nearby gym."),
  passage("R03-04-A", "A", "Many smartphones now include a feature called Focus Mode. When it is turned on, selected apps and notifications can be temporarily paused. Some people use it while studying or working because frequent notifications can interrupt their concentration. The apps are not deleted, and users can return to them when Focus Mode is turned off."),
  passage("R03-04-B", "B", "Most smartphones include a Battery Saver mode. When the battery becomes low, this mode can reduce background activity and limit some features. As a result, the phone may continue working for longer before it needs to be charged. Users can turn normal settings back on when they no longer need to save power."),
  passage("R05-06-A", "A", "Early electric cars often needed many hours to recharge, which made long journeys difficult. Newer batteries can store more energy, and fast-charging stations can add a large amount of power in much less time. As charging networks continue to grow, electric cars are becoming more practical for people who regularly travel long distances."),
  passage("R05-06-B", "B", "Years ago, people often needed cash or a physical bank card to pay for everyday purchases. Today, many phones and smartwatches can store secure digital payment information. Contactless systems have also become more widely available, allowing customers to pay quickly without handling cash."),
  passage("R07-10-A", "A", "Artificial intelligence tools are becoming common in education. Students can use them to explain difficult ideas, practice vocabulary, or receive quick feedback on their work. This can make independent study easier, especially when a teacher is not immediately available.\n\nHowever, using AI effectively requires judgment. If students simply copy an answer without thinking about it, they may finish a task without actually learning anything. AI systems can also produce information that sounds convincing but is incomplete or incorrect.\n\nFor this reason, some educators believe that students should learn how to work with AI rather than avoid it completely. They argue that learners should question the information they receive, compare it with reliable sources, and use AI as a tool that supports their own thinking rather than replaces it."),
  passage("R07-10-B", "B", "Hybrid work has become common in many companies. Employees may spend part of the week working from home and the rest working at an office. Supporters say this arrangement gives workers more flexibility and can reduce the time they spend commuting.\n\nStill, remote work is not ideal for every task. Some teams find that brainstorming, training new employees, and solving complicated problems are easier when people are in the same room. Others argue that online collaboration tools can handle many of these situations effectively.\n\nBecause different jobs have different needs, some organizations are moving away from one fixed rule. Instead, they allow individual teams to decide when meeting in person provides a real benefit."),
  passage("C02", "confirmation", "As AI-generated images and text become more common, deciding whether information can be trusted is becoming more complicated. Knowing that content was created by a machine does not automatically mean that it is false, just as human-created content is not automatically reliable. More important is whether its claims are supported by evidence and whether the source is transparent about how the information was produced."),
];

export const readingQuestions: readonly AssessmentQuestion[] = [
  reading({ id: "R01-A", slotId: "R01", form: "A", blockId: "R01", passageId: "R01-A", evidenceBand: "A1", construct: "direct factual comprehension", timeLimitSeconds: 45, readingTimeSeconds: 20, prompt: "What is Mariam going to do for dinner today?", optionTexts: ["Cook at home", "Eat at work", "Pick up an ordered meal", "Visit a restaurant"], correctOption: "C" }),
  reading({ id: "R01-B", slotId: "R01", form: "B", blockId: "R01", passageId: "R01-B", evidenceBand: "A1", construct: "direct factual comprehension", timeLimitSeconds: 45, readingTimeSeconds: 20, prompt: "How is Youssef going to work this morning?", optionTexts: ["By bus", "By car", "On foot", "By train"], correctOption: "B" }),
  reading({ id: "R02-A", slotId: "R02", form: "A", blockId: "R02", passageId: "R02-A", evidenceBand: "A1", construct: "direct supporting detail", timeLimitSeconds: 45, readingTimeSeconds: 25, prompt: "When does Karim join the live speaking session?", optionTexts: ["Monday", "Wednesday", "Thursday", "Saturday"], correctOption: "D" }),
  reading({ id: "R02-B", slotId: "R02", form: "B", blockId: "R02", passageId: "R02-B", evidenceBand: "A1", construct: "direct supporting detail", timeLimitSeconds: 45, readingTimeSeconds: 25, prompt: "When does Salma attend the group class?", optionTexts: ["Tuesday evening", "Thursday evening", "Sunday morning", "Saturday morning"], correctOption: "C" }),
  ...readingBlock("A", "R03-04", "R03-04-A", "A2", 45, [
    { id: "R03-A", slotId: "R03", prompt: "Why do some people use Focus Mode while studying?", optionTexts: ["To delete unused apps", "To reduce interruptions", "To make the phone faster", "To send more notifications"], correctOption: "B", construct: "purpose / cause", timeLimitSeconds: 55 },
    { id: "R04-A", slotId: "R04", prompt: "What does 'paused' mean in this passage?", optionTexts: ["Permanently removed", "Temporarily stopped", "Downloaded again", "Made louder"], correctOption: "B", construct: "vocabulary from context", timeLimitSeconds: 55 },
  ]),
  ...readingBlock("B", "R03-04", "R03-04-B", "A2", 45, [
    { id: "R03-B", slotId: "R03", prompt: "Why do people use Battery Saver mode?", optionTexts: ["To increase storage", "To make the battery last longer", "To download more apps", "To improve the camera"], correctOption: "B", construct: "purpose / cause", timeLimitSeconds: 55 },
    { id: "R04-B", slotId: "R04", prompt: "What does 'limit' mean in this context?", optionTexts: ["Increase completely", "Reduce or restrict", "Delete permanently", "Copy automatically"], correctOption: "B", construct: "vocabulary from context", timeLimitSeconds: 55 },
  ]),
  ...readingBlock("A", "R05-06", "R05-06-A", "B1", 55, [
    { id: "R05-A", slotId: "R05", prompt: "Why were long journeys more difficult in early electric cars?", optionTexts: ["The cars were too large", "Charging took a long time", "Drivers could not use highways", "Batteries were too expensive to replace"], correctOption: "B", construct: "explicit cause / effect", timeLimitSeconds: 55 },
    { id: "R06-A", slotId: "R06", prompt: "What has made electric cars more practical for long-distance travel?", optionTexts: ["Smaller roads", "Lower speed limits", "Improved batteries and charging networks", "Fewer people driving"], correctOption: "C", construct: "synthesis of supporting details", timeLimitSeconds: 60 },
  ], true),
  ...readingBlock("B", "R05-06", "R05-06-B", "B1", 55, [
    { id: "R05-B", slotId: "R05", prompt: "Why was making a payment less flexible in the past?", optionTexts: ["Shops were smaller", "People usually needed cash or a physical card", "Phones were too expensive", "Banks did not have customers"], correctOption: "B", construct: "explicit cause / effect", timeLimitSeconds: 55 },
    { id: "R06-B", slotId: "R06", prompt: "What has made digital payments easier?", optionTexts: ["Larger shops", "Fewer bank accounts", "Contactless technology and digital wallets", "Slower payment systems"], correctOption: "C", construct: "synthesis of supporting details", timeLimitSeconds: 60 },
  ], true),
  ...readingBlock("A", "R07-10", "R07-10-A", "B1", 90, [
    { id: "R07-A", slotId: "R07", prompt: "What is the main idea of the passage?", optionTexts: ["AI should completely replace teachers.", "Students should never use AI for schoolwork.", "AI can support learning when students use it thoughtfully.", "AI is useful only for learning vocabulary."], correctOption: "C", construct: "main idea", timeLimitSeconds: 60 },
    { id: "R08-A", slotId: "R08", prompt: "According to the passage, what is one risk of using AI?", optionTexts: ["It always takes too long to answer.", "It may provide inaccurate information.", "It cannot explain difficult ideas.", "It prevents students from studying independently."], correctOption: "B", construct: "supporting detail", timeLimitSeconds: 60 },
    { id: "R09-A", slotId: "R09", prompt: "Why does the writer mention students who copy answers without thinking?", optionTexts: ["To show that finishing a task is not the same as learning.", "To prove that AI never gives correct answers.", "To explain why teachers dislike technology.", "To recommend shorter homework assignments."], correctOption: "A", construct: "inference / rhetorical purpose", timeLimitSeconds: 75 },
    { id: "R10-A", slotId: "R10", prompt: "Which statement best describes the writer's attitude toward AI in education?", optionTexts: ["Completely negative", "Completely enthusiastic", "Cautiously positive", "Uninterested"], correctOption: "C", construct: "writer attitude", timeLimitSeconds: 75 },
  ], true),
  ...readingBlock("B", "R07-10", "R07-10-B", "B1", 90, [
    { id: "R07-B", slotId: "R07", prompt: "What is the main idea of the passage?", optionTexts: ["All employees should work from home.", "Office work is always better.", "Hybrid arrangements can work differently depending on the job and team.", "Online tools are no longer useful."], correctOption: "C", construct: "main idea", timeLimitSeconds: 60 },
    { id: "R08-B", slotId: "R08", prompt: "What benefit of hybrid work is mentioned?", optionTexts: ["Higher office costs", "Less commuting time", "More compulsory meetings", "Longer working days"], correctOption: "B", construct: "supporting detail", timeLimitSeconds: 60 },
    { id: "R09-B", slotId: "R09", prompt: "Why does the passage mention brainstorming and training?", optionTexts: ["To give examples of work that may benefit from face-to-face interaction.", "To show those activities are unnecessary.", "To criticize new employees.", "To explain why offices should close."], correctOption: "A", construct: "inference / rhetorical purpose", timeLimitSeconds: 75 },
    { id: "R10-B", slotId: "R10", prompt: "What is the writer's general attitude?", optionTexts: ["Strongly against hybrid work", "Balanced and practical", "Completely in favor of remote work", "Uninterested in workplace changes"], correctOption: "B", construct: "writer attitude", timeLimitSeconds: 75 },
  ], true),
  question({
    ...bandMetadata("B2Entry"),
    id: "C02",
    slotId: "C02",
    section: "reading",
    form: "confirmation",
    evidenceBand: "B2Entry",
    blockId: "C02",
    construct: "nuanced main claim",
    timeLimitSeconds: 75,
    readingTimeSeconds: 60,
    passageId: "C02",
    prompt: "What is the writer's main argument?",
    options: options(["AI-generated content is usually false.", "Human-created content is always trustworthy.", "Reliability should be judged by evidence, not simply by who or what created the content.", "AI content should be banned."]),
    correctOption: "C",
    isConfirmation: true,
  }),
];

type ReadingItem = {
  id: string;
  slotId: string;
  prompt: string;
  optionTexts: readonly [string, string, string, string];
  correctOption: "A" | "B" | "C" | "D";
  construct: string;
  timeLimitSeconds: number;
};

function reading(value: ReadingItem & {
  form: "A" | "B";
  blockId: string;
  passageId: string;
  evidenceBand: "A1" | "A2" | "B1";
  readingTimeSeconds?: number;
  isAnchor?: boolean;
}) {
  return question({
    ...bandMetadata(value.evidenceBand),
    id: value.id,
    slotId: value.slotId,
    section: "reading",
    form: value.form,
    evidenceBand: value.evidenceBand,
    blockId: value.blockId,
    construct: value.construct,
    timeLimitSeconds: value.timeLimitSeconds,
    readingTimeSeconds: value.readingTimeSeconds,
    passageId: value.passageId,
    prompt: value.prompt,
    options: options(value.optionTexts),
    correctOption: value.correctOption,
    isAnchor: value.isAnchor,
  });
}

function readingBlock(
  form: "A" | "B",
  blockId: string,
  passageId: string,
  evidenceBand: "A2" | "B1",
  readingTimeSeconds: number,
  items: readonly ReadingItem[],
  isAnchor = false,
) {
  return items.map((item, index) => reading({
    ...item,
    form,
    blockId,
    passageId,
    evidenceBand,
    readingTimeSeconds: index === 0 ? readingTimeSeconds : undefined,
    isAnchor,
  }));
}

function passage(id: string, form: ReadingPassage["form"], text: string): ReadingPassage {
  return { id, form, text };
}
