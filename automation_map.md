# HomeEdge Automation Map
**Last updated:** 2026-03-30
**Purpose:** Every automatable process for running HomeEdge as a solo founder. Cole's role becomes: approve, review, sell, build relationships. Everything else runs.

---

## THE NORTH STAR VISION

When fully built, this is what a week looks like for Cole:

Monday morning: Slack sends a digest. New leads found over the weekend — 45 real estate agents sourced from Facebook groups, LinkedIn, and broker directories. Top 10 pre-scored and pre-researched. Cole reviews in 5 minutes, approves the outreach queue.

A prospect replied to an email. The system already drafted a response. Cole reads it, hits send. One click.

Tuesday: A demo was booked. The calendar invite was sent automatically. The prospect already received a pre-demo email with a case study. After the call, Cole marks it "interested" and the follow-up sequence triggers on its own.

Thursday: A new client signed. Stripe webhook fires. The client receives a welcome email, onboarding checklist, and login credentials within minutes — without Cole touching it. Slack notifies Cole: "New client: Sarah M., Professional tier, $397/mo recurring."

Friday: Weekly business report hits Slack. Revenue, new leads, email open rates, which outreach sequences are converting, churn risk flags. Cole reads it in 10 minutes and adjusts one sequence subject line.

That is the end state. Build toward it. Every automation below is a brick in that machine.

---

## 1. LEAD GENERATION

### 1.1 Automated Real Estate Agent Prospecting
**What it does:** Finds licensed real estate agents by geography, brokerage size, and production level. Builds a scored lead list weekly with contact info, social profiles, and business context.

**How to build:**
- Use **Explorium MCP** (`fetch-entities`, `match-prospects`) to pull real estate agent records by zip code, brokerage, and production tier. Filter for agents with 5+ transactions/year (the ones who need tools, not hobbyists).
- Use **Clay MCP** (`find-and-enrich-contacts-at-company`, `enrich-prospects`) to layer in email addresses, LinkedIn URLs, phone numbers, and brokerage info.
- Run this as a **Claude Code scheduled agent** (cron: every Monday 6am) that outputs a fresh CSV of 50-100 new leads to a Slack channel.
- Label each lead with a score: solo agent, team lead, or brokerage — determines which outreach sequence they enter.

**Cost:** Explorium (paid per credit), Clay (paid per enrichment row). Budget ~$50-100/month for 200-400 enriched leads/week.

**Priority: DO NOW** — no leads, no business. This is the pipeline engine.

---

### 1.2 Facebook Group Monitoring for Warm Leads
**What it does:** Watches r/realtors, agent Facebook groups, and real estate forums for agents asking about tools, listing presentations, or CMA software. These are hot leads — they already know they have a problem.

**How to build:**
- Use **Claude in Chrome** (`navigate`, `get_page_text`, `find`) to scan public Facebook groups (e.g., "Real Estate Agent Referral Network," "Listing Agents Network") and Reddit r/realtors for posts containing trigger phrases: "CMA tool," "listing presentation," "what software do you use," "need help with seller tools."
- Run as a **Claude Code cron job** (daily, 7am). Extracted posts get dumped to a Slack channel with the poster's name, platform, post text, and a suggested DM response.
- Cole reviews daily digest in 2 minutes, picks who to reach out to manually.

**Cost:** Free (Chrome automation is local).

**Priority: DO NOW** — social monitoring catches buyers who are actively shopping. Best conversion rate of any lead source.

---

### 1.3 LinkedIn Agent Targeting
**What it does:** Finds agents on LinkedIn who recently changed brokerages, posted about listing presentations, or are growing their business — these are primed for new tools.

**How to build:**
- Use **Claude in Chrome** to run LinkedIn searches for "real estate agent" + location. Filter by recent activity (posted in last 30 days). Extract names, profile URLs, current brokerage, and post summaries.
- Pipe results into **Clay MCP** (`add-contact-data-points`) for enrichment.
- Flag "newly changed brokerage" agents as highest priority — they're rebuilding their systems and open to new tools.

**Cost:** Free (no LinkedIn API needed, browser-based). Clay enrichment costs apply.

**Priority: THIS WEEK**

---

### 1.4 Brokerage Scraping for Bulk Deals
**What it does:** Identifies mid-size brokerages (20-100 agents) and their office managers or owners. One brokerage deal = $800-6,000/month.

