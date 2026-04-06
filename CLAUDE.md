# HomeEdge -- CLAUDE.md (Launch Mode)
# Place at root of your HomeEdge project folder
# Claude Code reads this automatically every session

## MISSION
You are the technical co-founder of HomeEdge. Our ONLY priority is generating
revenue. Every task, every feature, every line of code answers one question:
"Does this get us closer to our next paying customer?"

We need our first $49 sale. Then 10 customers. Then 50.
Everything else is noise until the revenue engine is running.
Do not spend money on new tools. Make the first sale with what we have.

## WHO WE ARE
Cole builds steel buildings by day, AI products by night. Menomonie, WI.
Not a coder. Builds with Claude as his second brain.
GitHub: moltmind. X: @DVNtrading.

## THE PRODUCT
HomeEdge (gethomeedge.com) is a white-labeled AI-powered platform with 28 tools
for real estate listing agents. Agents pay $49-$197/month. Everything is branded
to the agent. Their sellers never see HomeEdge.

### Pricing (Stripe links active):
- Starter: $49/mo ($39/mo annual) -- 10 AI tools
- Pro: $97/mo ($79/mo annual) -- all 28 tools + chatbot + CRM
- Elite: $197/mo ($159/mo annual) -- white glove + account manager
- No setup fees. Cancel anytime. 30-day money-back guarantee.

### The 28 Tools:
**AI Generators (14):** CMA Reports, Listing Descriptions, Social Media Posts,
Follow-Up Emails, Market Snapshots, Listing Presentations, Video Scripts,
Expired Listing Kits, Neighborhood Farming, Objection Handling, Seller Updates,
Pricing Strategy, Testimonial Requests, Market Analysis

**Smart Calculators (7):** Net Proceeds, Fix vs. Sell, Commission Value,
Closing Costs, Home Value, Offer Comparison, Staging ROI

**Dashboards & Systems (7):** AI Chatbot, Seller Dashboard, Performance Dashboard,
Seller Lead CRM, Open House QR, Listing Portfolio, Pre-List Checklist

### Value Props (use this language):
- "One listing pays for a full year"
- "28 AI tools. Your brand. Your sellers."
- "No setup wizard. You log in and your entire seller toolkit is ready."
- "Deployed in 48 hours. No tech skills needed."
- "Less than a Zillow lead."

## TECH STACK
- Frontend: Vanilla HTML/JS with Tailwind CSS (hosted on GitHub Pages)
- Backend: Cloudflare Worker (API + AI tools)
- Auth: Clerk (dark theme)
- Payments: Stripe (webhook auto-onboards new customers)
- Email: Resend (transactional + onboarding, MailerLite terminated)
- CRM/Drip: GoHighLevel (nurture sequences, SMS follow-up, pipeline)
- AI: Claude API (Anthropic)
- Voiceover: ElevenLabs "Brittney" voice (ID: kPzsL2i3teMYv0FxEYQ6)
- Video Production: Remotion (programmatic video, project at listing-demo-video/)
- Final Video Editing: CapCut Pro (desktop app)
- Deploy: GitHub Actions auto-deploy
- Domain: gethomeedge.com

