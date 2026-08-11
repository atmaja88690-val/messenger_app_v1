# Performance Optimization Guide

## Overview

This guide covers performance optimization strategies for BSI Messenger, focusing on React rendering, network efficiency, and resource management.

---

## React Performance

### 1. Prevent Unnecessary Re-renders

**Problem:** Components re-render even when props haven't changed.

**Solution A: React.memo**
```typescript
// Memoize expensive components
export const MessageItem = React.memo(({ message }: Props) => {
  return (
    <div className="message">
      {message.body}
    </div>
  )
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return prevProps.message.id === nextProps.message.id &&
         prevProps.message.body === nextProps.message.body
})
```

**Solution B: useMemo for expensive calculations**
```typescript
const MessageList = ({ messages }: Props) => {
  // Only recalculate when messages change
  const sortedMessages = useMemo(() => {
    return messages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }, [messages])

  return <div>{sortedMessages.map(...)}</div>
}
```

**Solution C: useCallback for stable function references**
```typescript
const ChatInput = ({ onSend }: Props) => {
  // Stable reference across re-renders
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onSend()
    }
  }, [onSend])

  return <input onKeyPress={handleKeyPress} />
}
```

### 2. Virtualize Long Lists

**Problem:** Rendering 1000+ messages causes lag.

**Solution: Use react-virtuoso**
```typescript
import { Virtuoso } from 'react-virtuoso'

export const MessageList = ({ messages }: Props) => {
  return (
    <Virtuoso
      data={messages}
      initialTopMostItemIndex={messages.length - 1} // Start at bottom
      followOutput="auto" // Auto-scroll to new messages
      itemContent={(index, message) => (
        <MessageItem key={message.id} message={message} />
      )}
    />
  )
}
```

**Benefits:**
- Only renders visible items (~10-20 messages)
- Smooth scrolling with 1000+ items
- Auto-scroll to new messages

### 3. Optimize Zustand Selectors

**Problem:** Component re-renders when unrelated store state changes.

**❌ Bad: Subscribe to entire store**
```typescript
const ConversationItem = ({ conversationId }: Props) => {
  const store = useMessagesStore() // Re-renders on ANY store change
  const lastMessage = store.messages[conversationId]?.at(-1)
  
  return <div>{lastMessage?.body}</div>
}
```

**✅ Good: Selective subscription**
```typescript
const ConversationItem = ({ conversationId }: Props) => {
  // Only re-renders when this conversation's messages change
  const lastMessage = useMessagesStore(
    (state) => state.messages[conversationId]?.at(-1),
    shallow // Shallow comparison
  )
  
  return <div>{lastMessage?.body}</div>
}
```

**✅ Better: Custom equality function**
```typescript
const ConversationItem = ({ conversationId }: Props) => {
  const lastMessage = useMessagesStore(
    (state) => state.messages[conversationId]?.at(-1),
    (prev, next) => prev?.id === next?.id // Only re-render if message ID changes
  )
  
  return <div>{lastMessage?.body}</div>
}
```

### 4. Lazy Load Components

**Problem:** Large bundle size increases initial load time.

**Solution: Code splitting with React.lazy**
```typescript
// Lazy load heavy components
const SettingsModal = lazy(() => import('./components/SettingsModal'))
const CallWindow = lazy(() => import('./components/CallWindow'))

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsModal />} />
        <Route path="/call" element={<CallWindow />} />
      </Routes>
    </Suspense>
  )
}
```

**Route-based code splitting:**
```typescript
import { lazy } from '@tanstack/react-router'

const router = createRouter({
  routes: [
    {
      path: '/chat',
      component: lazy(() => import('./pages/ChatPage'))
    },
    {
      path: '/settings',
      component: lazy(() => import('./pages/SettingsPage'))
    }
  ]
})
```

---

## Network Performance

### 1. Optimize API Calls

**Problem:** Too many redundant API calls.

**Solution A: TanStack Query caching**
```typescript
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => api.get(`/users/${userId}`).then(r => r.data),
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  cacheTime: 10 * 60 * 1000 // Keep in memory for 10 minutes
})
```

