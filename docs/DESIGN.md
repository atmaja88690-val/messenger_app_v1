# Design Specifications
## BSI Messenger - UI/UX Design Document

**Version:** 1.0.0  
**Last Updated:** August 10, 2026  
**Status:** Reference Implementation Complete

---

## Design Philosophy

### Core Principles

**1. Simplicity**
- Clean, uncluttered interface
- Essential features prominently placed
- Advanced features accessible but not overwhelming

**2. Familiarity**
- Follow platform conventions (Windows, macOS, Android)
- Use recognizable messaging patterns
- Minimize learning curve

**3. Responsiveness**
- Instant feedback for all actions
- Optimistic UI updates
- Loading states for async operations

**4. Accessibility**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- High contrast support

**5. Consistency**
- Unified design language across platforms
- Predictable interaction patterns
- Consistent spacing and typography

---

## Design System

### Color Palette

#### Primary Colors
```css
/* Blue - Primary action color */
--primary-50:  #eff6ff   /* Lightest */
--primary-100: #dbeafe
--primary-200: #bfdbfe
--primary-300: #93c5fd
--primary-400: #60a5fa
--primary-500: #3b82f6   /* Main brand color */
--primary-600: #2563eb
--primary-700: #1d4ed8
--primary-800: #1e40af
--primary-900: #1e3a8a   /* Darkest */
```

#### Neutral Colors
```css
/* Gray - UI elements */
--gray-50:  #f9fafb   /* Backgrounds */
--gray-100: #f3f4f6
--gray-200: #e5e7eb   /* Borders */
--gray-300: #d1d5db
--gray-400: #9ca3af   /* Disabled text */
--gray-500: #6b7280   /* Secondary text */
--gray-600: #4b5563
--gray-700: #374151   /* Body text */
--gray-800: #1f2937
--gray-900: #111827   /* Headings */
```

#### Semantic Colors
```css
/* Success */
--success-500: #10b981
--success-600: #059669

/* Error */
--error-500: #ef4444
--error-600: #dc2626

/* Warning */
--warning-500: #f59e0b
--warning-600: #d97706

/* Info */
--info-500: #3b82f6
--info-600: #2563eb
```

#### Status Colors
```css
/* Online/Available */
--status-online: #10b981

/* Away */
--status-away: #f59e0b

/* DND */
--status-dnd: #ef4444

/* Offline */
--status-offline: #6b7280
```

### Typography

#### Font Family
```css
--font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

#### Font Sizes
```css
--text-xs:   0.75rem   /* 12px - Timestamps, captions */
--text-sm:   0.875rem  /* 14px - Secondary text */
--text-base: 1rem      /* 16px - Body text */
--text-lg:   1.125rem  /* 18px - Emphasis */
--text-xl:   1.25rem   /* 20px - Titles */
--text-2xl:  1.5rem    /* 24px - Headings */
--text-3xl:  1.875rem  /* 30px - Page titles */
```

#### Font Weights
```css
--font-normal:  400
--font-medium:  500
--font-semibold: 600
--font-bold:    700
```

#### Line Heights
```css
--leading-tight:  1.25
--leading-normal: 1.5
--leading-relaxed: 1.625
```

### Spacing Scale

```css
--space-1:  0.25rem   /* 4px */
--space-2:  0.5rem    /* 8px */
--space-3:  0.75rem   /* 12px */
--space-4:  1rem      /* 16px */
--space-5:  1.25rem   /* 20px */
--space-6:  1.5rem    /* 24px */
--space-8:  2rem      /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
```

### Border Radius

```css
--radius-sm:   0.25rem  /* 4px - Buttons, inputs */
--radius-md:   0.5rem   /* 8px - Cards */
--radius-lg:   0.75rem  /* 12px - Modals */
--radius-xl:   1rem     /* 16px - Large cards */
--radius-full: 9999px   /* Circular - Avatars */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

## Layout Structure

