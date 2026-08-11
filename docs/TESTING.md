# Testing Strategy

## Overview

BSI Messenger currently relies on **manual testing** and **development-time validation**. This document outlines the testing approach and provides guidance for adding automated tests in the future.

---

## Current Testing Approach

### 1. Manual Testing

**What we test manually:**
- User flows (login, send message, create group)
- UI responsiveness across screen sizes
- Real-time features (WebSocket, typing indicators)
- File uploads and downloads
- Push notifications (mobile)
- Voice/video calls (LiveKit)

**Testing checklist:** See [Manual Testing Checklist](#manual-testing-checklist)

### 2. TypeScript Type Checking

**Run type checking:**
```bash
npm run typecheck
```

**Benefits:**
- Catches type errors before runtime
- Ensures props match interfaces
- Validates API response types

### 3. ESLint

**Run linting:**
```bash
npm run lint
```

**Catches:**
- Unused variables
- Missing dependencies in useEffect
- Accessibility issues (via eslint-plugin-jsx-a11y)
- React anti-patterns

### 4. Code Review

**Every PR includes:**
- Manual code review
- Functional testing by reviewer
- Verification of TypeScript errors
- Check for console errors/warnings

---

## Manual Testing Checklist

### Authentication & User Management

- [ ] **Login**
  - [ ] Valid credentials → success
  - [ ] Invalid credentials → error message
  - [ ] Remember me checkbox works
  - [ ] Logout clears session

- [ ] **Registration**
  - [ ] Valid data → account created
  - [ ] Duplicate email → error
  - [ ] Password validation works
  - [ ] Email verification (if applicable)

- [ ] **Profile**
  - [ ] Update display name
  - [ ] Update avatar
  - [ ] Change password
  - [ ] Update status

### Conversations

- [ ] **Create Conversation**
  - [ ] Create 1:1 chat
  - [ ] Create group chat
  - [ ] Add multiple members to group
  - [ ] Set group title and avatar

- [ ] **Conversation List**
  - [ ] Displays all conversations
  - [ ] Shows last message preview
  - [ ] Shows unread count
  - [ ] Sorted by last activity
  - [ ] Search/filter works

- [ ] **Conversation Settings**
  - [ ] Edit group name (admin)
  - [ ] Change group avatar (admin)
  - [ ] Add members (admin)
  - [ ] Remove members (admin)
  - [ ] Leave group
  - [ ] Delete conversation

### Messaging

- [ ] **Send Messages**
  - [ ] Send text message
  - [ ] Send with Enter key
  - [ ] New line with Shift+Enter
  - [ ] Emoji picker works
  - [ ] Message appears in list
  - [ ] Optimistic UI (instant feedback)

- [ ] **Receive Messages**
  - [ ] Real-time message delivery
  - [ ] Notification shown
  - [ ] Unread count updates
  - [ ] Scroll to new message
  - [ ] Multiple messages in quick succession

- [ ] **Message Features**
  - [ ] Edit message
  - [ ] Delete message
  - [ ] Reply to message
  - [ ] Copy message text
  - [ ] Message timestamps

- [ ] **File Attachments**
  - [ ] Upload image
  - [ ] Upload document
  - [ ] Upload audio
  - [ ] Progress indicator shown
  - [ ] Thumbnail preview
  - [ ] Download attachment
  - [ ] Open in viewer

### Real-time Features

- [ ] **WebSocket Connection**
  - [ ] Connects on login
  - [ ] Reconnects after disconnect
  - [ ] Heartbeat keeps connection alive
  - [ ] Graceful handling of network loss

- [ ] **Typing Indicators**
  - [ ] Shows when other user typing
  - [ ] Stops after 2s of inactivity
  - [ ] Multiple users typing
  - [ ] Works in groups

- [ ] **Presence**
  - [ ] Online status updates
  - [ ] Last seen timestamp
  - [ ] Away status after inactivity
  - [ ] Offline detection

### Voice/Video Calls

- [ ] **Initiating Calls**
  - [ ] Start audio call
  - [ ] Start video call
  - [ ] Call notification sent

- [ ] **Receiving Calls**
  - [ ] Incoming call notification
  - [ ] Accept call
  - [ ] Reject call
  - [ ] Missed call indicator

- [ ] **During Call**
  - [ ] Audio/video working
  - [ ] Mute/unmute microphone
  - [ ] Enable/disable camera
  - [ ] Screen sharing
  - [ ] End call

### Mobile (Android)

- [ ] **Installation**
  - [ ] APK installs successfully
  - [ ] App icon appears
  - [ ] Opens without errors

- [ ] **Push Notifications**
  - [ ] Receives notifications when app closed
  - [ ] Notification content correct
  - [ ] Tapping opens conversation
  - [ ] Notification settings work

- [ ] **Mobile UI**
  - [ ] Responsive layout
  - [ ] Touch gestures work
  - [ ] Back button navigation
  - [ ] Keyboard handling
  - [ ] File picker works
  - [ ] Camera integration

### Desktop (Electron)

- [ ] **Installation**
  - [ ] Installer runs
  - [ ] Desktop shortcut created
  - [ ] Starts on system startup (if enabled)

- [ ] **System Integration**
  - [ ] System tray icon
  - [ ] Desktop notifications
  - [ ] Notification click opens app
  - [ ] Multiple windows support
  - [ ] Auto-update works

### Performance

- [ ] **Load Time**
  - [ ] App loads in <3s
  - [ ] Messages render quickly
  - [ ] Smooth scrolling (60fps)

- [ ] **Memory**
  - [ ] No memory leaks after 1 hour
  - [ ] Memory usage <200MB (desktop)
  - [ ] Memory usage <100MB (mobile)

- [ ] **Network**
  - [ ] Works on slow connection (3G)
  - [ ] Handles network interruptions
  - [ ] Reconnects automatically

### Cross-Platform

- [ ] **Desktop**
  - [ ] Windows 10/11
  - [ ] macOS 12+
  - [ ] Linux (Ubuntu, Fedora)

- [ ] **Mobile**
  - [ ] Android 7.0+
  - [ ] Different screen sizes
  - [ ] Tablets

- [ ] **Browsers** (for development)
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari

---

## Future: Automated Testing

### Recommended Testing Stack

**Unit Testing:**
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0"
  }
}
```

**E2E Testing:**
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

### Unit Test Example

**File:** `src/renderer/src/components/MessageItem.test.tsx` (future)

```typescript
import { render, screen } from '@testing-library/react'
import { MessageItem } from './MessageItem'
import { Message } from '../types'