**Solution B: Request deduplication**
```typescript
// TanStack Query automatically deduplicates concurrent requests
// Multiple components calling same query = single network request

const Component1 = () => {
  const { data } = useQuery({ queryKey: ['users'], ... })
}

const Component2 = () => {
  const { data } = useQuery({ queryKey: ['users'], ... }) // No duplicate request!
}
```

**Solution C: Pagination**
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['messages', conversationId],
  queryFn: ({ pageParam = 0 }) => 
    api.get(`/conversations/${conversationId}/messages`, {
      params: { limit: 50, offset: pageParam }
    }),
  getNextPageParam: (lastPage, pages) => {
    return lastPage.hasMore ? pages.length * 50 : undefined
  }
})
```

### 2. Optimize WebSocket Messages

**Problem:** Too many WebSocket events causing lag.

**Solution A: Message batching**
```typescript
class MessageBatcher {
  private queue: Message[] = []
  private timeout: NodeJS.Timeout | null = null

  add(message: Message) {
    this.queue.push(message)
    
    if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), 100) // Batch for 100ms
    }
  }

  private flush() {
    if (this.queue.length > 0) {
      useMessagesStore.getState().addMessages(this.queue)
      this.queue = []
    }
    this.timeout = null
  }
}

const batcher = new MessageBatcher()

// In WebSocket handler
wsService.on('new_message', (message) => {
  batcher.add(message) // Batched update
})
```

**Solution B: Throttle typing indicators**
```typescript
import { throttle } from 'lodash-es'

const sendTypingIndicator = throttle((conversationId: string) => {
  wsService.send('typing:start', { conversationId })
}, 2000) // Max once per 2 seconds
```

### 3. Image Optimization

**Problem:** Large images slow down message rendering.

**Solution A: Lazy load images**
```typescript
const MessageImage = ({ src }: Props) => {
  return (
    <img
      src={src}
      loading="lazy" // Browser native lazy loading
      decoding="async"
      alt="Attachment"
    />
  )
}
```

**Solution B: Use thumbnails**
```typescript
const MessageImage = ({ attachmentId }: Props) => {
  const [highRes, setHighRes] = useState(false)
  
  const thumbnailUrl = `${API_URL}/attachments/${attachmentId}/thumbnail`
  const fullUrl = `${API_URL}/attachments/${attachmentId}`
  
  return (
    <img
      src={highRes ? fullUrl : thumbnailUrl}
      onClick={() => setHighRes(true)}
      alt="Attachment"
    />
  )
}
```

**Solution C: Image compression (backend)**
```typescript
// Backend should compress images on upload
// - Resize to max 1920x1080
// - Generate 200x200 thumbnail
// - Use WebP format
// - Quality: 85%
```

---

## Memory Management

### 1. Limit Stored Messages

**Problem:** Storing unlimited messages causes memory leak.

**Solution: Ring buffer / sliding window**
```typescript
interface MessagesState {
  messages: Record<string, Message[]>
  addMessage: (conversationId: string, message: Message) => void
}

const MAX_MESSAGES_PER_CONVERSATION = 100

export const useMessagesStore = create<MessagesState>((set) => ({
  messages: {},
  
  addMessage: (conversationId, message) => set((state) => {
    const existing = state.messages[conversationId] || []
    const updated = [...existing, message]
    
    // Keep only last N messages
    const trimmed = updated.slice(-MAX_MESSAGES_PER_CONVERSATION)
    
    return {
      messages: {
        ...state.messages,
        [conversationId]: trimmed
      }
    }
  })
}))
```

### 2. Cleanup Event Listeners

**Problem:** Event listeners not removed cause memory leaks.

**Solution: Always cleanup in useEffect**
```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    console.log(event.data)
  }
  
  window.addEventListener('message', handleMessage)
  
  return () => {
    window.removeEventListener('message', handleMessage) // Cleanup!
  }
}, [])
```

### 3. Revoke Object URLs

**Problem:** Blob URLs not revoked stay in memory.

**Solution:**
```typescript
useEffect(() => {
  const objectUrl = URL.createObjectURL(blob)
  
  return () => {
    URL.revokeObjectURL(objectUrl) // Free memory
  }
}, [blob])
```

---

## Build Optimization

### 1. Bundle Size Analysis

**Analyze bundle:**
```bash
npm run build
npx vite-bundle-visualizer
```

**Reduce bundle size:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate large libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['@tanstack/react-router'],
          'vendor-query': ['@tanstack/react-query'],
          'livekit': ['livekit-client']
        }
      }
    }
  }
})
```

