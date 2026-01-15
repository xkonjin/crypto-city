# Plasma One Email Lifecycle CRM Flow

> **Comprehensive Email Marketing & Notification Strategy**  
> Based on FinTech industry best practices from Revolut, Wise, Chime, N26, and leading neobanks

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [User Lifecycle Stages](#user-lifecycle-stages)
3. [Email Categories](#email-categories)
4. [Complete Email Flow Matrix](#complete-email-flow-matrix)
5. [Notification Preferences Architecture](#notification-preferences-architecture)
6. [Visual Lifecycle Diagram](#visual-lifecycle-diagram)
7. [Implementation Recommendations](#implementation-recommendations)

---

## Executive Summary

### Plasma One Context
- **Product**: Stablecoin-native neobank with 10%+ yield, 4% cashback
- **Key Features**: Zero-fee USD₮ transfers, virtual/physical cards, 150+ countries
- **Target**: Global users seeking stablecoin-based financial services
- **Differentiator**: Quick onboarding (virtual card in minutes), yield on spending balance

### Email Strategy Goals
1. **Reduce churn**: 70% of users leave within 90 days if onboarding is poor
2. **Drive activation**: Get users to first deposit → first spend → yield awareness
3. **Build trust**: Security notifications, transparent communications
4. **Maximize LTV**: Cross-sell, referrals, tier upgrades

---

## User Lifecycle Stages

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   AWARE     │ →  │  SIGNUP     │ →  │  ACTIVATE   │ →  │   ENGAGED   │ →  │   LOYAL     │
│             │    │             │    │             │    │             │    │             │
│ • Prospect  │    │ • Account   │    │ • KYC Done  │    │ • Regular   │    │ • Referrer  │
│ • Interest  │    │   Created   │    │ • Deposit   │    │   Usage     │    │ • High Tier │
│             │    │ • Email     │    │ • Card Used │    │ • Multiple  │    │ • Advocate  │
│             │    │   Verified  │    │             │    │   Features  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ↑                                                                           │
       └───────────────────────── WIN-BACK CAMPAIGNS ──────────────────────────────┘
```

---

## Email Categories

### 1. Transactional (Required - Cannot Unsubscribe)
| Email Type | Trigger | Timing | Purpose |
|------------|---------|--------|---------|
| Email Verification | Account creation | Immediate | Confirm email ownership |
| Password Reset | User request | Immediate | Security |
| Security Alert | Suspicious activity | Immediate | Account protection |
| Transaction Confirmation | Deposit/Withdrawal | Immediate | Receipt |
| Login Notification | New device/location | Immediate | Security |
| Card Shipped | Physical card ordered | Same day | Tracking info |
| Card Activated | Card first used | Immediate | Confirmation |
| Statement Available | Monthly | 1st of month | Compliance |
| Tax Documents | Annual | January | 1099 forms |

### 2. Lifecycle (Critical - Highly Recommended)
| Email Type | Trigger | Timing | Purpose |
|------------|---------|--------|---------|
| Welcome Email | Account created | Immediate | First impression |
| KYC Reminder | KYC incomplete | +24h, +72h, +7d | Complete verification |
| First Deposit Nudge | No deposit after KYC | +48h | Activation |
| Card Order Prompt | Deposit but no card | +24h | Feature adoption |
| Virtual Card Ready | KYC approved | Immediate | Start spending |
| First Spend Celebration | First transaction | Immediate | Positive reinforcement |
| Yield Earned | Interest credited | Monthly | Value demonstration |

### 3. Marketing (Opt-in Required)
| Email Type | Trigger | Timing | Purpose |
|------------|---------|--------|---------|
| Product Updates | New feature launch | As needed | Engagement |
| Promotional Offers | Partner deals | Weekly max | Revenue |
| Cashback Boost | Limited time offers | Event-based | Spending increase |
| Educational Content | Based on behavior | Weekly | User education |
| Market Updates | Crypto news | Optional | Engagement |

### 4. Re-engagement (Behavior-Based)
| Email Type | Trigger | Timing | Purpose |
|------------|---------|--------|---------|
| We Miss You | 14 days inactive | Day 14 | Re-activation |
| Value Reminder | 30 days inactive | Day 30 | Win-back |
| Special Offer | 60 days inactive | Day 60 | Last attempt |
| Feedback Request | Before churn | Day 90 | Insight gathering |
| Sunset Notice | Prolonged inactivity | Day 120 | List hygiene |

---

## Complete Email Flow Matrix

### PHASE 1: PRE-SIGNUP
```
User Journey: Discovery → Interest → Signup Intent

Email: None (user not in system)
Alternative Touchpoints:
- Landing page optimization
- Social proof elements
- Trust badges (regulated, audited)
```

### PHASE 2: SIGNUP & VERIFICATION (Days 0-3)

#### Email 1: Welcome Email
**Trigger**: Account created  
**Timing**: Immediate (< 30 seconds)  
**Subject Line Options**:
- "Welcome to Plasma One - Your Digital Dollar Account"
- "🎉 You're in! Let's get you started"
- "Welcome to the future of money"

**Content Structure**:
```
HEADER: Plasma One logo + "Welcome, [First Name]!"

BODY:
1. Thank them for joining
2. Highlight key benefits (10%+ yield, 4% cashback, zero fees)
3. Clear CTA: "Verify Your Email" button
4. What's next preview (3 steps to start)

FOOTER:
- Support links
- Social media
- Unsubscribe (marketing only)
```

**Best Practices**:
- Personalize with first name
- Keep under 150 words
- Single primary CTA
- Mobile-optimized (60% open on mobile)

---

#### Email 2: Email Verification
**Trigger**: Welcome email sent  
**Timing**: Same as welcome (can be combined or separate)  
**Subject**: "Verify your email to start earning 10%+ yield"

**Content**:
```
- 6-digit OTP or magic link
- Expires in 24 hours
- "Didn't request this? Ignore this email"
- Support contact
```

---

#### Email 3: Verification Complete
**Trigger**: Email verified  
**Timing**: Immediate  
**Subject**: "Email verified ✓ Now let's complete your profile"

**Content**:
```
- Confirmation of verification
- Progress indicator (Step 1 of 3 complete)
- CTA: "Complete KYC Verification"
- Estimated time (< 5 minutes)
- What documents needed (ID, selfie)
```

---

### PHASE 3: KYC VERIFICATION (Days 0-7)

#### Email 4: KYC Instructions
**Trigger**: Email verified, KYC not started  
**Timing**: +2 hours after email verification  
**Subject**: "Quick step: Verify your identity (takes 3 min)"

**Content Structure**:
```
HEADER: Progress bar showing Step 2 of 3

BODY:
1. Why we need this (regulation, security)
2. What's required:
   - Government-issued ID (passport, license)
   - Quick selfie
   - Basic info (address, DOB)
3. How long it takes (usually < 24 hours approval)
4. CTA: "Start Verification"

TRUST ELEMENTS:
- "256-bit encryption"
- "We never sell your data"
- "Regulated financial institution"
```

---

#### Email 5: KYC Reminder #1
**Trigger**: KYC not started  
**Timing**: +24 hours  
**Subject**: "Don't miss out on 10%+ yield - verify in 3 minutes"

**Content**:
```
- Reminder of value proposition
- Address common concerns (privacy, speed)
- Alternative support (help via chat)
- CTA: "Complete Verification"
```

---

#### Email 6: KYC Reminder #2
**Trigger**: KYC not started  
**Timing**: +72 hours  
**Subject**: "Your account is almost ready - one step left"

**Content**:
```
- More urgent tone
- Highlight what they're missing (earning yield NOW)
- FAQ section inline
- Offer help (live chat, call back)
```

---

#### Email 7: KYC Submitted
**Trigger**: User submits KYC  
**Timing**: Immediate  
**Subject**: "We're reviewing your documents"

**Content**:
```
- Expected timeframe (< 24 hours typically)
- What happens next
- No action required
- Support contact if questions
```

---

#### Email 8: KYC Approved
**Trigger**: KYC passes verification  
**Timing**: Immediate  
**Subject**: "🎉 You're verified! Your virtual card is ready"

**Content Structure**:
```
CELEBRATION HEADER: "Welcome to the club!"

BODY:
1. Congratulations message
2. What's now unlocked:
   - Virtual card ready to use
   - Can deposit and earn yield
   - Order physical card
3. Primary CTA: "Make Your First Deposit"
4. Secondary CTA: "View Virtual Card"

NEXT STEPS:
- Add to Apple/Google Wallet
- Set up recurring deposits
- Invite friends for bonus
```

---

#### Email 9: KYC Failed/Additional Info
**Trigger**: KYC review requires more info  
**Timing**: Immediate  
**Subject**: "We need a bit more information"

**Content**:
```
- Specific issue (blurry photo, document expired, etc.)
- Clear instructions to resolve
- Supportive tone (not accusatory)
- Direct link to re-upload
- Support escalation option
```

---

### PHASE 4: ACTIVATION (Days 1-14)

#### Email 10: First Deposit Prompt
**Trigger**: KYC approved, no deposit after 48h  
**Timing**: +48 hours  
**Subject**: "Your account is earning 0%. Let's fix that."

**Content Structure**:
```
HEADER: "Your balance: $0.00 (earning 0%)"

BODY:
1. Highlight earning potential
   - "$1,000 → earns ~$100/year"
   - Compare to traditional banks
2. How to deposit:
   - Bank transfer
   - Crypto deposit
   - Card top-up
3. CTA: "Fund Your Account"

TRUST: "FDIC-insured" / "Fully backed"
```

---

#### Email 11: Deposit Received
**Trigger**: First deposit credited  
**Timing**: Immediate  
**Subject**: "💰 $[AMOUNT] received - you're now earning yield!"

**Content**:
```
- Transaction confirmation
- Current balance
- Current APY earning rate
- Next steps: Spend or hold
- CTA: "View Your Account"
```

---

#### Email 12: Virtual Card Ready to Use
**Trigger**: First deposit confirmed  
**Timing**: +1 hour after deposit  
**Subject**: "Your virtual card is loaded and ready"

**Content**:
```
- How to add to Apple/Google Wallet
- Where to use (online, in-store with tap)
- Cashback reminder (up to 4%)
- CTA: "Add to Wallet"
```

---

#### Email 13: Order Physical Card
**Trigger**: Has deposit, no physical card ordered  
**Timing**: +3 days  
**Subject**: "Get your Plasma One card delivered free"

**Content**:
```
- Card benefits (premium look, global acceptance)
- Free shipping offer
- Expected delivery time
- CTA: "Order Your Card"
```

---

#### Email 14: First Transaction Celebration
**Trigger**: First card transaction  
**Timing**: Immediate  
**Subject**: "🎉 First purchase complete! You earned $X cashback"

**Content**:
```
- Celebration of milestone
- Cashback earned
- Total savings potential
- Encourage more usage
- CTA: "View Rewards"
```

---

### PHASE 5: ENGAGEMENT (Ongoing)

#### Email 15: Weekly/Monthly Statement Summary
**Trigger**: End of period  
**Timing**: Weekly (optional) or Monthly (required)  
**Subject**: "Your Plasma One Summary - [Month]"

**Content Structure**:
```
METRICS DASHBOARD:
┌────────────────────────────────┐
│ Total Balance: $X,XXX          │
│ Interest Earned: $XX.XX        │
│ Cashback Earned: $XX.XX        │
│ Transactions: XX               │
└────────────────────────────────┘

HIGHLIGHTS:
- Biggest cashback merchant
- Yield earned this month
- Comparison to last month

CTA: "View Full Statement"
```

---

#### Email 16: Yield Paid Notification
**Trigger**: Monthly interest credited  
**Timing**: Day interest is credited  
**Subject**: "You earned $XX.XX in yield this month 📈"

**Content**:
```
- Interest amount earned
- New balance after interest
- Comparison to traditional bank equivalent
- CTA: "View Account"
- Secondary: "Deposit More"
```

---

#### Email 17: Referral Program Introduction
**Trigger**: 30 days active OR 3+ transactions  
**Timing**: Based on trigger  
**Subject**: "Give $XX, Get $XX - Share Plasma One"

**Content**:
```
- Referral program details
- Both parties benefit (double-sided)
- Unique referral link/code
- Easy share buttons (email, WhatsApp, Twitter)
- CTA: "Start Sharing"
```

---

#### Email 18: Successful Referral
**Trigger**: Friend completes signup + first deposit  
**Timing**: Immediate  
**Subject**: "🎉 You earned $XX! [Friend Name] joined Plasma One"

**Content**:
```
- Reward confirmation
- Friend's signup confirmed (privacy-safe)
- Current referral count/earnings
- Encourage more referrals
```

---

### PHASE 6: RETENTION & LOYALTY

#### Email 19: Tier Upgrade Available
**Trigger**: Meets criteria for higher tier  
**Timing**: When qualified  
**Subject**: "You've unlocked Plasma One [Tier Name]!"

**Content**:
```
- Congratulations
- New benefits unlocked
- How they qualified
- Encourage maintaining status
```

---

#### Email 20: Inactivity Warning (14 Days)
**Trigger**: No transactions in 14 days  
**Timing**: Day 14  
**Subject**: "We miss you! Your yield is waiting"

**Content Structure**:
```
TONE: Friendly, not pushy

BODY:
1. Notice they've been away
2. Reminder of value (earning yield daily)
3. What's new since last login
4. Easy way back in
5. CTA: "Check Your Account"

NO PRESSURE: "No worries if you're just busy"
```

---

#### Email 21: Win-Back (30 Days)
**Trigger**: No transactions in 30 days  
**Timing**: Day 30  
**Subject**: "Special offer: Extra 1% yield this week"

**Content**:
```
- Time-limited incentive
- Reminder of benefits
- What they're missing
- Clear CTA with deadline
```

---

#### Email 22: Win-Back (60 Days)
**Trigger**: No transactions in 60 days  
**Timing**: Day 60  
**Subject**: "We'd love to have you back - here's $XX"

**Content**:
```
- Stronger incentive
- Ask for feedback (why inactive?)
- Support options
- Last-chance framing
```

---

#### Email 23: Feedback Request (90 Days)
**Trigger**: No activity in 90 days  
**Timing**: Day 90  
**Subject**: "Quick question: How can we improve?"

**Content**:
```
- Short survey (3 questions max)
- Understand churn reasons
- Offer to help resolve issues
- No hard sell
```

---

#### Email 24: Sunset Warning (120 Days)
**Trigger**: No activity in 120 days  
**Timing**: Day 120  
**Subject**: "Important: Your account status"

**Content**:
```
- Inform about potential dormancy fees or restrictions
- How to keep account active
- Withdrawal instructions if leaving
- Final CTA to re-engage
```

---

### PHASE 7: CARD LIFECYCLE

#### Email 25: Physical Card Shipped
**Trigger**: Card shipped from fulfillment  
**Timing**: Same day as shipment  
**Subject**: "Your Plasma One card is on its way! 📦"

**Content**:
```
- Tracking number/link
- Expected delivery date
- What to do when it arrives (activate)
- Use virtual card in meantime
```

---

#### Email 26: Card Delivery Reminder
**Trigger**: 2 days before expected delivery  
**Timing**: 2 days before  
**Subject**: "Your card arrives tomorrow!"

**Content**:
```
- Reminder to look out for package
- Activation instructions preview
- PIN setup info
```

---

#### Email 27: Card Activation Prompt
**Trigger**: Card delivered (carrier confirmation)  
**Timing**: Delivery day  
**Subject**: "Your card arrived - activate it now"

**Content**:
```
- Step-by-step activation
- PIN selection
- Security features
- CTA: "Activate Card"
```

---

#### Email 28: Card Activated
**Trigger**: First physical card transaction  
**Timing**: Immediate  
**Subject**: "Your Plasma One card is now active ✓"

**Content**:
```
- Confirmation
- Security tips
- Remind of cashback
- Global usage info
```

---

#### Email 29: Card Expiring Soon
**Trigger**: 30 days before expiration  
**Timing**: 30 days before  
**Subject**: "Your card expires soon - new one on the way"

**Content**:
```
- Auto-replacement info
- Expected delivery
- Keep using current card until then
- Update subscriptions reminder
```

---

### PHASE 8: SECURITY & COMPLIANCE

#### Email 30: New Device Login
**Trigger**: Login from unrecognized device  
**Timing**: Immediate  
**Subject**: "New login to your account"

**Content**:
```
- Device/location info
- Time of login
- "Was this you?" verification
- Secure account link if not
- Contact support urgently
```

---

#### Email 31: Password Changed
**Trigger**: Password update  
**Timing**: Immediate  
**Subject**: "Your password was changed"

**Content**:
```
- Confirmation
- When it was changed
- "Not you? Secure your account"
- Support contact
```

---

#### Email 32: Suspicious Activity Alert
**Trigger**: Fraud system flag  
**Timing**: Immediate  
**Subject**: "⚠️ Unusual activity on your account"

**Content**:
```
- What was flagged
- Card temporarily frozen (if applicable)
- How to verify or dispute
- Direct support line
```

---

#### Email 33: Large Transaction Alert
**Trigger**: Transaction above threshold  
**Timing**: Immediate  
**Subject**: "Large transaction: $X,XXX from your account"

**Content**:
```
- Transaction details
- Merchant/recipient
- Confirm or report
- Quick action buttons
```

---

#### Email 34: Regulatory Updates
**Trigger**: TOS/Privacy changes  
**Timing**: 30 days before effective  
**Subject**: "Important: Updates to our terms"

**Content**:
```
- Summary of changes
- Effective date
- Full document link
- Contact for questions
```

---

## Notification Preferences Architecture

### User Control Categories

```
NOTIFICATION SETTINGS
├── 🔒 Security (Cannot disable)
│   ├── Password changes
│   ├── New device logins
│   ├── Suspicious activity
│   └── Large transactions
│
├── 💳 Transactions (Customizable)
│   ├── All transactions ○ ● Off
│   ├── Deposits only ● ○ Off
│   ├── Withdrawals only ● ○ Off
│   ├── Above $[amount] [___]
│   └── Daily digest vs Real-time
│
├── 📊 Account (Recommended)
│   ├── Yield earned ● ○ Off
│   ├── Monthly statements ● ○ Off
│   ├── Balance low alerts [___]
│   └── Card status updates ● ○ Off
│
├── 🎁 Rewards & Offers (Optional)
│   ├── Cashback earned ● ○ Off
│   ├── Partner offers ○ ● Off
│   ├── Boost promotions ○ ● Off
│   └── Referral updates ● ○ Off
│
└── 📧 Marketing (Opt-in)
    ├── Product updates ○ ● Off
    ├── Educational content ○ ● Off
    ├── Market news ○ ● Off
    └── Newsletter ○ ● Off
```

### Channel Preferences

```
DELIVERY CHANNELS
├── Email: [user@email.com] ✓
├── Push Notifications: [Enabled] ✓
├── SMS: [+1-XXX-XXX-XXXX] ○
└── In-App: [Always on] ✓

FREQUENCY SETTINGS
├── Transaction alerts: ● Real-time ○ Daily digest
├── Marketing emails: ○ Weekly ● Monthly ○ Never
└── Quiet hours: [10:00 PM] - [7:00 AM]
```

---

## Visual Lifecycle Diagram

```
                            PLASMA ONE EMAIL LIFECYCLE FLOW
                            ═══════════════════════════════
                            
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                           ACQUISITION PHASE                              │
    └─────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │    SIGNUP       │───▶│ EMAIL VERIFY    │───▶│   KYC FLOW      │
    │                 │    │                 │    │                 │
    │ • Welcome Email │    │ • OTP/Magic     │    │ • Instructions  │
    │ • Value Props   │    │   Link          │    │ • Reminders x3  │
    │ • Next Steps    │    │ • Confirm       │    │ • Approved/Fail │
    └─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                          │
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                           ACTIVATION PHASE                               │
    └─────────────────────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │  FIRST DEPOSIT  │───▶│  VIRTUAL CARD   │───▶│  FIRST SPEND    │
    │                 │    │                 │    │                 │
    │ • Nudge email   │    │ • Card ready    │    │ • Celebration   │
    │ • Confirmation  │    │ • Add to wallet │    │ • Cashback      │
    │ • Yield start   │    │ • Order phys.   │    │ • Next steps    │
    └─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                          │
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                           ENGAGEMENT PHASE                               │
    └─────────────────────────────────────────────────────────────────────────┘
                                                          │
                           ┌──────────────────────────────┼───────────────────┐
                           ▼                              ▼                   ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │   TRANSACTIONAL │    │   ENGAGEMENT    │    │   LOYALTY       │
    │                 │    │                 │    │                 │
    │ • Receipts      │    │ • Yield paid    │    │ • Referrals     │
    │ • Statements    │    │ • Summaries     │    │ • Tier upgrades │
    │ • Security      │    │ • Promotions    │    │ • VIP benefits  │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                          │
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                           RETENTION PHASE                                │
    └─────────────────────────────────────────────────────────────────────────┘
                                                          │
                           ┌──────────────────────────────┼───────────────────┐
                           ▼                              ▼                   ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │   14-DAY        │───▶│   30-DAY        │───▶│   60-90 DAY     │
    │   INACTIVITY    │    │   WIN-BACK      │    │   FINAL EFFORT  │
    │                 │    │                 │    │                 │
    │ • Miss you      │    │ • Special offer │    │ • Big incentive │
    │ • Value remind  │    │ • What's new    │    │ • Feedback ask  │
    │ • Easy return   │    │ • Time limit    │    │ • Sunset notice │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Implementation Recommendations

### Email Service Provider (ESP) Requirements

| Feature | Priority | Notes |
|---------|----------|-------|
| Transactional + Marketing | Critical | Separate IPs for deliverability |
| Real-time triggers | Critical | Instant send for security alerts |
| Dynamic content | High | Personalization at scale |
| A/B testing | High | Subject lines, CTAs, timing |
| Advanced segmentation | High | Behavior-based targeting |
| AMP email support | Medium | Interactive forms in email |
| Compliance tools | Critical | GDPR, CAN-SPAM, unsubscribe |

**Recommended ESPs for FinTech**:
- **SendGrid** (Twilio) - Transactional excellence
- **Customer.io** - Behavioral marketing
- **Braze** - Cross-channel orchestration
- **Vero** - Lifecycle automation

### Key Metrics to Track

```
DELIVERABILITY
├── Delivery rate: Target 99%+
├── Bounce rate: Target < 2%
├── Spam complaint rate: Target < 0.1%
└── Inbox placement: Target 95%+

ENGAGEMENT
├── Open rate by category:
│   ├── Transactional: 60-80%
│   ├── Onboarding: 40-60%
│   ├── Marketing: 20-30%
│   └── Win-back: 10-15%
├── Click-through rate (CTR):
│   ├── Transactional: 20-30%
│   ├── Onboarding: 15-25%
│   └── Marketing: 2-5%
└── Unsubscribe rate: Target < 0.5%

CONVERSION
├── Signup → KYC complete: Target 70%+
├── KYC → First deposit: Target 60%+
├── Deposit → First spend: Target 80%+
├── Win-back success rate: Target 5-10%
└── Referral conversion: Target 15-20%
```

### Compliance Checklist

- [ ] Double opt-in for marketing emails
- [ ] Clear unsubscribe in every email (except transactional)
- [ ] Physical address in footer
- [ ] Privacy policy link
- [ ] Sender name matches brand
- [ ] SPF, DKIM, DMARC configured
- [ ] Data retention policies defined
- [ ] GDPR-compliant preference center
- [ ] CAN-SPAM compliant headers

### Timing Best Practices

| Email Type | Best Send Time | Best Day |
|------------|---------------|----------|
| Welcome | Immediate | N/A |
| KYC Reminder | 10am-12pm local | Tue-Thu |
| Marketing | 2pm-4pm local | Tue, Thu |
| Win-back | 7pm-9pm local | Sunday |
| Security | Immediate | N/A |
| Statements | 9am local | 1st of month |

---

## Email Content Templates Summary

### Welcome Email Structure
```
Subject: Welcome to Plasma One - Your Digital Dollar Account

Hi [First Name],

Welcome to Plasma One! 🎉

You're joining [X] people who've discovered a better way 
to manage their money:

✓ Earn 10%+ yield on your balance
✓ Get up to 4% cashback on purchases  
✓ Send money globally for free
✓ Virtual card ready in minutes

[VERIFY EMAIL BUTTON]

What's next:
1. Verify your email (2 seconds)
2. Complete quick verification (3 minutes)
3. Make your first deposit and start earning

Questions? We're here 24/7 at support@plasma.to

The Plasma One Team

---
Unsubscribe from marketing | Privacy Policy
© 2026 Plasma. All rights reserved.
```

### KYC Reminder Template
```
Subject: Quick step: Verify your identity (takes 3 min)

Hi [First Name],

You're one step away from earning yield on your money!

Complete your identity verification to unlock:
• Your virtual spending card
• Ability to deposit and earn 10%+ yield
• Zero-fee global transfers

What you'll need:
📄 Government ID (passport or driver's license)
📸 A quick selfie

[COMPLETE VERIFICATION BUTTON]

Takes less than 3 minutes. Your data is encrypted 
and never shared.

Need help? Chat with us anytime.

Cheers,
The Plasma One Team
```

---

## Summary: Complete Email Count

| Phase | Email Count | Type |
|-------|------------|------|
| Signup & Verification | 3 | Transactional/Lifecycle |
| KYC Flow | 6 | Lifecycle |
| Activation | 5 | Lifecycle |
| Engagement | 4 | Marketing/Lifecycle |
| Retention | 6 | Marketing |
| Card Lifecycle | 5 | Transactional |
| Security | 5 | Transactional |
| **TOTAL** | **34** | |

---

*Document created: January 2026*  
*Based on research from: Revolut, Wise, Chime, N26, and FinTech industry best practices*