### Desktop Layout (Electron)

```
┌─────────────────────────────────────────────────────────┐
│  Title Bar (Windows) / Menu Bar (macOS)                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┬────────────────┬────────────────────────┐ │
│  │          │                │                        │ │
│  │ Sidebar  │ Conversation   │     Chat Area          │ │
│  │ (260px)  │ List (320px)   │     (flexible)         │ │
│  │          │                │                        │ │
│  │ - User   │ - Search       │ - Header               │ │
│  │ - Status │ - Filter       │ - Messages             │ │
│  │ - New    │ - Conv List    │ - Input                │ │
│  │          │                │                        │ │
│  └──────────┴────────────────┴────────────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘

Minimum Width: 900px
Minimum Height: 600px
```

### Mobile Layout (Android)

```
┌─────────────────┐
│  Status Bar     │
├─────────────────┤
│  App Bar        │
│  [≡] Title [⋮]  │
├─────────────────┤
│                 │
│  Content Area   │
│                 │
│  (Full Width)   │
│                 │
│                 │
│                 │
│                 │
├─────────────────┤
│  Bottom Nav     │  (Optional)
│  [Chat] [Calls] │
└─────────────────┘

Full Screen
Safe Area Aware
```

---

## Component Specifications

### 1. Sidebar (Desktop Only)

**Dimensions:** 260px width × full height  
**Background:** `--gray-50`  
**Border:** 1px right border `--gray-200`

**Contents:**
```
┌─────────────────────┐
│                     │
│  [User Avatar]      │  48×48px circular
│  Display Name       │  text-base, font-semibold
│  @username          │  text-sm, gray-500
│  [Status Dropdown]  │  Available ▼
│                     │
├─────────────────────┤
│                     │
│  [+ New Chat]       │  Primary button
│                     │
├─────────────────────┤
│                     │
│  Navigation         │
│  ☰ All Messages     │  Active: bg-primary-100
│  📞 Calls           │  Hover: bg-gray-100
│  ⚙️ Settings        │
│                     │
└─────────────────────┘
```

**Interactions:**
- Status dropdown opens menu with: Available, Away, DND, Offline
- New Chat button opens user search modal
- Navigation items highlight on hover and active state

---

### 2. Conversation List

**Dimensions:** 320px width × full height  
**Background:** White  
**Border:** 1px right border `--gray-200`

**Structure:**
```
┌────────────────────────────┐
│  Search Conversations      │  Input with search icon
│  [🔍 ___________________]  │
├────────────────────────────┤
│                            │
│  ┌────────────────────┐   │
│  │ [Avatar] Name      │   │  height: 72px
│  │          Last msg  │   │  padding: 12px
│  │          2:30 PM  [3] │ │  Unread badge
│  └────────────────────┘   │
│                            │
│  ┌────────────────────┐   │  Active: bg-primary-50
│  │ [Avatar] Name      │   │  Hover: bg-gray-50
│  │          Last msg  │   │
│  │          Yesterday    │ │
│  └────────────────────┘   │
│                            │
│  ...more conversations     │
│                            │
└────────────────────────────┘
```

**Conversation Item:**
- Avatar: 48×48px, circular
- Name: text-base, font-semibold, truncate
- Last Message: text-sm, gray-600, truncate
- Timestamp: text-xs, gray-400, right-aligned
- Unread Badge: circular, bg-primary-500, white text

**States:**
- Default: White background
- Hover: bg-gray-50
- Active: bg-primary-50, blue left border (4px)
- Unread: font-semibold for name

---

### 3. Chat Header

**Height:** 64px  
**Background:** White  
**Border:** 1px bottom border `--gray-200`

**Structure:**
```
┌──────────────────────────────────────────────────────┐
│  [←] [Avatar] Conversation Name          [📞] [📹] [⋮] │
│              2 members • Last seen 5m ago              │
└──────────────────────────────────────────────────────┘
```