### 2. Tree Shaking

**Import only what you need:**
```typescript
// ❌ Bad: Imports entire library
import _ from 'lodash'
_.debounce(fn, 300)

// ✅ Good: Imports only debounce
import { debounce } from 'lodash-es'
debounce(fn, 300)

// ✅ Better: Use native or small alternative
import { useDebouncedCallback } from 'use-debounce'
```

### 3. Minification

**Vite automatically minifies in production:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log
        drop_debugger: true
      }
    }
  }
})
```

---

## Database Performance (Backend Reference)

### 1. Indexing

```sql
-- Index frequently queried columns
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- Composite index for common query
CREATE INDEX idx_messages_conv_created ON messages(conversation_id, created_at DESC);
```

### 2. Query Optimization

```sql
-- ❌ Bad: N+1 query
SELECT * FROM messages WHERE conversation_id = ?;
-- Then for each message:
SELECT * FROM users WHERE id = ?;

-- ✅ Good: Join
SELECT m.*, u.display_name, u.avatar_key
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.conversation_id = ?
ORDER BY m.created_at DESC
LIMIT 50;
```

### 3. Pagination

```sql
-- Use offset-based pagination for small datasets
SELECT * FROM messages
WHERE conversation_id = ?
ORDER BY created_at DESC
LIMIT 50 OFFSET 0;

-- Use cursor-based pagination for large datasets
SELECT * FROM messages
WHERE conversation_id = ?
  AND created_at < ? -- cursor
ORDER BY created_at DESC
LIMIT 50;
```

---

## Monitoring Performance

### 1. React DevTools Profiler

**Steps:**
1. Install React DevTools extension
2. Open Components tab → Profiler
3. Click record
4. Perform actions in app
5. Stop recording
6. Analyze flame graph

**Look for:**
- Components taking >16ms to render (causes dropped frames at 60fps)
- Frequent re-renders
- Large component trees

### 2. Chrome Performance Tab

**Steps:**
1. Open DevTools → Performance tab
2. Click record
3. Perform actions
4. Stop recording
5. Analyze timeline

**Look for:**
- Long tasks (>50ms)
- Layout thrashing
- Memory leaks
- Network waterfalls

### 3. Lighthouse Audit

**Run Lighthouse:**
```bash
# Install
npm install -g lighthouse

# Run audit
lighthouse http://localhost:5173 --view

# Or use Chrome DevTools → Lighthouse tab
```

**Optimize scores:**
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >80

---

## Performance Checklist

### Development
- [ ] Use React DevTools to identify slow components
- [ ] Memoize expensive components and calculations
- [ ] Use selective Zustand subscriptions
- [ ] Virtualize long lists
- [ ] Lazy load routes and heavy components

### Network
- [ ] Enable TanStack Query caching
- [ ] Use pagination for large datasets
- [ ] Compress images on backend
- [ ] Batch WebSocket updates
- [ ] Implement request deduplication

### Memory
- [ ] Limit stored messages per conversation
- [ ] Cleanup event listeners in useEffect
- [ ] Revoke object URLs after use
- [ ] Monitor memory usage in DevTools

### Build
- [ ] Analyze bundle size with visualizer
- [ ] Split large libraries into separate chunks
- [ ] Remove unused code (tree shaking)
- [ ] Minify and compress production build
- [ ] Remove console.log in production

---

## Performance Targets

**Initial Load:**
- Time to Interactive (TTI): <3s
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s

**Runtime:**
- 60 FPS scrolling (16ms per frame)
- Message send latency: <200ms
- WebSocket reconnect: <1s

**Memory:**
- Heap size: <200MB (desktop)
- Heap size: <100MB (mobile)
- No memory leaks over 1 hour of usage

**Bundle:**
- Initial JS bundle: <500KB (gzipped)
- Total bundle: <2MB (gzipped)
- Code split: <200KB per route

---

*Monitor performance regularly and optimize based on real-world usage data.*
