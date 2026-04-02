const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// ============================================================
// CONFIGURATION — Fill these in before running
// ============================================================
const BOT_TOKEN = process.env.HOMEEDGE_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const COLE_CHAT_ID = process.env.COLE_CHAT_ID || 'YOUR_CHAT_ID_HERE';
// ============================================================

const LEADS_FILE = path.join(__dirname, 'leads.json');
const DEMO_LINK = 'https://gethomeedge.com/demo.html';
const FOUNDERS_LINK = 'https://gethomeedge.com/founders.html';
const SITE_LINK = 'https://gethomeedge.com';

// Load or create leads file
function loadLeads() {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Could not read leads file, starting fresh.');
  }
  return [];
}

function saveLeads(leads) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

// Track users who are in the middle of submitting their info
const activeConversations = {};

// Create bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('HomeEdge Telegram Bot is running...');

// ============================================================
// /start — Welcome message
// ============================================================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'there';

  bot.sendMessage(chatId,
`Hey ${firstName}, welcome to HomeEdge.

I'm Cole. I work at a steel plant by day and build AI tools for real estate agents at night.

HomeEdge is a fully branded AI seller platform. 28 tools, all under YOUR brand. Calculators, chatbot, listing writer, CMA generator, lead CRM, and more. Deployed to your domain in 48 hours.

One agent generated $12K in month one using it.

Here's what I can help you with:

/tools - See all 28 AI tools
/pricing - Founding member pricing (limited spots)
/demo - Get a link to the live demo
/contact - Submit your info and I'll reach out personally

Built from a steel plant, not a tech office.
-- Cole`
  );
});

// ============================================================
// /tools — Full 28-tool list
// ============================================================
bot.onText(/\/tools/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId,
`All 28 HomeEdge AI Tools:

AI GENERATORS (14)
 1. CMA Reports
 2. Listing Descriptions
 3. Social Media Posts
 4. Follow-Up Emails
 5. Market Snapshots
 6. Listing Presentations
 7. Video Scripts
 8. Expired Listing Kits
 9. Neighborhood Farming
10. Objection Handling
11. Seller Updates
12. Pricing Strategy
13. Testimonial Requests
14. Market Analysis

SMART CALCULATORS (7)
15. Net Proceeds Calculator
16. Fix vs. Sell Analyzer
17. Commission Value Calculator
18. Closing Cost Explainer
19. Home Value Tracker
20. Offer Comparison Matrix
21. Staging ROI Calculator

DASHBOARDS & SYSTEMS (7)
22. 24/7 AI Chatbot
23. Seller Dashboard
24. Performance Dashboard
25. Seller Lead CRM
26. Open House QR System
27. Listing Portfolio
28. Pre-List Checklist

Every tool is white-labeled to YOUR brand. Your logo, your colors, your domain.

/demo - See them in action
/pricing - Lock in founder pricing`
  );
});

// ============================================================
// /pricing — Founding member tiers
// ============================================================
bot.onText(/\/pricing/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId,
`Founder Pricing (Limited to 10 Agents)

These prices lock in FOREVER. When the spots fill, regular pricing kicks in and it's 30%+ more. One listing pays for an entire year.

------------------------------
FOUNDER STARTER
$997 setup + $197/mo
(Regular: $1,497 + $297/mo)

- All 28 AI-Powered Tools
- Branded Landing Page
- AI Chatbot for Your Site
- All Calculators & Analyzers
- Email Support
- Monthly Platform Updates

------------------------------
FOUNDER PROFESSIONAL (Most Popular)
$1,997 setup + $347/mo
(Regular: $2,997 + $497/mo)

- Everything in Starter
- Seller Dashboard / Client Portal
- Custom Branding Package
- Priority Support
- Quarterly Strategy Calls
- Performance Analytics

------------------------------
FOUNDER ELITE
$2,997 setup + $597/mo
(Regular: $4,997 + $797/mo)

- Everything in Professional
- Lead CRM Setup & Training
- Dedicated Account Manager
- Monthly Strategy Sessions
- Custom Integrations
- 1-on-1 Onboarding Call
- Priority Phone Support

------------------------------
Brokerage pricing available for teams of 10+ agents.

Ready to lock in your spot?
${FOUNDERS_LINK}

Questions? Use /contact and I'll reach out personally.
-- Cole`
  );
});

