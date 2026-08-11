# BSI Messenger Coding Guidelines & Best Practices

## Overview

This document establishes coding standards and best practices for BSI Messenger development. Following these guidelines ensures consistency, maintainability, and code quality across the codebase.

## TypeScript Conventions

### Type Definitions

**Use `interface` for object shapes:**
```typescript
// ✅ Good: Use interface for objects
interface User {
  id: string
  username: string
  displayName: string
}

interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}
```

**Use `type` for unions, intersections, and primitives:**
```typescript
// ✅ Good: Use type for unions and aliases
type UserStatus = 'AVAILABLE' | 'AWAY' | 'DND' | 'OFFLINE'
type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO'
type Nullable<T> = T | null
```

**Avoid `any` - use `unknown` instead:**
```typescript
// ❌ Bad: Using any
const parseData = (data: any) => {
  return data.value
}

// ✅ Good: Using unknown with type guards
const parseData = (data: unknown) => {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value
  }
  throw new Error('Invalid data format')
}
```

### Naming Conventions

**Variables and Functions:**
```typescript
// camelCase for variables and functions
const userName = 'John Doe'
const messageCount = 42

function getUserProfile() { }
function sendMessage() { }
```

**Components and Classes:**
```typescript
// PascalCase for components and classes
class AuthService { }
function LoginPage() { }
const ChatArea = () => { }
```

**Constants:**
```typescript
// SCREAMING_SNAKE_CASE for constants
const API_URL = 'https://api.example.com'
const MAX_RETRY_ATTEMPTS = 3
const TOKEN_KEY = 'bsi_access_token'
```

**Private Properties:**
```typescript
// Prefix with underscore for private/internal
class WebSocketService {
  private _ws: WebSocket | null = null
  private _handlers = new Map()
  
  // Public methods don't use underscore
  connect() { }
  disconnect() { }
}
```

**Boolean Variables:**
```typescript
// Prefix with is, has, should, can
const isLoading = true
const hasError = false
const shouldRetry = true
const canEdit = false
```

### Function Signatures

**Explicit Return Types:**
```typescript
// ✅ Good: Explicit return type
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ Good: Async functions with Promise type
async function fetchUser(id: string): Promise<User> {
  const response = await api.get(`/users/${id}`)
  return response.data
}

// ⚠️ Acceptable: Inferred types for simple cases
const add = (a: number, b: number) => a + b
```

**Function Parameters:**
```typescript
// ✅ Good: Use object parameter for multiple args
function createUser({
  username,
  email,
  role = 'USER'
}: {
  username: string
  email: string
  role?: string
}) {
  // Implementation
}

// ❌ Bad: Too many positional parameters
function createUser(username: string, email: string, role?: string, active?: boolean) { }
```

---

## React Best Practices

### Component Structure

**Functional Components:**
```typescript
// ✅ Good: Standard functional component structure
import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/auth.store'

interface ComponentNameProps {
  // Props definition
  title: string
  onAction: () => void
  disabled?: boolean
}

export default function ComponentName({ title, onAction, disabled = false }: ComponentNameProps) {
  // 1. Hooks
  const [localState, setLocalState] = useState('')
  const { user } = useAuthStore()

  // 2. Effects
  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    }
  }, [])

  // 3. Event handlers
  const handleClick = () => {
    onAction()
  }

  // 4. Render
  return (
    <div className="component-name">
      <h1>{title}</h1>
      <button onClick={handleClick} disabled={disabled}>
        Action
      </button>
    </div>
  )
}
```

### Hooks Usage

**Custom Hooks:**
```typescript
// ✅ Good: Extract reusable logic into custom hooks
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

// Usage
const Component = () => {
  const { width } = useWindowSize()
  return <div>{width < 768 ? 'Mobile' : 'Desktop'}</div>
}
```

**Rules of Hooks:**
```typescript
// ✅ Good: Hooks at top level
function Component() {
  const [state, setState] = useState()
  const { user } = useAuthStore()
  
  if (!user) return null
  
  return <div>{user.name}</div>
}

// ❌ Bad: Conditional hooks
function Component() {
  const { user } = useAuthStore()
  
  if (!user) return null
  
  const [state, setState] = useState() // ❌ Hook after return
  return <div>{user.name}</div>
}
```

### Props and State

**Props Destructuring:**
```typescript
// ✅ Good: Destructure in parameter
function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick} className={variant}>{label}</button>
}

// ❌ Bad: Props object usage
function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.label}</button>
}
```

**State Updates:**
```typescript
// ✅ Good: Functional updates for derived state
setCount(prev => prev + 1)
setItems(prev => [...prev, newItem])

// ✅ Good: Multiple related state in single object
const [form, setForm] = useState({ name: '', email: '' })
setForm(prev => ({ ...prev, name: 'John' }))

// ❌ Bad: Stale state reference
setCount(count + 1) // May use stale value
```

