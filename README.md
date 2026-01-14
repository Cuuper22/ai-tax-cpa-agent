# AI Tax CPA

A personal AI-powered Tax CPA desktop and mobile application built with Tauri 2.0.

## Features

- **Local-First**: All data stored locally with encrypted SQLite database (SQLCipher)
- **PIN Authentication**: Secure access with Argon2id password hashing
- **AI Assistant**: Claude-powered tax advice and Q&A
- **Tax Calculator**: 2024 federal and state tax bracket calculations
- **Document Management**: Store and organize tax-related documents
- **Deduction Tracking**: Categorize and track deductible expenses
- **Cross-Platform**: Runs on Windows, macOS, Linux, and Android

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Rust + Tauri 2.0
- **Database**: SQLite with SQLCipher encryption (desktop) / standard SQLite (mobile)
- **AI**: Claude API (Anthropic)

## Quick Start

### Prerequisites

- Node.js 18+
- Rust (stable)
- For Windows: Visual Studio Build Tools with MSVC
- For Android: JDK 17, Android SDK, NDK

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build

```bash
# Build for current platform
npm run tauri build

# Build for Android
npm run tauri android init  # First time only
npm run tauri android build
```

## Build Outputs

| Platform | Output |
|----------|--------|
| Windows | `.exe`, `.msi`, NSIS installer |
| Android | Universal APK (unsigned) |

See [BUILD_REPORT.md](./BUILD_REPORT.md) for detailed build information.

## Project Structure

```
├── src/                  # React frontend
├── src-tauri/            # Rust backend
│   ├── src/
│   │   ├── commands/     # Tauri commands
│   │   ├── db/           # Database layer
│   │   ├── crypto/       # Encryption utilities
│   │   ├── tax_engine/   # Tax calculations
│   │   └── ai/           # Claude integration
│   └── gen/android/      # Android project
└── BUILD_REPORT.md       # Detailed build report
```

## Security

- Desktop: Database encrypted with SQLCipher (AES-256)
- Mobile: Relies on OS-level encryption and app sandboxing
- PIN hashed with Argon2id
- API keys stored in system keyring/keychain

## License

Personal use only. Tax calculations are estimates and not professional tax advice.
