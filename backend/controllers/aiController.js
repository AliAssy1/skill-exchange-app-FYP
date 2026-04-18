const db = require('../config/database');

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY MAP
// Maps every word a user might say → a canonical service category.
// Add new rows here as the platform grows — no other code needs to change.
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_MAP = {
  tutoring: [
    'teacher', 'tutor', 'tutoring', 'study', 'studying',
    'math', 'maths', 'mathematics', 'calculus', 'algebra', 'geometry', 'statistics',
    'physics', 'chemistry', 'biology', 'science',
    'exam', 'test', 'homework', 'assignment', 'revision', 'lecture',
    'english', 'literature', 'essay', 'academic', 'university', 'degree',
  ],
  music: [
    'guitar', 'piano', 'keyboard', 'violin', 'viola', 'cello',
    'drums', 'drum', 'bass', 'singing', 'singer', 'vocal', 'voice',
    'music', 'musician', 'instrument', 'song', 'band', 'composition',
  ],
  food: [
    'food', 'hungry', 'hunger', 'eat', 'eating', 'starving', 'famished',
    'cooking', 'cook', 'chef', 'meal', 'recipe', 'baking', 'bake',
    'cuisine', 'nutrition', 'diet',
  ],
  programming: [
    'programming', 'coding', 'code', 'coder', 'developer', 'software',
    'python', 'javascript', 'java', 'typescript', 'cpp', 'c++',
    'html', 'css', 'react', 'node', 'database', 'sql', 'api',
    'web', 'website', 'app', 'mobile', 'backend', 'frontend',
    'computer', 'tech', 'technology',
  ],
  design: [
    'design', 'designer', 'graphic', 'logo', 'poster', 'banner', 'branding',
    'photoshop', 'illustrator', 'figma', 'sketch', 'canva',
    'illustration', 'drawing', 'art', 'artist', 'visual', 'ui', 'ux',
  ],
  language: [
    'language', 'languages', 'translate', 'translation', 'interpreter',
    'spanish', 'french', 'arabic', 'german', 'chinese', 'japanese',
    'italian', 'portuguese', 'russian', 'korean', 'hindi', 'urdu',
    'accent', 'speak', 'speaking', 'conversation', 'fluent',
  ],
  fitness: [
    'fitness', 'gym', 'workout', 'exercise', 'training', 'trainer',
    'yoga', 'pilates', 'sport', 'sports', 'running', 'jogging',
    'weight', 'muscle', 'strength', 'cardio', 'health', 'wellbeing',
    'martial', 'boxing', 'swimming',
  ],
  construction: [
    'construction', 'builder', 'building', 'build',
    'repair', 'fix', 'fixing', 'maintenance',
    'plumber', 'plumbing', 'electrician', 'electric', 'wiring',
    'carpenter', 'carpentry', 'painting', 'decorator',
    'handyman', 'renovation', 'install', 'installation',
  ],
  writing: [
    'writing', 'write', 'writer', 'copywriting', 'copywriter',
    'grammar', 'proofread', 'proofreading', 'editing', 'editor',
    'blog', 'content', 'report', 'cv', 'resume',
  ],
  business: [
    'business', 'accounting', 'accountant', 'finance', 'financial',
    'economics', 'marketing', 'management', 'entrepreneur',
    'startup', 'investment', 'tax', 'bookkeeping',
  ],
  photography: [
    'photo', 'photos', 'photography', 'photographer', 'camera',
    'video', 'videography', 'filming', 'film', 'editing', 'lightroom',
    'portrait', 'wedding', 'event',
  ],
};

