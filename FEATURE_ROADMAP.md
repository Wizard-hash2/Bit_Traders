# Feature Implementation Roadmap for Bit Traders

## Based on derivhub.com analysis

### ✅ Already Have (Built-in):

- Bot Builder (Blockly visual programming)
- Trading charts (TradingView integration)
- Bot execution engine
- Account management
- Trade history/Reports

### 🎯 Features to Add:

#### 1. **Trading Signals Panel**

Create a signals dashboard showing:

- Buy/Sell recommendations
- Market trends
- Technical indicators (RSI, MACD, Bollinger Bands)

**Implementation:**

```tsx
// src/pages/signals/index.tsx
- Fetch market data from Deriv API
- Display real-time signal calculations
- Add signal notifications
```

#### 2. **Horizontal/Vertical Split View**

Allow users to view multiple charts/bots simultaneously

**Implementation:**

- Use React Split Pane library
- Save layout preferences in localStorage
- Add toolbar buttons for layout switching

#### 3. **Quick Strategy Templates**

Expand existing quick strategies with more presets:

- Martingale strategies
- Trend following
- Mean reversion
- RSI-based strategies

**Already exists in:** `src/pages/bot-builder/quick-strategy/`
**Enhancement:** Add more templates and customization options

#### 4. **Mobile Apps Download Section**

Add a dedicated page for mobile app downloads

**Implementation:**

- Create landing page at `/download`
- Add QR codes for iOS/Android
- Include app features showcase

#### 5. **Advanced Analytics Dashboard**

Enhanced trading statistics:

- Win/loss ratio charts
- Profit/loss over time
- Best performing strategies
- Risk metrics

#### 6. **Social Trading Features** (Advanced)

- Share bot strategies
- Copy successful traders
- Community leaderboard

---

## 🚀 Quick Wins (Implement First):

### A. Add Signals Page

Location: `src/pages/signals/`

- Real-time market signals
- Technical indicator dashboard
- Trade recommendations

### B. Enhanced Quick Strategies

Location: `src/pages/bot-builder/quick-strategy/`

- Add 10+ more strategy templates
- Include strategy backtesting
- Strategy marketplace (future)

### C. Split View Trading

Location: `src/components/layout/`

- Add split-screen toggle
- Multiple chart viewing
- Synchronized scrolling

### D. Improved Mobile Experience

- PWA enhancements (already have basic PWA)
- Touch-optimized charts
- Mobile-specific bot builder UI

---

## 💰 Referral Integration Points:

All signup/deposit buttons should include your affiliate token:

1. Header "Sign up" button
2. Dashboard "Deposit" button
3. Account creation flows
4. All external Deriv links

## 📊 Tracking Implementation:

1. **On App Load:**

```tsx
// src/app/App.tsx
import { setAffiliateCookie } from '@/utils/referral-config';

useEffect(() => {
    setAffiliateCookie();
}, []);
```

2. **On All Deriv Links:**

```tsx
import { addReferralTracking } from '@/utils/referral-config';

const signup_url = addReferralTracking(standalone_routes.signup);
```

---

## 🎨 Branding Customization (Already Done):

- ✅ Logo replaced with BIT TRADERS
- ✅ Header customized
- ✅ Footer customized
- ✅ Icons made non-clickable
- ✅ Removed Deriv branding

---

## Next Steps:

1. Get your Deriv affiliate token from https://deriv.com/partners/affiliate-ib/
2. Update `src/utils/referral-config.ts` with your token
3. Choose which features to implement (I recommend starting with Signals + Enhanced Quick Strategies)
4. Test referral tracking in dev environment
