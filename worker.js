/**
 * HomeEdge Worker — Chat + Subscribe + Email Drip
 * Cloudflare Worker with Cron Trigger for automated welcome emails
 */

const ALLOWED_ORIGINS = [
  "https://gethomeedge.com",
  "https://www.gethomeedge.com",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

function corsHeaders(request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// --- GHL INTEGRATION ---
const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_LOCATION_ID = "jpig3KdT4xUkujgkElOx";

function ghlHeaders(token) {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "Version": "2021-07-28",
  };
}

async function createGHLContact(env, { name, email, phone, company, city, tags }) {
  const nameParts = (name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const res = await fetch(`${GHL_BASE}/contacts/`, {
    method: "POST",
    headers: ghlHeaders(env.GHL_API_TOKEN),
    body: JSON.stringify({
      locationId: GHL_LOCATION_ID,
      firstName,
      lastName,
      email: email || undefined,
      phone: phone || undefined,
      companyName: company || undefined,
      city: city || undefined,
      tags: tags || ["homeedge-lead", "website"],
      source: "HomeEdge Website",
    }),
  });
  const data = await res.json();
  if (!res.ok) { console.log("GHL contact error:", JSON.stringify(data)); return null; }
  return data.contact;
}

async function createGHLOpportunity(env, { contactId, name, pipelineId, stageId }) {
  const res = await fetch(`${GHL_BASE}/opportunities/`, {
    method: "POST",
    headers: ghlHeaders(env.GHL_API_TOKEN),
    body: JSON.stringify({
      locationId: GHL_LOCATION_ID,
      pipelineId,
      pipelineStageId: stageId,
      contactId,
      name: name || "HomeEdge Lead",
      status: "open",
    }),
  });
  const data = await res.json();
  if (!res.ok) console.log("GHL opportunity error:", JSON.stringify(data));
  return data;
}

async function updateGHLOpportunityStage(env, { opportunityId, stageId }) {
  const res = await fetch(`${GHL_BASE}/opportunities/${opportunityId}`, {
    method: "PUT",
    headers: ghlHeaders(env.GHL_API_TOKEN),
    body: JSON.stringify({ pipelineStageId: stageId }),
  });
  const data = await res.json();
  if (!res.ok) console.log("GHL stage update error:", JSON.stringify(data));
  return data;
}

const SYSTEM_PROMPT = `You are the HomeEdge Sales Assistant — a sharp, knowledgeable, warm closer working for HomeEdge (gethomeedge.com).

Your job: Help real estate agents understand how HomeEdge solves their real problems, and guide every conversation toward booking a demo or clicking "Get Started."

ABOUT HOMEEDGE:
- White-labeled AI seller platform, 100% branded to the agent (their logo, domain, colors)
- 27 AI-powered tools live now: 14 AI generators (CMA reports, listing descriptions, social media, market snapshots, pricing strategy, seller updates, objection handling, video scripts, and more), 7 smart calculators (net proceeds, fix vs. sell, commission value, staging ROI, and more), seller dashboard, lead CRM, performance analytics, open house QR system, listing portfolio, and a 24/7 AI chatbot
- The full seller journey covered: prospecting, listing presentation, pricing, marketing, client communication, analytics, and retention
- Deployed in 48 hours. No tech skills needed. We handle everything.
- Pricing: Starter $49/mo | Pro $97/mo | Elite $197/mo. Annual plans save 20%.
- 30-day money-back guarantee on all plans.
- Brokerage deals for 10+ agent teams (email cole@gethomeedge.com).

AGENT PROBLEMS YOU SOLVE:
- Can't differentiate from the 5 agents interviewing for the same listing -- HomeEdge gives them a 27-tool AI platform no other agent has
- Post-NAR settlement pressure to justify commissions -- the platform visually proves their value with calculators, dashboards, and AI tools
- Sellers go cold between appointments -- 24/7 AI chatbot + automated seller updates keep them engaged
- No time to write listing descriptions, social posts, CMAs, or emails -- AI generates it all in seconds
- Losing deals to Zillow/Opendoor/cash buyers -- net proceeds calculator and commission value calculator show sellers they net MORE with an agent
- No system to track leads -- built-in CRM and performance dashboard keep everything organized
- Generic websites that look like every other agent -- HomeEdge is fully custom-branded with 27 tools

CONVERSATION STYLE:
- Warm, confident, direct -- like a knowledgeable friend who happens to know everything about real estate tech
- Ask qualifying questions early: "How many listings are you closing a year?" or "What's your biggest challenge getting seller appointments?"
- Always move toward a next step. Never let a conversation end without a CTA.
- If they're hesitating on price, use the ROI: "One extra listing a year is $12K. The Pro plan is $1,164 annually. That's less than 10% of one commission check."
- If they're ready: direct them to gethomeedge.com and tell them to scroll to pricing and click Get Started. Plans start at $49/mo.
- If they ask something you genuinely don't know: "Let me connect you with Cole directly -- email cole@gethomeedge.com and he'll get back to you within the hour."
- Never be pushy. Be helpful. Close confidently.

LIMITS: You have a 12-message limit per session. Around message 10-11, naturally start steering toward "let's get on a quick call or get you started today."`;

const LIMIT_REPLY =
  "I'd love to keep chatting -- let's get you on a quick call with Cole instead. Book a time at cole@gethomeedge.com or hit the Get Started button above.";

// --- RATE LIMITING ---
const TIER_LIMITS = {
  starter: 500,
  professional: 2000,
  elite: Infinity,
  demo: 50,       // gift bot demos
  internal: Infinity  // Cole's own sales chatbot
};

async function checkRateLimit(env, clientId, tier) {
  if (!clientId || !env.RATE_LIMITS) return { allowed: true };
  const effectiveTier = tier || "demo";
  const limit = TIER_LIMITS[effectiveTier] ?? 500;
  if (limit === Infinity) return { allowed: true };

  const month = new Date().toISOString().slice(0, 7); // "2026-04"
  const key = `usage:${clientId}:${month}`;
  const current = parseInt(await env.RATE_LIMITS.get(key) || "0");

  if (current >= limit) {
    return { allowed: false, current, limit, remaining: 0 };
  }

  await env.RATE_LIMITS.put(key, String(current + 1), { expirationTtl: 86400 * 35 });
  return { allowed: true, current: current + 1, limit, remaining: limit - current - 1 };
}

// --- ANTHROPIC HEADERS (with prompt caching) ---
function anthropicHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };
}

