Created by Emi Yee and Jennifer Ju @ University of California San Diego DiamondHacks Hackathon 2026

# 🧠 Cognitive Load Optimizer

A Chrome extension that rebuilds any webpage in real-time to match your cognitive profile. Supports ADHD, Dyslexia, Visual Impairment, Sensory, Focus, and Motor profiles — combinable, instantly applied, and free to use.

---

## Features

| Profile | What it does |
|---|---|
| ⚡ ADHD | AI summary banner at the top of every page + blurs ads |
| 📖 Dyslexia | OpenDyslexic font + adjusted spacing and line height |
| 👁 Visual | High contrast mode + larger text |
| 🌿 Sensory | Stops all animations, mutes videos, desaturates colors |
| 🎯 Focus | Dims sidebars, navbars, and distractions |
| 🖱️ Motor | Enlarges buttons and click targets |

**Extra tools:** Reading ruler · Hide images · Summarize on demand · Focus scroll highlight

---

## Setup — Step by Step

### Step 1 — Download the code

1. Go to the GitHub repository
2. Click the green **Code** button
3. Click **Download ZIP**
4. Unzip the downloaded file somewhere on your computer (e.g. your Desktop)

---

### Step 2 — Get a free Groq API key

The ADHD summarization feature uses Groq's free AI API. You need a key to use it.

1. Go to **[console.groq.com](https://console.groq.com)**
2. Click **Sign Up** and create a free account
3. Once logged in, click **API Keys** in the left sidebar
4. Click **Create API Key**
5. Give it any name (e.g. "Cognitive Load Optimizer")
6. Copy the key — it starts with `gsk_...`
7. Save it somewhere safe — you won't be able to see it again

> The free tier includes generous limits — more than enough for personal use and demos.

---

### Step 3 — Add the OpenDyslexic font

The Dyslexia profile requires the OpenDyslexic font file.

1. Go to **[opendyslexic.org](https://opendyslexic.org)** and download the font, or find `OpenDyslexic-Regular.otf` online
2. Rename the file to exactly `OpenDyslexic-Regular.otf`
3. Place it inside the `fonts/` folder in the extension directory

---

### Step 4 — Load the extension in Chrome

1. Open Chrome and go to **[chrome://extensions](chrome://extensions)**
2. In the top right corner, turn on **Developer mode** (toggle switch)
3. Click **Load unpacked** (top left)
4. Select the unzipped extension folder (the one containing `manifest.json`)
5. The extension should appear with the FocusFlow icon in your toolbar

> If you don't see the icon in the toolbar, click the puzzle piece 🧩 icon in Chrome's top bar and pin **Cognitive Load Optimizer**

---

### Step 5 — Add your API key and choose a profile

1. Click the **FocusFlow icon** in your Chrome toolbar
2. Paste your Groq API key into the **Groq API key** field
3. Select one or more cognitive profiles by clicking them (they highlight when active)
4. Toggle any extra tools you want (reading ruler, hide images, etc.)
5. Click **Save settings**
6. The settings apply instantly to whatever tab you're on — no reload needed

---

## How to use it

- **Switch profiles** at any time — just open the popup, click a profile on or off, and hit Save
- **Test it on Wikipedia** — go to any long article (e.g. [en.wikipedia.org/wiki/Climate_change](https://en.wikipedia.org/wiki/Climate_change)) with ADHD mode on and watch the summary banner appear at the top
- **Summarize on demand** — enable the toggle, then click the **✦ Summarize** button that appears next to any paragraph
- **Reading ruler** — enable the toggle, then move your mouse over any page to see the highlight band follow your cursor

---

## Best sites to demo each feature

| Feature | Best site |
|---|---|
| ADHD summary | en.wikipedia.org |
| Dyslexia font | medium.com or bbc.com/news |
| Visual contrast | reddit.com |
| Sensory mode | youtube.com |
| Focus mode | cnn.com |
| Reading ruler | Any long article |
| Hide images | buzzfeed.com |

---

## Tech stack

- **Chrome Extension Manifest V3** — content scripts, service worker, storage API
- **Web Worker** — off-thread scroll tracking for focus highlight
- **Groq API (Llama 3.1 8B Instant)** — 131K context window, free tier
- **OpenDyslexic** — open source font for dyslexia accessibility
- **Vanilla JS + CSS injection** — no frameworks, works on any website

---

## Privacy

- Your API key is stored locally in Chrome's sync storage
- No data is ever sent anywhere except directly to Groq for summarization
- The extension has no analytics, no tracking, and no external dependencies
- Groq's free tier does not use your data for training

---

## Troubleshooting

**Summary says "Could not summarize — check your API key"**
→ Open the popup and re-paste your Groq key, then click Save. Make sure the key starts with `gsk_`.

**Extension not doing anything on a page**
→ Go to `chrome://extensions`, click the refresh icon on the extension, then close and reopen the tab.

**Dyslexia font not loading**
→ Make sure the font file is named exactly `OpenDyslexic-Regular.otf` and is inside the `fonts/` folder.

**Changes not applying instantly**
→ Try clicking Save again in the popup. If it still doesn't work, reload the tab once.

---

## Built for

🏆 Health Track — DiamondHacks 2026  
*"Making the web accessible for every mind — one profile at a time."*