**Elements:**
- Back button (mobile only): 40×40px touch target
- Avatar: 40×40px circular (group: stacked avatars)
- Title: text-lg, font-semibold
- Subtitle: text-sm, gray-500 (member count, last seen)
- Actions: Voice call, Video call, More menu (40×40px each)

**Mobile Adaptation:**
- Show back button
- Compress subtitle on small screens
- Move more actions to overflow menu

---

### 4. Message List

**Background:** White or `--gray-50`  
**Padding:** 16px horizontal

**Message Types:**

#### Text Message (Own)
```
                              ┌─────────────────────────┐
                              │ Hello! How are you?     │
                              │ 2:30 PM ✓✓              │
                              └─────────────────────────┘
```
- Alignment: Right
- Background: `--primary-500`
- Text Color: White
- Max Width: 70%
- Border Radius: 16px (top-left), 4px (top-right), 16px (bottom)
- Timestamp: text-xs, opacity-80
- Read Receipt: Double checkmark (gray=delivered, blue=read)

#### Text Message (Other)
```
  ┌─────────────────────────┐
  │ I'm doing great!        │
  │ 2:31 PM                 │
  └─────────────────────────┘
```
- Alignment: Left
- Background: `--gray-100`
- Text Color: `--gray-900`
- Max Width: 70%
- Border Radius: 4px (top-left), 16px (top-right), 16px (bottom)

#### System Message
```
           ─── John joined the conversation ───
```
- Alignment: Center
- Text: text-sm, gray-500, italic
- No background

#### Image Attachment
```
  ┌─────────────────────────┐
  │ ┌───────────────────┐   │
  │ │                   │   │
  │ │   [Image]         │   │  Max 300×300px
  │ │                   │   │  Rounded corners
  │ └───────────────────┘   │
  │ Filename.jpg 2:45 PM    │
  └─────────────────────────┘
```
- Image: Click to open lightbox
- Lazy loading for off-screen images
- Thumbnail: 200×200px max, maintain aspect ratio

#### File Attachment
```
  ┌─────────────────────────┐
  │ 📄 Document.pdf         │
  │    1.2 MB               │
  │    [Download] 2:45 PM   │
  └─────────────────────────┘
```
- Icon based on file type
- File name: truncate if too long
- File size: human-readable format
- Download button/link

#### Reply Message
```
  ┌─────────────────────────┐
  │ ┌─ Alice: Hello!        │  Quote in gray box
  │ Hi Alice! 👋            │  Reply text below
  │ 2:35 PM                 │
  └─────────────────────────┘
```
- Quote: bg-gray-100, left border-primary-500, italic
- Clicking quote scrolls to original message

**Message Grouping:**
- Group consecutive messages from same sender
- Show avatar only for first message in group
- Reduce spacing between grouped messages (4px vs 12px)

**Date Separators:**
```
              ──── Today ────
              ──── Yesterday ────
              ──── Monday, Aug 5 ────
```
- Sticky header when scrolling
- text-sm, gray-500, centered

**Typing Indicator:**
```
  ┌─────────────────────────┐
  │ Alice is typing...      │
  │ ● ● ●                   │  Animated dots
  └─────────────────────────┘
```
- Animated: dots bounce up/down
- Shows for 2 seconds after last typing event

---

### 5. Message Input

**Height:** Variable (min 56px, max 200px)  
**Background:** White  
**Border:** 1px top border `--gray-200`

**Structure:**
```
┌──────────────────────────────────────────────────────┐
│ [📎] [___________________________________] [😊] [Send] │
│       Multi-line textarea (auto-expand)               │
└──────────────────────────────────────────────────────┘
```

**Elements:**
- Attach button: 40×40px, gray-600
  - Opens file picker
  - Shows upload progress bar when uploading
- Textarea: 
  - Placeholder: "Type a message..."
  - Auto-expand on new lines (max 5 lines)
  - Shift+Enter: New line
  - Enter: Send message
