// Shared game data helpers: slug, title, category, normalization.
// Used by the build script; category rules are keyword-based (data has no genre).

const CATEGORY_RULES = [
  { category: "Cooking", keywords: ["Papa", "Papas", "Sushiria", "Bakeria", "Cheeseria", "Donuteria", "Wingeria", "Freezeria", "Pastaria", "Pancakeria", "Taco-Mia", "Burgeria", "Pizzeria", "Cupcakeria", "Hot-Doggeria", "Cluckeria", "Scooperia"] },
  { category: "Strategy", keywords: ["Bloons", "Kingdom-Rush", "Gemcraft", "Cursed-Treasure", "Tower-Defense", "Age-Of-War", "Plants-Vs-Zombies", "Pandemic", "Stick-War", "Mighty-Knight", "Doodle-God", "Steambirds", "Caravaneer"] },
  { category: "Action", keywords: ["Sift-Heads", "Madness", "Raze", "Strike-Force", "Boxhead", "Hobo", "Electric-Man", "Achilles", "Sonny", "Alien-Hominid", "Epic-Battle-Fantasy", "Bleach-Vs-Naruto", "Super-Smash-Flash", "Sonic-Smash", "Road-Of-The-Dead", "Zombocalypse", "The-Last-Stand", "Tank-Trouble", "Mutilate", "Whack", "Defend-Your-Nuts", "Interactive-Buddy", "The-Binding-Of-Isaac", "Armed-With-Wings"] },
  { category: "Platform", keywords: ["Wheely", "Vex", "Red-Ball", "Fireboy", "Fancy-Pants", "Super-Mario", "Portal", "Kawairun", "Awesome-Run", "Santa-Run", "Freddy-Nightmare-Run", "Toss-The-Turtle", "Raft-Wars", "Jump", "Jumpers", "Tube-Jumpers"] },
  { category: "Puzzle", keywords: ["Riddle-School", "Cube-Escape", "Trollface", "Bloxorz", "Sugar-Sugar", "Impossible-Quiz", "Double-Wires", "Abandoned", "Word", "Tiny-Islands", "WIZ", "Zumba-Mania"] },
  { category: "Sports", keywords: ["Tennis", "Soccer", "Football", "Basketball", "Golf", "Bowling", "Pool", "Fishing", "Wrestle", "Boxing", "Baseball", "Volleyball", "Yahoo-Tennis"] },
  { category: "Adventure", keywords: ["Duck-Life", "Learn-To-Fly", "Earn-To-Die", "Dino-Run", "Qwop", "Bob-The-Robber", "Escaping-The-Prison", "Fleeing-The-Complex", "Infiltrating-The-Airship", "Swords-And-Sandals", "Minecraft", "Abobo", "60-Second", "60-Seconds"] },
];

const DEFAULT_CATEGORY = "Arcade";

export function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function prettyTitle(name) {
  // "Papa-S-Sushiria" -> "Papa's Sushiria"; "Run-3" -> "Run 3"
  let words = String(name).split("-").filter(Boolean);
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    // Merge a lone "S" into the previous word as a possessive: Papa + S -> Papa's
    if (w.toUpperCase() === "S" && out.length > 0) {
      out[out.length - 1] += "'s";
      continue;
    }
    out.push(w.charAt(0).toUpperCase() + w.slice(1));
  }
  return out.join(" ");
}

export function guessCategory(name) {
  // Normalize spaces to hyphens so keyword boundaries match both
  // "Tank-Trouble" (Flash data) and "Tank Trouble" (CSV data).
  const norm = String(name).replace(/\s+/g, "-");
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      const re = new RegExp("(^|-)" + kw + "(-|$)", "i");
      if (re.test(norm)) return rule.category;
    }
  }
  return DEFAULT_CATEGORY;
}

// Titles from the CSV already use spaces and correct casing, so keep them
// as-is; hyphenated Flash names get prettified.
function titleFrom(name) {
  return name.includes("-") ? prettyTitle(name) : name.trim();
}

export function normalize(raw) {
  const slug = slugify(raw.name);
  const game = {
    slug,
    title: titleFrom(raw.name),
    category: guessCategory(raw.name),
    type: raw.type,
  };
  if (raw.type === "multi") game.base = raw.base;
  else game.url = raw.url;
  return game;
}

// Parse a ";"-separated CSV (header: name;url_game) into iframe game records.
export function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const rows = lines.slice(1); // drop header
  const out = [];
  for (const line of rows) {
    const idx = line.indexOf(";");
    if (idx === -1) continue;
    const name = line.slice(0, idx).trim();
    const url = line.slice(idx + 1).trim();
    if (name && url) out.push({ name, url, type: "iframe" });
  }
  return out;
}

export const CATEGORIES = ["Cooking", "Strategy", "Action", "Platform", "Puzzle", "Adventure", "Sports", "Arcade"];

export const CATEGORY_ICONS = {
  Cooking: "🍔",
  Strategy: "♟️",
  Action: "⚔️",
  Platform: "🏃",
  Puzzle: "🧩",
  Adventure: "🗺️",
  Sports: "⚽",
  Arcade: "🕹️",
};
