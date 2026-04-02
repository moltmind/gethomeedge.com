# HomeEdge Telegram Bot

A simple lead-capture bot for HomeEdge. No paid APIs. Runs free on the Telegram Bot API.

## What It Does

- Welcomes new users with the HomeEdge pitch
- Shows all 28 AI tools (/tools)
- Shows founding member pricing (/pricing)
- Sends the live demo link (/demo)
- Captures lead info (name, email, phone, brokerage) and saves it to a local file
- Notifies you (Cole) instantly when a new lead comes in

## Setup (Step by Step)

### 1. Get a Bot Token from Telegram

1. Open Telegram and search for **@BotFather**
2. Send him the message: `/newbot`
3. He'll ask you for a name. Type something like: `HomeEdge`
4. He'll ask for a username. Type something like: `HomeEdgeBot` (must end in "Bot")
5. BotFather will give you a long token that looks like: `7123456789:AAH_some_random_letters_and_numbers`
6. Copy that token. You'll need it in step 3.

### 2. Get Your Chat ID (so the bot can notify you)

1. Open Telegram and search for **@userinfobot**
2. Send it any message
3. It will reply with your user ID (a number like `123456789`)
4. Copy that number. You'll need it in step 3.

### 3. Install and Run

Make sure you have Node.js installed. If you don't, download it from https://nodejs.org (pick the LTS version).

Open your terminal and run these commands one at a time:

```
cd "/Users/faith/Desktop/Home Profit System/HPS/telegram-bot"
npm install
```

Now set your token and chat ID. You have two options:

**Option A: Environment variables (recommended)**

```
export HOMEEDGE_BOT_TOKEN="paste-your-token-here"
export COLE_CHAT_ID="paste-your-chat-id-here"
npm start
```

**Option B: Edit the file directly**

Open `bot.js` in any text editor. Find these two lines near the top:

```
const BOT_TOKEN = process.env.HOMEEDGE_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const COLE_CHAT_ID = process.env.COLE_CHAT_ID || 'YOUR_CHAT_ID_HERE';
```

Replace `YOUR_BOT_TOKEN_HERE` with your bot token and `YOUR_CHAT_ID_HERE` with your chat ID number. Then run:

```
npm start
```

You should see: `HomeEdge Telegram Bot is running...`

### 4. Test It

1. Open Telegram
2. Search for whatever username you gave your bot (e.g. @HomeEdgeBot)
3. Send `/start` and you should get the welcome message
4. Try `/tools`, `/pricing`, `/demo`, and `/contact`

## Bot Commands

| Command    | What it does                                    |
|------------|------------------------------------------------|
| /start     | Welcome message with HomeEdge pitch             |
| /tools     | Lists all 28 AI tools                           |
| /pricing   | Shows founder pricing (Starter, Pro, Elite)     |
| /demo      | Sends the live demo link                        |
| /contact   | Walks through lead capture (name, email, etc.)  |
| /menu      | Shows available commands                        |

## Where Leads Are Saved

All captured leads are saved to `leads.json` in this same folder. Each lead includes:

- Name
- Email
- Phone
- Brokerage
- Telegram username
- Timestamp

## Keeping It Running

The bot only works while the terminal is open. To keep it running 24/7 on your Mac:

```
nohup node bot.js > bot.log 2>&1 &
```

This runs it in the background. Check `bot.log` if anything goes wrong.

To stop it later:

```
pkill -f "node bot.js"
```

## Cost

Zero. The Telegram Bot API is completely free. No API keys, no credits, no limits that matter for this use case.
