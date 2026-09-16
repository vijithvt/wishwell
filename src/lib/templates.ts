export const templates = [
  {
    id: "midnight-sonata",
    name: "Midnight Sonata",
    background: "#0c192b",
    foreground: "#e8cb8e",
    category: "Music",
    image: "/templates/midnight-sonata.png",
  },
  {
    id: "rose-rhapsody",
    name: "Rose Rhapsody",
    background: "#f1d6d7",
    foreground: "#773a49",
    category: "Floral",
    image: "/templates/rose-rhapsody.png",
  },
  {
    id: "ivory-overture",
    name: "Ivory Overture",
    background: "#f4eddf",
    foreground: "#67502e",
    category: "Minimal",
    image: "/templates/ivory-overture.png",
  },
  {
    id: "emerald-encore",
    name: "Emerald Encore",
    background: "#123c31",
    foreground: "#edcf8a",
    category: "Music",
    image: "/templates/emerald-encore.png",
  },
  {
    id: "lavender-dream",
    name: "Lavender Dream",
    background: "#eee3f5",
    foreground: "#66417e",
    category: "Floral",
    image: "/templates/lavender-dream.png",
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    background: "#eed0ad",
    foreground: "#814124",
    category: "Celebration",
    image: "/templates/golden-hour.png",
  },
  {
    id: "blue-harmony",
    name: "Blue Harmony",
    background: "#dcecf6",
    foreground: "#295782",
    category: "Music",
    image: "/templates/blue-harmony.png",
  },
  {
    id: "confetti-pop",
    name: "Confetti Pop",
    background: "#fcf1dc",
    foreground: "#a44842",
    category: "Celebration",
    image: "/templates/confetti-pop.png",
  },
  {
    id: "botanical-wish",
    name: "Botanical Wish",
    background: "#e4eadc",
    foreground: "#47624c",
    category: "Floral",
    image: "/templates/botanical-wish.png",
  },
  {
    id: "cosmic-celebration",
    name: "Cosmic Celebration",
    background: "#211937",
    foreground: "#ead3a4",
    category: "Celebration",
    image: "/templates/cosmic-celebration.png",
  },
];
export function quoteFor(type: string, course = "") {
  if (type === "company")
    return "Here’s to new possibilities, meaningful moments, and a wonderful year ahead.";
  if (type === "school")
    return "Stay curious, dream boldly, and let every day teach you something wonderful.";
  const quotes: Record<string, string> = {
    Piano: "May every key you play open a new world of possibility.",
    Guitar: "Keep finding your rhythm and making every string sing.",
    Vocals: "Your voice is a gift. Let it grow brighter with every new year.",
    Violin:
      "Let passion guide your bow and fill your year with beautiful melodies.",
    Drums: "Follow your own beat. The world is waiting for your rhythm.",
  };
  return (
    quotes[course] ||
    "Keep learning, keep dreaming, and let your music fill the world with joy."
  );
}

const musicQuotes = [
  "Every small practice becomes part of a beautiful melody. Keep growing this year.",
  "May your birthday begin a year of new songs, brave first notes, and joyful discoveries.",
  "Great music starts with curiosity. Keep listening, learning, and finding your own sound.",
  "Celebrate how far you have come, and enjoy every note of the journey ahead.",
  "A little practice, a little patience, and a heart full of music can take you anywhere.",
  "Let this year bring new rhythms to learn and beautiful memories to compose.",
];
const instrumentQuotes: Record<string, string[]> = {
  piano: [
    "Let each new key unlock a little more confidence. Happy birthday!",
    "From your first scales to your favorite sonata, every note is progress.",
    "May your year be filled with bright chords and discoveries at the piano.",
  ],
  guitar: [
    "One chord at a time, you are creating your own beautiful story.",
    "May your birthday bring fresh inspiration and new songs for your strings.",
    "Keep practicing, keep strumming, and let your confidence ring out.",
  ],
  vocals: [
    "Keep exploring your voice. Every song is a new chance to shine.",
    "May your year be full of joyful singing and the courage to be heard.",
    "With every breath and every lesson, your own sound grows stronger.",
  ],
  violin: [
    "Every patient stroke of the bow brings a new melody within reach.",
    "May your birthday bring joyful lessons and music that makes your spirit soar.",
    "Keep listening closely and playing bravely. Your violin has stories to tell.",
  ],
  drums: [
    "May every new rhythm bring a little more joy to your year.",
    "Steady practice and a playful spirit make a wonderful beat. Keep going!",
    "Celebrate another year of finding your groove and growing your skills.",
  ],
};
export function quotesFor(type: string, course = ""): string[] {
  if (type === "company")
    return [
      quoteFor(type),
      "Wishing you a birthday full of joy and a year full of possibilities.",
      "Your ideas and energy make a difference. Here is to another wonderful year.",
      "Celebrate your achievements, enjoy your day, and look forward to what comes next.",
      "May this new chapter bring inspiration, happiness, and moments worth celebrating.",
      "Today we celebrate you and everything you bring to our team.",
      "Wishing you fresh adventures, meaningful success, and plenty of reasons to smile.",
      "Here is to a year of personal growth, good company, and happy memories.",
      "May your birthday be as thoughtful and bright as the work you share with us.",
      "A special day for a valued teammate. Enjoy every moment of your celebration.",
    ];
  if (type === "school")
    return [
      quoteFor(type),
      "Another year to ask questions, discover new interests, and follow your dreams.",
      "May your birthday open a chapter full of learning, friendship, and adventure.",
      "Every question is a new beginning. Keep your curiosity shining this year.",
      "Celebrate your progress and all the wonderful things you have yet to discover.",
      "Big dreams grow through small steps. Enjoy every step of your new year.",
      "Wishing you a birthday filled with smiles and a year filled with discovery.",
      "Keep reading, exploring, and believing in the things you can become.",
      "May new friendships and exciting ideas make this your happiest chapter yet.",
      "Your imagination makes the world more interesting. Keep sharing it!",
    ];
  const normalized = course.trim().toLowerCase();
  const canonical = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return [
    quoteFor("music", canonical),
    ...(instrumentQuotes[normalized] || [
      "Your next favorite melody may begin with today's practice.",
      "May your birthday inspire new sounds and a lifelong love of learning.",
      "Keep making music, sharing joy, and discovering what you can do.",
    ]),
    ...musicQuotes,
  ];
}
