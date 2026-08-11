# BSI Messenger Documentation Index

## Welcome

Welcome to the BSI Messenger documentation! This comprehensive guide covers all aspects of the application, from architecture and development to deployment and troubleshooting.

## Quick Links

**New Developer?** Start here:
1. [Setup Guide](./SETUP.md) - Get your development environment running in 30 minutes
2. [Architecture Overview](./ARCHITECTURE.md) - Understand the system design
3. [Coding Guidelines](./CODING_GUIDELINES.md) - Follow team conventions

**Looking for Something Specific?**
- [API Reference](./API.md) - Complete REST & WebSocket API documentation
- [Component Catalog](./COMPONENTS.md) - React component reference
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

---

## Documentation Categories

### 🚀 Getting Started

| Document | Description | Audience |
|----------|-------------|----------|
| [**Setup Guide**](./SETUP.md) | Environment setup and first steps | New developers |
| [**Architecture Overview**](./ARCHITECTURE.md) | System design and technology stack | All developers |
| [**Glossary**](./GLOSSARY.md) | Terms, acronyms, and concepts | Everyone |

**Estimated Time:** 1-2 hours to get started

---

### 💻 Development

| Document | Description | Audience |
|----------|-------------|----------|
| [**Coding Guidelines**](./CODING_GUIDELINES.md) | Standards and best practices | All developers |
| [**Adding Features**](./ADDING_FEATURES.md) | Step-by-step feature implementation | Frontend developers |
| [**Testing Strategy**](./TESTING.md) | Testing approaches and tools | All developers |

**Prerequisites:** Completed setup guide

---

### 🏗️ Architecture & Design

| Document | Description | Audience |
|----------|-------------|----------|
| [**Architecture**](./ARCHITECTURE.md) | System architecture and design patterns | All developers |
| [**State Management**](./STATE_MANAGEMENT.md) | Zustand stores and data flow | Frontend developers |
| [**Services**](./SERVICES.md) | Service layer and integrations | Frontend developers |
| [**Components**](./COMPONENTS.md) | React component catalog | Frontend developers |
| [**Database Schema**](./DATABASE.md) | PostgreSQL database structure | Backend developers |
| [**Types Documentation**](./TYPES.md) | TypeScript type system | All developers |

**For:** Understanding system internals

---

### 🖥️ Platform-Specific

| Document | Description | Audience |
|----------|-------------|----------|
| [**Electron/Desktop**](./ELECTRON.md) | Desktop application development | Desktop developers |
| [**Mobile/Capacitor**](./MOBILE.md) | Android app development | Mobile developers |

**For:** Platform-specific feature development

---

### 🔐 Security

| Document | Description | Audience |
|----------|-------------|----------|
| [**Authentication**](./AUTHENTICATION.md) | Auth flow and token management | All developers |

**For:** Security-sensitive features

---

### 🔄 Real-time Features

| Document | Description | Audience |
|----------|-------------|----------|
| [**Real-time Communication**](./REALTIME.md) | WebSocket and LiveKit implementation | All developers |

**For:** Chat and call features

---

### 📚 Reference

| Document | Description | Audience |
|----------|-------------|----------|
| [**API Reference**](./API.md) | Complete API endpoint documentation | All developers |
| [**Types Documentation**](./TYPES.md) | TypeScript interfaces and types | All developers |
| [**Configuration**](./CONFIGURATION.md) | Config files reference | All developers |
| [**Glossary**](./GLOSSARY.md) | Terms and acronyms | Everyone |

**For:** Day-to-day reference

---

### 🚀 Operations

| Document | Description | Audience |
|----------|-------------|----------|
| [**Deployment**](./DEPLOYMENT.md) | Build and release process | DevOps, Leads |
| [**Troubleshooting**](./TROUBLESHOOTING.md) | Common issues and fixes | All developers |
| [**Performance**](./PERFORMANCE.md) | Optimization strategies | All developers |

**For:** Production operations

---

### 📋 Planning

| Document | Description | Audience |
|----------|-------------|----------|
| [**Roadmap**](./ROADMAP.md) | Future features and technical debt | All team members |
| [**Changelog**](../CHANGELOG.md) | Version history and changes | All team members |

**For:** Project planning

---

## Learning Paths

### Path 1: New Frontend Developer

**Week 1: Setup & Basics**
1. Complete [Setup Guide](./SETUP.md)
2. Read [Architecture Overview](./ARCHITECTURE.md) (high-level only)
3. Study [Coding Guidelines](./CODING_GUIDELINES.md)
4. Browse [Component Documentation](./COMPONENTS.md)

**Week 2: Deep Dive**
1. Understand [State Management](./STATE_MANAGEMENT.md)
2. Learn [Service Layer](./SERVICES.md) patterns
3. Study [API Reference](./API.md) for backend integration
4. Review [Real-time Communication](./REALTIME.md)

