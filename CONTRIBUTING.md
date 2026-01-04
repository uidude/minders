# Contributing to Minders

## Prerequisites

- **Node.js** (v18 or v20 recommended - v22+ may require `--openssl-legacy-provider`)
- **Yarn** package manager
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YourOrg/minders.git
cd minders
```

### 2. Clone NPE Toolkit Dependency

Minders depends on [NPE Toolkit](https://github.com/npe-toolkit/npe-toolkit). Clone it as a sibling directory:

```bash
cd ..
git clone https://github.com/npe-toolkit/npe-toolkit.git
cd minders
```

Your directory structure should look like:
```
/workspaces/
  ├── minders/          # This repository
  └── npe-toolkit/      # NPE Toolkit dependency
```

### 3. Install Dependencies

```bash
yarn install
```

This will automatically run `project/setup.sh` to set up local dependencies.

### 4. Start Development Server

**Web (recommended for development):**
```bash
yarn web
# or with pnpm
pnpm dev
```

The app will be available at `http://localhost:19006`

**Note:** If you're using Node.js v22+, you may need to set the legacy OpenSSL provider:
```bash
export NODE_OPTIONS=--openssl-legacy-provider
yarn web
```

### Other Development Commands

| Command | Description |
|---------|-------------|
| `yarn web` | Start web development server |
| `yarn admin` | Start admin panel |
| `yarn go:ios` | Start iOS development |
| `yarn go:android` | Start Android development |
| `yarn build:web` | Build web version |
| `yarn build:ios` | Build iOS app |
| `yarn build:android` | Build Android app |

## Project Structure

```
minders/
├── client/              # Main React Native/Web app
│   ├── screens/         # Screen components
│   ├── components/      # Reusable UI components
│   └── App.tsx          # App entry point
├── common/              # Shared code between client/admin
│   ├── MinderApi.tsx    # Data models (Minder, MinderProject)
│   ├── AppLogic.tsx     # Business logic
│   └── Config.tsx       # Firebase configuration
├── admin/               # Admin dashboard
├── server/              # Backend (Firebase Functions)
│   ├── functions/       # Cloud Functions
│   └── firestore.rules  # Security rules
├── project/             # Expo/React Native config
│   ├── app.config.js    # Build profiles
│   ├── ios/             # iOS native code
│   └── android/         # Android native code
└── package.json         # Root workspace config
```

## Key Concepts

### Minder States

Minders can be in one of these states:
- `new` - Just created
- `top` - Top priority
- `cur` - Currently working on
- `soon` - Will do soon
- `later` - Deferred
- `waiting` - Waiting for something/someone
- `done` - Completed

### Filters/Views

- **Focus** - Shows `cur` and `top` items (default view)
- **Review** - Shows `new` items for triage
- **Pile** - Shows `soon` and `later` items
- **Waiting** - Shows snoozed/waiting items
- **All** - Shows everything
- **Done** - Shows completed items

## Technology Stack

- **Frontend:** React Native, Expo, React Navigation, React Native Paper
- **State:** Firebase Firestore, AsyncStorage
- **Auth:** Firebase Auth (Google, Phone, Apple)
- **Backend:** Firebase Cloud Functions

## Testing

Before submitting changes, verify your changes work:

1. Run the web development server
2. Test the feature manually
3. If using Claude Code, use Playwright MCP to capture screenshots

## Troubleshooting

### `expo: not found`
Run `yarn install` in the project directory to install dependencies.

### OpenSSL errors with Node.js v22+
Set the legacy provider:
```bash
export NODE_OPTIONS=--openssl-legacy-provider
```

### NPE Toolkit not found
Ensure the npe-toolkit is cloned as a sibling directory:
```bash
cd .. && git clone https://github.com/npe-toolkit/npe-toolkit.git
```
