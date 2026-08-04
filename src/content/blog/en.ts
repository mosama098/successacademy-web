import type { BlogArticle } from "./types";

// Add future English articles to this array and use the same slug in the Arabic file.
export const enBlogArticles: BlogArticle[] = [
  {
    slug: "improve-english-speaking",
    title: "How to Improve Your English Speaking Skills",
    excerpt:
      "Practical steps to help you speak with more confidence and turn the words and grammar you know into real communication.",
    publishDate: "2026-08-03",
    readingTime: "6 min read",
    category: "Speaking Skills",
    image: "/images/blog/speaking-cover.svg",
    seoTitle: "How to Improve Your English Speaking Skills | Success Academy",
    seoDescription:
      "A practical guide to improving English speaking through consistent practice, active listening, and useful feedback.",
    content: [
      {
        type: "paragraph",
        text: "Many learners understand vocabulary and grammar but hesitate when it is time to speak. The answer is not simply to memorise more. You need regular opportunities to use what you know in situations that feel relevant to your life.",
      },
      { type: "heading", text: "Start with simple, repeatable conversations" },
      {
        type: "paragraph",
        text: "Choose topics you meet every day: introducing yourself, describing your work, asking for help, or explaining something that happened. Prepare short, clear sentences and say them aloud until they begin to feel natural.",
      },
      { type: "heading", text: "Turn listening into active practice" },
      {
        type: "list",
        items: [
          "Listen to one short recording that matches your level.",
          "Repeat one or two sentences with similar rhythm and pronunciation.",
          "Use the same expression in a sentence about your own life.",
        ],
      },
      { type: "heading", text: "Give every practice session a purpose" },
      {
        type: "paragraph",
        text: "Set one small outcome for each session: ask and answer questions, explain an opinion, or tell a short story. A clear outcome makes progress easier to notice and keeps your practice focused.",
      },
      { type: "heading", text: "Use correction that keeps you communicating" },
      {
        type: "paragraph",
        text: "Useful correction does not interrupt every word. Finish your idea first, then review the mistakes that affected meaning or clarity. Say the sentence again so the improved version becomes part of your active English.",
      },
      { type: "heading", text: "Consistency matters more than long sessions" },
      {
        type: "paragraph",
        text: "Ten or fifteen minutes of regular speaking is more useful than one long session every few weeks. Record yourself, review one new expression, and use it again the next day. Confidence and response speed improve together over time.",
      },
    ],
  },
  {
    slug: "english-progress-mistakes",
    title: "Mistakes That Slow Down Your English Progress",
    excerpt:
      "Recognise the habits that produce plenty of effort but limited progress, and replace them with a clearer learning routine.",
    publishDate: "2026-07-27",
    readingTime: "5 min read",
    category: "English Progress",
    image: "/images/blog/progress-cover.svg",
    seoTitle: "Mistakes That Slow Down Your English Progress | Success Academy",
    seoDescription:
      "Common English learning mistakes that slow progress, with practical ways to organise practice and get clearer results.",
    content: [
      {
        type: "paragraph",
        text: "Slow progress does not always mean that you lack ability. Sometimes the learning approach is the problem: too many resources, unclear goals, and too little practice of the skills you actually need.",
      },
      { type: "heading", text: "Jumping between too many resources" },
      {
        type: "paragraph",
        text: "Every resource starts from a different point and follows a different sequence. Constant switching keeps you near the beginning. Choose one main learning path and use other resources only when they support it.",
      },
      { type: "heading", text: "Memorising words without context" },
      {
        type: "paragraph",
        text: "A word is easier to remember when it belongs to a sentence and a situation. Learn fewer words at a time, then write a sentence for each one that relates to your work, studies, or daily life.",
      },
      { type: "heading", text: "Waiting until you feel ready to speak" },
      {
        type: "list",
        items: [
          "Begin with short sentences instead of waiting for perfect ones.",
          "Allow mistakes during practice.",
          "Review repeated errors after the conversation ends.",
        ],
      },
      { type: "heading", text: "Studying without a measurable goal" },
      {
        type: "paragraph",
        text: "A goal such as 'be better at English' is hard to track. Turn it into a result: introduce yourself for two minutes, write a work email, or understand a call about a familiar topic. Clear outcomes guide useful practice.",
      },
      { type: "heading", text: "Skipping review and feedback" },
      {
        type: "paragraph",
        text: "Practice matters, but review stops the same errors from becoming habits. Keep a short record of recurring mistakes and useful expressions, then revisit them in different situations.",
      },
    ],
  },
  {
    slug: "choose-right-english-course",
    title: "How to Choose the Right English Course",
    excerpt:
      "Simple criteria to help you compare programmes and choose training that fits your level, goal, and preferred way of learning.",
    publishDate: "2026-07-20",
    readingTime: "6 min read",
    category: "Course Guidance",
    image: "/images/blog/course-cover.svg",
    seoTitle: "How to Choose the Right English Course | Success Academy",
    seoDescription:
      "Learn the key criteria for choosing an English course that matches your level and goals, from assessment to practice and follow-up.",
    content: [
      {
        type: "paragraph",
        text: "The right course is not necessarily the most popular or the longest. A good choice begins with your current level, the result you need, and the time you can realistically commit.",
      },
      { type: "heading", text: "Start with a meaningful level assessment" },
      {
        type: "paragraph",
        text: "A useful assessment is more than a grammar quiz. It should show how well you understand and use English, then recommend a starting point that is neither too easy nor unnecessarily difficult.",
      },
      { type: "heading", text: "Connect the programme to your goal" },
      {
        type: "list",
        items: [
          "For work, focus on professional conversations, emails, and meetings.",
          "For university, prioritise comprehension, writing, and presenting ideas clearly.",
          "For travel and daily life, choose training built around realistic situations.",
        ],
      },
      { type: "heading", text: "Ask how the training works" },
      {
        type: "paragraph",
        text: "Find out how much time is spent explaining and how much is spent using English. Practical programmes create space for speaking, activities, and application, followed by clear correction and another chance to try.",
      },
      { type: "heading", text: "Look for clear follow-up" },
      {
        type: "paragraph",
        text: "Regular follow-up helps you understand your progress and where to focus next. Ask how feedback is delivered and what support is available when you miss a session or find a topic difficult.",
      },
      { type: "heading", text: "Choose a schedule you can maintain" },
      {
        type: "paragraph",
        text: "Compare schedules, delivery modes, and the commitment each option requires. The best programme combines effective training with a routine you can sustain, because regular attendance is part of the result.",
      },
    ],
  },
];