**How to build:**
- Use **Firecrawl** to scrape broker directories: NAR Find a REALTOR, brokerages' own "Meet the Team" pages, and Zillow's agent directory.
- Extract: brokerage name, location, estimated agent count, broker-owner name, website, email format.
- Enrich with **Clay MCP** (`find-and-enrich-company`) for owner contact info.
- Feed into a separate "Brokerage Prospects" MailerLite group.

**Cost:** Firecrawl (paid by scrape volume, ~$20-50/month for this use case). Clay enrichment applies.

**Priority: THIS WEEK** — brokerage tier is the 10x multiplier on revenue.

---

## 2. LEAD NURTURE

### 2.1 Cold Outreach Email Sequences
**What it does:** Sends a multi-step cold email sequence to each new lead. Personalized per lead type (solo agent vs team lead vs brokerage). Stops when they reply or book a demo.

**How to build:**
- Use **MailerLite MCP** (`create_automation`, `build_custom_automation`) to build sequences:
  - Day 1: Intro email — "Here's the tool your listing presentation is missing"
  - Day 3: Case study email — Jim Geracie story, $12K+ month
  - Day 7: Value email — specific tool (e.g., 5-Minute CMA Generator) with a screenshot/GIF
  - Day 14: Last-chance email — "Quick question before I close your file"
- Use **MailerLite MCP** (`add_subscriber`, `assign_subscriber_to_group`) to route leads from Explorium/Clay into the right sequence based on type (solo/team/brokerage).
- Use **MailerLite MCP** (`generate_email_content`, `suggest_subject_lines`) to draft and A/B test subject lines.

**Cost:** MailerLite free tier covers up to 1,000 subscribers. Grows to paid (~$25/mo) as list scales.

**Priority: DO NOW** — sequences can be running while Cole is sleeping.

---

### 2.2 Demo Follow-Up Automation
**What it does:** After a demo call, automatically sends a follow-up email within 30 minutes with a recap, next steps, and a Stripe payment link. No manual "great talking to you" emails.

**How to build:**
- Cole marks a tag in MailerLite ("Demo Completed") after each call.
- **MailerLite MCP** (`create_automation`) triggers an automation on that tag: immediate email with the relevant tier's payment link embedded.
- If no purchase in 3 days: automated follow-up "Any questions before you get started?"
- If no purchase in 7 days: "I have one spot open this week" scarcity email.

**Cost:** Free (MailerLite automation).

**Priority: DO NOW**

---

### 2.3 Re-Engagement Campaign for Cold Leads
**What it does:** Leads who went silent after 30 days get a "break-up" sequence that either re-engages them or removes them from the list (keeps deliverability clean).

**How to build:**
- **MailerLite MCP** (`create_segment`) segments leads with no opens or clicks in 30 days.
- **MailerLite MCP** (`create_automation`) runs a 3-email re-engagement: "Still interested?", a value-add (new tool announcement or market insight), then a final "I'll remove you if I don't hear back."
- Unresponsive leads get unsubscribed automatically. Clean list = better inbox placement.

**Cost:** Free.

**Priority: THIS WEEK**

---

## 3. SOCIAL MONITORING

### 3.1 Daily Keyword Monitoring — Reddit + Facebook
**What it does:** Monitors r/realtors and relevant Facebook groups daily for mentions of HomeEdge competitors, agent tool complaints, and listing presentation discussions. Feeds both leads and competitive intel.

**How to build:**
- **Claude in Chrome** (`navigate`, `get_page_text`) visits r/realtors, r/RealEstate, and 3-5 Facebook groups daily.
- Searches for keywords: "listing presentation software," "CMA tool," "seller tools," "Home Value Estimator," "kvCORE," "Sierra Interactive" (competitors).
- Extracts post URL, username, post text, comment count.
- Claude Code cron (6am daily) posts a Slack digest to a #social-monitoring channel.
- Competitor complaint posts (e.g., "kvCORE is too expensive") get flagged as "HOT LEAD — reach out today."

**Cost:** Free.

**Priority: THIS WEEK**

---

### 3.2 Competitor Price/Feature Monitoring
**What it does:** Tracks competitor websites (Listings-to-Leads, DeltaNet, Sierra Interactive, kvCORE) for pricing changes, new features, and messaging changes. Keeps HomeEdge's positioning sharp.