describe('MessageItem', () => {
  const mockMessage: Message = {
    id: '1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    type: 'TEXT',
    body: 'Hello world',
    createdAt: '2024-01-01T10:00:00Z'
  }

  it('renders message text', () => {
    render(<MessageItem message={mockMessage} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders timestamp', () => {
    render(<MessageItem message={mockMessage} />)
    expect(screen.getByText(/10:00/)).toBeInTheDocument()
  })

  it('shows edited indicator when message is edited', () => {
    const editedMessage = { ...mockMessage, editedAt: '2024-01-01T11:00:00Z' }
    render(<MessageItem message={editedMessage} />)
    expect(screen.getByText('(edited)')).toBeInTheDocument()
  })
})
```

### Integration Test Example

**File:** `src/renderer/src/services/auth.service.test.ts` (future)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { authService } from './auth.service'
import { api } from './api.service'

vi.mock('./api.service')

describe('authService', () => {
  it('login sets user in store', async () => {
    const mockUser = { id: '1', username: 'john', displayName: 'John' }
    vi.mocked(api.post).mockResolvedValue({ data: { user: mockUser } })

    const user = await authService.login({ email: 'john@example.com', password: 'pass' })

    expect(user).toEqual(mockUser)
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'john@example.com', password: 'pass' })
  })

  it('logout clears user from store', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} })

    await authService.logout()

    expect(api.post).toHaveBeenCalledWith('/auth/logout')
    // Verify store cleared (implementation depends on store)
  })
})
```

### E2E Test Example

**File:** `tests/e2e/chat.spec.ts` (future)

```typescript
import { test, expect } from '@playwright/test'

test('user can send and receive messages', async ({ page, context }) => {
  // Login as User 1
  await page.goto('http://localhost:5173')
  await page.fill('[name="email"]', 'user1@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  
  // Wait for chat page
  await expect(page).toHaveURL(/.*chat/)
  
  // Open conversation
  await page.click('[data-testid="conversation-1"]')
  
  // Send message
  await page.fill('[data-testid="message-input"]', 'Hello from User 1')
  await page.press('[data-testid="message-input"]', 'Enter')
  
  // Verify message appears
  await expect(page.locator('text=Hello from User 1')).toBeVisible()
  
  // Open second browser context as User 2
  const page2 = await context.newPage()
  await page2.goto('http://localhost:5173')
  await page2.fill('[name="email"]', 'user2@example.com')
  await page2.fill('[name="password"]', 'password')
  await page2.click('button[type="submit"]')
  
  // User 2 should see message from User 1
  await page2.click('[data-testid="conversation-1"]')
  await expect(page2.locator('text=Hello from User 1')).toBeVisible()
  
  // User 2 replies
  await page2.fill('[data-testid="message-input"]', 'Hello back!')
  await page2.press('[data-testid="message-input"]', 'Enter')
  
  // User 1 should see reply in real-time
  await expect(page.locator('text=Hello back!')).toBeVisible()
})
```

### Test Commands (Future)

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Testing Best Practices

### 1. Test User Behavior, Not Implementation

```typescript
// ❌ Bad: Testing implementation details
expect(component.state.count).toBe(5)

// ✅ Good: Testing user-visible behavior
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

### 2. Use Test IDs Sparingly

```typescript
// Only when necessary (no other reliable selector)
<button data-testid="submit-button">Submit</button>

// Prefer semantic queries
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email address')
screen.getByText('Welcome back')
```

### 3. Mock External Dependencies

```typescript
// Mock API calls
vi.mock('./api.service', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

// Mock WebSocket
vi.mock('./websocket.service', () => ({
  wsService: {
    connect: vi.fn(),
    send: vi.fn()
  }
}))
```

### 4. Keep Tests Independent

```typescript
// Each test should be runnable in isolation
describe('MessageList', () => {
  beforeEach(() => {
    // Reset state before each test
    useMessagesStore.setState({ messages: {} })
  })

  it('test 1', () => { /* ... */ })
  it('test 2', () => { /* ... */ }) // Doesn't depend on test 1
})
```

### 5. Test Happy Path and Error Cases

```typescript
it('shows error message when login fails', async () => {
  vi.mocked(api.post).mockRejectedValue({
    response: { data: { message: 'Invalid credentials' } }
  })

  render(<LoginForm />)
  
  await userEvent.type(screen.getByLabelText('Email'), 'wrong@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'wrongpass')
  await userEvent.click(screen.getByRole('button', { name: 'Login' }))
  
  expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
})
```

---

## Coverage Goals (Future)

**When implementing automated tests:**

- **Unit Tests:** 70%+ coverage
  - Services: 80%+
  - Stores: 80%+
  - Components: 60%+
  - Utils: 90%+

- **Integration Tests:** Critical paths
  - Authentication flow
  - Message sending/receiving
  - File uploads
  - WebSocket connection

- **E2E Tests:** Core user flows
  - Login → Send message
  - Create group → Add members
  - Upload file → Download
  - Voice call flow

---

## Test Environments

### Local Development
```bash
npm run test        # Run unit tests
npm run test:e2e    # Run E2E tests
```

### CI/CD (Future)
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e
```

---

## Debugging Tests

### Debug in VS Code

**launch.json:**
```json
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debug E2E Tests

```bash
# Run with Playwright UI
npm run test:e2e:ui

# Debug specific test
npx playwright test --debug tests/e2e/chat.spec.ts
```

---

## Current Status

**Testing Coverage:** ~0% automated (all manual)

**When to add tests:**
- When feature is stable and unlikely to change frequently
- After major refactors to prevent regressions
- When fixing bugs (write test to reproduce, then fix)
- Before v1.0 release

**Priority for future automated testing:**
1. Authentication flow
2. Message sending/receiving
3. WebSocket connection handling
4. Critical business logic (services, stores)
5. UI components (nice to have)

---

*Testing is important for long-term maintainability. Start with manual testing and gradually add automated tests as the codebase matures.*
