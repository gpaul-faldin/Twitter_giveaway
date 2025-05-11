# 🤖 Twitter Giveaway Automation Bot 🎁

This project is a sophisticated Twitter bot system designed to automate participation in giveaways. It was developed from the ground up as a learning experience and represents my first project of this scale, requiring extensive reverse engineering of Twitter's API endpoints and authentication methods.

## 📜 Overview

The bot can automatically participate in Twitter giveaways by performing actions such as:
- ✅ Following specified accounts
- ❤️ Liking tweets
- 🔄 Retweeting content
- 👥 Tagging friends in comments
- 📷 Uploading screenshots (for YouTube requirements)

The system manages a pool of Twitter accounts, handles account initialization, proxy rotation, and even deals with phone verification challenges.

## 🛠️ Tech Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: Custom Twitter API integration
- **Automation**: Puppeteer for browser automation
- **Task Scheduling**: node-cron for timed operations

## 🔍 Reverse Engineering Highlights

Creating this project required significant reverse engineering of Twitter's internal APIs:
- Discovered undocumented endpoints for actions like liking, retweeting, and following
- Decoded CSRF token requirements and cookie authentication
- Reverse-engineered media upload flow for image sharing
- Built workarounds for rate limiting and account timeouts
- Created solutions for handling captchas and phone verification challenges

## Deactivated Keys and Webhooks

Please note that any private API keys or webhooks present in the code are deactivated and no longer functional.

## 🌐 API Endpoints

### Action Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/action` | POST | Configure a giveaway action |
| `/api/action-v2` | POST | Enhanced giveaway action setup |
| `/api/start` | POST | Start configured actions with selected accounts |
| `/api/init` | POST | Initialize new accounts |
| `/api/check-pva` | POST | Check for phone verification requirements |

### Data Retrieval

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/retrieve/lowest` | GET | Get accounts with lowest follower/following metrics |
| `/api/retrieve/random` | GET | Get random accounts from pool |
| `/api/retrieve/specific` | GET | Retrieve specific accounts by tag |
| `/api/retrieve/number` | GET | Count active/timeout accounts |

### Data Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/add/account` | PUT | Add new accounts to the database |
| `/api/add/proxy` | PUT | Add proxies to the rotation pool |
| `/api/update/twitter` | PUT | Update Twitter follower/following data |
| `/api/update/proxy` | PUT | Update proxy assignments |
| `/api/delete/proxy` | DELETE | Remove proxies from pool |
| `/api/delete/account` | DELETE | Remove accounts from system |

## ⚙️ Key Features

### 🔄 Account Rotation
The system intelligently rotates through available accounts to avoid detection, using metrics like follower counts to determine optimal account selection.

### 🕸️ Proxy Management
Accounts are assigned rotating proxies to prevent IP-based detection and bans.

### 📱 Phone Verification Handling
The system can handle Twitter's phone verification challenges using SMS verification services.

### 🎭 Profile Mimicry
Accounts can be initialized with realistic profiles, including profile pictures, banners, and bio text from a collection of real account templates.

### ⏱️ Natural Timing
Participations are spread out over the duration of a giveaway to mimic natural human behavior.

### 🔔 Win Detection
The system monitors giveaways for winner announcements and notifies via Discord webhooks when one of the bot accounts wins.

## 🧠 Intelligent Features

- **Smart Tagging**: Can tag random followers when needed for giveaway requirements
- **YouTube Integration**: Detects when a giveaway requires YouTube interaction and handles screenshot proof (steal X screenshots from legit participant)
- **Captcha Solving**: Integration with 2captcha service for automated captcha resolution
- **Timeout Management**: Detects and manages account timeouts and suspensions

## Deactivated Keys and Webhooks

Please note that any private API keys or webhooks present in the code are deactivated and no longer functional.

## 📊 Dashboard Potential

While not implemented in the current version, the API structure would easily support a dashboard for:
- Monitoring active giveaways
- Tracking win rates
- Managing account pool
- Visualizing participation metrics

## ⚠️ Disclaimer

This project was created as a learning exercise to understand API reverse engineering, automation, and building scalable backend systems. Using bots to participate in giveaways may violate Twitter's Terms of Service. This code is shared for educational purposes only.

## 🌱 Learning Outcomes

As my first project of this scale, developing this Twitter giveaway automation system taught me:
- Complex system architecture and component interaction
- Advanced API reverse engineering techniques
- MongoDB database modeling and relationships
- Security considerations for authentication
- Error handling and resilience in distributed systems
- Performance optimization for concurrent operations

The experience gained from building this project laid a strong foundation for tackling even more complex software engineering challenges in the future.

<!-- PORTFOLIO_METADATA_START -->
<div align="center">
  <h3>📊 Portfolio Metadata</h3>
  <p><em>This section is used for automatic project information extraction</em></p>
</div>

### 📜 Project Overview
Twitter Giveaway Automation Bot is a sophisticated system designed to automate participation in Twitter giveaways. Developed as a learning experience in API reverse engineering, this project manages multiple Twitter accounts to follow specified profiles, like tweets, retweet content, tag friends in comments, and even upload screenshots for verification.

### 🎯 Key Features
- **Account Rotation**: Intelligently rotates through accounts to avoid detection
- **Proxy Management**
- **Phone Verification Handling**: Manages Twitter's phone verification challenges
- **Profile Mimicry**: Initializes accounts with realistic profiles and bio content
- **Natural Timing**: Spreads participations over time to mimic human behavior
- **Win Detection**: Monitors giveaways and notifies when a bot account wins

### 🛠️ Technology Stack
- Node.js
- Express
- MongoDB
- Puppeteer
- node-cron
- Discord Webhooks
- SMS Verification Services
<!-- PORTFOLIO_METADATA_END -->
