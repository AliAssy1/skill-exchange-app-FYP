const Anthropic = require('@anthropic-ai/sdk');
const db = require('../config/database');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an advanced AI assistant embedded inside a Student Skill Exchange mobile app called SkillSwap.

Your job is to act as a highly intelligent, helpful, and reliable assistant that improves user experience, guides users, and understands the app deeply.

## APP CONTEXT
This app allows students to:
- Post services they can offer (e.g., tutoring, coding help, design, CV writing)
- Browse and request services from other students
- Chat with other users
- Use a credit system to pay for services
- Earn credits by helping others
- Leave reviews and build reputation

Credits are a time/effort-based internal currency, not real money.

## YOUR MAIN GOALS
You must always:
1. Give accurate, helpful, and simple explanations
2. Respond in a friendly, natural, human tone
3. Help users take action inside the app (not just talk)
4. Guide users toward using features (posting services, finding help, using credits)
5. Be concise but informative
6. Never confuse or overwhelm the user

## SMART BEHAVIOR RULES
- If the user asks how something works, explain clearly step-by-step
- If the user needs help, suggest specific actions inside the app
- If the user asks vague questions, ask clarifying questions before answering
- If the user asks about services, use the search_services tool to find real results from the app
- If the user asks about credits, explain them simply as a time-based exchange system
- Always try to move the conversation toward solving the user's problem
- When you find services using the tool, present them in a clear, readable format

## IMPORTANT LIMITS
- Do NOT invent real users, services, or transactions
- If you don't know something specific in the app, say so and guide the user
- Do not give unsafe, illegal, or harmful advice
- Do not be overly robotic or repetitive

## TONE
- Friendly, helpful, and natural
- Like a smart student assistant, not a corporate bot
- Avoid long paragraphs unless necessary
- Be encouraging but not fake or overly emotional

## RESPONSE STYLE
Bad: "I am an AI and cannot assist with that."
Good: "I'm not seeing that option directly, but you can try going to your Profile → Edit → then update your bio. Want me to guide you step-by-step?"

## EXTRA INTELLIGENCE RULE
Whenever possible:
- Suggest the next best action inside the app
- Help users complete tasks, not just answer questions
- Think like a product assistant, not a general chatbot

When presenting services found via search, format each one clearly with name, provider, cost, and a brief description. Always end with encouragement to browse or request.