function cachedSystem(prompt) {
  return [{ type: "text", text: prompt, cache_control: { type: "ephemeral" } }];
}

// MailerLite removed (account terminated April 2026)
// All email now handled via Resend, all CRM via GHL

// --- STRIPE WEBHOOK SIGNATURE VERIFICATION (Web Crypto API) ---
async function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = sigHeader.split(",").reduce((acc, part) => {
    const [key, value] = part.split("=");
    acc[key.trim()] = value;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) throw new Error("Missing timestamp or signature");

  // Reject timestamps older than 5 minutes (replay protection)
  if (Math.floor(Date.now() / 1000) - parseInt(timestamp) > 300) {
    throw new Error("Webhook timestamp too old");
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
  const computedSig = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, "0")).join("");

  // Constant-time comparison
  if (computedSig.length !== signature.length) throw new Error("Signature mismatch");
  let mismatch = 0;
  for (let i = 0; i < computedSig.length; i++) {
    mismatch |= computedSig.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (mismatch !== 0) throw new Error("Signature mismatch");

  return JSON.parse(payload);
}

// --- ONBOARDING EMAIL ---
const ONBOARDING_EMAIL = {
  subject: "You're in -- let's build your HomeEdge platform",
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333"><h1 style="color:#0B1426">Welcome to HomeEdge!</h1><p>Hey there,</p><p>Cole here. Your payment just came through and I'm fired up to get your platform built.</p><p><strong>Here's what happens next:</strong></p><ol><li><strong>Within 24 hours</strong> -- I'll send you a quick intake form (logo, colors, domain, headshot)</li><li><strong>Within 48 hours</strong> -- Your fully branded AI platform goes live</li><li><strong>Day 3</strong> -- We hop on a 15-minute walkthrough call so you know every feature</li></ol><p>In the meantime, start thinking about:</p><ul><li>Your brand colors (hex codes if you have them)</li><li>Your logo file (PNG with transparent background works best)</li><li>Your preferred domain or subdomain</li><li>A professional headshot</li></ul><p>If you have any questions at all, just reply to this email. I answer personally.</p><p>Let's build your edge.</p><p><strong>Cole Cummings</strong><br>Builder of HomeEdge<br><a href="https://gethomeedge.com">gethomeedge.com</a></p></div>`
};

// --- TIER DETECTION FROM AMOUNT ---
// New pricing: Starter $49/$468, Pro $97/$948, Elite $197/$1908
function getTierFromAmount(amountCents) {
  if (amountCents >= 19700) return "elite";
  if (amountCents >= 9700) return "pro";
  return "starter";
}

// --- CLERK USER PROVISIONING ---
async function ensureClerkUser(env, email, name, tier, stripeCustomerId) {
  const CLERK_API = "https://api.clerk.com/v1";
  const headers = {
    Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const metadata = {
    subscription_tier: tier,
    stripe_customer_id: stripeCustomerId || "",
    activated_at: new Date().toISOString(),
  };

  // Check if user already exists in Clerk
  const searchRes = await fetch(
    `${CLERK_API}/users?email_address=${encodeURIComponent(email)}&limit=1`,
    { headers }
  );
  const users = await searchRes.json();

  if (Array.isArray(users) && users.length > 0) {
    // Update existing user's tier
    const userId = users[0].id;
    await fetch(`${CLERK_API}/users/${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ public_metadata: metadata }),
    });
    console.log(`Clerk: Updated ${email} to ${tier} tier (user ${userId})`);
    return userId;
  }

  // Create new user -- they'll set their password on first sign-in
  const nameParts = (name || "").split(" ");
  const createRes = await fetch(`${CLERK_API}/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email_address: [email],
      first_name: nameParts[0] || "",
      last_name: nameParts.slice(1).join(" ") || "",
      public_metadata: metadata,
    }),
  });
  const newUser = await createRes.json();

  if (newUser.id) {
    console.log(`Clerk: Created ${email} as ${tier} tier (user ${newUser.id})`);
    return newUser.id;
  }

  console.log(`Clerk: Failed to create user for ${email}`, JSON.stringify(newUser));
  return null;
}

// --- EMAIL DRIP ---
// Welcome email: sent instantly via Resend on /subscribe
// Nurture sequence (5 emails over 10 days): handled by GHL workflow
// SMS follow-up (6 texts over 14 days): handled by GHL workflow
// All automations triggered by GHL contact creation + tags

