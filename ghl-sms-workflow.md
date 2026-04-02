# HomeEdge -- GHL SMS Follow-Up Workflow
**Created:** 2026-04-01
**Platform:** GoHighLevel (GHL)
**Purpose:** Automated SMS follow-up sequence for new HomeEdge leads. Written in Cole's voice. Designed to feel like a real person texting, not a marketing bot.

---

## COMPLIANCE FIRST

Before any SMS sends, the lead MUST have opted in via the sms-consent.html form or a GHL form with equivalent TCPA-compliant language:

> "I agree to receive text messages from HomeEdge about AI tools for my real estate business. Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time."

Every first SMS must include: "Reply STOP to opt out."

GHL Settings:
- Enable A2P 10DLC registration (required for business SMS)
- Register HomeEdge as a brand in GHL > Settings > Phone Numbers > Trust Center
- Set sending window: 9:00 AM - 8:00 PM in the lead's local timezone
- Never send on Sundays

---

## WORKFLOW OVERVIEW

```
NEW LEAD IN
    |
    v
[IMMEDIATE: Within 1 min]  SMS #1 -- The Real Human Text
    |
    v
[Wait 4 hours]
    |
    +--- REPLIED? ---> YES ---> [CONVERSATION BRANCH] (manual or AI-assisted)
    |                    NO
    v
[DAY 1, Evening]  SMS #2 -- The Demo Nudge
    |
    v
[Wait 24 hours]
    |
    +--- REPLIED? ---> YES ---> [CONVERSATION BRANCH]
    |                    NO
    v
[DAY 2]  SMS #3 -- The Social Proof Drop
    |
    v
[Wait 48 hours]
    |
    +--- REPLIED? ---> YES ---> [CONVERSATION BRANCH]
    |                    NO
    v
[DAY 5]  SMS #4 -- The Value Bomb
    |
    v
[Wait 48 hours]
    |
    +--- REPLIED? ---> YES ---> [CONVERSATION BRANCH]
    |                    NO
    v
[DAY 7]  SMS #5 -- The Honest Check-In
    |
    +--- REPLIED? ---> YES ---> [CONVERSATION BRANCH]
    |                    NO
    v
[DAY 7 + 2 hours]  INTERNAL: Escalate to Phone Call
    |
    v
[Wait 7 days]
    |
    +--- REPLIED? ---> YES ---> [CONVERSATION BRANCH]
    |                    NO
    v
[DAY 14]  SMS #6 -- The Last Note
    |
    v
[Move to NURTURE pipeline -- email only, stop SMS]
```

---

## TRIGGER CONFIGURATION (GHL)

**Workflow Name:** HomeEdge SMS Follow-Up -- New Lead

**Trigger:** Contact Created or Pipeline Stage Changed to "New Lead"

**Trigger Sources (any of these):**
- Facebook Lead Ad form submission
- Website form (sms-consent.html or GHL landing page)
- LinkedIn lead form (synced via Zapier > GHL)
- Manual add by Cole (tagged "SMS Opted In")
- Gift bot demo request (Facebook group comment > manual add)

**Entry Conditions:**
- Contact has phone number (required)
- Tag includes "SMS Opted In" (required)
- Contact is NOT tagged "Do Not SMS" or "Unsubscribed"
- Contact is NOT already in this workflow

**Exit Conditions (remove from workflow immediately):**
- Contact replies "STOP", "UNSUBSCRIBE", "CANCEL", or "QUIT"
- Contact replies with any message (moves to Conversation Branch)
- Contact books a demo call (Calendly webhook or GHL calendar booking)
- Contact makes a purchase (Stripe webhook)

---

## SMS TEMPLATES

### SMS #1 -- The Real Human Text
**Timing:** Within 1 minute of lead creation
**GHL Wait:** 1 minute after trigger

```
Hey {{contact.first_name}}, it's Cole from HomeEdge. You grabbed a look at the AI seller tools for agents. Wanted to say thanks and see if you had any questions. I built this stuff myself -- happy to walk you through it.

Reply STOP to opt out.
```

**Why this works:** It's immediate. It's personal. It doesn't try to sell anything. It asks a question. The "I built this stuff myself" line is Cole's differentiator -- nobody else can say that.

---

### SMS #2 -- The Demo Nudge
**Timing:** Day 1, approximately 4-6 hours after SMS #1
**GHL Wait:** 4 hours after SMS #1 (or push to next morning if outside sending window)