// DB search terms used per category — broader than individual keywords so the
// LIKE query can match service titles / descriptions / categories in the DB.
const CATEGORY_SEARCH_TERMS = {
  tutoring:     ['tutor', 'teaching', 'academic', 'study', 'homework'],
  music:        ['music', 'guitar', 'piano', 'violin', 'singing', 'instrument'],
  food:         ['cooking', 'food', 'baking', 'meal', 'chef', 'nutrition'],
  programming:  ['programming', 'coding', 'development', 'software', 'web'],
  design:       ['design', 'graphic', 'art', 'illustration', 'ui', 'ux'],
  language:     ['language', 'spanish', 'french', 'arabic', 'translation'],
  fitness:      ['fitness', 'gym', 'yoga', 'exercise', 'training', 'sport'],
  construction: ['construction', 'repair', 'building', 'handyman', 'plumbing'],
  writing:      ['writing', 'essay', 'grammar', 'english', 'content'],
  business:     ['business', 'accounting', 'finance', 'marketing'],
  photography:  ['photography', 'video', 'photo', 'editing'],
};

// Human-readable label shown in responses
const CATEGORY_LABELS = {
  tutoring:     'tutoring / academic help',
  music:        'music lessons',
  food:         'cooking / food',
  programming:  'programming / tech',
  design:       'design / art',
  language:     'language lessons',
  fitness:      'fitness / sport',
  construction: 'construction / repair',
  writing:      'writing / editing',
  business:     'business / finance',
  photography:  'photography / video',
};

// ─────────────────────────────────────────────────────────────────────────────
// FILLER PHRASES  — stripped from messages before category mapping
// ─────────────────────────────────────────────────────────────────────────────
const FILLER_PHRASES = [
  'is there any', 'is there a', 'is there an', 'is there',
  'are there any', 'are there', 'anyone in', 'anyone who',
  'do you have any', 'do you have a', 'do you have',
  'can i find', 'can you find me', 'can you find',
  "i'm looking for", 'i am looking for', 'looking for',
  'i need a', 'i need an', 'i need',
  'i want a', 'i want an', 'i want',
  'help me find', 'help me with', 'help me',
  'show me', 'get me', 'find me', 'find a', 'find an',
  'i am', "i'm", 'i have', "i've",
  'searching for', 'searching',
  'any good', 'any', 'some', 'please',
  'here', 'around', 'available', 'near me', 'in my area',
  'can you', 'could you', 'would you', 'do you', 'does anyone',
];

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — classifyIntent(message)
// Returns: "greeting" | "conversation" | "service_request" | "unknown"
// ─────────────────────────────────────────────────────────────────────────────

const GREETING_WORDS   = ['hi', 'hey', 'hello', 'howdy', 'hiya', 'yo', 'sup', 'heya', 'greetings'];
const GREETING_PHRASES = ['good morning', 'good afternoon', 'good evening', 'good night'];

