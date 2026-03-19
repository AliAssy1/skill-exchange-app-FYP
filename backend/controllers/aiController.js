const db = require('../config/database');

// AI Bot User ID (can be any special ID)
const AI_BOT_ID = 1;

// @desc    AI Search for services based on message
// @route   POST /api/ai/search
// @access  Private
const aiSearch = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Extract keywords from the message
    const keywords = extractKeywords(message.toLowerCase());
    
    if (keywords.length === 0) {
      return res.json({
        success: true,
        response: "I can help you find services! Try asking like:\n• 'I need a Spanish tutor'\n• 'Looking for Python programming help'\n• 'Need help with Math'\n\nWhat are you looking for?",
        results: []
      });
    }

    // Search for services matching keywords
    const searchPattern = keywords.map(k => `%${k}%`);
    const whereConditions = keywords.map(() => 
      '(s.title LIKE ? OR s.description LIKE ? OR s.category LIKE ?)'
    ).join(' OR ');
    
    const queryParams = [];
    keywords.forEach(keyword => {
      queryParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    });

    const [services] = await db.query(
      `SELECT DISTINCT s.*, u.full_name as provider_name, u.email, u.reputation_score
       FROM services s
       JOIN users u ON s.user_id = u.id
       WHERE (${whereConditions}) AND s.status = 'active' AND u.account_status = 'active'
       GROUP BY s.id
       LIMIT 10`,
      queryParams
    );

    // Format response
    let response = '';
    if (services.length > 0) {
      response = `🎯 I found ${services.length} service${services.length > 1 ? 's' : ''} for you:\n\n`;
      services.forEach((service, index) => {
        response += `${index + 1}. 📚 ${service.title}\n`;
        response += `   👤 Provider: ${service.provider_name}\n`;
        response += `   💰 Credits: ${service.credits_cost || 0}\n`;
        response += `   ⭐ Rating: ${service.reputation_score ? Number(service.reputation_score).toFixed(1) : '5.0'}\n`;
        if (service.description) {
          response += `   📝 ${service.description.substring(0, 80)}${service.description.length > 80 ? '...' : ''}\n`;
        }
        response += `\n`;
      });
      response += `\nYou can browse these services in the Browse Services section!`;
    } else {
      response = `😔 I couldn't find any services matching "${keywords.join(', ')}".\n\nTry:\n• Using different keywords\n• Checking the Browse Services section\n• Posting a request in Service Request/Offer`;
    }

    res.json({
      success: true,
      response,
      results: services
    });

  } catch (error) {
    console.error('AI Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Handle AI chat message
// @route   POST /api/ai/chat
// @access  Private
const aiChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Save user message to bot
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [userId, AI_BOT_ID, message]
    );

    // Detect intent and search
    const searchResult = await detectIntentAndSearch(message, userId);

    // Save bot response
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [AI_BOT_ID, userId, searchResult.response]
    );

    res.json({
      success: true,
      response: searchResult.response,
      results: searchResult.results
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper: Extract keywords from message
function extractKeywords(message) {
  // Remove common words
  const stopWords = ['i', 'need', 'want', 'looking', 'for', 'a', 'an', 'the', 'help', 'with', 'can', 'you', 'find', 'me', 'some', 'any', 'tutor', 'teacher', 'instructor', 'assistance'];
  
  // Extract words
  const words = message.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));

  // Detect common subject patterns
  const subjects = {
    'spanish': ['spanish', 'español'],
    'math': ['math', 'mathematics', 'calculus', 'algebra', 'geometry'],
    'programming': ['programming', 'coding', 'code', 'python', 'javascript', 'java', 'cpp'],
    'physics': ['physics', 'mechanics', 'thermodynamics'],
    'chemistry': ['chemistry', 'organic', 'inorganic'],
    'biology': ['biology', 'anatomy', 'genetics'],
    'english': ['english', 'writing', 'grammar', 'literature'],
    'music': ['music', 'guitar', 'piano', 'singing'],
    'art': ['art', 'drawing', 'painting', 'design', 'graphic'],
  };

  const detected = [];
  for (const [subject, patterns] of Object.entries(subjects)) {
    if (patterns.some(pattern => message.includes(pattern))) {
      detected.push(subject);
    }
  }

  // Combine detected subjects with other keywords
  return [...new Set([...detected, ...words])];
}

// Helper: Detect intent and search
async function detectIntentAndSearch(message, userId) {
  const keywords = extractKeywords(message.toLowerCase());
  
  if (keywords.length === 0) {
    return {
      response: "👋 Hi! I'm your AI assistant. I can help you find services!\n\nTry asking:\n• 'I need a Spanish tutor'\n• 'Looking for Python help'\n• 'Need Math tutoring'\n\nWhat can I help you find?",
      results: []
    };
  }

  // Search for services
  const queryParams = [];
  keywords.forEach(keyword => {
    queryParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  });

  const whereConditions = keywords.map(() => 
    '(s.title LIKE ? OR s.description LIKE ? OR s.category LIKE ?)'
  ).join(' OR ');

  const [services] = await db.query(
    `SELECT DISTINCT s.*, u.full_name as provider_name, u.email, u.reputation_score
     FROM services s
     JOIN users u ON s.user_id = u.id
     WHERE (${whereConditions}) AND s.status = 'active' AND u.account_status = 'active' AND u.id != ?
     GROUP BY s.id
     LIMIT 10`,
    [...queryParams, userId]
  );

  let response = '';
  if (services.length > 0) {
    response = `🎯 Great! I found ${services.length} service${services.length > 1 ? 's' : ''} matching your request:\n\n`;
    services.forEach((service, index) => {
      response += `${index + 1}. 📚 ${service.title}\n`;
      response += `   👤 ${service.provider_name}\n`;
      response += `   💰 ${service.credits_cost || 0} credits\n`;
      response += `   ⭐ ${service.reputation_score ? Number(service.reputation_score).toFixed(1) : '5.0'}/5.0\n`;
      if (service.description) {
        response += `   📝 ${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}\n`;
      }
      response += `\n`;
    });
    response += `💡 Visit "Browse Services" to view details and book!`;
  } else {
    response = `😔 I couldn't find services for "${keywords.join(', ')}".\n\n💡 Try:\n• Different keywords\n• Browse Services section\n• Post in Service Request/Offer\n\nWhat else can I help you find?`;
  }

  return { response, results: services };
}

module.exports = {
  aiSearch,
  aiChat
};