**How to build:**
- **Firecrawl** scrapes competitor pricing pages weekly.
- Claude Code agent compares this week vs last week and notes changes.
- Summary posted to Slack #competitive-intel.

**Cost:** Firecrawl credits (~$5-10/month for weekly scrapes of 5-6 pages).

**Priority: LATER** — valuable but not revenue-critical on day 1.

---

### 3.3 Testimonial and Review Monitoring
**What it does:** Watches for any mention of HomeEdge online (Google, Facebook, Reddit, Zillow agent profiles) so Cole can respond, amplify, or address issues fast.

**How to build:**
- **Firecrawl** + **Claude in Chrome** searches "HomeEdge" + "gethomeedge.com" across platforms weekly.
- Positive mentions get flagged to ask permission to use as testimonials.
- Any negative mention triggers an immediate Slack alert.

**Cost:** Free.

**Priority: LATER** — relevant once there are enough clients to generate mentions.

---

## 4. SALES PROCESS

### 4.1 Demo Booking Confirmation and Prep Automation
**What it does:** The moment a prospect books a demo (via Calendly or a booking link), they receive a confirmation email, a pre-demo case study, and a short "what to expect" video. They arrive prepared and warm.

**How to build:**
- Calendly webhook (or form submission) triggers a **MailerLite MCP** automation.
- Email 1 (immediate): Booking confirmed + Jim Geracie case study PDF (attached or linked).
- Email 2 (24 hours before): "Tomorrow's call — 3 things to know about HomeEdge" — sets expectations, pre-answers objections.
- **ElevenLabs** (`generate_tts`): Record a 90-second "Hi, I'm Cole" audio intro for the confirmation email. Personal without being live. Pre-built, scales to 1,000 demos.

**Cost:** ElevenLabs (per-character, ~$0.01-0.02 per audio generation). One-time recording, used forever.

**Priority: DO NOW**

---

### 4.2 Proposal Generation
**What it does:** After a sales call, Cole tells Claude Code the tier and client name — a formatted proposal PDF is generated and emailed within minutes.

**How to build:**
- Claude Code script takes inputs: agent name, brokerage, tier selected, specific tools discussed.
- Pulls from the HPS_Brokerage_Proposal_Template.docx, personalizes it.
- **Gmail MCP** (`gmail_create_draft`) drafts the proposal email with the PDF attached.
- Cole reviews the draft and hits send. 5 minutes vs 30 minutes manual.

**Cost:** Free.

**Priority: THIS WEEK**

---

### 4.3 Payment Link Routing
**What it does:** Ensures the right Stripe payment link goes to the right prospect every time. No wrong links, no friction at the close.

**How to build:**
- Payment links already created in Stripe LIVE mode (see setup_status.md).
- Build a simple internal "Send Payment Link" Claude Code command: Cole types the tier name, Claude Code generates the email with the correct embedded link.
- **Gmail MCP** drafts it, Cole sends.
- After payment: Stripe webhook fires to trigger onboarding (see Section 5).

**Cost:** Free (Stripe standard processing: 2.9% + $0.30).

**Priority: DO NOW** — already mostly done, just needs the command wrapper.

---

### 4.4 CRM Lite — Lead Status in Slack Canvas
**What it does:** A simple Slack Canvas that tracks every live prospect: name, tier, last contact, next step, and status. Keeps Cole from losing deals in his head.

**How to build:**
- **Slack MCP** (`slack_create_canvas`) builds a "HomeEdge Pipeline" canvas.
- **Slack MCP** (`slack_update_canvas`) updates it when Cole adds or moves a prospect.
- Claude Code agent runs weekly and adds any new leads from MailerLite that replied or clicked.
- This is not a full CRM — it's a 1-person deal tracker. Keep it simple.

**Cost:** Free.

**Priority: THIS WEEK**

---

## 5. CLIENT ONBOARDING

### 5.1 Post-Payment Welcome Sequence
**What it does:** The moment a client pays via Stripe, the entire onboarding sequence fires automatically. No manual welcome emails, no "I'll send that over tomorrow."

