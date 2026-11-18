import type { Candidate, DiscoverFilters } from "./types";

export const DEMO_CATALOG: Candidate[] = [
  {
    name: "Ananya Rao",
    username: "ananya.slowmornings",
    niche: "Slow living & home",
    followers: 48200,
    email: "hello@ananyarao.example",
    location: "Bengaluru, India",
    bio: "Slow mornings, rented-home styling and the small rituals that make a day feel softer.",
    website: "https://ananyarao.example",
    score: 93,
    summary:
      "A high-fit slow-living creator with a warm, essay-led feed. Her audience is 78% Indian women aged 25–38, and her saved-reel rate is well above the home niche average.",
    tier: "A",
    tags: ["high-fit", "home", "bengaluru"],
  },
  {
    name: "Tara Menon",
    username: "tara.morningedit",
    niche: "Mindful mornings",
    followers: 92800,
    email: "tara@morningedit.example",
    location: "Bengaluru, India",
    bio: "A quieter start to the day. Mindful routines, soft light and small good things.",
    score: 95,
    summary:
      "The strongest overall fit: a morning-ritual creator whose audience and mood match the campaign almost exactly.",
    tier: "A",
    tags: ["high-fit", "mornings", "bengaluru"],
  },
  {
    name: "Kabir Mehta",
    username: "kabirathome",
    niche: "Minimal home styling",
    followers: 112000,
    email: "collaborate@kabirathome.example",
    location: "Mumbai, India",
    bio: "Less, but better. Small-space styling, warm minimalism and honest furniture notes.",
    score: 88,
    summary:
      "A polished minimal-home creator with strong male reach and a high save rate. His small-space series fits the campaign's practical tone.",
    tier: "A",
    tags: ["home", "mumbai", "warm-minimal"],
  },
  {
    name: "Meera Iyer",
    username: "meera.everyday",
    niche: "Everyday wellness",
    followers: 76500,
    email: "hello@meeraeveryday.example",
    location: "Chennai, India",
    bio: "Gentle wellness for real life. Food, rest and routines that do not demand a perfect day.",
    score: 86,
    summary:
      "An everyday-wellness creator with unusually high comment depth. Her audience responds to honest, unpolished routines.",
    tier: "A",
    tags: ["wellness", "chennai"],
  },
  {
    name: "Sana Sheikh",
    username: "sanastudio",
    niche: "Home office & productivity",
    followers: 27900,
    email: "studio@sanastudio.example",
    location: "Hyderabad, India",
    bio: "Calm desks, honest productivity and a softer relationship with work.",
    score: 84,
    summary:
      "A small but intentional home-office creator. Her audience is close to the brand's core customer and her content style is calm without being bland.",
    tier: "B",
    tags: ["home-office", "hyderabad"],
  },
  {
    name: "Farah Ali",
    username: "farahwellness",
    niche: "Sleep & recovery",
    followers: 66400,
    email: "hello@farahwellness.example",
    location: "Lucknow, India",
    bio: "Better sleep, softer evenings and recovery rituals for tired people.",
    score: 83,
    summary:
      "A sleep-and-recovery creator with a calm, credible voice. Strong fit for the evening ritual angle.",
    tier: "B",
    tags: ["sleep", "evening"],
  },
  {
    name: "Dev Patel",
    username: "devbrews",
    niche: "Coffee & rituals",
    followers: 59300,
    email: "hi@devbrews.example",
    location: "Ahmedabad, India",
    bio: "Slow coffee, quiet mornings, and the ritual of making one good cup.",
    score: 82,
    summary:
      "A rituals-led creator with a loyal, high-intent audience. Natural fit for the morning brew series.",
    tier: "B",
    tags: ["coffee", "rituals"],
  },
  {
    name: "Leela Krishnan",
    username: "leela.linen",
    niche: "Conscious fashion",
    followers: 38200,
    email: "hello@leelalinen.example",
    location: "Coimbatore, India",
    bio: "Linen-first dressing, natural dye and a slower relationship with what we wear.",
    score: 80,
    summary:
      "A conscious-fashion creator whose linen-first values overlap naturally with the collection.",
    tier: "B",
    tags: ["fashion", "linen"],
  },
  {
    name: "Rhea Kapoor",
    username: "rheamakes",
    niche: "DIY & crafts",
    followers: 33400,
    email: "rhea@rheamakes.example",
    location: "Pune, India",
    bio: "Making ordinary things by hand. Clay, paper, and weekend projects for slow afternoons.",
    score: 78,
    summary:
      "A craft-led creator with a small but highly engaged audience. Good fit for the ceramics story.",
    tier: "B",
    tags: ["craft", "pune"],
  },
  {
    name: "Nisha Verma",
    username: "nishagrows",
    niche: "Urban gardening",
    followers: 21700,
    email: "hello@nishagrows.example",
    location: "Delhi, India",
    bio: "Balcony gardening, seasonal seeds and small green corners in a busy city.",
    score: 73,
    summary:
      "A practical urban-gardening creator. Smaller reach, but an engaged local audience.",
    tier: "B",
    tags: ["gardening", "delhi"],
  },
  {
    name: "Priya Desai",
    username: "priyaplants",
    niche: "Plants & interiors",
    followers: 18900,
    email: "priya@priyaplants.example",
    location: "Surat, India",
    bio: "Plants in small homes, soft corners and the slow joy of watching things grow.",
    score: 71,
    summary:
      "A micro-creator with a very engaged plant-and-interiors audience. A warm, low-cost partnership candidate.",
    tier: "C",
    tags: ["plants", "surat"],
  },
  {
    name: "Ishaan Bose",
    username: "ishaan.frames",
    niche: "Photography & lifestyle",
    followers: 41600,
    email: "hello@ishaanframes.example",
    location: "Kolkata, India",
    bio: "Quiet frames of ordinary days. Film photography and unhurried city walks.",
    score: 69,
    summary:
      "A beautiful visual storyteller with a quieter commercial fit. Approach only with a strong visual concept.",
    tier: "C",
    tags: ["photography", "kolkata"],
  },
  {
    name: "Arjun Nair",
    username: "arjunoutdoors",
    niche: "Outdoor & travel",
    followers: 154000,
    email: "hello@arjunoutdoors.example",
    location: "Kochi, India",
    bio: "Weekend trails, slow travel and the gear that earns its place in the bag.",
    score: 64,
    summary:
      "A strong outdoor creator, but a weaker fit for a home-and-ritual campaign. Audience overlap is limited.",
    tier: "C",
    tags: ["outdoor", "travel"],
  },
  {
    name: "Aditya Kulkarni",
    username: "adityaeats",
    niche: "Food & hosting",
    followers: 205000,
    email: "collab@adityaeats.example",
    location: "Pune, India",
    bio: "Weekend tables, generous food and the people who gather around them.",
    score: 58,
    summary:
      "A large food creator with broad reach. Keep as a secondary option if the campaign expands into hosting.",
    tier: "C",
    tags: ["food", "hosting"],
  },
  {
    name: "Vihaan Reddy",
    username: "vihaanhome",
    niche: "Minimal home styling",
    followers: 130000,
    email: null,
    location: "Hyderabad, India",
    bio: "Warm minimalism, apartment tours and practical design notes.",
    score: 76,
    summary:
      "A strong visual fit, but no public business email is listed. Keep in research until a compliant contact route is confirmed.",
    tier: "B",
    tags: ["home", "no-email"],
  },
  {
    name: "Diya Shah",
    username: "diyaslowtable",
    niche: "Food & hosting",
    followers: 44100,
    email: "hello@diyaslowtable.example",
    location: "Ahmedabad, India",
    bio: "Slow lunches, seasonal tables and the quiet pleasure of feeding people well.",
    score: 79,
    summary:
      "A slow-hosting creator whose table styling could carry a beautiful product-led story. Good crossover with the linen range.",
    tier: "B",
    tags: ["hosting", "ahmedabad", "linen"],
  },
  {
    name: "Nikhil Menon",
    username: "nikhilreads",
    niche: "Slow living & home",
    followers: 26400,
    email: "hello@nikhilreads.example",
    location: "Bengaluru, India",
    bio: "Books, long mornings and the case for doing a little less.",
    score: 77,
    summary:
      "A thoughtful slow-living voice with a bookish, loyal audience. Strong resonance with the brand essay style.",
    tier: "B",
    tags: ["slow-living", "books"],
  },
  {
    name: "Aisha Khan",
    username: "aisha.rituals",
    niche: "Everyday wellness",
    followers: 51200,
    email: "hello@aisharituals.example",
    location: "Mumbai, India",
    bio: "Small rituals for crowded days. Skincare, tea and ten quiet minutes.",
    score: 81,
    summary:
      "A rituals-led wellness creator with a practical, warm voice. Her ten-minute reset format suits stories especially well.",
    tier: "B",
    tags: ["wellness", "rituals", "mumbai"],
  },
  {
    name: "Rohan Das",
    username: "rohan.woodwork",
    niche: "DIY & crafts",
    followers: 37900,
    email: "hello@rohanwoodwork.example",
    location: "Guwahati, India",
    bio: "Small woodwork projects, repair over replace and tools that last.",
    score: 68,
    summary:
      "A repair-and-craft creator with a practical audience. A good fit for a behind-the-scenes making story.",
    tier: "C",
    tags: ["woodwork", "craft"],
  },
  {
    name: "Maya Pillai",
    username: "maya.winddown",
    niche: "Sleep & recovery",
    followers: 88400,
    email: "hello@mayawinddown.example",
    location: "Kochi, India",
    bio: "Wind-down routines, better sleep and the art of ending the day gently.",
    score: 87,
    summary:
      "A strong sleep-and-evening creator with a calm, credible presence. Could anchor the evening ritual chapter.",
    tier: "A",
    tags: ["sleep", "evening", "kochi"],
  },
  {
    name: "Ira Bansal",
    username: "ira.ceramics",
    niche: "DIY & crafts",
    followers: 19300,
    email: "hello@iraceramics.example",
    location: "Jaipur, India",
    bio: "Hand-built ceramics, glaze tests and slow studio days.",
    score: 74,
    summary:
      "A ceramics creator with an intimate studio audience. Natural fit for a maker-to-maker story.",
    tier: "B",
    tags: ["ceramics", "jaipur"],
  },
  {
    name: "Zoya Rahman",
    username: "zoya.table",
    niche: "Food & hosting",
    followers: 63100,
    email: "hello@zoyatable.example",
    location: "Hyderabad, India",
    bio: "Everyday tables, generous portions and the people who make a house feel full.",
    score: 72,
    summary:
      "A hosting creator with a warm, family-led audience. Better fit for a tableware story than the morning campaign.",
    tier: "C",
    tags: ["food", "hosting"],
  },
  {
    name: "Karan Joshi",
    username: "karan.minimal",
    niche: "Minimal home styling",
    followers: 142000,
    email: "hello@karanminimal.example",
    location: "Delhi, India",
    bio: "One-room living, warm minimalism and fewer, better things.",
    score: 85,
    summary:
      "A large minimal-home creator with a clean, architectural eye. Strong reach, but a more polished commercial tone.",
    tier: "A",
    tags: ["home", "minimal", "delhi"],
  },
  {
    name: "Sara Thomas",
    username: "sara.slowdays",
    niche: "Slow living & home",
    followers: 22400,
    email: "hello@saraslowdays.example",
    location: "Goa, India",
    bio: "Slow days by the coast. Natural textures, open windows and unhurried food.",
    score: 82,
    summary:
      "A coastal slow-living creator with a beautiful visual world. Strong fit for the linen and outdoor morning story.",
    tier: "B",
    tags: ["slow-living", "goa", "linen"],
  },
  {
    name: "Neel Shah",
    username: "neelplants",
    niche: "Plants & interiors",
    followers: 31600,
    email: "hello@neelplants.example",
    location: "Vadodara, India",
    bio: "Indoor plants, repotting days and green corners for rented homes.",
    score: 70,
    summary:
      "A practical plants creator with a helpful, tutorial-led feed. Good for a low-production stories partnership.",
    tier: "C",
    tags: ["plants", "tutorial"],
  },
];