// ============================================================
// /demo — Demo link
// ============================================================
bot.onText(/\/demo/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId,
`Here's the live HomeEdge demo:

${DEMO_LINK}

Takes 30 seconds. You'll see what your sellers would see, all branded to you.

The AI chatbot on the demo page is live. Ask it anything about selling a home.

Want to talk about what this looks like for YOUR business? Use /contact and I'll personally reach out.
-- Cole`
  );
});

// ============================================================
// /contact — Lead capture (multi-step conversation)
// ============================================================
bot.onText(/\/contact/, (msg) => {
  const chatId = msg.chat.id;

  activeConversations[chatId] = {
    step: 'name',
    data: {
      telegramId: chatId,
      telegramUsername: msg.from.username || 'N/A',
      submittedAt: new Date().toISOString()
    }
  };

  bot.sendMessage(chatId, "Great, I'd love to connect you with Cole.\n\nWhat's your full name?");
});

// ============================================================
// /menu — Show available commands
// ============================================================
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId,
`HomeEdge Bot Commands:

/tools - See all 28 AI tools
/pricing - Founding member pricing
/demo - Live demo link
/contact - Submit your info for a personal follow-up
/menu - Show this menu

Website: ${SITE_LINK}
-- Cole`
  );
});

// ============================================================
// Handle conversation flow for lead capture
// ============================================================
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands (they're handled above)
  if (!text || text.startsWith('/')) return;

  // Check if user is in a lead-capture conversation
  const convo = activeConversations[chatId];
  if (!convo) return;

  switch (convo.step) {
    case 'name':
      convo.data.name = text.trim();
      convo.step = 'email';
      bot.sendMessage(chatId, `Thanks, ${convo.data.name}. What's your email address?`);
      break;

    case 'email':
      convo.data.email = text.trim();
      convo.step = 'phone';
      bot.sendMessage(chatId, 'And your phone number? (or type "skip" to skip)');
      break;

    case 'phone':
      convo.data.phone = text.trim().toLowerCase() === 'skip' ? 'N/A' : text.trim();
      convo.step = 'brokerage';
      bot.sendMessage(chatId, 'Last one. What brokerage or team are you with? (or type "skip")');
      break;

    case 'brokerage':
      convo.data.brokerage = text.trim().toLowerCase() === 'skip' ? 'N/A' : text.trim();

      // Save the lead
      const leads = loadLeads();
      leads.push(convo.data);
      saveLeads(leads);

      // Confirm to the user
      bot.sendMessage(chatId,
`Got it. Here's what I have:

Name: ${convo.data.name}
Email: ${convo.data.email}
Phone: ${convo.data.phone}
Brokerage: ${convo.data.brokerage}

Cole will personally reach out within 24 hours. In the meantime, check out the demo:

${DEMO_LINK}

Talk soon.
-- Cole`
      );

      // Notify Cole
      if (COLE_CHAT_ID !== 'YOUR_CHAT_ID_HERE') {
        bot.sendMessage(COLE_CHAT_ID,
`NEW LEAD from Telegram Bot

Name: ${convo.data.name}
Email: ${convo.data.email}
Phone: ${convo.data.phone}
Brokerage: ${convo.data.brokerage}
Telegram: @${convo.data.telegramUsername}

Submitted: ${convo.data.submittedAt}`
        );
      }

      // Clean up
      delete activeConversations[chatId];
      break;
  }
});

// ============================================================
// Handle polling errors quietly
// ============================================================
bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 409) {
    // Another instance is running, ignore
    return;
  }
  console.error('Bot polling error:', error.code || error.message);
});