**Week 3: First Contribution**
1. Pick a small feature from [Roadmap](./ROADMAP.md)
2. Follow [Adding Features](./ADDING_FEATURES.md) guide
3. Submit pull request
4. Iterate based on code review

### Path 2: Desktop Developer

**Focus Areas:**
1. [Setup Guide](./SETUP.md) - Desktop development setup
2. [Electron Documentation](./ELECTRON.md) - Main process architecture
3. [Architecture](./ARCHITECTURE.md) - Local proxy server
4. [Services](./SERVICES.md) - IPC communication

### Path 3: Mobile Developer

**Focus Areas:**
1. [Setup Guide](./SETUP.md) - Android setup
2. [Mobile Documentation](./MOBILE.md) - Capacitor integration
3. [Architecture](./ARCHITECTURE.md) - Platform detection
4. [Services](./SERVICES.md) - Push notifications

### Path 4: Backend Developer

**Focus Areas:**
1. [Architecture](./ARCHITECTURE.md) - System overview
2. [Database Schema](./DATABASE.md) - PostgreSQL structure
3. [API Reference](./API.md) - Endpoint contracts
4. [Authentication](./AUTHENTICATION.md) - Token flow

---

## Common Tasks

### How do I...

**...add a new React component?**
→ See [Components Guide](./COMPONENTS.md#component-patterns)

**...create a new API endpoint?**
→ See [Adding Features](./ADDING_FEATURES.md#adding-api-endpoints)

**...add a new Zustand store?**
→ See [State Management](./STATE_MANAGEMENT.md#creating-new-stores)

**...implement a new WebSocket event?**
→ See [Real-time Communication](./REALTIME.md#adding-websocket-events)

**...debug Electron main process?**
→ See [Electron Guide](./ELECTRON.md#debugging)

**...fix a build error?**
→ See [Troubleshooting](./TROUBLESHOOTING.md#build-errors)

**...deploy a new version?**
→ See [Deployment Guide](./DEPLOYMENT.md)

---

## Documentation Conventions

### Icons Used

- 🚀 Getting Started
- 💻 Development
- 🏗️ Architecture
- 🖥️ Platform-Specific
- 🔐 Security
- 🔄 Real-time
- 📚 Reference
- 🚀 Operations
- 📋 Planning

### Code Examples

```typescript
// ✅ Good: Recommended approach
const recommended = 'This is the preferred way'

// ❌ Bad: Avoid this pattern
const avoid = 'Don't do this'

// ⚠️ Acceptable: Works but not ideal
const acceptable = 'Acceptable in certain cases'
```

### Admonitions

**Important Notes:**
> ⚠️ **Warning:** Critical information that could cause issues if ignored

> 💡 **Tip:** Helpful suggestions for better practices

> 📝 **Note:** Additional context or clarification

---

## Contributing to Documentation

### Found an Issue?

- **Typo or small fix:** Submit a pull request
- **Missing content:** Create an issue with details
- **Unclear explanation:** Suggest improvements in PR

### Documentation Standards

1. **Clarity:** Write for developers who are new to the codebase
2. **Examples:** Include code examples for complex concepts
3. **Structure:** Use consistent heading hierarchy
4. **Links:** Cross-reference related documentation
5. **Updates:** Keep documentation in sync with code changes

### File Naming

- Use UPPERCASE for root-level docs: `README.md`, `CHANGELOG.md`
- Use UPPERCASE for docs/ files: `ARCHITECTURE.md`, `API.md`
- Use kebab-case for images: `architecture-diagram.png`

---

## Version Information

**Documentation Version:** 1.0.0  
**Last Updated:** August 10, 2026  
**Application Version:** 1.0.0

**Compatibility:**
- Node.js: 20.x or 22.x LTS
- Electron: 39.x
- React: 19.x
- TypeScript: 5.9.x

---

## Support & Resources

**Internal Resources:**
- GitHub Repository: https://github.com/your-org/bsi-messenger
- Internal Wiki: [Link if available]
- Team Chat: BSI Messenger #dev channel

**External Resources:**
- React Documentation: https://react.dev/
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Electron Documentation: https://www.electronjs.org/docs
- Zustand Guide: https://github.com/pmndrs/zustand

**Getting Help:**
1. Search documentation (this index)
2. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
3. Search GitHub issues
4. Ask in team chat
5. Create new issue with details

---

## Feedback

Help us improve this documentation!

**What works:**
- Clear, concise explanations
- Practical code examples
- Troubleshooting sections
- Quick reference tables

**What we need:**
- Your questions (they help us improve)
- Your suggestions (we want to help you)
- Your contributions (share your knowledge)

Submit feedback via GitHub issues or pull requests.

---

*Happy coding! 🚀*