Your purpose is to make the app feel intelligent, helpful, and easy to use.`;

// ─────────────────────────────────────────────────────────────────────────────
// TOOL DEFINITION
// ─────────────────────────────────────────────────────────────────────────────
const tools = [
  {
    name: 'search_services',
    description: 'Search the SkillSwap database for available student services. Use this whenever the user asks about finding, browsing, or looking for any kind of service or help.',
    input_schema: {
      type: 'object',
      properties: {
        terms: {
          type: 'array',
          items: { type: 'string' },
          description: 'Search keywords to look for in service titles, descriptions, and categories. Include synonyms and related terms for better results.',
        },
      },
      required: ['terms'],
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// INTENT DETECTION
// ─────────────────────────────────────────────────────────────────────────────

const INTENT_RULES = {
  FIND_SERVICE: [
    { re: /\b(need|want|find|get|looking for|search|hire|where can i)\b/, w: 2 },
    { re: /\b(tutor|teacher|coach|mentor|instructor)\b/, w: 3 },
    { re: /\b(help with|help me|teach me|learn|study|practice|someone (who|that) can)\b/, w: 2 },
    { re: /\b(math|maths|physics|chemistry|biology|coding|programming|python|javascript|java|html|css|react|spanish|french|arabic|german|chinese|japanese|design|essay|cv|grammar|writing|accounting|business|fitness|music|guitar|piano|singing)\b/, w: 2 },
  ],
  OFFER_SERVICE: [
    { re: /\b(i can|i know|i teach|i offer|i provide|i'm good at|i am good at)\b/, w: 4 },
    { re: /\b(want to|looking to|would like to) (teach|help|offer|share|provide|start)\b/, w: 4 },
    { re: /\b(post|create|list|add|publish) (a |my |)(service|skill)\b/, w: 3 },
    { re: /\b(earn|make|get) (credits|tokens)\b/, w: 2 },
    { re: /\bshare my (skills?|knowledge|expertise)\b/, w: 3 },
  ],
  GENERAL_BROWSE: [
    { re: /\b(browse|explore|see all|view all|show me everything|show me services|show me what)\b/, w: 4 },
    { re: /\bwhat('s| is) (available|here|on offer|on there|on skillswap)\b/, w: 3 },
    { re: /\bwhat (services|categories|subjects|skills) (are|do you|can i)\b/, w: 2 },
    { re: /\ball services\b/, w: 3 },
  ],
  HELP: [
    { re: /^(help|idk|hmm|hm|huh|ok|okay|sure|hi|hey|hello|yo|sup|what|huh)[\s!?.]*$/i, w: 5 },
    { re: /\b(help|guide|explain|how do i|what is|how does|confused|not sure|don't know|no idea|stuck)\b/, w: 2 },
    { re: /^\s*.{1,6}\s*$/, w: 1 },
  ],
  ACTIVITY: [
    { re: /\bmy (requests?|messages?|services?|notifications?|history|credits?|balance|activity|incoming|sent)\b/, w: 5 },
    { re: /\b(check|see|view|show) (my |)(requests?|messages?|activity|sent|incoming|pending)\b/, w: 4 },
    { re: /\b(how many|status|pending|unread)\b/, w: 2 },
  ],
};

function detectIntent(message) {
  const lower = message.toLowerCase().trim();
  const scores = { FIND_SERVICE: 0, OFFER_SERVICE: 0, GENERAL_BROWSE: 0, HELP: 0, ACTIVITY: 0 };

  for (const [intent, rules] of Object.entries(INTENT_RULES)) {
    for (const { re, w } of rules) {
      if (re.test(lower)) scores[intent] += w;
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topIntent, topScore] = sorted[0];
  const confidence = parseFloat(Math.min(topScore / 6, 1.0).toFixed(2));

  return topScore >= 2
    ? { intent: topIntent, confidence }
    : { intent: 'UNKNOWN', confidence: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART RESPONSE BANK
// Every entry has a text (or textFn) + suggestions array.
// Suggestions must always be short, action-oriented, tappable phrases.
// ─────────────────────────────────────────────────────────────────────────────

const SMART_RESPONSES = {
  GREETING: {
    text: "Hey! I'm your SkillSwap assistant — I can help you find services, offer your skills, or answer any questions about the app. What would you like to do?",
    suggestions: ['Find a tutor', 'Browse all services', 'Offer my skills', 'How do credits work?', 'Check my requests'],
  },
  FIND_SERVICE: {
    textFound:    (n) => `Found ${n} service${n > 1 ? 's' : ''} that match! Tap below to browse them.`,
    textNotFound: "I didn't find exact matches right now — but here are some ways I can help:",
    suggestionsFound:    ['Search for something else', 'Browse all services', 'Offer my own skills', 'Check my requests'],
    suggestionsNotFound: ['Browse all services', 'Try a different keyword', 'Offer my own skills', 'Ask me anything else'],
  },
  OFFER_SERVICE: {
    text: "Great — sharing your skills is the best way to earn credits on SkillSwap! Here's how to get started:",
    suggestions: ['How do I post a service?', 'What subjects are in demand?', 'How do credits work?', 'Browse services first', 'See my existing services'],
  },
  GENERAL_BROWSE: {
    text: "Sure! Here's a snapshot of what's on SkillSwap — what catches your interest?",
    suggestions: ['Tutoring & academics', 'Programming & tech', 'Languages', 'Design & creative', 'Fitness & health', 'Business & finance'],
  },
  ACTIVITY: {
    text: "Here's a quick look at your activity — what would you like to check?",
    suggestions: ['Incoming requests', 'Sent requests', 'My messages', 'Service history', 'My credits balance'],
  },
  HELP: {
    text: "Happy to help! Here are the most popular things people do on SkillSwap:",
    suggestions: ['Find a tutor or helper', 'Browse all services', 'Offer my own skills', 'Check my requests', 'How do credits work?'],
  },
  UNKNOWN: {
    text: "Not quite sure what you mean — but here are some things I can help with on SkillSwap:",
    suggestions: ['Find a tutor or helper', 'Browse all services', 'Offer my own skills', 'Check my requests', 'How do credits work?'],
  },
};

// Suggestions appended to every Claude API response, keyed by context
const CONTEXT_SUGGESTIONS = {
  FIND_SERVICE_results:   ['Search for something else', 'Browse all services', 'Offer my own skills', 'Check my requests'],
  FIND_SERVICE_noresults: ['Browse all services', 'Try a different keyword', 'Offer my own skills', 'Ask me anything else'],
  OFFER_SERVICE:  ['How do I post a service?', 'Browse services first', 'How do credits work?', 'See my existing services'],
  GENERAL_BROWSE: ['Find a specific tutor', 'Browse all services', 'Offer my skills', 'Check my requests'],
  ACTIVITY:       ['Incoming requests', 'Sent requests', 'My messages', 'Service history'],
  HELP:           ['Find a tutor or helper', 'Browse all services', 'Offer my own skills', 'How do credits work?'],
  UNKNOWN:        ['Find a tutor or helper', 'Browse all services', 'Offer my own skills', 'How do credits work?'],
};

function contextSuggestions(intent, hasResults) {
  if (intent === 'FIND_SERVICE') {
    return hasResults ? CONTEXT_SUGGESTIONS.FIND_SERVICE_results : CONTEXT_SUGGESTIONS.FIND_SERVICE_noresults;
  }
  return CONTEXT_SUGGESTIONS[intent] || CONTEXT_SUGGESTIONS.UNKNOWN;
}

// ─────────────────────────────────────────────────────────────────────────────
// KEYWORD → DB SEARCH TERM MAPPING
// ─────────────────────────────────────────────────────────────────────────────

const KEYWORD_MAP = {
  tutoring:     { kws: ['tutor','teach','study','math','maths','physics','chemistry','biology','exam','homework','revision','academic','essay','english','science'], terms: ['tutor','teaching','academic','study','homework'] },
  music:        { kws: ['guitar','piano','violin','drums','singing','music','instrument','song','band'],                                                               terms: ['music','guitar','piano','violin','singing'] },
  food:         { kws: ['food','hungry','cooking','cook','chef','meal','recipe','baking','eat'],                                                                        terms: ['cooking','food','baking','chef'] },
  programming:  { kws: ['programming','coding','code','python','javascript','java','html','css','react','web','software','tech','computer','developer'],                terms: ['programming','coding','development','software','web'] },
  design:       { kws: ['design','graphic','logo','photoshop','figma','illustration','art','artist','ui','ux'],                                                        terms: ['design','graphic','art','ui'] },
  language:     { kws: ['language','spanish','french','arabic','german','chinese','japanese','translate','speak'],                                                      terms: ['language','spanish','french','arabic','translation'] },
  fitness:      { kws: ['fitness','gym','workout','exercise','yoga','sport','running','training'],                                                                       terms: ['fitness','gym','yoga','exercise','training'] },
  construction: { kws: ['construction','repair','fix','plumber','electrician','carpenter','handyman','builder'],                                                        terms: ['construction','repair','building','handyman'] },
  writing:      { kws: ['writing','write','essay','grammar','proofread','cv','resume','blog','content'],                                                                terms: ['writing','essay','grammar','content'] },
  business:     { kws: ['business','accounting','finance','marketing','economics','tax'],                                                                               terms: ['business','accounting','finance','marketing'] },
  photography:  { kws: ['photo','photography','video','camera','filming'],                                                                                             terms: ['photography','video','photo'] },
};

const STOPWORDS = new Set(['i','a','an','the','is','are','want','need','can','you','for','me','help','with','to','and','or','my','some','any','do','have','get','find','please','someone','anyone']);

function extractSearchTerms(message) {
  const lower = message.toLowerCase();
  for (const { kws, terms } of Object.values(KEYWORD_MAP)) {
    if (kws.some(k => lower.includes(k))) return terms;
  }
  const words = lower.split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
  return words.length > 0 ? words.slice(0, 4) : [message];
}

// ─────────────────────────────────────────────────────────────────────────────
// DB SEARCH
// ─────────────────────────────────────────────────────────────────────────────

async function dbSearch(terms, userId) {
  if (!terms?.length) return [];
  const conditions = terms
    .map(() => '(s.title LIKE ? OR s.description LIKE ? OR s.category LIKE ?)')
    .join(' OR ');
  const params = [];
  terms.forEach(t => params.push(`%${t}%`, `%${t}%`, `%${t}%`));
  const [rows] = await db.query(
    `SELECT DISTINCT s.id, s.title, s.description, s.category, s.credits_cost, s.duration_minutes,
            u.full_name AS provider_name, u.reputation_score
     FROM services s
     JOIN users u ON s.user_id = u.id
     WHERE (${conditions})
       AND s.status = 'active'
       AND u.account_status = 'active'
       AND u.id != ?
     ORDER BY u.reputation_score DESC
     LIMIT 8`,
    [...params, userId]
  );
  return rows;
}

function formatServicesForClaude(services) {
  if (!services.length) return 'No services found for these search terms.';
  return services.map((s, i) =>
    `${i + 1}. "${s.title}" by ${s.provider_name} — ${s.credits_cost} credits` +
    (s.duration_minutes ? ` (${s.duration_minutes} min)` : '') +
    `\n   Rating: ${s.reputation_score ? Number(s.reputation_score).toFixed(1) : '5.0'}/5.0` +
    (s.description ? `\n   ${s.description.substring(0, 120)}${s.description.length > 120 ? '...' : ''}` : '')
  ).join('\n\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART FALLBACK  (no API key — never hits a dead end)
// ─────────────────────────────────────────────────────────────────────────────

async function smartFallback(message, userId) {
  const lower = message.toLowerCase().trim();

  // Greeting
  if (/^(hi|hey|hello|howdy|hiya|yo|sup|what's up|wassup)[\s!?.]*$/i.test(lower)) {
    const r = SMART_RESPONSES.GREETING;
    return { response: r.text, suggestions: r.suggestions, intent: 'GREETING', results: [] };
  }

  const { intent } = detectIntent(message);

  // Service search: hit the DB
  if (intent === 'FIND_SERVICE') {
    const terms = extractSearchTerms(message);
    const services = await dbSearch(terms, userId);
    const r = SMART_RESPONSES.FIND_SERVICE;
    return {
      response:    services.length > 0 ? r.textFound(services.length) : r.textNotFound,
      suggestions: services.length > 0 ? r.suggestionsFound : r.suggestionsNotFound,
      intent,
      results: services,
    };
  }

  // General browse: return a sample of services as a taster
  if (intent === 'GENERAL_BROWSE') {
    const services = await dbSearch(['tutor', 'coding', 'design', 'language'], userId);
    const r = SMART_RESPONSES.GENERAL_BROWSE;
    return { response: r.text, suggestions: r.suggestions, intent, results: services.slice(0, 5) };
  }

  // All other intents: pre-built contextual response — never blank
  const r = SMART_RESPONSES[intent] || SMART_RESPONSES.UNKNOWN;
  return { response: r.text, suggestions: r.suggestions, intent, results: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: POST /api/ai/chat
// ─────────────────────────────────────────────────────────────────────────────

const aiChat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const hasApiKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here';
    const { intent } = detectIntent(message);

    // ── No API key: smart fallback (never a dead end) ─────────────────────────
    if (!hasApiKey) {
      const result = await smartFallback(message, req.user.id);
      return res.json({ success: true, ...result });
    }

    // ── Claude API path ───────────────────────────────────────────────────────
    const messages = [
      ...history
        .slice(-10)
        .filter(m => m.sender_id !== 'welcome')
        .map(m => ({ role: m.sender_id === 'ai' ? 'assistant' : 'user', content: m.message })),
      { role: 'user', content: message },
    ];

    const firstResponse = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    // Tool use → search DB, second call
    if (firstResponse.stop_reason === 'tool_use') {
      const toolUse = firstResponse.content.find(c => c.type === 'tool_use');
      const searchTerms = toolUse?.input?.terms || [message];
      const services = await dbSearch(searchTerms, req.user.id);

      const secondResponse = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages: [
          ...messages,
          { role: 'assistant', content: firstResponse.content },
          {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: formatServicesForClaude(services) }],
          },
        ],
      });

      const aiText = secondResponse.content.find(c => c.type === 'text')?.text || 'Here are the results!';
      return res.json({
        success: true,
        response: aiText,
        suggestions: contextSuggestions('FIND_SERVICE', services.length > 0),
        intent: 'FIND_SERVICE',
        results: services,
      });
    }

    // Plain text response — wrap with intent-contextual suggestions
    const aiText = firstResponse.content.find(c => c.type === 'text')?.text || "I'm here to help!";
    return res.json({
      success: true,
      response: aiText,
      suggestions: contextSuggestions(intent, false),
      intent,
      results: [],
    });

  } catch (err) {
    console.error('AI Chat error:', err);
    if (err.status === 401) {
      return res.status(503).json({ message: 'Invalid API key. Please check ANTHROPIC_API_KEY in the backend .env file.' });
    }
    res.status(500).json({ message: 'AI service error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: POST /api/ai/search  (backwards compatibility)
// ─────────────────────────────────────────────────────────────────────────────

const aiSearch = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: 'Message is required' });
  try {
    const services = await dbSearch([message], req.user.id);
    res.json({
      success: true,
      response: services.length > 0 ? `Found ${services.length} services.` : 'No services found.',
      results: services,
    });
  } catch (err) {
    console.error('AI Search error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { aiSearch, aiChat };