- Emoji button: 40×40px, gray-600
  - Opens emoji picker popover
- Send button: 40×40px, primary-500
  - Disabled when empty
  - Animated: Press effect

**File Upload Preview:**
```
┌──────────────────────────────────────────────────────┐
│ ┌────────────────────────────────┐ [×]               │
│ │ 📷 IMG_1234.jpg (2.4 MB)       │ Remove button    │
│ │ ████████████░░░░░░░ 75%        │ Progress bar     │
│ └────────────────────────────────┘                   │
├──────────────────────────────────────────────────────┤
│ [📎] [Add caption..._______________] [😊] [Send]     │
└──────────────────────────────────────────────────────┘
```

---

### 6. Avatar Component

**Sizes:**
- xs: 24×24px (inline mentions)
- sm: 32×32px (message list)
- md: 40×40px (header, conversation list)
- lg: 48×48px (sidebar, profile)
- xl: 64×64px (profile modal)
- 2xl: 96×96px (settings page)

**Variants:**

#### With Image
```css
.avatar {
  border-radius: 50%;
  object-fit: cover;
}
```

#### Fallback (Initials)
```
┌───┐
│ JD │  Background: primary-500
└───┘  Text: white, font-semibold
```
- Show first 2 initials of display name
- Background colors rotate based on user ID

#### Group Avatar (Stacked)
```
  ┌───┬───┐
  │ A │ B │  2 avatars side-by-side
  └───┴───┘
```
- Max 4 avatars shown
- "+3" indicator for more members

#### Status Indicator
```
┌───┐
│   │●  Green dot = Online
└───┘   Position: bottom-right, 25%
```
- Online: green-500
- Away: yellow-500
- DND: red-500
- Offline: No indicator

---

### 7. Button Component

**Variants:**

#### Primary
```css
background: primary-500
color: white
hover: primary-600
active: primary-700
padding: 8px 16px
border-radius: 6px
font-weight: 500
```

#### Secondary
```css
background: gray-200
color: gray-900
hover: gray-300
```

#### Outline
```css
background: transparent
border: 1px solid gray-300
color: gray-700
hover: bg-gray-50
```

#### Ghost
```css
background: transparent
color: gray-700
hover: bg-gray-100
```

#### Icon Button
```css
width: 40px
height: 40px
border-radius: 50%
padding: 0
display: flex
align-items: center
justify-content: center
```

**States:**
- Default
- Hover: Slight darken
- Active: More darken
- Disabled: opacity-50, cursor-not-allowed
- Loading: Spinner inside button

**Sizes:**
- sm: height 32px, text-sm
- md: height 40px, text-base
- lg: height 48px, text-lg

---

### 8. Modal/Dialog

**Structure:**
```
┌────────────────────────────────┐
│  ×  Modal Title                │  Header: 56px height
├────────────────────────────────┤
│                                │
│  Modal Content                 │  Body: scrollable
│  ...                           │  Max-height: 80vh
│                                │
├────────────────────────────────┤
│  [Cancel]  [Confirm]           │  Footer: 64px height
└────────────────────────────────┘
```

**Backdrop:**
- Background: rgba(0, 0, 0, 0.5)
- Click to close (optional)

**Animation:**
- Enter: Fade in + scale from 0.95 to 1
- Exit: Fade out + scale to 0.95
- Duration: 200ms

**Sizes:**
- sm: max-width 400px
- md: max-width 600px
- lg: max-width 800px
- xl: max-width 1200px
- full: width 100% - 32px

---

### 9. Dropdown Menu

**Structure:**
```
┌─────────────────────┐
│ ✓ Available         │  Checkmark if selected
│   Away              │
│   Do Not Disturb    │
│ ──────────────────  │  Divider
│   Logout            │  Destructive action (red)
└─────────────────────┘
```