**How to build:**
- **Stripe MCP** (`create_webhook`) or Stripe Dashboard webhook points to a MailerLite webhook URL.
- **MailerLite MCP** (`create_automation`) triggers on new subscriber tagged "Paying Client":
  - Email 1 (immediate): Welcome email, what happens next, expected timeline, Cole's direct contact.
  - Email 2 (Day 1): Onboarding checklist (7 items: send logo, answer 5 setup questions, schedule onboarding call).
  - Email 3 (Day 3): "Quick check-in — any questions on the checklist?"
  - Email 7: Setup complete confirmation + how to get support.

**Cost:** Free.

**Priority: DO NOW** — first impressions lock in retention. A slow onboarding kills trust immediately.

---

### 5.2 Client Setup Intake Form
**What it does:** New clients fill out a form with everything Cole needs to build their tools: branding, target market, brokerage name, headshot. Eliminates 5+ back-and-forth emails per client.

**How to build:**
- **MailerLite MCP** (`create_form`) builds an intake form with fields: logo upload, brand colors (hex), brokerage name, agent name, target zip codes, primary tool selection, preferred contact method.
- Form completion triggers MailerLite tag "Setup Started" which moves them to the next sequence step.
- Form responses automatically populate a Slack message via webhook to #new-clients.

**Cost:** Free.

**Priority: DO NOW**

---

### 5.3 White-Label Asset Generation
**What it does:** Once intake form is submitted, automatically generate the client's branded social media templates and placeholder graphics. Cuts setup time from hours to 20 minutes.

**How to build:**
- **Canva MCP** (`generate-design`, `perform-editing-operations`) takes the client's logo, brand colors, and name from the intake form.
- Generates: LinkedIn post template, email header graphic, "Powered by HomeEdge" badge variants.
- Assets exported via **Canva MCP** (`export-design`) and uploaded to a client folder.
- Cole reviews and approves before sending. Takes 2 minutes instead of 2 hours.

**Cost:** Canva Pro (already part of Canva MCP).

**Priority: THIS WEEK**

---

### 5.4 Onboarding Call Scheduler
**What it does:** Client receives a self-serve booking link for their onboarding call immediately after payment. No "let's find a time" email threads.

**How to build:**
- Calendly link for "HomeEdge Onboarding Call" included in the Day 1 welcome email.
- Booking triggers a MailerLite tag "Onboarding Call Scheduled" which pauses the onboarding reminder sequence.
- If no booking in 3 days: automated reminder "Don't forget to schedule your setup call."

**Cost:** Free (Calendly free tier).

**Priority: DO NOW**

---

## 6. CLIENT RETENTION

### 6.1 Monthly Value Email — Client Newsletter
**What it does:** Every active client receives a monthly email with: new feature announcements, a real estate market insight, one actionable tip for their listing business, and a spotlight on one HomeEdge tool. Keeps HomeEdge top of mind and demonstrates ongoing value.

**How to build:**
- **MailerLite MCP** (`generate_email_content`) drafts the newsletter from a monthly template.
- Claude Code agent pulls the month's key metrics (new tools, updates) and writes the "What's New" section.
- **MailerLite MCP** (`create_campaign`, `schedule_campaign`) schedules it for the first Tuesday of each month.
- Cole reviews the draft on the last Friday of the month. 15-minute review, not 2-hour write.

**Cost:** Free.

**Priority: THIS WEEK**

---

### 6.2 Churn Risk Detection
**What it does:** Flags clients who are showing signs of disengagement before they cancel: not logging in, not opening emails, support tickets going unanswered. Gives Cole a warning so he can intervene.

**How to build:**
- **MailerLite MCP** (`get_subscriber_activity`) checks each paying client's email activity weekly.
- If a client hasn't opened any email in 30 days: tagged "Churn Risk" and Cole gets a Slack alert.
- Automated "check-in" email fires: "Just checking in — how are your listings performing? Let's do a 15-minute tune-up call."
- **Stripe MCP** (`list_subscriptions`) runs monthly to flag any upcoming cancellations or past-due invoices.

**Cost:** Free.

**Priority: THIS WEEK** — one saved client pays for weeks of work.

---

### 6.3 Renewal and Upgrade Nudges
**What it does:** Identifies clients who are close to outgrowing their current tier and prompts an upgrade conversation before they think about looking elsewhere.

