# Changelog

All notable changes to the GoAmpy Waitlist Application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-11-14

### 🔐 Security Improvements
- **Stronger Referral Codes**: Implemented cryptographically secure referral codes using slugified username + 6-character random string (e.g., `john-doe-x7q3vg`)
- **Self-Referral Prevention**: Added robust validation to prevent users from using their own referral codes, returning proper JSON error responses
- **Anti-Brute Force**: Referral codes now use unambiguous characters (3456789ABCDEFGHJKLMNPQRTUVWXY) to prevent brute force attacks
- **Disposable Email Blocking**: Added validation to reject disposable email addresses from known providers

### 🎨 Frontend Enhancements
- **React 18.3.1 Upgrade**: Updated React and React DOM to latest stable version for improved performance and compatibility
- **PWA Support**: Added Progressive Web App configuration with offline support and installability on mobile devices
- **Web Share API**: Integrated native mobile sharing with fallback to clipboard copy for desktop users
- **Visual Feedback**: Added copy confirmation ("✓ Copied!") for better user experience

### 🚀 Backend Improvements
- **Error Handling**: Implemented proper JSON error responses for API endpoints instead of HTML error pages
- **Referral Attribution**: Enhanced referral tracking with deduplication and proper event logging
- **Share Page Optimization**: Added 10-minute caching and noindex meta tags for referral share pages
- **Request Logging**: Comprehensive logging with PII redaction and request ID tracking

### 🐛 Bug Fixes
- Fixed React version conflict causing black screen by replacing lucide-react icons with inline SVGs
- Fixed referral code lookup issue by ensuring consistent lowercase storage and retrieval
- Fixed error middleware not being properly connected to Express app
- Fixed self-referral check not working due to case sensitivity issues

### 📚 Documentation
- Updated system architecture documentation to reflect current implementation
- Added comprehensive security documentation
- Created detailed API documentation with examples
- Added developer onboarding guide

## [1.0.0] - 2024-11-13

### Initial Release
- Split-panel landing page with Chat and Console panels
- Conversational onboarding flow with AI assistant (Ampy)
- Basic referral code generation and tracking
- Points system (10 base + 20 verified + 10 per referral)
- Email OTP verification (Supabase Auth)
- PostgreSQL database with Drizzle ORM
- Express.js BFF pattern on port 5177
- React with TypeScript and Vite on port 5000
- Tailwind CSS with shadcn/ui components
- TanStack Query for state management