**Styling:**
- Background: White
- Border: 1px gray-200
- Shadow: shadow-lg
- Border Radius: 8px
- Item Padding: 8px 12px
- Item Hover: bg-gray-100
- Item Active: bg-primary-50

**Animation:**
- Enter: Fade in + slide down 8px
- Exit: Fade out
- Duration: 150ms

---

### 10. Toast Notification

**Positions:** Top-right (desktop), Top (mobile)

**Types:**

#### Success
```
┌──────────────────────────────┐
│ ✓ Message sent successfully  │  Green icon + text
└──────────────────────────────┘
```

#### Error
```
┌──────────────────────────────┐
│ ✗ Failed to send message     │  Red icon + text
└──────────────────────────────┘
```

#### Info
```
┌──────────────────────────────┐
│ ℹ Connection restored        │  Blue icon + text
└──────────────────────────────┘
```

**Styling:**
- Background: White
- Border: 1px with semantic color
- Shadow: shadow-lg
- Icon: 20×20px, semantic color
- Auto-dismiss: 3 seconds (error: 5 seconds)
- Close button: Optional

**Animation:**
- Enter: Slide in from right (desktop) or top (mobile)
- Exit: Fade out
- Max visible: 3 toasts stacked

---

## Interaction Patterns

### Sending a Message

1. User types in input field
2. "Send" button activates (blue)
3. User presses Enter or clicks Send
4. Message appears immediately (optimistic UI)
5. Show sending indicator (single gray checkmark)
6. Server responds → Update to delivered (double gray checkmark)
7. Recipient reads → Update to read (double blue checkmark)

### Receiving a Message

1. Message arrives via WebSocket
2. If in conversation: Message appends to list
3. If not in conversation: Unread badge updates
4. Desktop notification (if app in background)
5. Mobile push notification (if app closed)
6. Auto-scroll to bottom (if already at bottom)

### Editing a Message

1. User hovers over own message → Show actions menu
2. User clicks "Edit"
3. Message content loads into input field
4. User modifies and presses Enter
5. Message updates with "(edited)" tag
6. All clients see updated message

### Starting a Call

1. User clicks call button (voice/video)
2. Show connecting animation
3. Send call invite to recipient
4. Recipient sees incoming call modal
5. If accepted: Open call window
6. WebRTC connection established
7. Show call UI with controls

---

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 639px) {
  /* Single-pane layout */
  /* Full-width conversation or list */
}

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) {
  /* Two-pane layout */
  /* Conversation list + Chat area */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Three-pane layout */
  /* Sidebar + List + Chat */
}
```

---

## Accessibility Requirements

### Keyboard Navigation

**Tab Order:**
1. Sidebar navigation
2. Conversation list search
3. Conversation items (↑↓ to navigate)
4. Chat header actions
5. Message list (Page Up/Down to scroll)
6. Message input
7. Send button

**Keyboard Shortcuts:**
- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + N` - New conversation
- `Ctrl/Cmd + /` - Show shortcuts
- `Esc` - Close modal/dropdown
- `Enter` - Send message
- `Shift + Enter` - New line
- `↑` in empty input - Edit last message

### Screen Reader Support

**Landmarks:**
```html
<nav aria-label="Main navigation">
<main aria-label="Chat messages">
<form aria-label="Send message">
```

**Live Regions:**
```html
<div role="log" aria-live="polite" aria-atomic="false">
  <!-- New messages announced -->
</div>

<div role="status" aria-live="polite">
  <!-- Typing indicators, status updates -->
</div>
```

**ARIA Labels:**
- All buttons: `aria-label` or visible text
- Icons: `aria-label="Send message"`
- Avatar: `alt="John Doe"`
- Links: Descriptive text

### Focus Management

- Focus visible: 2px blue outline
- Focus trap in modals
- Return focus after modal close
- Skip to content link

### Color Contrast