**How to build:**
- **MailerLite MCP** tag logic: clients on Starter tier who have been active for 90+ days get an automated "You might be ready for Professional" email.
- Email shows what they're missing at the next tier and includes a Stripe upgrade link.
- **Stripe MCP** (`update_subscription`) handles the tier change when they upgrade.

**Cost:** Free.

**Priority: LATER** — relevant once you have 10+ clients.

---

### 6.4 Anniversary Touchpoints
**What it does:** On a client's 3-month, 6-month, and 12-month anniversaries, they receive a personalized milestone email. Builds loyalty. Makes them feel valued, not just invoiced.

**How to build:**
- **MailerLite MCP** custom date field on subscriber record: "Client Since."
- **MailerLite MCP** (`create_automation`) date-based trigger: send email at +90 days, +180 days, +365 days.
- 3-month: "You've been with HomeEdge 3 months — here's what other agents at your stage are doing."
- 6-month: "Halfway through your first year — here's your impact summary."
- 12-month: "One full year. Here's what you've built." + Renewal discount offer.

**Cost:** Free.

**Priority: LATER**

---

## 7. CONTENT CREATION

### 7.1 Outreach Message Generation
**What it does:** Generates personalized cold outreach messages (email, LinkedIn DM, Facebook DM) for each lead based on their profile: brokerage, market, recent posts, production level. Not templates — actual personalized messages.

**How to build:**
- Claude Code agent takes enriched lead data (from Clay/Explorium) and generates a first-touch outreach message per lead.
- Inputs: agent name, brokerage, state, any recent social post (if scraped), tier they're being targeted for.
- Output: a ready-to-send email draft (subject line + body) loaded into **Gmail MCP** (`gmail_create_draft`) or a DM script for LinkedIn/Facebook.
- Cole reviews the batch, approves the queue. 10-second review per message.

**Cost:** Free.

**Priority: DO NOW**

---