export default {
  // --- CRON TRIGGER: Reserved for future use (drip handled by GHL workflows) ---
  async scheduled(event, env, ctx) {
    // No-op: email drip + SMS follow-up handled by GHL workflows
  },

  async fetch(request, env, ctx) {
    const CORS_HEADERS = corsHeaders(request);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        ...CORS_HEADERS,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      }});
    }

    const url = new URL(request.url);

    // --- AUTHENTICATED API ENDPOINTS (GET/POST/PUT/DELETE via Clerk JWT) ---

    // Helper: verify Clerk session token from Authorization header
    async function getClerkUserId(request, env) {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "");
      if (!token) return null;
      try {
        const res = await fetch("https://api.clerk.com/v1/clients/verify", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          // Fallback: decode JWT payload to get sub (userId)
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            return payload.sub || null;
          }
          return null;
        }
        const data = await res.json();
        return data.sub || data.user_id || null;
      } catch {
        // Fallback: decode JWT payload
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            return payload.sub || null;
          }
        } catch {}
        return null;
      }
    }

    // --- BRANDING ENDPOINT ---
    if (url.pathname === "/branding") {
      const userId = await getClerkUserId(request, env);
      if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      if (request.method === "GET") {
        const data = await env.RATE_LIMITS.get(`branding:${userId}`);
        return new Response(data || JSON.stringify({}), {
          status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      if (request.method === "POST" || request.method === "PUT") {
        const body = await request.json();
        const branding = {
          businessName: (body.businessName || "").slice(0, 200),
          logoUrl: (body.logoUrl || "").slice(0, 500),
          primaryColor: (body.primaryColor || "#00F2FE").slice(0, 20),
          accentColor: (body.accentColor || "#D4AF37").slice(0, 20),
          phone: (body.phone || "").slice(0, 20),
          website: (body.website || "").slice(0, 200),
          updatedAt: new Date().toISOString(),
        };
        await env.RATE_LIMITS.put(`branding:${userId}`, JSON.stringify(branding), { expirationTtl: 86400 * 365 });

        // Also update Clerk publicMetadata with branding
        try {
          await fetch(`https://api.clerk.com/v1/users/${userId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              public_metadata: {
                brand_name: branding.businessName,
                brand_logo: branding.logoUrl,
                brand_color: branding.primaryColor,
              },
            }),
          });
        } catch (err) {
          console.log("Clerk metadata update error:", err.message);
        }

        return new Response(JSON.stringify({ success: true, branding }), {
          status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // --- LEADS ENDPOINT ---
    if (url.pathname === "/leads" || url.pathname.startsWith("/leads/")) {
      const userId = await getClerkUserId(request, env);
      if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const leadsKey = `leads:${userId}`;

      if (request.method === "GET") {
        const data = await env.RATE_LIMITS.get(leadsKey);
        return new Response(data || JSON.stringify([]), {
          status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      if (request.method === "POST") {
        const body = await request.json();
        const existing = JSON.parse(await env.RATE_LIMITS.get(leadsKey) || "[]");

        if (body.action === "add") {
          const lead = {
            id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: (body.name || "").slice(0, 200),
            email: (body.email || "").slice(0, 200),
            phone: (body.phone || "").slice(0, 20),
            address: (body.address || "").slice(0, 300),
            status: body.status || "new",
            source: (body.source || "").slice(0, 100),
            notes: (body.notes || "").slice(0, 1000),
            createdAt: new Date().toISOString(),
          };
          existing.push(lead);
          await env.RATE_LIMITS.put(leadsKey, JSON.stringify(existing), { expirationTtl: 86400 * 365 });
          return new Response(JSON.stringify({ success: true, lead }), {
            status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        if (body.action === "update" && body.id) {
          const idx = existing.findIndex(l => l.id === body.id);
          if (idx === -1) {
            return new Response(JSON.stringify({ error: "Lead not found" }), {
              status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
          }
          Object.assign(existing[idx], {
            name: body.name !== undefined ? (body.name || "").slice(0, 200) : existing[idx].name,
            email: body.email !== undefined ? (body.email || "").slice(0, 200) : existing[idx].email,
            phone: body.phone !== undefined ? (body.phone || "").slice(0, 20) : existing[idx].phone,
            address: body.address !== undefined ? (body.address || "").slice(0, 300) : existing[idx].address,
            status: body.status || existing[idx].status,
            source: body.source !== undefined ? (body.source || "").slice(0, 100) : existing[idx].source,
            notes: body.notes !== undefined ? (body.notes || "").slice(0, 1000) : existing[idx].notes,
            updatedAt: new Date().toISOString(),
          });
          await env.RATE_LIMITS.put(leadsKey, JSON.stringify(existing), { expirationTtl: 86400 * 365 });
          return new Response(JSON.stringify({ success: true, lead: existing[idx] }), {
            status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        if (body.action === "delete" && body.id) {
          const filtered = existing.filter(l => l.id !== body.id);
          await env.RATE_LIMITS.put(leadsKey, JSON.stringify(filtered), { expirationTtl: 86400 * 365 });
          return new Response(JSON.stringify({ success: true }), {
            status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        if (body.action === "bulk") {
          // Full replace (for migration from localStorage)
          const leads = Array.isArray(body.leads) ? body.leads.slice(0, 500) : [];
          await env.RATE_LIMITS.put(leadsKey, JSON.stringify(leads), { expirationTtl: 86400 * 365 });
          return new Response(JSON.stringify({ success: true, count: leads.length }), {
            status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Only allow POST for remaining endpoints
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // --- TELEGRAM BOT WEBHOOK ---
    if (url.pathname === "/telegram") {
      let update;
      try { update = await request.json(); } catch {
        return new Response("OK", { status: 200 });
      }

      const message = update.message;
      if (!message || !message.text || !message.chat) {
        return new Response("OK", { status: 200 });
      }

      const chatId = message.chat.id;
      const userText = message.text.trim();
      const TELEGRAM_TOKEN = env.TELEGRAM_BOT_TOKEN;

      if (!TELEGRAM_TOKEN) {
        return new Response("OK", { status: 200 });
      }

      // Look up agent config from KV: telegram:{chatId} or telegram:bot:{botIdentifier}
      // For now, use a default config or look up by bot token
      const botConfig = JSON.parse(await env.RATE_LIMITS.get("telegram:config") || "{}");
      const agentName = botConfig.agentName || "HomeEdge Agent";
      const company = botConfig.company || "";
      const city = botConfig.city || "";
      const state = botConfig.state || "";
      const clientId = botConfig.clientId || "telegram-default";

      // Rate limit
      const rateCheck = await checkRateLimit(env, clientId, "elite");
      if (!rateCheck.allowed) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "This assistant has reached its monthly usage limit. Please contact your agent directly for help.",
          }),
        });
        return new Response("OK", { status: 200 });
      }

      // Handle /start command
      if (userText === "/start") {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `Hi! I'm ${agentName}'s AI seller assistant. I can help you with anything about selling your home -- pricing, the process, what to expect, and more.\n\nJust type your question and I'll help!`,
          }),
        });
        return new Response("OK", { status: 200 });
      }

      // Get conversation history from KV (last 10 messages for context)
      const historyKey = `telegram:history:${chatId}`;
      const history = JSON.parse(await env.RATE_LIMITS.get(historyKey) || "[]");
      history.push({ role: "user", content: userText });
      const recentHistory = history.slice(-10);

      const telegramSystemPrompt = `You are an AI Seller Assistant for ${agentName}${company ? " at " + company : ""}. You help homeowners${city ? " in " + city : ""}${state ? ", " + state : ""} understand everything about selling their home. Be warm, knowledgeable, and concise. Use short paragraphs. No markdown formatting (Telegram doesn't render it well). Keep responses under 300 words.`;

      // Call Anthropic
      try {
        const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: anthropicHeaders(env.ANTHROPIC_API_KEY),
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 400,
            temperature: 0.7,
            system: cachedSystem(telegramSystemPrompt),
            messages: recentHistory,
          }),
        });

        const aiData = await aiRes.json();
        const reply = aiData?.content?.[0]?.text || "Sorry, I couldn't process that. Try again!";

        // Save conversation history (expire after 24 hours)
        recentHistory.push({ role: "assistant", content: reply });
        await env.RATE_LIMITS.put(historyKey, JSON.stringify(recentHistory.slice(-10)), { expirationTtl: 86400 });

        // Send reply via Telegram
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: reply,
          }),
        });
      } catch (err) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Sorry, I'm having trouble right now. Please try again in a moment.",
          }),
        });
      }

      return new Response("OK", { status: 200 });
    }

    // --- GIFT DEMO BOT ENDPOINT ---
    if (url.pathname === "/gift") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const { messages, agentName, company, city, state, specialty, clientId, tier } = body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return new Response(
          JSON.stringify({ error: "messages must be a non-empty array" }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // Rate limit check
      const rateCheck = await checkRateLimit(env, clientId || "gift-demo", tier || "demo");
      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({ error: "Monthly usage limit reached", limit: rateCheck.limit }),
          { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const giftSystemPrompt = `You are an AI Seller Assistant demo built for ${agentName || "a real estate professional"} at ${company || "their brokerage"}. You help homeowners in the ${city || "local"}${state ? ", " + state : ""} area understand everything about selling their home.

You are an expert on:
- The ${city || "local"} real estate market -- neighborhoods, pricing trends, what buyers want
- The complete home selling process from preparation to closing
- How to price a home competitively using local market data
- Staging, repairs, and preparation tips that maximize sale price
- Timeline expectations and what sellers should plan for
- Closing costs, commissions, and net proceeds estimation
- Why working with ${agentName || "a professional agent"} at ${company || "the brokerage"} gives sellers a real advantage
${specialty ? "- Specialty expertise: " + specialty : ""}

Your personality:
- Warm, knowledgeable, genuinely helpful -- like a smart assistant who knows real estate inside out
- You represent ${agentName || "the agent"} and ${company || "their brokerage"} professionally
- Answer questions thoroughly but concisely
- When appropriate, encourage the seller to reach out to ${agentName || "the agent"} for a personalized consultation or home evaluation
- Be helpful first, never pushy

Keep responses concise and natural. Use bullet points for lists. You have personality -- you are not a generic bot.`;

      let anthropicResponse;
      try {
        anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: anthropicHeaders(env.ANTHROPIC_API_KEY),
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 500,
            temperature: 0.7,
            system: cachedSystem(giftSystemPrompt),
            messages: messages,
          }),
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Failed to reach AI", detail: err.message }),
          { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      if (!anthropicResponse.ok) {
        const errText = await anthropicResponse.text();
        return new Response(
          JSON.stringify({ error: "AI error", detail: errText }),
          { status: anthropicResponse.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const giftData = await anthropicResponse.json();
      const giftReply = giftData?.content?.[0]?.text ?? "Sorry, I couldn't generate a response. Try again!";

      return new Response(
        JSON.stringify({ reply: giftReply }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // --- AI TOOLS ENDPOINT ---
    if (url.pathname === "/tool") {
      let body;
      try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const { messages, toolType, context, clientId, tier } = body;
      if (!Array.isArray(messages) || messages.length === 0 || !toolType) {
        return new Response(
          JSON.stringify({ error: "messages array and toolType required" }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // Rate limit check
      const toolRateCheck = await checkRateLimit(env, clientId, tier);
      if (!toolRateCheck.allowed) {
        return new Response(
          JSON.stringify({ error: "Monthly usage limit reached", limit: toolRateCheck.limit, remaining: 0 }),
          { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const ctx = context || {};
      const TOOL_PROMPTS = {
        cma: `You are a professional CMA (Comparative Market Analysis) report generator for real estate agents. Generate a comprehensive, branded market analysis report.

When given a property address or details, create a detailed CMA that includes:
- Executive Summary with estimated price range
- Market Overview for the area (trends, inventory, days on market)
- 3-5 comparable sales analysis (generate realistic but clearly labeled as AI-estimated comps)
- Pricing Strategy recommendation with reasoning
- Suggested list price with confidence range
- Key factors affecting value (condition, location, market timing)

Format the output with clear headings, bullet points, and professional language. Make it look like something an agent would proudly hand to a seller.

IMPORTANT: Clearly note that comp data is AI-estimated and should be verified with MLS data. This is a starting point, not a substitute for actual MLS research.

${ctx.agentName ? "Agent: " + ctx.agentName : ""}
${ctx.company ? "Brokerage: " + ctx.company : ""}`,

        social: `You are a social media content strategist for real estate agents. Generate engaging, platform-optimized social media posts.

Create a week's worth of content (5-7 posts) that includes:
- Mix of: listing highlights, market tips, personal brand posts, engagement questions, and calls-to-action
- Platform-specific formatting (indicate Instagram, Facebook, LinkedIn, or TikTok)
- Relevant hashtags for each post
- Emoji usage that feels natural, not forced
- Post lengths appropriate for each platform

The tone should be professional but approachable -- like a knowledgeable friend who happens to be an expert.

${ctx.agentName ? "Agent: " + ctx.agentName : ""}
${ctx.market ? "Market: " + ctx.market : ""}
${ctx.listing ? "Featured Listing: " + ctx.listing : ""}`,

        followup: `You are a follow-up email specialist for real estate agents. Generate professional, warm follow-up emails that feel personal -- not templated.

Based on the scenario provided, generate:
- Subject line (compelling but not clickbaity)
- Email body (150-250 words max)
- Appropriate tone for the situation
- A clear but gentle call-to-action
- Professional sign-off

Scenarios you handle: post-showing, post-open house, post-listing appointment, after receiving an offer, after closing, re-engagement (cold lead), and referral request.

The email should sound like the agent wrote it personally, not like it was generated. Natural language, no corporate jargon.

${ctx.agentName ? "Agent: " + ctx.agentName : ""}
${ctx.company ? "Brokerage: " + ctx.company : ""}`,

        objection: `You are a real estate objection handling coach. When given a seller or buyer objection, provide 3 different response strategies:

1. **Data-Driven Response** -- Use market facts, statistics, and logical reasoning
2. **Empathetic Response** -- Acknowledge the concern, validate the feeling, then redirect
3. **Story-Based Response** -- Use a relevant anecdote or case study to illustrate the point

For each response:
- Keep it concise (3-5 sentences)
- Make it sound natural and conversational
- Include a transition back to the value proposition
- End with a soft question that moves the conversation forward

Common objections you handle: commission too high, want to sell FSBO, Zillow says my home is worth more, I want to wait for a better market, another agent will do it for less, I don't need staging, your marketing plan is too expensive.

Post-NAR settlement context: commissions are now negotiable and must be clearly communicated. Help agents navigate this new landscape.`,

        presentation: `You are a listing presentation content generator. Create compelling, structured content for a real estate agent's listing presentation.

Generate a complete listing presentation outline with content for each section:
1. **About [Agent Name]** -- credentials, experience, what sets them apart
2. **Market Analysis** -- current market snapshot for the area
3. **Pricing Strategy** -- how you determine the right price
4. **Marketing Plan** -- what you'll do to sell the home (online, print, social, open houses)
5. **Timeline** -- what to expect from listing to closing
6. **Your Investment** -- how to frame the commission conversation (post-NAR)
7. **Why Choose [Agent]** -- the close, differentiators, guarantees
8. **Next Steps** -- clear call to action

Make it persuasive but honest. This is what wins listings at the kitchen table.

${ctx.agentName ? "Agent: " + ctx.agentName : ""}
${ctx.company ? "Brokerage: " + ctx.company : ""}
${ctx.market ? "Market: " + ctx.market : ""}`,

        videoScript: `You are a real estate video script writer. Generate camera-ready scripts optimized for the specified platform and format.

Script types you create:
- Listing walkthrough (60s Reel or 3-min YouTube)
- Market update (60s Reel)
- Neighborhood spotlight (90s Reel or 3-min YouTube)
- Seller tips (60s Reel)
- Just Listed / Just Sold announcement (30s Story or Reel)

Each script includes:
- Hook (first 3 seconds -- critical for stopping the scroll)
- Body with natural talking points (not word-for-word -- agents should sound authentic)
- B-roll suggestions in [brackets]
- Call-to-action at the end
- Estimated duration
- Music/mood suggestion

${ctx.agentName ? "Agent: " + ctx.agentName : ""}`,

        marketSnapshot: `You are a real estate market analyst. Generate a professional market snapshot report for a specific area.

Include:
- Current market conditions (buyer's vs seller's market)
- Median home price and trend direction
- Average days on market
- Inventory levels and months of supply
- Price per square foot averages
- Year-over-year changes
- Neighborhood/area breakdown if applicable
- Forecast and recommendations for sellers
- Forecast and recommendations for buyers

Format as a clean, professional report with headers and bullet points. This should look like something an agent would print and hand out at an open house or community event.

IMPORTANT: Note that data is AI-estimated based on general market knowledge and should be verified with local MLS data.

${ctx.market ? "Market Area: " + ctx.market : ""}`,

        expiredListing: `You are an expired listing prospecting specialist for real estate agents. Help agents win expired listings by generating personalized outreach.

Given an expired listing's details, generate:
1. **Why It Didn't Sell** -- 3-5 possible reasons based on the details provided (pricing, marketing, condition, timing, photos)
2. **Your New Strategy** -- A clear, specific plan for what you'd do differently (pricing adjustment, marketing upgrades, staging recommendations, timing)
3. **Outreach Script** -- A door-knock or phone script that's empathetic (the seller is frustrated) and positions the agent as the solution
4. **Follow-Up Email** -- A professional email the agent can send after the initial contact
5. **Key Talking Points** -- 3-4 bullet points the agent should hit in any conversation

Tone: Empathetic but confident. The seller is disappointed. They need someone who understands what went wrong and has a real plan.

${ctx.agentName ? "Agent: " + ctx.agentName : ""}
${ctx.company ? "Brokerage: " + ctx.company : ""}`,

        neighborhoodFarm: `You are a geographic farming strategist for real estate agents. Help agents dominate a specific neighborhood or area.

Given a neighborhood or zip code, generate a complete farming kit:
1. **Neighborhood Overview** -- What makes this area attractive to buyers, key demographics, school info, lifestyle
2. **Door-Knock Script** -- Natural, non-pushy script for walking the neighborhood ("Hi, I'm [Agent], I specialize in this neighborhood...")
3. **Mailer Copy** -- Content for a postcard or letter (front and back copy, 150 words max)
4. **Social Media Post** -- A neighborhood spotlight post for Instagram/Facebook
5. **Market Stats Talking Points** -- 5 key stats about the area the agent should know cold
6. **Monthly Touchpoint Calendar** -- 12-month plan for staying top of mind (what to send/do each month)

The goal: become the agent everyone in that neighborhood thinks of first.

${ctx.agentName ? "Agent: " + ctx.agentName : ""}
${ctx.market ? "Target Area: " + ctx.market : ""}`,

        listingDescription: `You are a professional real estate listing description writer. Generate compelling, MLS-ready listing descriptions that make properties irresistible.

When given property details, create:
- An attention-grabbing opening line (the hook)
- Vivid description of key features and upgrades
- Neighborhood and lifestyle highlights
- A strong closing with call-to-action

Guidelines:
- Write in the specified style (professional, luxury, casual, inviting, or first-time buyer focused)
- Use sensory language -- help buyers FEEL the home
- Avoid banned fair housing words (master bedroom → primary bedroom, walk-in → step-in, etc.)
- Keep it 150-300 words (MLS-optimized length)
- Include the agent's branding naturally at the end

${ctx.agentName ? "Agent: " + ctx.agentName : ""}
${ctx.company ? "Brokerage: " + ctx.company : ""}`,

        sellerUpdate: `You are a real estate communication specialist. Generate professional weekly seller update emails that keep sellers informed, confident, and trusting their agent.

Create a warm, informative update that includes:
1. **Activity Summary** -- Showings, online views, open house attendance
2. **Buyer Feedback** -- Summarize and contextualize the feedback received
3. **Market Context** -- How the local market is performing, new comps, inventory changes
4. **Strategy Assessment** -- Is the current pricing/marketing strategy working? Any adjustments recommended?
5. **Next Steps** -- What the agent plans to do this coming week
6. **Encouragement** -- End on a positive, confident note

Tone: Professional but warm. The seller should feel informed and confident, never anxious.
Format as an email with subject line. Keep it 200-350 words.

${ctx.agentName ? "Agent: " + ctx.agentName : ""}
${ctx.company ? "Brokerage: " + ctx.company : ""}`,

        pricingRecommendation: `You are a real estate pricing strategist. Generate a comprehensive pricing recommendation with strategic reasoning.

Based on the property details and market context, provide:
1. **Recommended List Price** -- A specific price or tight range with confidence level
2. **Pricing Rationale** -- Why this price point (market data, condition, competition, timing)
3. **Comparable Properties** -- 3-4 AI-estimated comps with adjustments (clearly labeled as estimates)
4. **Pricing Strategy Options**:
   - Aggressive (below market to generate multiple offers)
   - Competitive (at market for steady interest)
   - Aspirational (above market, tests the ceiling)
   Include pros/cons for each.
5. **Price Reduction Strategy** -- If needed, when and how much to adjust
6. **Market Timing Factors** -- Seasonality, interest rates, inventory trends

IMPORTANT: Note that comp data is AI-estimated and should be verified with actual MLS data.

${ctx.agentName ? "Agent: " + ctx.agentName : ""}
${ctx.company ? "Brokerage: " + ctx.company : ""}`,

        testimonialRequest: `You are a client relationship specialist for real estate agents. Generate personalized testimonial request outreach that feels genuine, not transactional.

Create:
1. **Email Subject Line** -- Warm, personal, high open-rate
2. **Email Body** (150-250 words) -- Thank them, remind them of the positive experience, make the ask easy (provide 2-3 prompt questions they can answer), include where the testimonial will be used (Google, Zillow, website)
3. **Follow-Up Text Message** (under 160 characters) -- A gentle reminder if they haven't responded
4. **Google Review Direct Link Reminder** -- Mention they can leave a Google review too

Guidelines:
- Reference specific positive moments from the transaction
- Make it easy -- suggest they just answer 2-3 questions rather than writing a full testimonial
- Include a "no pressure" out
- Match the requested tone (warm, professional, or casual)

${ctx.agentName ? "Agent: " + ctx.agentName : ""}
${ctx.company ? "Brokerage: " + ctx.company : ""}`,

        marketIndicator: `You are a real estate market analyst. Analyze whether a specific market is favoring buyers or sellers and provide actionable insights.

Generate a comprehensive market analysis including:
1. **Market Type Indicator** -- Classify as: Strong Seller's Market, Lean Seller's, Balanced, Lean Buyer's, or Strong Buyer's Market
2. **Key Metrics** (AI-estimated, note this clearly):
   - Months of inventory supply
   - Median days on market
   - List-to-sale price ratio
   - Year-over-year price change
   - Active listings vs. closed sales ratio
3. **What This Means for Sellers** -- Specific advice based on conditions
4. **What This Means for Buyers** -- Specific advice based on conditions
5. **90-Day Forecast** -- Where the market appears to be heading
6. **Agent Talking Points** -- 3-4 key stats to share with clients

IMPORTANT: All data is AI-estimated based on general market knowledge. Recommend verifying with local MLS data.

${ctx.agentName ? "Agent: " + ctx.agentName : ""}`
      };

      const systemPrompt = TOOL_PROMPTS[toolType];
      if (!systemPrompt) {
        return new Response(
          JSON.stringify({ error: "Unknown toolType", valid: Object.keys(TOOL_PROMPTS) }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const maxTokensMap = { cma: 2000, social: 1500, followup: 800, objection: 1000, presentation: 2000, videoScript: 1000, marketSnapshot: 1500, expiredListing: 2000, neighborhoodFarm: 2000, listingDescription: 1000, sellerUpdate: 1200, pricingRecommendation: 2000, testimonialRequest: 1000, marketIndicator: 1500 };

      let toolResponse;
      try {
        toolResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: anthropicHeaders(env.ANTHROPIC_API_KEY),
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: maxTokensMap[toolType] || 1000,
            temperature: 0.6,
            system: cachedSystem(systemPrompt),
            messages: messages,
          }),
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "AI unavailable", detail: err.message }),
          { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      if (!toolResponse.ok) {
        const errText = await toolResponse.text();
        return new Response(
          JSON.stringify({ error: "AI error", detail: errText }),
          { status: toolResponse.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const toolData = await toolResponse.json();
      const toolReply = toolData?.content?.[0]?.text ?? "Sorry, couldn't generate content. Try again.";

      return new Response(
        JSON.stringify({ reply: toolReply, toolType, remaining: toolRateCheck.remaining }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // --- STRIPE WEBHOOK ENDPOINT ---
    if (url.pathname === "/webhook/stripe") {
      const rawBody = await request.text();
      const sigHeader = request.headers.get("stripe-signature");

      if (!sigHeader) {
        return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      let event;
      try {
        event = await verifyStripeSignature(rawBody, sigHeader, env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.log("Webhook signature verification failed:", err.message);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const email = session.customer_details?.email || session.customer_email;
        const name = session.customer_details?.name || "";
        const amount = session.amount_total || 0;
        const tier = getTierFromAmount(amount);

        if (email) {
          // Send onboarding email via Resend + tag in GHL as active client
          ctx.waitUntil(
            (async () => {
              try {
                // Send onboarding email via Resend
                await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${env.RESEND_API_KEY}`,
                  },
                  body: JSON.stringify({
                    from: "HomeEdge <onboarding@resend.dev>",
                    to: email,
                    subject: ONBOARDING_EMAIL.subject,
                    html: ONBOARDING_EMAIL.html,
                    reply_to: "cole@gethomeedge.com",
                  }),
                });
                console.log(`Onboarding email sent to ${email} via Resend`);

                // Notify Cole about the sale
                await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${env.RESEND_API_KEY}`,
                  },
                  body: JSON.stringify({
                    from: "HomeEdge Sales <onboarding@resend.dev>",
                    to: "cca.fam.acc@gmail.com",
                    subject: `NEW SALE: ${name || email} - ${tier} ($${(amount / 100).toFixed(2)})`,
                    html: `<p><strong>New ${tier} client!</strong></p><p>Name: ${name}<br>Email: ${email}<br>Amount: $${(amount / 100).toFixed(2)}</p><p>Onboarding email sent automatically. Start building their platform!</p>`,
                  }),
                });
              } catch (err) {
                console.log("Onboarding email error:", err.message);
              }
            })()
          );

          // Update GHL pipeline to Closed Won
          ctx.waitUntil(
            (async () => {
              try {
                const ghlKey = `ghl:${email.replace(/[^a-z0-9]/gi, '')}`;
                const ghlData = JSON.parse(await env.RATE_LIMITS.get(ghlKey) || "null");
                if (ghlData && ghlData.contactId) {
                  const oppRes = await fetch(
                    `${GHL_BASE}/opportunities/search?locationId=${GHL_LOCATION_ID}&contactId=${ghlData.contactId}`,
                    { headers: ghlHeaders(env.GHL_API_TOKEN) }
                  );
                  const oppData = await oppRes.json();
                  if (oppData.opportunities && oppData.opportunities.length > 0) {
                    await updateGHLOpportunityStage(env, {
                      opportunityId: oppData.opportunities[0].id,
                      stageId: env.GHL_STAGE_CLOSED_WON,
                    });
                    console.log(`GHL: Moved ${email} to Closed Won`);
                  }
                } else {
                  const contact = await createGHLContact(env, {
                    name, email, phone: "", company: "", city: "",
                    tags: ["homeedge-client", "stripe-direct"],
                  });
                  if (contact && contact.id) {
                    await createGHLOpportunity(env, {
                      contactId: contact.id,
                      name: `${name || email} - ${tier}`,
                      pipelineId: env.GHL_PIPELINE_ID,
                      stageId: env.GHL_STAGE_CLOSED_WON,
                    });
                  }
                }
              } catch (err) {
                console.log("GHL Stripe sync error:", err.message);
              }
            })()
          );

          // Create or update Clerk user with subscription tier
          ctx.waitUntil(
            (async () => {
              try {
                const clerkUserId = await ensureClerkUser(
                  env, email, name, tier,
                  session.customer || ""
                );
                if (clerkUserId) {
                  console.log(`Clerk user provisioned: ${clerkUserId} (${tier})`);
                }
              } catch (err) {
                console.log("Clerk provisioning error:", err.message);
              }
            })()
          );

          console.log(`New ${tier} client: ${email} ($${(amount / 100).toFixed(2)})`);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // --- SMS OPT-IN ENDPOINT ---
    if (url.pathname === "/sms-optin") {
      let optBody;
      try { optBody = await request.json(); } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const { name, email, phone, company } = optBody;
      if (!phone) {
        return new Response(JSON.stringify({ error: "Phone required" }), {
          status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      // Create or update GHL contact with SMS opt-in tag
      ctx.waitUntil(
        (async () => {
          try {
            await createGHLContact(env, {
              name: name || "",
              email: email || undefined,
              phone,
              company: company || "",
              city: "",
              tags: ["homeedge-lead", "sms-opted-in", "website"],
            });
            console.log(`SMS opt-in: ${phone} (${name || "unknown"})`);
          } catch (err) {
            console.log("SMS opt-in GHL error:", err.message);
          }
        })()
      );

      // Store backup
      const key = `sms_optin_${Date.now()}`;
      await env.RATE_LIMITS.put(key, JSON.stringify({ ...optBody, ts: new Date().toISOString() }), { expirationTtl: 86400 * 365 });

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // --- NOTIFY ENDPOINT (backup lead capture - logs to KV) ---
    if (url.pathname === "/notify") {
      // Basic abuse protection: check origin
      const notifyOrigin = request.headers.get("Origin") || "";
      if (!ALLOWED_ORIGINS.includes(notifyOrigin)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      let notifyBody;
      try { notifyBody = await request.json(); } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      // Limit payload size to prevent KV abuse
      const notifyStr = JSON.stringify(notifyBody);
      if (notifyStr.length > 5000) {
        return new Response(JSON.stringify({ error: "Payload too large" }), {
          status: 413, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      // Store lead in KV as backup so no lead is ever lost
      const key = `lead_${Date.now()}`;
      await env.RATE_LIMITS.put(key, notifyStr, { expirationTtl: 86400 * 30 });
      return new Response(JSON.stringify({ stored: true, key }), {
        status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // --- SUBSCRIBE ENDPOINT (Resend) ---
    if (url.pathname === "/subscribe") {
      let subBody;
      try { subBody = await request.json(); } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const { email, name, phone, company, city } = subBody;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(JSON.stringify({ error: "Valid email required" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      // Sanitize inputs: trim and limit length to prevent abuse
      const clean = (s, max = 200) => (s || "").toString().trim().slice(0, max);
      const safeName = clean(name);
      const safePhone = clean(phone, 20);
      const safeCompany = clean(company);
      const safeCity = clean(city, 100);

      // Store lead in KV as permanent record
      const leadKey = `lead_${Date.now()}_${email.replace(/[^a-z0-9]/gi, '')}`;
      await env.RATE_LIMITS.put(leadKey, JSON.stringify({ email, name, phone, company, city, ts: new Date().toISOString() }), { expirationTtl: 86400 * 365 });

      const firstName = (name || "").split(" ")[0] || "there";

      // Create contact + pipeline opportunity in GHL (non-blocking, independent of email)
      ctx.waitUntil(
          (async () => {
            try {
              const contact = await createGHLContact(env, {
                name, email, phone, company, city,
                tags: ["homeedge-lead", "website"],
              });
              if (contact && contact.id) {
                await env.RATE_LIMITS.put(
                  `ghl:${email.replace(/[^a-z0-9]/gi, '')}`,
                  JSON.stringify({ contactId: contact.id }),
                  { expirationTtl: 86400 * 365 }
                );
                await createGHLOpportunity(env, {
                  contactId: contact.id,
                  name: `${name || email} - HomeEdge`,
                  pipelineId: env.GHL_PIPELINE_ID,
                  stageId: env.GHL_STAGE_NEW_LEAD,
                });
                console.log(`GHL: Created contact + opportunity for ${email}`);
              }
            } catch (err) {
              console.log("GHL integration error:", err.message);
            }
          })()
        );

      // Send welcome email + notify Cole via Resend (non-blocking, independent of GHL)
      ctx.waitUntil(
        (async () => {
          try {
            const welcomeHtml = `
<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.6">
  <div style="background:#0B1426;padding:30px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="color:#00D4FF;margin:0;font-size:24px">HomeEdge</h1>
    <p style="color:#94A3B8;margin:8px 0 0;font-size:14px">28 AI Tools for Listing Agents</p>
  </div>
  <div style="padding:30px;background:#f9fafb;border-radius:0 0 12px 12px">
    <p>Hey ${firstName},</p>
    <p>Thanks for checking out HomeEdge. You just joined a small group of agents who are about to have an unfair advantage.</p>
    <p>Your personalized AI demo is being built right now. Cole (the founder) will send you the link within 24 hours with your name, your brokerage, and your market baked in.</p>
    <p>In the meantime, here is what 28 AI tools can do for your listing business:</p>
    <ul>
      <li><strong>AI Chatbot</strong> that answers seller questions on your website 24/7</li>
      <li><strong>Listing descriptions</strong> written in 10 seconds</li>
      <li><strong>Net proceeds calculator</strong> that builds trust instantly</li>
      <li><strong>Social media posts</strong> generated in your voice</li>
      <li>Plus 24 more tools, all branded to you</li>
    </ul>
    <p style="text-align:center;margin:30px 0">
      <a href="https://gethomeedge.com/#demo-video" style="background:linear-gradient(135deg,#00D4FF,#0099cc);color:#0B1426;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Watch the Demo Video</a>
    </p>
    <p>Questions? Just reply to this email. I read every one.</p>
    <p>-- Cole Cummings<br>Founder, HomeEdge<br><a href="https://gethomeedge.com" style="color:#00D4FF">gethomeedge.com</a></p>
  </div>
</div>`;

            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${env.RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "HomeEdge <onboarding@resend.dev>",
                to: email,
                subject: `${firstName}, your AI demo is being built`,
                html: welcomeHtml,
                reply_to: "cole@gethomeedge.com",
              }),
            });
            console.log(`Welcome email sent to ${email}`);

            // Notify Cole
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${env.RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "HomeEdge Leads <onboarding@resend.dev>",
                to: "cca.fam.acc@gmail.com",
                subject: `NEW LEAD: ${name || email} from ${city || "unknown"}`,
                html: `<p><strong>New demo request!</strong></p><p>Name: ${name}<br>Email: ${email}<br>Phone: ${phone}<br>Brokerage: ${company}<br>City: ${city}</p>`,
              }),
            });
          } catch (err) {
            console.log("Resend email error:", err.message);
          }
        })()
      );

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // --- CHAT ENDPOINT (default) ---
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { messages, sessionCount } = body;

    // Enforce session limit
    if (typeof sessionCount === "number" && sessionCount >= 12) {
      return new Response(
        JSON.stringify({ reply: LIMIT_REPLY, limitReached: true }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages must be a non-empty array" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Call Anthropic API (with prompt caching)
    let anthropicResponse;
    try {
      anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: anthropicHeaders(env.ANTHROPIC_API_KEY),
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          temperature: 0.7,
          system: cachedSystem(SYSTEM_PROMPT),
          messages: messages,
        }),
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Failed to reach Anthropic API", detail: err.message }),
        {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      return new Response(
        JSON.stringify({ error: "Anthropic API error", detail: errText }),
        {
          status: anthropicResponse.status,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const data = await anthropicResponse.json();
    const reply = data?.content?.[0]?.text ?? "Sorry, I couldn't generate a response. Try again!";

    return new Response(
      JSON.stringify({ reply, limitReached: false }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  },
};