```
Quick thought {{contact.first_name}} -- the best way to see what HomeEdge does is the live demo. Takes 30 seconds. No sign-up needed.

gethomeedge.com/demo.html

Built it from a steel plant, not a tech office. Let me know what you think.
```

**Why this works:** Low commitment ask. "30 seconds" removes friction. The steel plant line is memorable and differentiating.

---

### SMS #3 -- The Social Proof Drop
**Timing:** Day 2 (approximately 24 hours after SMS #2)
**GHL Wait:** 24 hours

```
One thing I should mention -- my first agent client used these tools and generated over $12K in his first month. He pulled up the seller calculator at a kitchen table and won the listing on the spot.

Not saying that happens every time. But the tools work. Thought you'd want to know.
```

**Why this works:** Story-based proof. Not "our clients see 300% ROI" corporate speak. A real story about a real person at a real kitchen table. Feels like Cole telling you something over a beer.

---

### SMS #4 -- The Value Bomb
**Timing:** Day 5 (3 days after SMS #3)
**GHL Wait:** 72 hours

```
Hey {{contact.first_name}}, random question. How long does it take you to write a listing description right now? One of our tools does it in about 10 seconds. AI writes it in your voice, branded to you.

That's just one of 5 tools live right now. 28 total on the roadmap.
```

**Why this works:** Asks a question about their pain point. Doesn't pitch -- shows a specific capability. The "28 total on the roadmap" signals this is serious and growing.

---

### SMS #5 -- The Honest Check-In
**Timing:** Day 7 (2 days after SMS #4)
**GHL Wait:** 48 hours

```
Hey {{contact.first_name}}, just checking in one more time. I know you're busy -- listing agents don't exactly have slow weeks.

If the timing's off, no worries at all. But if you want 10 minutes to see what your branded version would look like, I'm around this week. Just say the word.
```

**Why this works:** Acknowledges they're busy (respect). Gives them an easy out (no pressure). But makes a specific offer -- "10 minutes" and "this week" create a soft deadline. "Your branded version" makes it personal.

---

### SMS #6 -- The Last Note
**Timing:** Day 14 (7 days after SMS #5)
**GHL Wait:** 7 days

```
Last text from me {{contact.first_name}}. I don't want to be that guy who keeps texting.

If you ever want to see what HomeEdge can do for your seller business, the demo is always live: gethomeedge.com/demo.html

And I'm always here. -- Cole
```

**Why this works:** Respectful close. "I don't want to be that guy" is self-aware and human. Leaves the door open without pressure. The "-- Cole" sign-off is consistent with all his messaging.

---

## CONVERSATION BRANCH (When They Reply)

When a lead replies to ANY SMS, the workflow pauses and moves to the Conversation Branch.

### GHL Configuration:
1. **If/Else Condition:** Contact replied = YES
2. **Action:** Remove from automated sequence
3. **Action:** Add tag "SMS Replied"
4. **Action:** Move pipeline stage to "Engaged"
5. **Action:** Send internal notification to Cole (GHL mobile app push + Slack via webhook)
6. **Action:** Wait for Cole's manual response (or use GHL Conversation AI as a backup)

### Response Playbook for Cole:

**If they say something positive** ("looks cool", "tell me more", "interested"):
```
Awesome. Want me to show you what your version would look like? Takes about 30 seconds. I can mock one up with your branding.

Or if you'd rather hop on a quick call, here's my calendar: [Calendly link]
```

**If they ask about pricing:**
```
Good question. Right now I'm doing founding member pricing that locks in forever. Starts at $147/mo for a solo agent. Setup is one-time and I handle everything -- deployed in 48 hours.

Want me to walk you through what's included? Quick call is the easiest way.
```

**If they say "not right now" or "maybe later":**
```
Totally get it. I'll check back in a few weeks. In the meantime the demo is always live if you want to poke around: gethomeedge.com/demo.html

No pressure either way. -- Cole
```
*Action: Add tag "Nurture -- Revisit 30 Days". Set GHL task to follow up in 30 days.*

**If they say "not interested" or "no thanks":**
```
Appreciate you letting me know. If anything changes down the road, I'm here. Best of luck with your listings.
```
*Action: Add tag "Not Interested". Remove from all SMS sequences. Move to email-only nurture.*

**If they ask a specific question about a tool:**
```
Great question. [Answer the specific question in 2-3 sentences.] Want to see it in action? The demo lets you play with it live: gethomeedge.com/demo.html
```

---

## PHONE CALL ESCALATION

### When to Call:

| Trigger | Action |
|---------|--------|
| Lead replied positively but hasn't booked a demo after 24 hours | Cole calls within business hours |
| Lead viewed demo page 2+ times (tracked via GHL pixel) | Cole calls -- they're interested but need a push |
| Lead is a brokerage owner or team leader (from lead score data) | Cole calls after SMS #2 regardless of reply |
| Day 7 with no reply to any SMS | Cole calls once as final outreach before SMS #6 |

### GHL Configuration for Phone Escalation:
1. **After SMS #5 (Day 7):** Wait 2 hours
2. **If/Else:** Contact has NOT replied to any SMS AND has NOT booked
3. **Action:** Create GHL Task -- "Call {{contact.first_name}} {{contact.last_name}} -- No SMS reply after 7 days"
4. **Action:** Send push notification to Cole's phone
5. **Action:** Add tag "Phone Call Needed"

### Call Script (keep it short):
"Hey {{first_name}}, it's Cole from HomeEdge. I sent you a couple texts this week about the AI seller tools I built for listing agents. Wanted to put a voice to the name. Do you have about 2 minutes? ... Great. Quick version: I'm a steel worker in Wisconsin who builds AI at night. I built a branded seller platform -- your name, your logo, 5 AI tools that help you win listings. My first client generated $12K in month one. I'm looking for 10 founding members. Would it be worth 10 minutes later this week to see a demo?"

---

## LEAD SOURCE VARIATIONS

Different lead sources get slightly different SMS #1 messages. The rest of the sequence stays the same.

### Facebook Lead Ad:
```
Hey {{contact.first_name}}, it's Cole from HomeEdge. Saw you checked out the AI tools for listing agents on Facebook. Thanks for looking. Got any questions? I'm the one who actually built all of it -- happy to walk you through anything.

Reply STOP to opt out.
```

### Website Form (gethomeedge.com):
```
Hey {{contact.first_name}}, it's Cole. You just signed up on the HomeEdge site. Wanted to say thanks personally. If you haven't hit the demo yet, it's worth 30 seconds: gethomeedge.com/demo.html

I built every tool on there. Questions? Just reply here.

Reply STOP to opt out.
```

### LinkedIn Connection / DM Response:
```
Hey {{contact.first_name}}, it's Cole -- we connected on LinkedIn. Moving the conversation here since it's easier. Wanted to make sure you saw the HomeEdge demo: gethomeedge.com/demo.html

Let me know what you think. Built it all myself.

Reply STOP to opt out.
```

### Gift Bot Demo Request (Facebook Group):
```
Hey {{contact.first_name}}, it's Cole. I'm building your free demo bot right now. Should have it ready within the hour. I'll text you the link when it's live.

In the meantime, here's what the full platform looks like: gethomeedge.com/demo.html

Reply STOP to opt out.
```

---

## GHL PIPELINE STAGES

Set up a pipeline called **"HomeEdge SMS Leads"** with these stages:

| Stage | Trigger | Notes |
|-------|---------|-------|
| New Lead | Contact created with "SMS Opted In" tag | Auto-enters SMS workflow |
| SMS Sent | After SMS #1 sends | Tracking engagement |
| Engaged | Lead replies to any SMS | Workflow pauses, Cole responds |
| Demo Viewed | Lead clicks demo link (GHL tracking pixel) | High intent signal |
| Demo Booked | Calendly booking or GHL calendar event | Exit SMS workflow |
| Demo Completed | Cole marks manually after call | Triggers demo follow-up sequence |
| Proposal Sent | Cole sends pricing/tier info | |
| Won | Stripe payment received | Triggers onboarding sequence |
| Lost -- Not Now | "Maybe later" response | Revisit in 30 days |
| Lost -- Not Interested | "No thanks" response | Email nurture only |
| Lost -- No Response | Day 14, no engagement | Email nurture only |

---

## GHL TAGS TO CREATE

| Tag | Purpose |
|-----|---------|
| SMS Opted In | Required for SMS workflow entry |
| SMS Replied | Lead responded to at least one text |
| Phone Call Needed | Escalation trigger for Cole |
| Demo Viewed | Clicked demo link |
| Demo Booked | Scheduled a call |
| Founding Member Lead | Expressed interest in founding pricing |
| Brokerage Lead | Team leader or broker owner (priority) |
| Wisconsin Lead | Local -- gets priority outreach |
| Nurture -- Revisit 30 Days | Check back later |
| Not Interested | Stop all SMS, email nurture only |
| Do Not SMS | Hard opt-out |
| Source: Facebook Ad | Lead source tracking |
| Source: Website Form | Lead source tracking |
| Source: LinkedIn | Lead source tracking |
| Source: Gift Bot | Lead source tracking |
| Source: Referral | Lead source tracking |

---

## GHL CUSTOM FIELDS

| Field | Type | Purpose |
|-------|------|---------|
| Lead Score | Number | From scored_leads.csv ranking system |
| Brokerage Name | Text | For personalization |
| Agent Count | Number | For brokerage leads -- determines tier |
| Lead Source | Dropdown | Facebook Ad, Website, LinkedIn, Gift Bot, Referral, Cold Outreach |
| Last SMS Sent | Date | Track cadence |
| SMS Reply Count | Number | Engagement scoring |
| Demo Link Clicks | Number | Intent scoring |

---

## TIMING RULES

1. **Never send before 9 AM or after 8 PM** in the lead's timezone. GHL can detect timezone from area code. If unknown, default to Central Time.
2. **Never send on Sundays.** Push to Monday morning.
3. **Space messages by at least 4 hours.** No double-texting in the same window.
4. **If a lead replies, STOP the automation immediately.** Do not send the next scheduled SMS. Cole handles it from there.
5. **Brokerage leads (team leaders, broker owners) get a phone call after SMS #2** regardless of reply status. These are high-value leads worth the personal touch.
6. **Wisconsin leads get SMS #1 personalized** with "fellow Wisconsin builder" language. Use GHL If/Else on the Location field.

---

## WEEKLY REVIEW CHECKLIST (for Cole)

Every Monday morning, review these in GHL:

- [ ] How many new leads entered the SMS workflow this week?
- [ ] How many replied? (target: 25%+ reply rate)
- [ ] How many moved to "Engaged" or "Demo Booked"?
- [ ] Any leads stuck in "Phone Call Needed" that you haven't called yet?
- [ ] Any STOP requests? (check compliance)
- [ ] Which lead source is producing the most replies?
- [ ] Any messages that need rewriting based on response patterns?

---

## SETUP STEPS IN GHL (Implementation Checklist)

1. [ ] Register A2P 10DLC in GHL Trust Center
2. [ ] Purchase a local phone number (Wisconsin area code -- 414 or 262 -- for trust)
3. [ ] Create the pipeline "HomeEdge SMS Leads" with all stages above
4. [ ] Create all tags listed above
5. [ ] Create all custom fields listed above
6. [ ] Build Workflow: "HomeEdge SMS Follow-Up -- New Lead"
   - Trigger: Contact Created + Tag "SMS Opted In"
   - Add If/Else branches for lead source (customize SMS #1)
   - Add If/Else branch for Location contains "WI" or "Wisconsin"
   - Add Wait steps with business hours enforcement
   - Add Reply Detection at each wait step (exit to Conversation Branch)
   - Add internal notification actions for replies and escalations
7. [ ] Connect Calendly webhook to GHL (or use GHL calendar)
8. [ ] Connect Stripe webhook to GHL for purchase detection
9. [ ] Set up GHL tracking pixel on gethomeedge.com/demo.html
10. [ ] Test the full workflow with a test contact
11. [ ] Import existing leads from scored_leads.csv (tag appropriately, DO NOT auto-enroll without SMS consent)

---

## COPY RULES (Same as All HomeEdge Content)

- No em dashes anywhere (use -- if needed)
- First person, conversational
- No corporate speak ("leverage", "optimize", "synergy" -- never)
- Sign off with "-- Cole" on final messages
- One call to action per message (not two, not three)
- No emoji overload (zero or one max per message)
- Short paragraphs. These are texts, not emails.
- Always reference that Cole built this himself. That's the differentiator.
- Demo link OR founders link, never both in the same text

---

*This workflow handles the first 14 days of SMS engagement. After Day 14 with no response, leads move to email-only nurture via MailerLite. The SMS channel stays open -- if they text back months later, Cole picks up the conversation.*