export function filterCatalog(filters: DiscoverFilters): Candidate[] {
  const query = filters.query?.trim().toLowerCase();
  const niche = filters.niche?.trim().toLowerCase();
  const location = filters.location?.trim().toLowerCase();
  const min = filters.minFollowers ?? 0;
  const max = filters.maxFollowers ?? Number.MAX_SAFE_INTEGER;

  return DEMO_CATALOG.filter((candidate) => {
    if (candidate.followers < min || candidate.followers > max) return false;
    if (filters.emailOnly && !candidate.email) return false;
    if (niche && niche !== "all" && candidate.niche.toLowerCase() !== niche) return false;
    if (location && location !== "all" && !candidate.location.toLowerCase().includes(location)) return false;
    if (query) {
      const haystack = [
        candidate.name,
        candidate.username,
        candidate.niche,
        candidate.location,
        candidate.bio,
        ...candidate.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  }).sort((a, b) => b.score - a.score);
}

export const LOCATIONS = [
  "All locations",
  "Bengaluru",
  "Mumbai",
  "Chennai",
  "Pune",
  "Kochi",
  "Hyderabad",
  "Ahmedabad",
  "Delhi",
  "Kolkata",
  "Surat",
  "Coimbatore",
  "Lucknow",
  "Guwahati",
  "Jaipur",
  "Goa",
  "Vadodara",
];
