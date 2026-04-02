#!/usr/bin/env python3
"""Mass gift bot generator for HomeEdge outreach."""

import os
import re

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Seller Assistant | {display_name}</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0f1a;color:#e2e8f0;min-height:100vh;display:flex;flex-direction:column}}
.header{{background:linear-gradient(135deg,#0B1426 0%,#132038 100%);border-bottom:1px solid #1E3050;padding:20px 24px;text-align:center}}
.header h1{{font-size:1.1rem;color:#00D4FF;letter-spacing:0.5px;margin-bottom:4px}}
.header h2{{font-size:1.5rem;color:#fff;font-weight:700}}
.header .company{{font-size:0.95rem;color:#94a3b8;margin-top:4px}}
.header .market{{display:inline-block;margin-top:8px;padding:4px 12px;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.2);border-radius:20px;font-size:0.8rem;color:#00D4FF}}
.demo-badge{{text-align:center;padding:8px;background:rgba(245,166,35,0.1);border-bottom:1px solid rgba(245,166,35,0.15);font-size:0.8rem;color:#F5A623}}
.chat-container{{flex:1;display:flex;flex-direction:column;max-width:800px;width:100%;margin:0 auto;padding:0 16px}}
.messages{{flex:1;overflow-y:auto;padding:20px 0;display:flex;flex-direction:column;gap:16px}}
.msg{{max-width:85%;padding:14px 18px;border-radius:16px;line-height:1.6;font-size:0.95rem;animation:fadeIn 0.3s ease}}
.msg.bot{{align-self:flex-start;background:#141b2d;border:1px solid #1E3050;border-bottom-left-radius:4px}}
.msg.user{{align-self:flex-end;background:linear-gradient(135deg,#00D4FF 0%,#0099cc 100%);color:#0B1426;font-weight:500;border-bottom-right-radius:4px}}
.msg.bot strong{{color:#00D4FF}}
.msg.bot ul,.msg.bot ol{{margin:8px 0 8px 20px}}
.msg.bot li{{margin:4px 0}}
.msg.bot p{{margin:6px 0}}
.typing{{align-self:flex-start;padding:14px 18px;background:#141b2d;border:1px solid #1E3050;border-radius:16px;border-bottom-left-radius:4px}}
.typing span{{display:inline-block;width:8px;height:8px;background:#00D4FF;border-radius:50%;margin:0 2px;animation:bounce 1.4s infinite}}
.typing span:nth-child(2){{animation-delay:0.2s}}
.typing span:nth-child(3){{animation-delay:0.4s}}
@keyframes bounce{{0%,60%,100%{{transform:translateY(0)}}30%{{transform:translateY(-8px)}}}}
@keyframes fadeIn{{from{{opacity:0;transform:translateY(8px)}}to{{opacity:1;transform:translateY(0)}}}}
.input-area{{padding:16px 0 24px;display:flex;gap:10px}}
.input-area input{{flex:1;padding:14px 18px;background:#141b2d;border:1px solid #1E3050;border-radius:12px;color:#e2e8f0;font-size:0.95rem;outline:none;transition:border-color 0.2s}}
.input-area input:focus{{border-color:#00D4FF}}
.input-area input::placeholder{{color:#4a5568}}
.input-area button{{padding:14px 24px;background:linear-gradient(135deg,#00D4FF,#0099cc);color:#0B1426;border:none;border-radius:12px;font-weight:700;font-size:0.95rem;cursor:pointer;transition:transform 0.1s}}
.input-area button:hover{{transform:scale(1.02)}}
.input-area button:active{{transform:scale(0.98)}}
.input-area button:disabled{{opacity:0.5;cursor:not-allowed;transform:none}}
.footer{{text-align:center;padding:16px;border-top:1px solid #1E3050;font-size:0.8rem;color:#4a5568}}
.footer a{{color:#F5A623;text-decoration:none;font-weight:600}}
.footer a:hover{{text-decoration:underline}}
.suggested{{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}}
.suggested button{{padding:8px 16px;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);border-radius:20px;color:#00D4FF;font-size:0.85rem;cursor:pointer;transition:all 0.2s}}
.suggested button:hover{{background:rgba(0,212,255,0.15);border-color:#00D4FF}}
@media(max-width:600px){{.header h2{{font-size:1.2rem}}.msg{{max-width:92%}}.input-area{{padding:12px 0 16px}}}}
</style>
</head>
<body>
<div class="header">
  <h1>AI Seller Assistant</h1>
  <h2>{display_name}</h2>
  <div class="company">{company} | {city}, {state}</div>
  <div class="market">Serving the {market_area} Area</div>
</div>
<div class="demo-badge">Live Demo -- Built by Cole Cummings for {first_name} {last_name}</div>
<div class="chat-container">
  <div class="messages" id="messages">
    <div class="msg bot">
      <p>Hi! I'm the AI seller assistant for {first_name} {last_name} at {company}. I help homeowners in the {market_area} area understand everything about selling their home.</p>
      <p>{market_hook}</p>
      <p><strong>What can I help you with?</strong></p>
      <div class="suggested">
        <button onclick="sendSuggested(this)">{q1}</button>
        <button onclick="sendSuggested(this)">{q2}</button>
        <button onclick="sendSuggested(this)">{q3}</button>
        <button onclick="sendSuggested(this)">{q4}</button>
      </div>
    </div>
  </div>
  <div class="input-area">
    <input type="text" id="input" placeholder="Ask anything about selling your home in {city}..." autocomplete="off">
    <button id="send" onclick="send()">Send</button>
  </div>
</div>
<div class="footer">
  Powered by <a href="https://gethomeedge.com" target="_blank">HomeEdge</a> | This is 1 of 28 AI-powered tools. <a href="https://gethomeedge.com" target="_blank">See the full platform</a>
</div>
<script>
const WORKER="https://homeedge-chat.moltmind.workers.dev/gift";
const AGENT={{name:"{first_name} {last_name}",company:"{company}",city:"{city}",state:"{state}"}};
const history=[];const msgBox=document.getElementById("messages");const input=document.getElementById("input");const sendBtn=document.getElementById("send");
function sendSuggested(btn){{input.value=btn.textContent;btn.parentElement.remove();send()}}
function addMsg(role,text){{const d=document.createElement("div");d.className="msg "+role;if(role==="bot"){{let html=text.replace(/\\*\\*(.*?)\\*\\*/g,"<strong>$1</strong>");html=html.replace(/\\n\\n/g,"</p><p>");html=html.replace(/\\n- /g,"</p><ul><li>").replace(/<\\/ul><ul>/g,"");if(html.includes("<li>"))html+="</li></ul>";html=html.replace(/\\n(\\d+)\\. /g,"</p><ol><li>").replace(/<\\/ol><ol>/g,"");if(html.includes("<ol>"))html+="</li></ol>";html=html.replace(/\\n/g,"<br>");d.innerHTML="<p>"+html+"</p>";}}else{{d.textContent=text;}}msgBox.appendChild(d);msgBox.scrollTop=msgBox.scrollHeight;}}
function showTyping(){{const d=document.createElement("div");d.className="typing";d.id="typing";d.innerHTML="<span></span><span></span><span></span>";msgBox.appendChild(d);msgBox.scrollTop=msgBox.scrollHeight;}}
function hideTyping(){{const t=document.getElementById("typing");if(t)t.remove();}}
async function send(){{const text=input.value.trim();if(!text)return;input.value="";sendBtn.disabled=true;addMsg("user",text);history.push({{role:"user",content:text}});showTyping();try{{const res=await fetch(WORKER,{{method:"POST",headers:{{"Content-Type":"application/json"}},body:JSON.stringify({{messages:history,agentName:AGENT.name,company:AGENT.company,city:AGENT.city,state:AGENT.state}})}});const data=await res.json();hideTyping();if(data.reply){{addMsg("bot",data.reply);history.push({{role:"assistant",content:data.reply}});}}else{{addMsg("bot","Sorry, I had trouble responding. Please try again.");}}}}catch(e){{hideTyping();addMsg("bot","Connection issue. Please try again in a moment.");}}sendBtn.disabled=false;input.focus();}}
input.addEventListener("keydown",e=>{{if(e.key==="Enter"&&!sendBtn.disabled)send()}});
</script>
</body>
</html>"""

# Market hooks and suggested questions by region
MARKET_DATA = {
    "TX": {
        "hook": "Texas real estate moves fast -- whether you're in the suburbs or the city, timing and pricing are everything right now.",
        "q1": "What's the market like in my area right now?",
        "q2": "How should I price my home to sell fast?",
        "q3": "What repairs actually increase my home's value?",
        "q4": "What are my net proceeds after selling?",
    },
    "IL": {
        "hook": "The Chicagoland market has unique dynamics -- from property taxes to neighborhood demand, every detail matters when selling.",
        "q1": "What's the Chicago-area market like right now?",
        "q2": "How do I price my home competitively?",
        "q3": "How do property taxes affect my sale?",
        "q4": "What are my estimated net proceeds?",
    },
    "GA": {
        "hook": "Atlanta's market is one of the hottest in the Southeast -- knowing how to position your home is the difference between a quick sale and sitting on the market.",
        "q1": "What's the Atlanta market like right now?",
        "q2": "How do I price my home to get multiple offers?",
        "q3": "Should I stage my home before listing?",
        "q4": "What are my net proceeds after selling?",
    },
    "TN": {
        "hook": "Nashville's real estate market is booming with new residents every day -- positioning your home right means selling faster and for more.",
        "q1": "What's the Nashville market like right now?",
        "q2": "How should I price my home?",
        "q3": "What makes Nashville buyers choose one home over another?",
        "q4": "What are my estimated net proceeds?",
    },
    "MD": {
        "hook": "The Baltimore market has pockets of incredible demand -- knowing which neighborhoods are trending and how to price accordingly is key.",
        "q1": "What's the Baltimore-area market like right now?",
        "q2": "How do I price my home competitively?",
        "q3": "What upgrades help sell a home in this market?",
        "q4": "What are my net proceeds after selling?",
    },
    "NC": {
        "hook": "North Carolina's real estate market is attracting buyers from across the country -- that means opportunity if you position your home right.",
        "q1": "What's the market like in my area right now?",
        "q2": "How should I price my home?",
        "q3": "What are buyers looking for in this market?",
        "q4": "What are my estimated net proceeds?",
    },
    "MN": {
        "hook": "The Twin Cities market rewards sellers who price right and present well -- let's make sure you're set up to maximize your sale.",
        "q1": "What's the Twin Cities market like right now?",
        "q2": "How do I price my home to sell quickly?",
        "q3": "Should I make repairs before listing?",
        "q4": "What are my net proceeds after selling?",
    },
    "AZ": {
        "hook": "Arizona's real estate market is driven by migration and lifestyle buyers -- pricing and presentation are everything in this competitive landscape.",
        "q1": "What's the Phoenix/Scottsdale market like right now?",
        "q2": "How should I price my home to sell fast?",
        "q3": "What upgrades get the best ROI in Arizona?",
        "q4": "What are my net proceeds after selling?",
    },
    "CO": {
        "hook": "Denver's real estate market attracts buyers from across the country -- strong presentation and smart pricing make all the difference.",
        "q1": "What's the Denver market like right now?",
        "q2": "How do I price my home competitively?",
        "q3": "What repairs actually increase my home's value?",
        "q4": "What are my estimated net proceeds?",
    },
    "FL": {
        "hook": "Florida's real estate market is fueled by relocation and investment buyers -- positioning your home right means faster sales and stronger offers.",
        "q1": "What's the market like in my area right now?",
        "q2": "How should I price my home to attract multiple offers?",
        "q3": "What should I disclose about insurance and flood zones?",
        "q4": "What are my net proceeds after selling?",
    },
    "IN": {
        "hook": "Indiana's real estate market offers strong value for buyers -- as a seller, that means smart pricing and great presentation are your best tools.",
        "q1": "What's the Indianapolis market like right now?",
        "q2": "How do I price my home to sell quickly?",
        "q3": "What improvements help sell a home in this market?",
        "q4": "What are my estimated net proceeds?",
    },
    "OH": {
        "hook": "Ohio's housing market is steady and growing -- buyers are looking for move-in ready homes with strong neighborhood appeal.",
        "q1": "What's the Columbus market like right now?",
        "q2": "How should I price my home?",
        "q3": "What are buyers looking for in this market?",
        "q4": "What are my net proceeds after selling?",
    },
    "OR": {
        "hook": "Portland's real estate market rewards unique properties and neighborhood character -- let's make sure your home stands out to the right buyers.",
        "q1": "What's the Portland market like right now?",
        "q2": "How do I price my home competitively?",
        "q3": "What makes Portland buyers choose one home over another?",
        "q4": "What are my estimated net proceeds?",
    },
    "MO": {
        "hook": "Kansas City's real estate market is on the rise -- more buyers are moving in every year, and sellers who position well are seeing strong results.",
        "q1": "What's the Kansas City market like right now?",
        "q2": "How should I price my home?",
        "q3": "What upgrades help sell a home in this market?",
        "q4": "What are my net proceeds after selling?",
    },
    "NE": {
        "hook": "Omaha's real estate market is stable and growing -- buyers value well-maintained homes in strong school districts, and pricing right is key.",
        "q1": "What's the Omaha market like right now?",
        "q2": "How do I price my home to sell quickly?",
        "q3": "What improvements get the best return on investment?",
        "q4": "What are my estimated net proceeds?",
    },
}

# Default for states not listed
DEFAULT_MARKET = {
    "hook": "The real estate market is always changing -- understanding your local dynamics is key to getting the best price for your home.",
    "q1": "What's the market like in my area right now?",
    "q2": "How should I price my home?",
    "q3": "What should I do to prepare my home for sale?",
    "q4": "What are my estimated net proceeds?",
}

LEADS = [
    # Texas
    {"first": "Melony", "last": "Trementozzi", "company": "eXp Realty", "city": "McKinney", "state": "TX", "market": "Dallas-Fort Worth"},
    {"first": "Sharon", "last": "Dolan", "company": "Keller Williams Realty", "city": "Dallas", "state": "TX", "market": "Dallas"},
    {"first": "Ashlee", "last": "Calvert", "company": "United Real Estate", "city": "Houston", "state": "TX", "market": "Greater Houston"},
    {"first": "Eboni", "last": "Berry", "company": "eXp Realty", "city": "Houston", "state": "TX", "market": "Houston"},
    {"first": "Ezalden", "last": "Alleheibat", "company": "Team West Real Estate", "city": "Austin", "state": "TX", "market": "Austin"},
    # Chicago
    {"first": "Sanjay", "last": "Marathe", "company": "Keller Williams Infinity", "city": "Naperville", "state": "IL", "market": "Chicagoland"},
    {"first": "Stella", "last": "Amenechi", "company": "Coldwell Banker Realty", "city": "Evanston", "state": "IL", "market": "North Shore Chicago"},
    {"first": "Venetia Ann", "last": "Johnson", "company": "Coldwell Banker Realty", "city": "Chicago", "state": "IL", "market": "Chicago"},
    {"first": "Donna", "last": "Scumaci", "company": "KW Premiere Properties", "city": "Elmhurst", "state": "IL", "market": "DuPage County"},
    {"first": "Sierra", "last": "Willman", "company": "KW Premiere Properties", "city": "Glen Ellyn", "state": "IL", "market": "DuPage County"},
    # Atlanta
    {"first": "Megan", "last": "Kumming", "company": "KW Peachtree Road", "city": "Atlanta", "state": "GA", "market": "Atlanta"},
    {"first": "Tanya", "last": "Jones", "company": "Atlanta First Realty Group", "city": "Smyrna", "state": "GA", "market": "Metro Atlanta"},
    {"first": "Bridget", "last": "Johnson", "company": "Coldwell Banker Realty", "city": "Atlanta", "state": "GA", "market": "Greater Atlanta"},
    {"first": "Tim", "last": "Hardeman", "company": "Hardeman Real Estate", "city": "Roswell", "state": "GA", "market": "North Fulton"},
    {"first": "Aida", "last": "Friebe", "company": "Engel and Volkers", "city": "Atlanta", "state": "GA", "market": "Atlanta"},
    # East Coast
    {"first": "Caitlin", "last": "Martin", "company": "Weichert Realtors", "city": "Nashville", "state": "TN", "market": "Nashville"},
    {"first": "Sophia", "last": "McCormick", "company": "Next Step Realty", "city": "Baltimore", "state": "MD", "market": "Baltimore"},
    {"first": "Lisa", "last": "Ciofani", "company": "Cummings and Co Realtors", "city": "Baltimore", "state": "MD", "market": "Baltimore"},
    {"first": "Candace", "last": "Ellis", "company": "Ellis Group Realty", "city": "Charlotte", "state": "NC", "market": "Charlotte"},
    {"first": "Melonie", "last": "Mickle", "company": "M2 Realty", "city": "Raleigh", "state": "NC", "market": "Triangle"},
    # === EXPANSION MARKETS (April 1, 2026) ===
    # Phoenix/Scottsdale, AZ
    {"first": "Alexandra", "last": "Komichak", "company": "eXp Realty", "city": "Phoenix", "state": "AZ", "market": "Phoenix"},
    {"first": "Mariana", "last": "Hoyt", "company": "My Home Group Real Estate", "city": "Phoenix", "state": "AZ", "market": "Phoenix"},
    {"first": "Caitlin", "last": "Bronsky", "company": "Real Broker", "city": "Phoenix", "state": "AZ", "market": "Phoenix"},
    {"first": "Susan", "last": "Polakof", "company": "Coldwell Banker Realty", "city": "Phoenix", "state": "AZ", "market": "Phoenix"},
    {"first": "Kari", "last": "Gutierrez", "company": "HomeSmart", "city": "Phoenix", "state": "AZ", "market": "Phoenix"},
    {"first": "Patricia", "last": "Gore", "company": "Coldwell Banker Realty", "city": "Scottsdale", "state": "AZ", "market": "Scottsdale"},
    {"first": "Heather", "last": "Martin", "company": "eXp Realty", "city": "Scottsdale", "state": "AZ", "market": "Scottsdale"},
    {"first": "Judy", "last": "Hudek", "company": "Realty ONE Group", "city": "Scottsdale", "state": "AZ", "market": "Scottsdale"},
    # Denver, CO
    {"first": "David", "last": "Colson", "company": "RE/MAX Alliance", "city": "Denver", "state": "CO", "market": "Denver"},
    {"first": "Loretta", "last": "Hernandez", "company": "Sterling Real Estate Group", "city": "Denver", "state": "CO", "market": "Denver"},
    {"first": "Christopher", "last": "Raichart", "company": "RE/MAX Synergy", "city": "Denver", "state": "CO", "market": "Denver"},
    {"first": "David", "last": "Armayor", "company": "Coldwell Banker Realty", "city": "Denver", "state": "CO", "market": "Denver"},
    {"first": "Elyse", "last": "Anderson", "company": "Key Team Real Estate", "city": "Denver", "state": "CO", "market": "Denver"},
    {"first": "Lori", "last": "Anderst", "company": "Brokers Guild Real Estate", "city": "Denver", "state": "CO", "market": "Denver"},
    {"first": "Jean", "last": "Theobald", "company": "RE/MAX Professionals", "city": "Denver", "state": "CO", "market": "Denver"},
    {"first": "Kimberly", "last": "Chatman", "company": "Coldwell Banker Realty", "city": "Denver", "state": "CO", "market": "Denver"},
    # Tampa, FL
    {"first": "Aimee", "last": "Millan", "company": "Dalton Wade Inc", "city": "Tampa", "state": "FL", "market": "Tampa Bay"},
    {"first": "Nicole", "last": "DiSabato Harmon", "company": "RE/MAX Realtec Group", "city": "Tampa", "state": "FL", "market": "Tampa Bay"},
    {"first": "Tina", "last": "White", "company": "Century 21 BE3", "city": "Tampa", "state": "FL", "market": "Tampa Bay"},
    {"first": "Cindy", "last": "Harrison", "company": "Future Home Realty", "city": "Tampa", "state": "FL", "market": "Tampa Bay"},
    {"first": "Gloria", "last": "Steele", "company": "Keller Williams Tampa", "city": "Tampa", "state": "FL", "market": "Tampa Bay"},
    {"first": "Shauna", "last": "Ward", "company": "SENW", "city": "Tampa", "state": "FL", "market": "Tampa Bay"},
    {"first": "Mitchell", "last": "Eckley", "company": "Coldwell Banker Realty", "city": "Tampa", "state": "FL", "market": "Tampa Bay"},
    {"first": "Ray", "last": "Perez", "company": "Agile Group Realty", "city": "Tampa", "state": "FL", "market": "Tampa Bay"},
    # Orlando, FL
    {"first": "Nicole", "last": "Perpillant", "company": "La Rosa Realty", "city": "Orlando", "state": "FL", "market": "Orlando"},
    {"first": "Brendy", "last": "Calderon", "company": "eXp Realty", "city": "Orlando", "state": "FL", "market": "Orlando"},
    {"first": "Rodieris", "last": "Guzman", "company": "Keller Williams Classic", "city": "Orlando", "state": "FL", "market": "Orlando"},
    {"first": "Jose", "last": "Martinez Rivera", "company": "LPT Realty", "city": "Orlando", "state": "FL", "market": "Orlando"},
    {"first": "Carlos", "last": "Diaz", "company": "Collective Group Realty", "city": "Orlando", "state": "FL", "market": "Orlando"},
    {"first": "Edgar", "last": "Rodriguez", "company": "RE/MAX Elite", "city": "Orlando", "state": "FL", "market": "Orlando"},
    {"first": "Jay", "last": "Patterson", "company": "Keller Williams Advantage", "city": "Orlando", "state": "FL", "market": "Orlando"},
    {"first": "Paulo", "last": "Alves", "company": "Compass Florida", "city": "Orlando", "state": "FL", "market": "Orlando"},
    # Indianapolis, IN
    {"first": "Keith", "last": "Fields", "company": "F.C. Tucker Company", "city": "Indianapolis", "state": "IN", "market": "Indianapolis"},
    {"first": "Chuck", "last": "Bear", "company": "eXp Realty", "city": "Indianapolis", "state": "IN", "market": "Indianapolis"},
    {"first": "Sherri", "last": "Bryant", "company": "Highgarden Real Estate", "city": "Indianapolis", "state": "IN", "market": "Indianapolis"},
    {"first": "Shawn", "last": "Nugent", "company": "Highgarden Real Estate", "city": "Indianapolis", "state": "IN", "market": "Indianapolis"},
    {"first": "Taylor", "last": "Thomas", "company": "eXp Realty", "city": "Indianapolis", "state": "IN", "market": "Indianapolis"},
    {"first": "Alyssa", "last": "Thurman", "company": "CrestPoint Real Estate", "city": "Indianapolis", "state": "IN", "market": "Indianapolis"},
    {"first": "Rashelle", "last": "Howe", "company": "Century 21 Scheetz", "city": "Indianapolis", "state": "IN", "market": "Indianapolis"},
    {"first": "Marcus", "last": "Fillyaw", "company": "RE/MAX Advanced Realty", "city": "Indianapolis", "state": "IN", "market": "Indianapolis"},
    # Columbus, OH
    {"first": "Tom", "last": "Eroshevich", "company": "RE/MAX Partners", "city": "Columbus", "state": "OH", "market": "Columbus"},
    {"first": "Laurie", "last": "Elsass", "company": "Keller Williams Capital Partners", "city": "Columbus", "state": "OH", "market": "Columbus"},
    {"first": "Kennisha", "last": "Cunningham", "company": "Coldwell Banker Realty", "city": "Columbus", "state": "OH", "market": "Columbus"},
    {"first": "Chrisi", "last": "Hagan", "company": "Red 1 Realty", "city": "Columbus", "state": "OH", "market": "Columbus"},
    {"first": "Kimberly", "last": "Russell", "company": "RE/MAX ONE", "city": "Columbus", "state": "OH", "market": "Columbus"},
    {"first": "Kimberly", "last": "Saunders", "company": "RE/MAX Revealty", "city": "Columbus", "state": "OH", "market": "Columbus"},
    {"first": "Connie", "last": "Sadowski", "company": "Coldwell Banker Realty", "city": "Columbus", "state": "OH", "market": "Columbus"},
    {"first": "Stephanie", "last": "Gulau", "company": "Keller Williams Capital Partners", "city": "Columbus", "state": "OH", "market": "Columbus"},
    # Kansas City, MO
    {"first": "Kelli", "last": "Nelson", "company": "Realty ONE Group Esteem", "city": "Kansas City", "state": "MO", "market": "Kansas City"},
    {"first": "Joanna", "last": "Rangel", "company": "Keller Williams Southland", "city": "Kansas City", "state": "MO", "market": "Kansas City"},
    {"first": "Gary", "last": "Ashley Sr", "company": "Weichert Realtors", "city": "Kansas City", "state": "MO", "market": "Kansas City"},
    {"first": "Lainey", "last": "Puglisi", "company": "RE/MAX Heritage", "city": "Kansas City", "state": "MO", "market": "Kansas City"},
    {"first": "Terri", "last": "Riddle", "company": "Keller Williams KC North", "city": "Kansas City", "state": "MO", "market": "Kansas City"},
    {"first": "Peggy", "last": "Jones-Wilson", "company": "ReeceNichols", "city": "Kansas City", "state": "MO", "market": "Kansas City"},
    {"first": "Crystal", "last": "Hawkins", "company": "Boulevard Residential", "city": "Kansas City", "state": "MO", "market": "Kansas City"},
    {"first": "Dina", "last": "Blackmore", "company": "Platinum Realty", "city": "Kansas City", "state": "MO", "market": "Kansas City"},
    # Portland, OR
    {"first": "Shawn", "last": "Watson", "company": "RE/MAX Northwest", "city": "Portland", "state": "OR", "market": "Portland"},
    {"first": "Koert", "last": "Balke", "company": "MORE Realty", "city": "Portland", "state": "OR", "market": "Portland"},
    {"first": "Sylvia", "last": "Groce", "company": "RE/MAX Equity Group", "city": "Portland", "state": "OR", "market": "Portland"},
    {"first": "Dan", "last": "Walters", "company": "Keller Williams Portland Elite", "city": "Portland", "state": "OR", "market": "Portland"},
    {"first": "Felicity", "last": "Cortese", "company": "Keller Williams Portland Premiere", "city": "Portland", "state": "OR", "market": "Portland"},
    {"first": "Zak", "last": "Meaut", "company": "Premiere Property Group", "city": "Portland", "state": "OR", "market": "Portland"},
    {"first": "Denise", "last": "Wolfe", "company": "Urban Nest Realty", "city": "Portland", "state": "OR", "market": "Portland"},
    {"first": "Amy", "last": "Lindseth", "company": "eXp Realty", "city": "Portland", "state": "OR", "market": "Portland"},
    # Omaha, NE
    {"first": "Emily", "last": "Lynch", "company": "Better Homes and Gardens RE", "city": "Omaha", "state": "NE", "market": "Omaha"},
    {"first": "Molly", "last": "Hunt-Spisak", "company": "NP Dodge Real Estate", "city": "Omaha", "state": "NE", "market": "Omaha"},
    {"first": "Ryan", "last": "Beck", "company": "BHHS Ambassador Real Estate", "city": "Omaha", "state": "NE", "market": "Omaha"},
    {"first": "Sara", "last": "Harvey", "company": "Better Homes and Gardens RE", "city": "Omaha", "state": "NE", "market": "Omaha"},
    {"first": "David", "last": "Greiner", "company": "Better Homes and Gardens RE", "city": "Omaha", "state": "NE", "market": "Omaha"},
    {"first": "Sarah", "last": "Lynch", "company": "Better Homes and Gardens RE", "city": "Omaha", "state": "NE", "market": "Omaha"},
    {"first": "Justin", "last": "Ogburn", "company": "Revel Realty", "city": "Omaha", "state": "NE", "market": "Omaha"},
    {"first": "Emilee", "last": "Jensen", "company": "Better Homes and Gardens RE", "city": "Omaha", "state": "NE", "market": "Omaha"},
    # San Antonio, TX
    {"first": "Sherry", "last": "Harlan", "company": "Riverbend Realty Group", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "John", "last": "Notzon", "company": "Keller Williams City-View", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "Michael", "last": "Granado", "company": "Performance Realty", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "Danielle", "last": "FitzGibbons", "company": "Keller Williams Heritage", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "Esmilda", "last": "Guerra", "company": "Compass RE Texas", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "Johnny", "last": "Devora", "company": "Devora Realty", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "Sue", "last": "Johnson", "company": "New Braunfels Real Estate", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "George", "last": "Sanchez", "company": "Simple Real Estate Ventures", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "Carmen", "last": "Lucas", "company": "Kuper Sothebys International", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "Fernando", "last": "Trevino", "company": "RE/MAX Alamo Realty", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "Robert", "last": "Medina", "company": "RE/MAX North San Antonio", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "Kristine", "last": "Trcka", "company": "RE/MAX Corridor", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "Jenny", "last": "Bingham", "company": "RE/MAX Associates", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    {"first": "Bryan", "last": "Treat", "company": "Orchard Brokerage", "city": "San Antonio", "state": "TX", "market": "San Antonio"},
    # Inbound leads
    {"first": "Lauren", "last": "Toman", "company": "Century 21", "city": "Tampa", "state": "FL", "market": "Tampa Bay"},
]

def slug(first, last):
    return f"{first.lower().replace(' ', '-')}-{last.lower().replace(' ', '-')}"

def generate(lead):
    state = lead["state"]
    mkt = MARKET_DATA.get(state, DEFAULT_MARKET)
    display = f"{lead['first']} {lead['last']}"
    if lead.get("company"):
        display = f"{lead['first']} {lead['last']}"

    html = TEMPLATE.format(
        display_name=display,
        first_name=lead["first"],
        last_name=lead["last"],
        company=lead["company"],
        city=lead["city"],
        state=state,
        market_area=lead["market"],
        market_hook=mkt["hook"],
        q1=mkt["q1"],
        q2=mkt["q2"],
        q3=mkt["q3"],
        q4=mkt["q4"],
    )
    return html

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    count = 0
    for lead in LEADS:
        filename = slug(lead["first"], lead["last"]) + ".html"
        filepath = os.path.join(out_dir, filename)
        if os.path.exists(filepath):
            print(f"SKIP (exists): {filename}")
            continue
        html = generate(lead)
        with open(filepath, "w") as f:
            f.write(html)
        print(f"CREATED: {filename}")
        count += 1
    print(f"\nDone. {count} new gift bots generated.")