### Performance Optimization

**React.memo:**
```typescript
// ✅ Good: Memoize expensive components
const ExpensiveComponent = React.memo(({ data }: Props) => {
  return <div>{/* Complex rendering */}</div>
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id
})
```

**useMemo and useCallback:**
```typescript
// ✅ Good: Memoize expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name))
}, [items])

// ✅ Good: Stable callback references
const handleClick = useCallback((id: string) => {
  onItemClick(id)
}, [onItemClick])

// ❌ Avoid: Unnecessary memoization
const simple = useMemo(() => x + y, [x, y]) // Overkill for simple calc
```

---

## State Management Guidelines

### When to Use What

**Component State (useState):**
- Temporary UI state (modal visibility, input values)
- Component-specific state not needed elsewhere
- Simple state without complex logic

**Zustand Store:**
- Application-wide state (auth, chat, calls)
- State needed across multiple components
- Real-time data from WebSocket
- State that persists across navigation

**React Query:**
- Server data that can be cached
- Paginated data lists
- Data that can be refreshed/invalidated
- CRUD operations with optimistic updates

### Store Design

**Single Responsibility:**
```typescript
// ✅ Good: Focused store with clear purpose
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

// ❌ Bad: Mixed responsibilities
interface AppState {
  user: User | null
  messages: Message[]
  callState: CallState
  // Too many concerns in one store
}
```

**Immutable Updates:**
```typescript
// ✅ Good: Immutable state updates
set((state) => ({
  ...state,
  conversations: state.conversations.map(conv =>
    conv.id === updatedConv.id ? { ...conv, ...updates } : conv
  )
}))

// ❌ Bad: Mutating state
set((state) => {
  state.conversations[0].title = 'New Title'
  return state
})
```

---

## Async/Await Patterns

### Error Handling

**Try-Catch Blocks:**
```typescript
// ✅ Good: Proper error handling
async function fetchData() {
  try {
    const response = await api.get('/data')
    return response.data
  } catch (error) {
    // Log for debugging
    console.error('[fetchData] Error:', error)
    
    // Provide user-friendly message
    if (error.response?.status === 404) {
      throw new Error('Data not found')
    } else if (error.response?.status === 500) {
      throw new Error('Server error, please try again')
    } else {
      throw new Error('Failed to fetch data')
    }
  }
}
```

**Promise.all for Parallel Requests:**
```typescript
// ✅ Good: Parallel requests
const [users, settings, stats] = await Promise.all([
  api.get('/users'),
  api.get('/settings'),
  api.get('/stats')
])

// ❌ Bad: Sequential requests (slower)
const users = await api.get('/users')
const settings = await api.get('/settings')
const stats = await api.get('/stats')
```

---

## File Organization

### Import Order

```typescript
// 1. External libraries
import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

// 2. Internal modules
import { useAuthStore } from '@/stores/auth.store'
import { usersApi } from '@/services/api.service'

// 3. Components
import Avatar from '@/components/common/Avatar'
import Button from '@/components/common/Button'

// 4. Types
import type { User, UserStatus } from '@/types'

// 5. Styles
import './ComponentName.css'
```

### File Naming

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatArea.tsx          # PascalCase for components
│   │   ├── Sidebar.tsx
│   │   └── MessageBubble.tsx
├── stores/
│   ├── auth.store.ts             # kebab-case for non-components
│   ├── chat.store.ts
│   └── call.store.ts
├── services/
│   ├── api.service.ts
│   ├── ws.service.ts
│   └── notification.service.ts
├── types/
│   └── index.ts                  # Group related types
└── utils/
    ├── format.ts                 # Utility functions
    └── validation.ts
```

---

## CSS and Styling

### Tailwind CSS Classes

**Utility Organization:**
```typescript
// ✅ Good: Logical grouping with line breaks
<div className="
  flex items-center justify-between
  px-4 py-2
  bg-gray-800 hover:bg-gray-700
  border border-gray-700 rounded-lg
  transition-colors duration-200
">
  Content
</div>

// Use cn() helper for conditional classes
import { cn } from '@/utils/cn'

<button className={cn(
  'px-4 py-2 rounded',
  variant === 'primary' && 'bg-blue-500',
  variant === 'secondary' && 'bg-gray-500',
  disabled && 'opacity-50 cursor-not-allowed'
)} />
```

**Responsive Design:**
```typescript
// Mobile-first approach
<div className="
  flex-col           // Mobile: stack vertically
  md:flex-row        // Tablet+: horizontal
  gap-2 md:gap-4     // Responsive spacing
