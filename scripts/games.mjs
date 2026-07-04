// Shared game data helpers: slug, title, category, normalization.
// Used by the build script; category rules are keyword-based (data has no genre).

// Order matters: the first matching rule wins, so put more specific
// categories before broader ones (e.g. Cooking before Sports).
const CATEGORY_RULES = [
  { category: "Cooking", keywords: ["Papa", "Papas", "Sushiria", "Bakeria", "Cheeseria", "Donuteria", "Wingeria", "Freezeria", "Pastaria", "Pancakeria", "Taco-Mia", "Burgeria", "Pizzeria", "Cupcakeria", "Hot-Doggeria", "Cluckeria", "Scooperia", "Cooking", "Sushi", "Burger", "Pizza", "Cake", "Cook", "Chef", "Kitchen", "Bakery", "Cafe", "Restaurant", "Ice-Cream", "Candy", "Donut"] },
  { category: "Racing", keywords: ["Racing", "Race", "Racer", "Drift", "Traffic", "Vehicles", "Vehicle", "Car", "Cars", "Bike", "Moto", "Motorcycle", "Truck", "Wheelie", "Highway", "Speed", "Turbo", "Nitro", "Rally", "Formula", "Kart", "Driving", "Driver", "Parking", "Rush-Hour"] },
  { category: "Idle", keywords: ["Idle", "Clicker", "Tycoon", "Simulator", "Merge", "Incremental", "Paperclips", "Cookie-Clicker", "Capitalist", "Miner", "Factory", "Empire", "Manager"] },
  { category: "Strategy", keywords: ["Bloons", "Kingdom-Rush", "Gemcraft", "Cursed-Treasure", "Tower-Defense", "Tower-Defenders", "Toy-Defense", "Age-Of-War", "Plants-Vs-Zombies", "Pandemic", "Stick-War", "Mighty-Knight", "Doodle-God", "Steambirds", "Caravaneer", "Defense", "Defenders", "Defend", "Chess", "Checkers", "Battle", "War", "Tactics", "Strategy", "Kings-League", "Takeover"] },
  { category: "Sports", keywords: ["Tennis", "Soccer", "Football", "Basketball", "Basket", "Golf", "Bowling", "Bowl", "Pool", "Fishing", "Wrestle", "Boxing", "Baseball", "Volleyball", "Volley", "Pickleball", "Skater", "Skate", "Sumo", "Hockey", "Cricket", "Dunk", "Pro-Skater", "Super-Bowl", "Goal"] },
  { category: "Action", keywords: ["Sift-Heads", "Madness", "Raze", "Strike-Force", "Boxhead", "Hobo", "Electric-Man", "Achilles", "Sonny", "Alien-Hominid", "Epic-Battle-Fantasy", "Bleach-Vs-Naruto", "Super-Smash-Flash", "Sonic-Smash", "Road-Of-The-Dead", "Zombocalypse", "The-Last-Stand", "Tank-Trouble", "Tank", "Tanks", "Mutilate", "Whack", "Defend-Your-Nuts", "Interactive-Buddy", "The-Binding-Of-Isaac", "Armed-With-Wings", "Stickman", "Stick-Duel", "Shooter", "Shoot", "Gun", "Gunfire", "Sniper", "Zombie", "Zombies", "Ninja", "Ninjas", "SWAT", "Fight", "Fighter", "Duel", "Sword", "Knight", "Combat", "Warrior", "Survev", "Massacre", "Space-Wars"] },
  { category: "Platform", keywords: ["Wheely", "Vex", "Red-Ball", "Fireboy", "Fancy-Pants", "Super-Mario", "Mario", "Sonic", "Portal", "Kawairun", "Awesome-Run", "Santa-Run", "Freddy-Nightmare-Run", "Toss-The-Turtle", "Raft-Wars", "Jump", "Jumper", "Jumpers", "Tube-Jumpers", "Parkour", "Run", "Runner", "Climb", "Spelunky", "Big-Tower-Tiny-Square", "Boy", "World"] },
  { category: "Puzzle", keywords: ["Riddle-School", "Cube-Escape", "Trollface", "Bloxorz", "Sugar-Sugar", "Impossible-Quiz", "Impossible-Game", "Double-Wires", "Abandoned", "Word", "Words", "Tiny-Islands", "WIZ", "Zumba-Mania", "Puzzle", "Sudoku", "Mahjong", "Solitaire", "Tetris", "2048", "Unblock", "Uno", "Sort", "Match", "Escape", "Blocks", "Block", "Suika", "Watermelon", "Crossword", "Quiz", "Mind", "Brain", "Logic"] },
  { category: "Adventure", keywords: ["Duck-Life", "Learn-To-Fly", "Earn-To-Die", "Dino-Run", "Qwop", "Bob-The-Robber", "Escaping-The-Prison", "Fleeing-The-Complex", "Infiltrating-The-Airship", "Swords-And-Sandals", "Minecraft", "Abobo", "60-Second", "60-Seconds", "Adventure", "Quest", "Zelda", "Journey", "Explore", "Story", "Legend", "Rpg", "Dungeon", "Isle", "Island"] },
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

export const CATEGORIES = ["Action", "Racing", "Puzzle", "Sports", "Strategy", "Platform", "Adventure", "Cooking", "Idle", "Arcade"];

export const CATEGORY_ICONS = {
  Action: "⚔️",
  Racing: "🏎️",
  Puzzle: "🧩",
  Sports: "⚽",
  Strategy: "♟️",
  Platform: "🏃",
  Adventure: "🗺️",
  Cooking: "🍔",
  Idle: "⏳",
  Arcade: "🕹️",
};