// Patterns that indicate the user is chatting, NOT searching for a service
const CONVERSATION_PATTERNS = [
  /^how are you/,
  /^how r u/,
  /^who are you/,
  /^what are you/,
  /^what can you do/,
  /^tell me about yourself/,
  /^(thank|thanks|thx|cheers)/,
  /^(ok|okay|cool|great|nice|awesome|sounds good|got it|understood)(\s|$)/,
  /^(bye|goodbye|see you|cya|take care)(\s|$)/,
  /^(yes|no|yeah|nope|nah|yep|sure)$/,
  /^(lol|haha|hehe|wow|oh|ah|hmm|interesting)(\s|$)/,
  /^i am (tired|bored|happy|sad|excited|fine|okay|good|great|bad|sick|busy|back)/,
  /^i'm (tired|bored|happy|sad|excited|fine|okay|good|great|bad|sick|busy|back)/,
  /^what('s| is) (this|that|it|up|new|happening)/,
  /^(morning|afternoon|evening)(\s|$)/,
];

// Explicit phrases that signal the user wants a service
const SEARCH_TRIGGER_PHRASES = [
  'find', 'search', 'looking for', 'need a', 'need an', 'need some',
  'want a', 'want an', 'is there', 'are there', 'anyone in', 'do you have',
  'show me', 'recommend', 'suggest', 'any service', 'help with', 'help me',
];

function classifyIntent(message) {
  const lower = message.toLowerCase().trim();
  const words = lower.split(/\s+/);

  // ── Greeting ────────────────────────────────────────────────────────────
  if (GREETING_WORDS.includes(words[0]) && words.length <= 4) return 'greeting';
  if (GREETING_PHRASES.some(p => lower.startsWith(p)))         return 'greeting';

  // ── Pure conversation ────────────────────────────────────────────────────
  if (CONVERSATION_PATTERNS.some(p => p.test(lower))) return 'conversation';

  // ── Explicit search trigger ──────────────────────────────────────────────
  if (SEARCH_TRIGGER_PHRASES.some(t => lower.includes(t))) return 'service_request';

  // ── Category keyword present → user is asking about a service ───────────
  if (mapToCategory(lower) !== null) return 'service_request';

  // ── Short or vague message with no signal ───────────────────────────────
  if (words.length <= 2) return 'unknown';

  // ── Multi-word message we couldn't classify — treat as possible search ───
  return 'service_request';
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — mapToCategory(message)
// Strips fillers, then checks every remaining word against CATEGORY_MAP.
// Returns the first matching category string, or null if none found.
// ─────────────────────────────────────────────────────────────────────────────
function mapToCategory(message) {
  // Strip filler phrases (longest first to avoid partial removal)
  const sortedFillers = [...FILLER_PHRASES].sort((a, b) => b.length - a.length);
  let cleaned = message.toLowerCase().trim();
  for (const filler of sortedFillers) {
    cleaned = cleaned.replace(new RegExp(`\\b${filler}\\b`, 'g'), ' ');
  }
  cleaned = cleaned.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const words = cleaned.split(/\s+/).filter(w => w.length > 1);

  // Check each word against every category's keyword list
  for (const word of words) {
    for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
      if (keywords.includes(word)) return category;
    }
  }

  // Also try partial matching for compound words (e.g. "guitarist" contains "guitar")
  for (const word of words) {
    for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
      if (keywords.some(kw => word.includes(kw) || kw.includes(word))) return category;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — searchByCategory(category, userId)
// Uses CATEGORY_SEARCH_TERMS to run a broad DB query, then falls back
// to related categories if the primary one returns nothing.
// ─────────────────────────────────────────────────────────────────────────────
async function searchByCategory(category, userId) {
  const terms = CATEGORY_SEARCH_TERMS[category] || [category];
  const services = await dbQuery(terms, userId);

  if (services.length > 0) {
    const label = CATEGORY_LABELS[category] || category;
    const response =
      `🎯 I found ${services.length} service${services.length > 1 ? 's' : ''} for ${label}:\n\n` +
      formatResults(services) +
      '💡 Tap "View Services in Browse" to see full details!';
    return { response, results: services };
  }

  // Fallback — nothing in the matched category
  const label = CATEGORY_LABELS[category] || category;
  return {
    response:
      `😔 I couldn't find any ${label} services right now.\n\n` +
      `💡 You can:\n• Browse all services to find something similar\n` +
      `• Post a service request yourself\n• Try a different keyword`,
    results: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DB helpers
// ─────────────────────────────────────────────────────────────────────────────
async function dbQuery(terms, userId) {
  if (!terms || terms.length === 0) return [];

  const conditions = terms
    .map(() => '(s.title LIKE ? OR s.description LIKE ? OR s.category LIKE ?)')
    .join(' OR ');
  const params = [];
  terms.forEach(t => params.push(`%${t}%`, `%${t}%`, `%${t}%`));

  const [rows] = await db.query(
    `SELECT DISTINCT s.*, u.full_name AS provider_name, u.reputation_score
     FROM services s
     JOIN users u ON s.user_id = u.id
     WHERE (${conditions})
       AND s.status = 'active'
       AND u.account_status = 'active'
       AND u.id != ?
     GROUP BY s.id
     ORDER BY u.reputation_score DESC
     LIMIT 10`,
    [...params, userId]
  );
  return rows;
}

function formatResults(services) {
  let text = '';
  services.forEach((s, i) => {
    text += `${i + 1}. 📚 ${s.title}\n`;
    text += `   👤 ${s.provider_name}\n`;
    text += `   💰 ${s.credits_cost || 0} credits\n`;
    text += `   ⭐ ${s.reputation_score ? Number(s.reputation_score).toFixed(1) : '5.0'}/5.0\n`;
    if (s.description) {
      text += `   📝 ${s.description.substring(0, 100)}${s.description.length > 100 ? '...' : ''}\n`;
    }
    text += '\n';
  });
  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversation responses
// ─────────────────────────────────────────────────────────────────────────────
function getConversationResponse(intent, message) {
  const lower = message.toLowerCase();

  if (intent === 'greeting') {
    return (
      "Hi there! 👋 I'm your AI Service Finder.\n\n" +
      "I can help you find services like:\n" +
      "• 📚 Tutoring (Maths, Spanish, Programming...)\n" +
      "• 🎵 Music lessons (Guitar, Piano, Singing...)\n" +
      "• 🍳 Cooking / Food\n" +
      "• 💻 Tech & Design\n" +
      "• 🏗 Construction & Repairs\n" +
      "• ...and much more!\n\n" +
      "Just tell me what you need!"
    );
  }

  if (intent === 'conversation') {
    if (/how are you|how r u/.test(lower))
      return "I'm doing great, thanks! 😊 What service can I help you find today?";

    if (/who are you|what are you|what can you do|tell me about/.test(lower))
      return (
        "I'm the AI Service Finder for SkillSwap! 🤖\n\n" +
        "I understand natural language — try asking:\n" +
        "• \"Is there any guitar teacher here?\"\n" +
        "• \"I'm starving — any food service?\"\n" +
        "• \"Anyone in construction?\"\n" +
        "• \"I need help with my Maths exam\""
      );

    if (/thank|thanks|thx|cheers/.test(lower))
      return "You're welcome! 😊 Let me know if you need anything else.";

    if (/bye|goodbye|see you|cya|take care/.test(lower))
      return "Goodbye! 👋 Come back anytime you need help finding services.";

    // Vague emotional / state messages
    if (/i am tired|i'm tired|i am bored|i'm bored/.test(lower))
      return "Sorry to hear that! 😅 Maybe a skill exchange session can cheer you up?\n\nAre you looking for tutoring, music, fitness, or something else?";

    return (
      "I'm here to help! 😊\n\n" +
      "Tell me what kind of service you need and I'll find it for you.\n\n" +
      "Example: \"Is there a cooking class?\" or \"I need a programming tutor\""
    );
  }

  if (intent === 'unknown') {
    return (
      "I'm not sure what you mean. 🤔\n\n" +
      "Are you looking for one of these?\n" +
      "• 📚 Tutoring / academic help\n" +
      "• 🎵 Music lessons\n" +
      "• 🍳 Cooking / food\n" +
      "• 💻 Programming / design\n" +
      "• 🏗 Construction / repairs\n\n" +
      "Just describe what you need in plain words!"
    );
  }

  return null; // service_request → proceed to category search
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────────────────────

// @route POST /api/ai/search
const aiSearch = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const category = mapToCategory(message);
    if (!category) {
      return res.json({
        success: true,
        response:
          "I couldn't identify a service category from your message.\n\n" +
          "Try: \"I need a music tutor\" or \"Is there a cooking class?\"",
        results: [],
      });
    }
    const result = await searchByCategory(category, req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('AI Search error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route POST /api/ai/chat
const aiChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    // AI responses live in frontend state only — never written to messages table.

    // Step 1 — classify
    const intent = classifyIntent(message);

    // Step 2 — handle non-search intents immediately
    const canned = getConversationResponse(intent, message);
    if (canned !== null) {
      return res.json({ success: true, response: canned, results: [] });
    }

    // Step 3 — map to category
    const category = mapToCategory(message);
    if (!category) {
      return res.json({
        success: true,
        response:
          "I'm not sure which type of service you need. 🤔\n\n" +
          "Are you looking for:\n" +
          "• Tutoring, Music, Cooking, Programming, Design,\n" +
          "• Fitness, Languages, Construction, Writing...?\n\n" +
          "Just say something like: \"I need a guitar teacher\" or \"Anyone for construction?\"",
        results: [],
      });
    }

    // Step 4 — search by category
    const result = await searchByCategory(category, req.user.id);
    res.json({ success: true, ...result });

  } catch (err) {
    console.error('AI Chat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { aiSearch, aiChat };
