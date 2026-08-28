# Smart Wallet Dashboard

Build the first screen of a modern, premium cryptocurrency wallet mobile web application. Called smartchain For this stage, build ONLY the Dashboard. Do not build the other pages yet. The project must be production-ready, responsive, and easy to continue developing later through GitHub.

DESIGN DIRECTION

Create an original premium crypto-wallet interface inspired by modern cryptocurrency exchanges and banking apps, but do not copy any existing company's exact UI, logo, trademarks, or proprietary branding.

Use a dark theme with a cryptocurrency exchange-inspired yellow accent.

Color palette

- Primary accent: #F0B90B

- Bright yellow highlight: #FCD535

- Main background: #0B0E11

- Secondary background: #181A20

- Card background: #1E2329

- Border: #2B3139

- Primary text: #F5F5F5

- Secondary text: #B7BDC6

- Positive balance/profit: #0ECB81

- Negative/loss: #F6465D

The interface should feel secure, premium, modern, and trustworthy.

MOBILE-FIRST LAYOUT

The app should be designed primarily for mobile screens, matching the proportions and usability of a native mobile application. It must also work beautifully on desktop.

TOP HEADER

Create a compact top navigation bar containing:

- A hamburger menu icon on the left

- An original wallet logo and app name

- A security/shield icon

- A notification bell with an optional notification badge

- A circular user avatar on the right

Use a clean dark header with a subtle bottom border.

BALANCE CARD

IMPORTANT: Do NOT use a rounded rectangular card for the main balance.

The balance area should look like a premium digital banking card with a more structured bank-card appearance:

- Rectangular horizontal card

- Slight corner radius only, approximately 10px to 14px, not overly rounded

- Subtle border and premium gradient

- Dark charcoal background with very subtle yellow accents

- Optional faint abstract crypto pattern in the background

- Should visually feel like a physical premium bank card

Display:

AVAILABLE BALANCE

$0.00

Below the balance, show a small eye icon allowing the user to hide or reveal the balance.

Include a small portfolio change indicator such as:

+0.00% Today

The card should have excellent spacing and hierarchy. The balance amount must be the main visual focus.

QUICK ACTIONS

Below the balance card, create four equally spaced quick action buttons:

- Deposit

- Withdraw

- Send

- Swap

Each action should use a clean icon and label.

The buttons should be interactive in the UI, but for now they can display placeholder actions or navigate to placeholder routes.

Use yellow accents carefully. Do not make the entire screen yellow.

ASSET OVERVIEW

Create an "Assets" section below the quick actions.

Display a list of sample cryptocurrencies:

Bitcoin

BTC · $0.00

Ethereum

ETH · $0.00

Tether

USDT · $0.00

Each asset row should include:

- Coin icon

- Coin name

- Symbol

- Balance

- Optional small percentage change indicator

Use realistic placeholder data connect live prices.

Include a "View All Assets" button.

RECENT ACTIVITY

Create a Recent Activity section with an empty state when the user has no transactions.

The empty state should include:

- A subtle transaction/history icon

- Text: "No transactions yet"

- Small supporting text encouraging the user to start using their wallet

Do NOT use fake "live transactions" or misleading withdrawal notifications.

BOTTOM NAVIGATION

Create a fixed mobile bottom navigation with five tabs:

- Home

- Markets

- Trade

- Wallet

- Account

The currently selected Home tab should use the yellow accent.

Keep the navigation clean and native-app-like.

TECHNICAL REQUIREMENTS

- Use React and TypeScript

- Use reusable components

- Use a clean folder structure

- Use Tailwind CSS or the existing project's styling system

- Make all components responsive

- Add proper loading and empty states

- Use accessible buttons and labels

- Keep all data in mock data files for now

- Do not add authentication yet

- Do not add payment processing yet

- Do not add blockchain transactions yet

- Do not create fake balances or simulate real financial activity

COMPONENT STRUCTURE

Organize the Dashboard into reusable components:

- AppHeader

- BalanceCard

- QuickActions

- AssetList

- AssetRow

- RecentActivity

- BottomNavigation

Create clean TypeScript interfaces for wallet assets and transactions so real APIs can be connected later.

FUTURE-READY ARCHITECTURE

Prepare the project so the following can be added later without rebuilding the Dashboard:

- User authentication

- Wallet creation and management

- Blockchain providers

- Real cryptocurrency prices

- Deposits and withdrawals

- Transaction history

- KYC/identity verification

- Security settings

- Notifications

For now, focus entirely on making the Dashboard visually excellent and fully responsive.

Do not modify unrelated pages or existing functionality. Build the Dashboard first and keep the implementation clean so future changes can be made directly through GitHub.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://smartchain-dash-prime.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bff17122-161d-40ea-9117-26097ebd7d74).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