">
```

---

## Error Handling

### User-Facing Errors

```typescript
// ✅ Good: User-friendly error messages
function handleLoginError(error: unknown) {
  let message = 'Login failed'
  
  if (error?.response?.status === 401) {
    message = 'Invalid username or password'
  } else if (error?.response?.status === 429) {
    message = 'Too many login attempts. Please try again later.'
  } else if (!error?.response) {
    message = 'Network error. Please check your connection.'
  }
  
  showErrorToast(message)
}

// ❌ Bad: Technical errors shown to users
showErrorToast(error.message) // "Request failed with status code 401"
```

### Defensive Programming

```typescript
// ✅ Good: Guard clauses and null checks
function processUser(user: User | null) {
  if (!user) {
    console.warn('[processUser] User is null')
    return
  }
  
  if (!user.email) {
    console.warn('[processUser] User has no email')
    return
  }
  
  // Process user
}

// ✅ Good: Optional chaining
const userName = user?.profile?.displayName ?? 'Unknown'

// ✅ Good: Array safety
const firstMessage = messages?.[0] ?? null
```

---

## Testing Guidelines

### Unit Test Structure

```typescript
describe('auth.store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })
  })

  describe('login', () => {
    it('should set user and authenticated on successful login', async () => {
      // Arrange
      const mockUser = { id: '1', username: 'test' }
      jest.spyOn(authApi, 'login').mockResolvedValue({ 
        data: { user: mockUser, accessToken: 'token', refreshToken: 'refresh' }
      })

      // Act
      await useAuthStore.getState().login('test', 'password')

      // Assert
      expect(useAuthStore.getState().user).toEqual(mockUser)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('should set error on failed login', async () => {
      // Test error case
    })
  })
})
```

---

## Comments and Documentation

### When to Comment

```typescript
// ✅ Good: Explain WHY, not WHAT
// Debounce to avoid excessive API calls during typing
const debouncedSearch = useDebounce(searchQuery, 300)

// ✅ Good: Document complex logic
// Calculate pagination based on 0-indexed cursor.
// Backend expects seq as string (BigInt), but we work with numbers.
const nextCursor = String(Number(lastMessage.seq) - 1)

// ❌ Bad: Obvious comments
// Set loading to true
setLoading(true)

// ❌ Bad: Commented-out code
// const oldFunction = () => { ... }  // Remove instead of commenting
```

### JSDoc for Public APIs

```typescript
/**
 * Sends a text message to the active conversation with optimistic update.
 * 
 * @param body - The message text content
 * @param replyToId - Optional message ID to reply to
 * @throws {Error} If no active conversation or body is empty
 * 
 * @example
 * ```typescript
 * await sendText('Hello world!')
 * await sendText('Reply text', 'msg_123')
 * ```
 */
async sendText(body: string, replyToId?: string): Promise<void> {
  // Implementation
}
```

---

## Git Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code formatting (no logic change)
- **refactor:** Code restructuring (no behavior change)
- **perf:** Performance improvement
- **test:** Adding or updating tests
- **chore:** Maintenance tasks (deps, config)

### Examples

```bash
# Simple feature
git commit -m "feat: add typing indicators to chat"

# Bug fix with details
git commit -m "fix: resolve WebSocket reconnection loop

- Add isRefreshInFlight check before reconnect
- Reset reconnect delay on successful connection
- Fixes #123"

# Breaking change
git commit -m "feat!: change message API response format

BREAKING CHANGE: Message.seq is now string instead of number
to match backend BigInt serialization"
```

---

## Code Review Checklist

### Before Submitting PR

- [ ] Code follows style guidelines (ESLint passes)
- [ ] Code is formatted (Prettier applied)
- [ ] TypeScript compiles without errors
- [ ] No console.log() statements (use proper logging)
- [ ] Tests added/updated (if applicable)
- [ ] Documentation updated (if needed)
- [ ] Git commit messages follow format
- [ ] PR description explains changes clearly

### Reviewing Code

**What to Look For:**
- Logic errors and edge cases
- Performance implications
- Security vulnerabilities
- Code duplication
- Unclear naming
- Missing error handling
- Inconsistent patterns

**Feedback Style:**
- Be constructive and respectful
- Explain WHY, not just WHAT
- Suggest alternatives
- Distinguish between "must fix" and "nice to have"

---

## Security Best Practices

### Input Validation

```typescript
// ✅ Good: Validate user input
function createUser(username: string) {
  if (!username || username.length < 3) {
    throw new Error('Username must be at least 3 characters')
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error('Username can only contain letters, numbers, and underscores')
  }
  
  // Proceed with creation
}
```

### Sensitive Data

```typescript
// ✅ Good: Never log sensitive data
console.log('[auth] Login attempt for user:', username) // ✅ OK
console.log('[auth] Token:', accessToken) // ❌ Never log tokens

// ✅ Good: Clear sensitive data from memory
function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  // Don't keep references to tokens
}
```

---

*These coding guidelines are living documents. Suggest improvements via pull requests!*