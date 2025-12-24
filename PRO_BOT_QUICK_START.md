# Pro Bot Tab - Quick Start Guide

## ✅ What's Been Implemented

A fully functional **Pro Bot Library** tab has been integrated into your application with the following features:

### Features

- 📚 Browse 24 curated pre-made trading bots
- 🔍 Search bots by name, description, or tags
- 🏷️ Filter by category (Digits, Rise/Fall, Volatility, Touch, etc.)
- ⭐ Difficulty indicators (Beginner, Intermediate, Advanced)
- 🚀 One-click load directly into Bot Builder
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🎨 Modern card-based UI with hover effects

## 🗂️ File Structure

```
src/
├── constants/
│   └── pro-bots.ts              # Bot data and categories
├── stores/
│   ├── pro-bot-store.ts         # MobX store for state management
│   └── root-store.ts            # Updated with pro_bot store
├── pages/
│   └── pro-bot/
│       ├── index.tsx            # Main page component
│       ├── bot-card.tsx         # Individual bot card
│       └── pro-bot.scss         # Styling
└── pages/main/
    └── main.tsx                 # Updated with Pro Bot tab

Configuration:
├── rsbuild.config.ts            # Updated to serve bots folder
└── constants/bot-contents.ts    # Updated tab constants
```

## 🚀 How to Use

1. **Start the Application**

    ```bash
    npm run dev
    ```

2. **Navigate to Pro Bot Tab**
    - Click on the **Pro Bot** tab (with rocket icon 🚀)
    - Located between "Pro Digit" and "Tutorials" tabs

3. **Search & Filter**
    - Type bot name in search box
    - Click category buttons to filter
    - Results update in real-time

4. **Load a Bot**
    - Click **"Load Bot"** button on any bot card
    - Bot automatically loads into Bot Builder
    - You're switched to Bot Builder tab
    - Success notification is shown

5. **Run the Bot**
    - Configure any settings in Bot Builder if needed
    - Click **"Run"** to execute the bot

## 📋 Available Bots

### By Category

**Digits (5 bots)**

- 1 Tick Digit Over 2
- Digit Over 3
- Digit Ranger Auto Bot
- Dynamic Digits Auto Bot
- Super Digit Under

**Rise/Fall (5 bots)**

- MKZ RF Premium Bot
- Binary Bot Premium Rise/Fall
- RF Optic Trend Bot
- House of Rise/Fall Auto Bot
- RF Heist B-Bot

**Premium (2 bots)**

- High Profit Bot
- Bot Sniper

**Auto Bot (7 bots)**

- Absolute Deriv Bot
- Bull Power Binary Bot
- Bear Market Auto Trader
- Roller Deriv Bot
- Equalizer Auto Bot
- Low Risk Manager Deriv Bot
- Bonus Bot

**Touch (2 bots)**

- One Touch Stimuli Bot
- Entry Touch B-Bot

**Flex Period (2 bots)**

- Flex Period - Long to Shorter
- Flex Period - Short to Longer

**Volatility (1 bot)**

- Volatility Index Technical Analysis

## 🔧 Technical Stack

- **State Management**: MobX
- **UI Framework**: React with TypeScript
- **Styling**: SCSS with CSS variables
- **Icon Library**: Deriv Quill Icons (Rocket icon)
- **Build Tool**: RSBuild

## 📍 How Bots Are Loaded

1. **Location**: `c:\Codes\Bit_Traders\bots\Free-Dbots\`
2. **Access URL**: `/bots/Free-Dbots/{botFileName}`
3. **Process**:
    - User clicks "Load Bot"
    - XML file is fetched from local folder
    - Loaded into Blockly workspace
    - User switched to Bot Builder
    - Success notification shown

## 🎨 UI Components

### Pro Bot Page

- Header with title and search
- Category filter buttons
- Grid layout of bot cards (responsive)
- Empty state when no results

### Bot Card

- Bot name and description
- Category badge
- Difficulty badge (color-coded)
- Tag display (first 3)
- Load button with loading state

### Responsive Breakpoints

- Desktop: 3-4 columns
- Tablet: 2 columns
- Mobile: 1 column (full width)

## 🔄 Data Flow

```
User clicks "Load Bot"
    ↓
ProBotStore.loadBotToBuilder()
    ↓
Fetch XML from /bots/Free-Dbots/{fileName}
    ↓
Load XML into Blockly workspace
    ↓
Switch to Bot Builder tab (index 1)
    ↓
Show success notification
    ↓
Ready to run bot
```

## ⚙️ Configuration

### Adding More Bots

Edit `src/constants/pro-bots.ts`:

```typescript
export const PRO_BOTS: ProBot[] = [
    {
        id: 'unique-id',
        name: 'Bot Name',
        description: 'What this bot does...',
        category: BOT_CATEGORIES.DIGITS,
        difficulty: BOT_DIFFICULTIES.BEGINNER,
        fileName: 'Exact-Bot-Filename.xml', // Must match file in bots folder
        tags: ['tag1', 'tag2', 'tag3'],
    },
    // ... more bots
];
```

### Changing Tab Position

Update `src/constants/bot-contents.ts`:

- Modify the `DBOT_TABS` object indices
- Update `TAB_IDS` array order

## 🐛 Troubleshooting

### Bot doesn't load

- Verify bot file exists in `bots/Free-Dbots/` folder
- Check file name matches exactly (case-sensitive)
- Open browser console for error details

### Search not working

- Ensure search term is not empty
- Try different keywords (name, description, tags)
- Clear filters to see all bots

### Tab not appearing

- Clear browser cache
- Rebuild project: `npm run build`
- Check browser console for errors

## 📦 Build & Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

The bots folder is automatically included in the build output.

## 📝 Notes

- All 88 bots are available locally (only 24 curated by default)
- Can easily expand to show all bots
- No external API calls required
- Bots are loaded from local static files
- Each bot is fully editable after loading

## 🚀 Next Steps

1. Test loading different bots
2. Run bots to verify they work
3. Customize categories or add more bots as needed
4. Consider adding bot preview feature
5. Implement bot ratings/reviews

Enjoy! 🎉