### 7.2 LinkedIn Content Calendar
**What it does:** Generates 4 LinkedIn posts per week: one educational (real estate data insight), one social proof (case study or result), one personal (Cole's perspective), one offer (soft CTA to demo). Builds Cole's personal brand as the go-to real estate tech guy.

**How to build:**
- Claude Code agent runs every Friday morning and generates the next week's 4 posts.
- Posts are dropped into a **Slack MCP** (`slack_create_canvas`) "Content Queue" canvas for Cole's review.
- Cole edits/approves, copies and posts manually (LinkedIn API access is complex — manual posting takes 5 minutes).
- **Canva MCP** (`generate-design`) creates a visual card for each post.

**Cost:** Free.

**Priority: THIS WEEK** — LinkedIn is the highest-leverage channel for individual agent outreach.

---

### 7.3 Case Study and Social Proof Generation
**What it does:** Turns client wins into formatted case studies automatically. Input: client name, tier, before/after outcome. Output: formatted PDF case study, email version, and LinkedIn post.

**How to build:**
- Claude Code takes: client name (or "Anonymous Agent"), tier, metrics (e.g., "went from 45 min CMA prep to 7 min"), market, timeframe.
- Generates: 300-word case study, one-paragraph email snippet, one LinkedIn post.
- **Canva MCP** generates the designed PDF version.
- Used in demo prep emails, sales calls, and LinkedIn posts.

**Cost:** Free.

**Priority: THIS WEEK** — Jim Geracie case study needs to be packaged now.

---

### 7.4 Demo Video / Voiceover Production
**What it does:** Creates professional-sounding narrated walkthroughs of HomeEdge tools for use in sales emails and on the website. Sounds like a real product company, not a one-person show.

**How to build:**
- Write walkthrough scripts in Claude Code.
- **ElevenLabs** (`generate_tts`) generates the voiceover with a professional voice.
- Cole records a screen capture of the tool while the voiceover plays.
- Post to Loom or embed in emails as a video thumbnail.

**Cost:** ElevenLabs per-character billing (~$0.50-2 per video depending on length). One-time per tool.

**Priority: THIS WEEK** — a 2-minute demo video converts better than any amount of copy.

---

## 8. BUSINESS INTELLIGENCE

### 8.1 Weekly Revenue and Pipeline Report
**What it does:** Every Monday morning, Cole gets a Slack message with the full business snapshot: MRR, new clients this week, demos scheduled, leads in sequence, email open rates, and any churn flags.

**How to build:**
- Claude Code cron (Monday 7am) hits:
  - **Stripe MCP** (`list_subscriptions`, `retrieve_balance`) for MRR, new clients, upcoming renewals.
  - **MailerLite MCP** (`get_campaign`, `get_subscriber_count`, `get_automation_activity`) for email metrics.
  - **Slack MCP** (`slack_read_canvas`) for pipeline status.
- Claude Code formats a clean summary and posts it to **Slack MCP** (`slack_send_message`) in #business-pulse.
- No dashboards, no logging in anywhere. Just reads the message.

**Cost:** Free.

**Priority: THIS WEEK** — you can't improve what you don't measure.

---

### 8.2 Outreach Sequence Performance Tracking
**What it does:** Tracks which email sequences, subject lines, and outreach templates are converting leads to demos and demos to clients. Surfaces winners fast.

**How to build:**
- **MailerLite MCP** (`get_campaign`, `get_automation_activity`) runs weekly and pulls open rates, click rates, and conversion rates per sequence.
- Claude Code compares this week vs last week, flags sequences below 20% open rate for replacement.
- Results posted to Slack #sequence-performance.
- Cole reviews monthly and updates the worst-performing email.

**Cost:** Free.

**Priority: THIS WEEK**

---

### 8.3 Client Health Score Dashboard
**What it does:** Scores each paying client weekly on engagement and satisfaction signals. Green = healthy. Yellow = at risk. Red = about to churn.

**How to build:**
- **MailerLite MCP** (`get_subscriber_activity`) pulls email engagement per client.
- **Stripe MCP** (`list_invoices`) checks payment history (late payments = early churn signal).
- Claude Code scores each client 1-10 based on: email opens, support contact frequency, payment history, days since last login.
- **Slack MCP** (`slack_update_canvas`) updates a "Client Health" canvas weekly.

**Cost:** Free.

**Priority: LATER** — relevant at 10+ clients.

---

### 8.4 Market Intelligence Feed
**What it does:** Delivers a weekly summary of what's happening in the real estate tech market: new competitor features, industry news, agent pain points surfacing online. Keeps HomeEdge's positioning relevant.

**How to build:**
- **Firecrawl** scrapes: Inman News, RealTrends, and 2-3 real estate tech blogs weekly.
- Claude Code summarizes the week's key developments in 5 bullet points.
- Posted to Slack #market-intel every Friday afternoon.

**Cost:** Firecrawl credits (~$10-20/month).

**Priority: LATER**

---

## 9. ADMIN

### 9.1 Invoice and Receipt Automation
**What it does:** Every payment generates a professional receipt automatically. Monthly invoices go out automatically. Zero manual invoicing.

**How to build:**
- **Stripe MCP** handles all of this natively. Stripe's automatic email receipts are enabled at the account level.
- For custom invoices (e.g., brokerage deals billed on net-30): **Stripe MCP** (`create_invoice`, `create_invoice_item`, `finalize_invoice`) generates and sends them.
- No manual invoice creation ever.

**Cost:** Free (included in Stripe).

**Priority: DO NOW** — set it up once.

---

### 9.2 Failed Payment Recovery
**What it does:** When a subscription payment fails (expired card, insufficient funds), an automated dunning sequence kicks in before the subscription cancels. Recovers revenue that would otherwise be lost silently.

**How to build:**
- **Stripe MCP** (`update_subscription`) enables Stripe's Smart Retries (automatic retry logic).
- Enable Stripe's built-in dunning emails in the Dashboard (Settings > Billing > Revenue Recovery).
- **MailerLite MCP** adds a secondary touchpoint: if Stripe flags a failed payment, trigger a "quick note about your billing" email sequence with a card update link.

**Cost:** Free.

**Priority: DO NOW** — silent churn is the worst kind.

---

### 9.3 New Client Slack Notification
**What it does:** The instant a new Stripe payment processes, Cole gets a Slack message: "New client signed: [Name], [Tier], $[amount]/month." Feels like having a sales team celebrating every win.

**How to build:**
- **Stripe MCP** (`create_webhook`) fires on `checkout.session.completed` and `invoice.payment_succeeded`.
- Claude Code webhook handler posts to **Slack MCP** (`slack_send_message`) in #wins.
- Message includes: client name (from Stripe customer), tier, amount, and first payment vs renewal.

**Cost:** Free.

**Priority: DO NOW** — motivation + awareness. Build this first week.

---

### 9.4 Monthly Bookkeeping Summary
**What it does:** On the first of every month, Cole receives a clean financial summary: gross revenue, Stripe fees, net revenue, new clients, cancellations, and net MRR change. Ready for taxes or investor reporting.

**How to build:**
- Claude Code cron (1st of month, 8am):
  - **Stripe MCP** (`list_invoices`, `list_subscriptions`, `retrieve_balance`) pulls last month's data.
  - Calculates: gross, Stripe fees (2.9% + $0.30 per transaction), net, new subs, cancellations, MRR.
- Output posted to **Slack MCP** and optionally emailed via **Gmail MCP**.

**Cost:** Free.

**Priority: THIS WEEK**

---

### 9.5 Coupon and Trial Management
**What it does:** Creates and manages limited-time discount codes for sales calls, partnerships, and coaching orgs. Cole can offer a 30-day free trial or a setup fee waiver without touching Stripe manually.

**How to build:**
- **Stripe MCP** (`create_coupon`, `list_coupons`) manages all discount codes.
- Cole has a pre-built Claude Code command: "Create a 25% off coupon for [name], expires in 7 days."
- Single command, 10 seconds, instead of navigating Stripe UI.

**Cost:** Free.

**Priority: THIS WEEK**

---

## PRIORITY EXECUTION ORDER

### DO NOW (This weekend + next 48 hours)
1. MailerLite cold outreach sequences (2.1) — pipeline needs to be running
2. Post-payment welcome sequence (5.1) — set it up before the next client signs
3. Demo booking confirmation emails (4.1) — every demo should get this
4. Client intake form (5.2) — replaces email back-and-forth immediately
5. Stripe webhook for Slack new client notifications (9.3) — takes 30 minutes, huge motivation
6. Stripe failed payment recovery (9.2) — set and forget, protects revenue
7. Invoice automation (9.1) — already Stripe-native, just enable it

### THIS WEEK
8. Lead prospecting with Explorium + Clay (1.1) — build the pipeline engine
9. Facebook/Reddit social monitoring cron (1.2, 3.1) — warm leads for free
10. Weekly revenue/pipeline Slack report (8.1) — visibility on the business
11. Monthly bookkeeping summary (9.4) — financial clarity
12. LinkedIn brokerage lead targeting (1.3, 1.4) — targeting the 10x tier
13. LinkedIn content calendar (7.2) — brand-building is a long game, start now
14. Jim Geracie case study packaged into PDF and email (7.3) — best sales asset you have
15. Demo video voiceover for one key tool (7.4) — converts in the sales email
16. Demo follow-up automation (2.2) — closes deals while Cole sleeps
17. Canva white-label asset generation (5.3) — cuts setup time per client
18. Outreach message generation pipeline (7.1) — personalized at scale
19. Churn risk detection (6.2) — protect the base
20. Slack Pipeline Canvas for deal tracking (4.4) — replaces mental overhead

### LATER (Once 5+ clients are paying)
21. Re-engagement sequences (2.3)
22. Client health score dashboard (8.3)
23. Competitor monitoring (3.2)
24. Anniversary touchpoints (6.4)
25. Upgrade nudge automations (6.3)
26. Market intelligence feed (8.4)
27. Testimonial/review monitoring (3.3)

---

## TOOL REFERENCE QUICK MAP

| Task | Primary Tool | Secondary Tool |
|------|-------------|---------------|
| Find agent leads | Explorium MCP | Clay MCP |
| Enrich lead data | Clay MCP | Explorium MCP |
| Email sequences | MailerLite MCP | Gmail MCP |
| Social monitoring | Claude in Chrome | Firecrawl |
| Scrape competitor/broker sites | Firecrawl | Claude in Chrome |
| Payments and invoicing | Stripe MCP | — |
| Slack notifications | Slack MCP | — |
| Design assets | Canva MCP | — |
| Voiceover / demo audio | ElevenLabs | — |
| Scheduled agents / cron | Claude Code cron | — |
| Draft and send emails manually | Gmail MCP | MailerLite MCP |
| Deal tracking | Slack Canvas (Slack MCP) | — |

---

*This document is a living blueprint. Update it as automations are built. Every completed row is leverage compounding.*