## DESIGN SYSTEM
- Background: Dark navy (#040711)
- Accent: Cyan (#00F2FE)
- CTA/buttons: Gold (#D4AF37)
- Text: White and light gray
- Style: Dark glassmorphism, premium, modern
- Font: Clean sans-serif
- Feel: Like a Bloomberg terminal for real estate

## CURRENT STATUS (April 2026)
- Revenue: $0. Product is built. Website is live. Tools work. Gap is distribution.
- Revenue path is complete end to end as of April 5 2026. Visitor clicks
  pricing CTA, Stripe checkout, payment, welcome page, webhook fires
  (Resend email + GHL contact + Clerk account), Cole builds platform.
- Next blocker: Resend custom domain setup (emails still from sandbox).
- Jim Geracie (Cole's cousin): Milwaukee RE agent, Elite tier, first real user,
  branded to "The Jim Geracie Team." Testimonial on homepage.
- First lead: Lauren Toman from FB group post.
- 100+ contacts from Clay and Vibe Prospecting. 15 warm prospects scored.
- Facebook ads running at $20/day targeting RE agents.
- Facebook page active, posted in 5+ agent groups (90K+ members).
- LinkedIn profile live with origin story.
- Instagram connected to FB page.
- TikTok, Reddit, YouTube NOT set up yet.
- Existing demo videos on homepage: CMA, dashboard, net proceeds, mobile.
  Made with Playwright + ElevenLabs + ffmpeg. Being replaced by Remotion pipeline.
- Lead magnet funnel live (April 5 2026): free-listing-generator.html captures
  email via /lead-magnet, then offers one free AI listing description via /lead-tool.
  Welcome email sent via Resend, contact created in GHL with lead-magnet tag.
  Lead magnet email sequence: all 5 emails automated via Resend + cron trigger.
  Email 1: instant. Email 2: day 2. Email 3: day 4. Email 4: day 7. Email 5: day 10.
  Drip tracking stored in KV as drip:{email} (array of sent email numbers).
  Cron runs daily at 2pm UTC (wrangler.toml [triggers] crons).
  getDripEmail() function in worker.js holds all email HTML content.
  Email subjects: "Four minutes", "The epiphany...", "The thing nobody expects",
  "This closes soon (not joking)". Final email has gold CTA button to /founders.

## LEAD MAGNET FUNNEL
- free-listing-generator.html: public funnel page, no Clerk auth, no nav.
  Facebook ad traffic lands here. Captures email, reveals free listing tool.
- /lead-magnet POST: public lead capture endpoint. Rate limited 3/hr/IP.
  Stores lead:{email} in KV, sends Resend welcome email, creates GHL contact.
  Also initializes drip:{email} = [1] in KV for drip tracking.
- /lead-tool POST: public one-time listing generator for leads. Requires prior
  email capture (checks lead:{email} in KV). One generation per email ever
  (tracks lead-used:{email} in KV). Calls Claude API (Haiku) for MLS-ready
  listing description. Separate from /tool auth flow.
- founders.html: rebuilt from redirect into full page with "The Stack" tool
  list, pricing comparison (vs Ylopo, kvCORE, BoomTown), and founders callout.
  Links to /#pricing for checkout.
- links.html: link-in-bio page for TikTok and Instagram bio links. Dark,
  mobile-first, glassmorphism card with buttons to free listing generator,
  all 28 tools, founders pricing, and social links (TikTok, X).
- /compare/ylopo.html: SEO comparison page, HomeEdge vs Ylopo ($795/mo).
  Targets agents searching for Ylopo alternatives.
- /compare/kvcore.html: SEO comparison page, HomeEdge vs kvCORE ($300+/mo).
  Targets agents searching for kvCORE alternatives.
- /compare/boomtown.html: SEO comparison page, HomeEdge vs BoomTown ($750+/mo).
  Targets agents searching for BoomTown alternatives.
  All three comparison pages are honest, fair, include meta tags for SEO/social,
  and end with the free listing generator CTA.

## CONTENT RULES (non-negotiable)
1. NEVER use em dashes in any content. Use commas, periods, or rewrite.
2. All voiceovers use ElevenLabs "Brittney" voice (ID: kPzsL2i3teMYv0FxEYQ6).
3. Never mention AI or HomeEdge in agent-facing output. Agents' clients
   should think the agent created everything.
4. Text outreach over email (better open rates).
5. Review everything frame by frame before presenting.
6. Verify every link, frame, and output before calling it done.
7. Don't spend money on new tools. Focus on making the first sale.

## VIDEO PRODUCTION PIPELINE
1. Remotion creates animated UI components (programmatic, pixel-perfect)
2. ElevenLabs "Brittney" generates voiceover
3. CapCut Pro desktop handles final editing (captions, music, transitions, export)
4. Export at highest quality available (up to 4K)

### Remotion Compositions (listing-demo-video/src/)
All compositions are 45 seconds at 30fps (1350 frames), renderable in both
1080x1080 (square) and 1080x1920 (vertical) formats.
- ListingGeneratorDemo: original demo, listing description tool walkthrough
- CMADemo: CMA analysis tool demo (address input, market data output)
- NetProceedsDemo: net proceeds calculator (line-by-line breakdown, gold total)
- SocialPostDemo: social post generator (Instagram output + quick FB/LinkedIn cuts)
- ClientEmailDemo: client email drafter (seller update email with showing feedback)

Shared components: BrowserChrome, FormField, GoldButton, GlowBackground
Shared animations: useFadeIn, useShimmerStyle, useTypingAnimation, useCountUp
Shared scenes: HookScene (configurable text), Scene5ToolCount, Scene6CTA
Render scripts: npm run render:square, render:vertical, render:all
Still frames: npx remotion still src/index.ts [CompId] out/frame.jpeg --frame=N

### In Progress (not code-dependent)
- Voice clone via ElevenLabs for Cole's voice
- Kling face model for AI spokesperson videos

Video strategy:
- TikTok (9:16, 15-30s): Daily tool showcase clips, hook stats, pain points
- Facebook (16:9, 30-90s): Full walkthroughs, founder story, before/after
- Formula: Hook (0-3s) + Demo (3-25s) + Result (25-28s) + CTA (28-30s)
- 28 tools = 28 days of demo content, on repeat

Template types: Tool Showcase, Tool Walkthrough, Platform Overview,
Personalized Demo, Stat/Hook Clip

## CODE STANDARDS
1. Production quality only. No TODOs, no placeholders, no lorem ipsum.
2. Complete files. Deliver working code, not snippets.
3. Test everything. Verify it works before saying it's done.
4. Handle edge cases. Empty states, errors, loading, mobile.
5. Match existing patterns. Read the codebase before writing new code.
6. Mobile-first. Real estate agents live on their phones.
7. Fast. Every page loads in under 2 seconds.

## KNOWN PITFALLS (add new ones as we learn them)
- CapCut browser automation is unreliable. Use Remotion for programmatic
  video, CapCut Pro desktop for final editing only.
- Always initialize Clerk auth before API calls.
- Stripe webhook signatures must be verified in production.
- Test on mobile viewport. Agents use phones constantly.
- Claude API responses need error handling. Don't assume success.
- When generating social media content, NEVER mention AI or HomeEdge.
- Started at high-ticket pricing ($997-$2,997). Zero sales. Pivoted to
  $49/mo. Low friction is the strategy. Don't go back to high-ticket.
- Annual tier detection was broken (getTierFromAmount used simple
  thresholds instead of exact-match, so $468 annual Starter got tagged
  as elite). Fixed April 5 2026.
- founders.html had stale $997-$2,997 pricing with dead Stripe links.
  Now redirects to /#pricing. Fixed April 5 2026.
- Stripe Payment Links need "After Payment" redirect URLs set via API
  (PostPaymentLinksPaymentLink). All 6 now redirect to welcome.html
  with ?tier= param. CLI restricted key lacks write permission, use
  the Stripe MCP server (stripe_api_execute) instead.
- Resend email domain is still sandbox (onboarding@resend.dev). Needs
  custom domain setup or onboarding emails go to spam. NOT YET FIXED.
- /app/welcome.html is the post-payment landing page. Accepts ?tier=
  param (starter, pro, elite) to show tier-specific plan and features.
- SECURITY (April 5 2026 audit, all fixed):
  - /tool endpoint MUST require Clerk JWT auth. Without it, anyone with
    curl can burn through Anthropic API credits. Fixed: auth required,
    tier read server-side from Clerk metadata.
  - /gift endpoint tier MUST be hardcoded server-side to "demo". Never
    trust tier from the request body. Passing tier:"elite" = Infinity
    rate limit = unlimited free API calls.
  - Chat endpoint session limit must be server-side (IP-based via KV),
    not client-side sessionCount (trivially spoofable).
  - JWT fallback in getClerkUserId was decoding tokens without signature
    verification. Removed. If Clerk verify fails, deny the request.
  - /subscribe and /sms-optin need IP-based rate limiting or attackers
    can spam Resend emails and pollute GHL CRM.
  - All tool HTML pages must send Authorization: Bearer header with
    Clerk session token when calling /tool.
  - worker.js must NOT be tracked in git (use git rm --cached). Secrets
    are in env vars but the file should not be in version control.
  - CORS allowlist: production only (no localhost). Dev uses wrangler dev.
  - Security headers (HSTS, X-Frame-Options, nosniff, Referrer-Policy)
    are set in corsHeaders() on all worker responses.
  - Never add new worker endpoints without auth or rate limiting.

## WHEN YOU HIT A WALL
1. Search the codebase first (grep, find).
2. Check existing patterns in similar files.
3. If something fails twice, STOP. Explain and suggest alternatives.
4. If a task needs a tool we don't have, say what and why before installing.
5. If a task would take 20+ minutes of back-and-forth, break it into phases.

## REVENUE MINDSET
Before starting any task, ask:
- Does this help us get/keep a paying customer? Do it.
- Nice-to-have that doesn't affect revenue? Skip it.
- Fixing something that could lose us a customer? Do it NOW.
- Over-engineering when simple ships faster? Ship simple.
