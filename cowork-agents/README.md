# HomeEdge Cowork Agents

Five Cowork Projects that run HomeEdge like a company. Each file below is the project instructions for a Cowork session. Copy-paste into a new Cowork Project's instructions to activate that agent.

## The Team

| Agent | Role | File | When to Use |
|-------|------|------|-------------|
| **SPARK** | Marketing | SPARK-marketing.md | Daily — content creation, posting, engagement |
| **CLOSER** | Sales | CLOSER-sales.md | Daily — pipeline, outreach, demos, closing |
| **FORGE** | Engineering | FORGE-engineering.md | As needed — deploys, fixes, monitoring |
| **ONBOARD** | Operations | ONBOARD-operations.md | When a sale happens — client setup |
| **LEDGER** | Finance | LEDGER-finance.md | Weekly — revenue tracking, costs, margins |

## How to Set Up

1. Open Claude Desktop app
2. Go to the Cowork tab
3. Create a new Project for each agent
4. Paste the agent's .md file contents into the Project Instructions
5. Point the Project's working directory to `/Users/faith/Desktop/Home Profit System/HPS/`

## How to Use

**Morning routine:**
1. Open SPARK — "What content goes out today?"
2. Open CLOSER — "Any new leads? Who's hottest?"
3. SPARK drafts content, CLOSER drafts outreach, you execute both

**When something breaks:**
1. Open FORGE — "Check all endpoints and fix anything down"

**When a sale comes in:**
1. Open ONBOARD — "New client: [name], [tier]. Begin onboarding."

**End of week:**
1. Open LEDGER — "Weekly financial report"

## CEO Prompt
The master CEO prompt that coordinates all agents is at:
`/Users/faith/Desktop/Home Profit System/HPS/CEO-PROMPT.md`

Use it as the instructions for your PRIMARY Claude Code session. It spawns sub-agents mapped to these same roles.