- Text: Min 4.5:1 ratio (AA)
- Large text: Min 3:1 ratio
- UI components: Min 3:1 ratio
- Status indicators: Not rely on color alone (use icons)

---

## Dark Mode (Future)

**Color Palette:**
```css
--bg-primary: #1f2937
--bg-secondary: #111827
--text-primary: #f9fafb
--text-secondary: #9ca3af
--border: #374151
```

**Implementation:**
```css
@media (prefers-color-scheme: dark) {
  /* Dark theme variables */
}

[data-theme="dark"] {
  /* Manual dark theme */
}
```

---

## Animation Guidelines

### Timing
- Quick: 150ms (hover, focus)
- Normal: 200ms (modals, dropdowns)
- Slow: 300ms (page transitions)

### Easing
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Platform-Specific Adaptations

### Windows
- Use Segoe UI font
- Window controls: top-right
- Scrollbar: Always visible
- Context menu: Right-click

### macOS
- Use San Francisco font
- Traffic lights: top-left
- Scrollbar: Auto-hide
- Menu bar integration

### Android
- Material Design guidelines
- Bottom navigation (optional)
- Floating action button for new chat
- Swipe gestures (back, delete)
- Ripple effects on touch

---

## Error States

### Empty States

#### No Conversations
```
┌────────────────────────┐
│                        │
│    💬                  │
│                        │
│  No conversations yet  │
│  Start chatting now!   │
│                        │
│  [+ New Chat]          │
│                        │
└────────────────────────┘
```

#### No Messages in Conversation
```
┌────────────────────────┐
│                        │
│    👋                  │
│                        │
│  Say hello to Alice!   │
│                        │
└────────────────────────┘
```

### Error States

#### Network Error
```
┌────────────────────────┐
│    ⚠️                   │
│  Connection lost       │
│  Reconnecting...       │
│  [Retry]               │
└────────────────────────┘
```

#### Message Failed
```
┌─────────────────────────┐
│ Message failed to send  │ Red border
│ [Retry] [Delete]        │
└─────────────────────────┘
```

---

## Loading States

### Skeleton Screens

#### Conversation List Loading
```
┌────────────────────────┐
│ ░░░░ ░░░░░░░░         │
│      ░░░░░░░░░        │
│                        │
│ ░░░░ ░░░░░░░░         │
│      ░░░░░░░░░        │
│                        │
│ ░░░░ ░░░░░░░░         │
│      ░░░░░░░░░        │
└────────────────────────┘
```

#### Message Loading
```
┌─────────────────────────┐
│  ░░░░░░░░░░             │
│  ░░░░░░░░░░░░░          │
│                         │
│         ░░░░░░░░░░      │
│          ░░░░░░░░       │
└─────────────────────────┘
```

### Spinners

- Size: 24px (inline), 48px (full-page)
- Color: primary-500
- Animation: Rotate 360deg, 1s linear infinite

---

## Design Checklist

### For Every New Component

- [ ] Follows design system colors
- [ ] Uses design system spacing
- [ ] Typography matches scale
- [ ] Responsive on all screen sizes
- [ ] Keyboard accessible
- [ ] Screen reader friendly
- [ ] Has focus indicator
- [ ] Color contrast meets WCAG AA
- [ ] Has loading state
- [ ] Has error state
- [ ] Has empty state
- [ ] Animations respect prefers-reduced-motion
- [ ] Works in dark mode (future)
- [ ] Touch targets min 44×44px (mobile)
- [ ] Consistent with existing components

---

## Resources

### Design Tools
- Figma: [Design file link]
- Color palette: [Coolors link]
- Icons: Heroicons, Lucide Icons
- Fonts: Inter (Google Fonts)

### References
- [Material Design](https://material.io)
- [Apple HIG](https://developer.apple.com/design/)
- [Microsoft Fluent](https://www.microsoft.com/design/fluent/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

*This design specification ensures consistency and quality across BSI Messenger. Follow these guidelines when implementing new features.*
