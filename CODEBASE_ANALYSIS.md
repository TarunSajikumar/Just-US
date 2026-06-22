# JustUs React Native + TypeScript Codebase Analysis

**Analysis Date:** June 22, 2026  
**Codebase:** Full-stack React Native + Express.js + MongoDB  
**Database:** MongoDB (Mongoose ODM)  
**Real-time:** Socket.io

---

## 1. DATABASE SCHEMA STRUCTURE

### Core User & Relationship Models

#### **User Model** ([backend/src/models/User.ts](backend/src/models/User.ts))
```
Fields:
- email (unique, lowercase, indexed)
- phone (unique, optional)
- name
- password (select: false - not returned by default)
- email_verified (boolean)
- birthday (Date)
- gender (String)
- relationship_status: "none" | "couple" (default: "none")
- relationship_mode: "NONE" | "SOLO" | "COUPLE" (default: "NONE")
- invite_code (String, nullable)
- partner_id (ObjectId, ref: User)
- couple_id (String)
- partnerNickname (default: "")
- partnerPingMessage (default: "I miss you, where are you? ❤️")
- fcmToken (Firebase Cloud Messaging token)
- isOnline (boolean, default: false)
- lastSeen (Date)
- lastHeartbeat (Date)
- notificationsEnabled (boolean)
- preferences:
  - language (default: 'en')
  - fontSize: 'small' | 'medium' | 'large'
  - quickLoveNotifications (boolean)
- quickLoveDefaultMessage (default: "I Love You ❤️")
- timestamps (createdAt, updatedAt)
```

#### **Couple Model** ([backend/src/models/Couple.ts](backend/src/models/Couple.ts))
```
Fields:
- users (array of ObjectId, ref: User)
- relationshipStartDate (Date, default: now)
- coupleFeatureStatus: "pending" | "active" | "declined" | null
- coupleFeatureRequester (ObjectId, ref: User)
- connectionLevel (Number, default: 75)
- timestamps (createdAt, updatedAt)
```

#### **PendingUser Model** ([backend/src/models/PendingUser.ts](backend/src/models/PendingUser.ts))
```
Fields:
- email (unique, lowercase, trimmed)
- name (required)
- password (nullable, set after email verification)
- otp (required)
- otpExpiresAt (Date, required)
- email_verified (boolean, default: false)
- timestamps
- TTL Index: Auto-deletes after 1 hour if not verified
```

#### **OTP Model** ([backend/src/models/Otp.ts](backend/src/models/Otp.ts))
```
Fields:
- contact (unique - email or phone)
- code (String)
- expiresAt (Date)
- timestamps
```

### Communication Models

#### **Message Model** ([backend/src/models/Message.ts](backend/src/models/Message.ts))
```
Fields:
- sender_id (ObjectId, ref: User, required)
- receiver_id (ObjectId, ref: User)
- couple_id (ObjectId, ref: Couple)
- message (String, required)
- read (boolean, default: false)
- status: 'sent' | 'delivered' | 'read' (default: 'sent')
- media_url (String, nullable)
- media_type: 'photo' | 'video' | 'audio' | 'document' | null
- reaction (String - emoji, nullable)
- reply_to (String, nullable)
- is_voice (boolean)
- voice_duration (Number in ms)
- is_pinned (boolean)
- is_saved_by (array of ObjectId, ref: User)
- is_edited (boolean)
- deleted_by (array of ObjectId, ref: User)
- timestamps (createdAt, updatedAt)
- Index: { sender_id: 1, receiver_id: 1, createdAt: -1 }
```

#### **Memory Model** ([backend/src/models/Memory.ts](backend/src/models/Memory.ts))
```
Fields:
- couple_id (ObjectId, ref: Couple, required)
- image_url (String, required)
- caption (String, optional)
- timestamps
```

### Couple-Specific Features

#### **Mood Model** ([backend/src/models/Mood.ts](backend/src/models/Mood.ts))
```
Fields:
- userId (ObjectId, ref: User, required)
- coupleId (ObjectId, ref: Couple, required)
- mood (String, required)
- emoji (String, optional)
- timestamps
```

#### **Goal Model** ([backend/src/models/Goal.ts](backend/src/models/Goal.ts))
```
Fields:
- coupleId (ObjectId, ref: Couple, required)
- createdBy (ObjectId, ref: User, required)
- title (String, max 200 chars, required)
- emoji (String, default: "🎯")
- target (Number, required, min: 1)
- current (Number, default: 0)
- completed (boolean, default: false)
- completedAt (Date, optional)
- timestamps
```

#### **Poll Model** ([backend/src/models/Poll.ts](backend/src/models/Poll.ts))
```
Fields:
- coupleId (ObjectId, ref: Couple, required)
- createdBy (ObjectId, ref: User, required)
- question (String, max 300 chars, required)
- options (array of Strings)
- votes (Record<string, number> - { userId: optionIndex })
- endsAt (Date, required)
- expired (boolean, default: false)
- timestamps
```

#### **Note Model** ([backend/src/models/Note.ts](backend/src/models/Note.ts))
```
Fields:
- userId (ObjectId, ref: User, required)
- coupleId (ObjectId, ref: Couple, required)
- content (String, required)
- timestamps
```

#### **Event Model** ([backend/src/models/Event.ts](backend/src/models/Event.ts))
```
Fields:
- coupleId (ObjectId, ref: Couple, required)
- createdBy (ObjectId, ref: User, required)
- title (String, max 200 chars, required)
- eventDate (Date, required)
- eventType: "anniversary" | "trip" | "date" | "milestone" | "custom"
- emoji (String, default: "📅")
- timestamps
- Index: { coupleId: 1, eventDate: 1 }
```

#### **Activity Model** ([backend/src/models/Activity.ts](backend/src/models/Activity.ts))
```
Fields:
- coupleId (ObjectId, ref: Couple, required)
- actorId (ObjectId, ref: User, required)
- actionType (enum):
  - goal_created
  - goal_updated
  - goal_completed
  - poll_created
  - poll_voted
  - mood_updated
  - love_note_sent
  - memory_added
  - timeline_added
  - miss_you_ping
- details (Record<string, any>)
- timestamps
- Index: { coupleId: 1, createdAt: -1 }
```

#### **TimelineEvent Model** ([backend/src/models/TimelineEvent.ts](backend/src/models/TimelineEvent.ts))
```
Fields:
- couple_id (ObjectId, ref: Couple, required)
- created_by (ObjectId, ref: User, required)
- title (String, max 80 chars, required)
- description (String, max 300 chars)
- date (Date, required)
- type: "milestone" | "memory" | "date" | "custom"
- timestamps
- Index: { couple_id: 1, date: -1 }
```

#### **Achievement Model** ([backend/src/models/Achievement.ts](backend/src/models/Achievement.ts))
```
Fields:
- coupleId (ObjectId, ref: Couple, required)
- code (enum):
  - FIRST_CONNECTION
  - FIRST_MEMORY
  - FIRST_NOTE
  - 100_DAYS
  - 365_DAYS
- unlockedAt (Date, default: now)
- timestamps
- Unique Index: { coupleId: 1, code: 1 }
```

#### **QuickLoveMessage Model** ([backend/src/models/QuickLoveMessage.ts](backend/src/models/QuickLoveMessage.ts))
```
Fields:
- couple_id (ObjectId, ref: Couple, required)
- text (String, required)
- emoji (String, default: "💕")
- sender_id (ObjectId, ref: User, required)
- timestamps
```

#### **CoupleQuestion Model** ([backend/src/models/CoupleQuestion.ts](backend/src/models/CoupleQuestion.ts))
```
Fields:
- coupleId (ObjectId, ref: Couple, required, indexed)
- senderId (ObjectId, ref: User, required)
- question (String, required)
- answer (String, default: "")
- answeredAt (Date, default: null)
- timestamps
```

#### **CouplePosition Model** ([backend/src/models/CouplePosition.ts](backend/src/models/CouplePosition.ts))
```
Fields:
- coupleId (ObjectId, ref: Couple, required)
- positionId (String, required)
- favorites (array of ObjectId, ref: User)
- wantToTry (array of ObjectId, ref: User)
- tried (array of ObjectId, ref: User)
- notes (String, default: "")
- timestamps
- Unique Index: { coupleId: 1, positionId: 1 }

Predefined Positions (10 total):
- spoon, lotus, standing, bridge, face_to_face, fusion, missionary, cowgirl, acrobat, crouching_tiger
- Each with: id, name, difficulty, energyLevel, category
```

#### **CoupleIdea Model** ([backend/src/models/CoupleIdea.ts](backend/src/models/CoupleIdea.ts))
```
Fields:
- coupleId (ObjectId, ref: Couple, required)
- ideaId (String, required)
- likes (array of ObjectId, ref: User)
- isCompleted (boolean, default: false)
- timestamps
- Unique Index: { coupleId: 1, ideaId: 1 }

Predefined Ideas (5 total):
- cook_dinner, star_gazing, museum_date, movie_marathon, diy_spa
- Each with: id, title, desc
```

#### **CoupleChallenge Model** ([backend/src/models/CoupleChallenge.ts](backend/src/models/CoupleChallenge.ts))
```
Fields:
- coupleId (ObjectId, ref: Couple, required)
- challengeId (String, required)
- isCompleted (boolean, default: false)
- completedAt (Date, nullable)
- timestamps
- Unique Index: { coupleId: 1, challengeId: 1 }

Predefined Challenges (5 total):
- no_phones, love_letters, compliment_day, try_something_new, stare_deeply
- Each with: id, title, desc
```

#### **WishlistItem Model** ([backend/src/models/WishlistItem.ts](backend/src/models/WishlistItem.ts))
```
Fields:
- coupleId (ObjectId, ref: Couple, required, indexed)
- userId (ObjectId, ref: User, required)
- title (String, required)
- notes (String, default: "")
- isCompleted (boolean, default: false)
- timestamps
```

#### **Invite Model** ([backend/src/models/Invite.ts](backend/src/models/Invite.ts))
```
Fields:
- code (String, unique, required) - 6-char alphanumeric
- created_by (ObjectId, ref: User, required)
- used_by (ObjectId, ref: User)
- status: "pending" | "used" | "cancelled"
- expires_at (Date) - 24 hours from creation
- timestamps
```

---

## 2. BACKEND ARCHITECTURE

### Server Configuration

**Port:** 5000 (configurable via `PORT` env var)  
**CORS:** Allow all origins during development  
**Database:** MongoDB (Mongoose)  
**Real-time:** Socket.io with WebSocket transport  

**Socket.io Config:**
- `pingInterval: 10000` (10 seconds)
- `pingTimeout: 5000` (5 seconds)
- CORS origin: "*"

### Main Routes Structure

[backend/src/app.ts](backend/src/app.ts)

**API Endpoints Organization:**

| Route Prefix | Module | Description |
|---|---|---|
| `/api/auth` | Authentication | signup, login, password reset, profile |
| `/api/chat` | Chat | legacy chat routes |
| `/api/messages` | Messages | message CRUD, reactions, search, pin/save |
| `/api/invite` | Invite System | create/join couple invitations |
| `/api/couple` | Couple Features | relationship settings, quick love, positions, ideas, challenges, questions |
| `/api/users` | User Settings | partner nickname, ping message, FCM token, preferences |
| `/api/notifications` | Notifications | miss-you ping, intimate questions, date ideas |
| `/api/memories` | Memories | photo memories CRUD |
| `/api/moods` | Mood Tracking | mood logging and history |
| `/api/goals` | Goals | couple goals/habits CRUD |
| `/api/polls` | Polls | create, vote, delete polls |
| `/api/notes` | Notes | love notes between partners |
| `/api/timeline` | Timeline | relationship timeline events |
| `/api/achievements` | Achievements | unlock and view achievements |
| `/api/activities` | Activities | activity feed |
| `/api/events` | Events | relationship events |
| `/api/dashboard` | Dashboard | dashboard data aggregation |

### Middleware

**Auth Middleware** ([backend/src/middleware/auth.middleware.ts](backend/src/middleware/auth.middleware.ts))
- Validates JWT token from `Authorization: Bearer <token>` header
- Extracts `userId` from decoded token
- Returns 401 if token missing or invalid
- Attaches `req.userId` and `req.user` to request

**Upload Middleware** ([backend/src/middleware/uploadMiddleware.ts](backend/src/middleware/uploadMiddleware.ts))
- File upload handling (likely using Multer + Cloudinary)

**CORS Middleware**
- Allows all origins and credentials
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Limit: 10MB for JSON and URL-encoded bodies

### Health Check Endpoints

**`GET /`** - Returns server status with DB connection status  
**`GET /health`** - Returns health status (healthy/unhealthy based on DB)

---

## 3. SOCKET.IO REAL-TIME COMMUNICATION

### Socket Setup

[backend/src/sockets/chatSocket.ts](backend/src/sockets/chatSocket.ts)

**Authentication:**
- Token passed via `socket.handshake.auth.token`
- JWT verified on connection
- Disconnects immediately if token invalid/missing

**Room Structure:**
```
- User joins personal room: socket.join(userId)
- Chat room deterministic: roomId(userId1, userId2) = sorted users joined by "-"
  Example: "60d5ec49c12345...-60d5ec49c67890..." (always same regardless of connection order)
```

### Socket Events Implemented

#### **Connection & Status Events**

| Event | Emitted By | Payload | Purpose |
|---|---|---|---|
| `connect` | Server | - | User connects with valid token |
| `disconnect` | Server | - | User disconnects (updates lastSeen, notifies partner) |
| `user_status_change` | Server | `{ userId, status: "online"/"offline", lastSeen }` | Broadcast online/offline status to partner |
| `user-online` | Client | `userId` | Explicit mark as online |
| `client_heartbeat` | Client | `{ ts: timestamp }` | Keep-alive ping (updates lastHeartbeat) |

#### **Chat & Messaging Events**

| Event | Emitted By | Payload | Purpose |
|---|---|---|---|
| `join_room` | Client | `partnerId` | Join deterministic couple chat room |
| `send_message` | Client | `{ receiverId, message: {...} }` | Send text message via socket (also persisted via REST) |
| `send_media` | Client | `{ receiverId, mediaMessage: {...} }` | Send media message (file persisted via REST first) |
| `message` | Server | Message object | Broadcast received message to room |
| `delete_message` | Client | `{ messageId }` | Delete message (sender only) |
| `message_deleted` | Server | `{ messageId }` | Broadcast deletion to room |
| `message_reaction` | Client | `{ messageId, reaction: emoji }` | Add/remove reaction to message |
| `message_reaction` | Server | `{ messageId, reaction }` | Broadcast reaction change to room |
| `messages_read` | Server | `{ readerId }` | Broadcast when messages marked read |
| `typing` | Client | `{ partnerId, isTyping: boolean }` | Typing indicator |
| `user_typing` | Server | `{ userId, isTyping }` | Broadcast typing status to room |

#### **Relationship Events**

| Event | Emitted By | Payload | Purpose |
|---|---|---|---|
| `quick_love_sent` | Client | `{ message }` | Send quick love message |
| `quick_love_received` | Server | `{ message }` | Broadcast quick love to partner |
| `profile_updated` | Client | `{ userId, name?, gender?, birthday? }` | Notify partner of profile changes |
| `profile_updated` | Server | Same payload | Broadcast profile update to couple room |
| `relationship_dates_updated` | Server | `{ relationshipStartDate }` | Broadcast relationship date change to couple room |
| `partner_connected` | Server | `{ coupleId, partnerId }` | Notify user their partner connected via invite |

### Socket Implementation Details

**Heartbeat System:**
- Server sends ping every 10 seconds
- Server expects pong within 5 seconds
- Client can send explicit `client_heartbeat` to update `lastHeartbeat`
- Used to keep presence accurate

**Message Status Flow:**
1. REST POST creates message with `status: 'sent'`
2. If receiver is in room at creation time → `status: 'delivered'`
3. When receiver retrieves → `status: 'read'`
4. Socket event `messages_read` broadcast when any mark-read happens

**Disconnect Handling:**
- Checks if user still has other active socket connections
- If no other connections → set `isOnline: false`, `lastSeen: now`
- Notify partner via `user_status_change` event

---

## 4. AUTHENTICATION FLOW

### Signup Flow (3-Step Process)

**Step 1: POST `/api/auth/signup`**
```
Request: { name, email }
Response: { message: "OTP sent to email..." }

Server Actions:
1. Validate email format and check if user already exists
2. Generate 6-digit OTP
3. Create/update PendingUser record with:
   - email, name, otp
   - otpExpiresAt: now + 10 minutes
   - email_verified: false
4. Send OTP via email (BREVO SMTP)
```

**Step 2: POST `/api/auth/verify-email-otp`**
```
Request: { email, otp }
Response: { success: true, message: "Email verified successfully" }

Server Actions:
1. Find PendingUser by email
2. Verify OTP matches and not expired
3. Set email_verified: true on PendingUser
```

**Step 3: POST `/api/auth/register`**
```
Request: { email, password }
Response: { success, token, user: fullProfile }

Server Actions:
1. Verify email was verified via OTP
2. Hash password with bcryptjs
3. Create User record
4. Delete PendingUser
5. Generate JWT token (30-day expiration)
6. Return token + full profile (including partner, relationshipStartDate, anniversaryDate)
```

### Login Flow

**POST `/api/auth/login`**
```
Request: { email, password }
Response: { success, token, user: fullProfile }

Server Actions:
1. Find User by email (must include password field)
2. Compare password with bcrypt
3. Generate JWT token (30-day expiration)
4. Return token + full profile
```

### Password Reset Flow (3-Step Process)

**Step 1: POST `/api/auth/forgot-password`**
```
Request: { email }
Response: { message: "Reset OTP sent to email" }

Server Actions:
1. Find User by email
2. Generate 6-digit OTP
3. Save to Otp collection with 10-minute expiration
4. Send OTP email
```

**Step 2: POST `/api/auth/verify-reset-otp`**
```
Request: { email, otp }
Response: { success, message: "OTP verified successfully" }

Server Actions:
1. Find Otp record by email
2. Verify code and expiration
```

**Step 3: POST `/api/auth/reset-password`**
```
Request: { email, newPassword }
Response: { success, message: "Password reset successfully" }

Server Actions:
1. Hash new password
2. Update User.password
3. Delete Otp record
```

### JWT Token Details

**Token Payload:**
```
{ userId: "60d5ec49c..." }
```

**Signing Algorithm:** HS256  
**Expiration:** 30 days  
**Secret:** `JWT_SECRET` env var

**Storage (Mobile):**
- Native platforms (iOS/Android): Secure Store (encryption on device)
- Web: AsyncStorage (localStorage)
- Key: `userToken`

---

## 5. FRONTEND STATE MANAGEMENT

### Zustand Store Structure

[mobile-app/src/store/authStore.ts](mobile-app/src/store/authStore.ts)

**Store Name:** `useAuthStore` (Zustand)

**State:**
```typescript
{
  token: string | null;
  user: any | null;
  partner: any | null;
  relationshipMode: 'SOLO' | 'COUPLE' | 'NONE';
  relationshipStartDate: string | null;
  partnerNickname: string;
  partnerPingMessage: string;
  notificationsEnabled: boolean;
}
```

**Actions:**
```
setToken(token)
setUser(user)
setPartner(partner)
setRelationshipMode(mode)
setRelationshipStartDate(date)
setPartnerNickname(nickname)
setPartnerPingMessage(message)
setNotificationsEnabled(enabled)
refreshUser() → calls authService.me()
logout() → clears all state + calls socket disconnect
```

**Persistence:**
- Uses Zustand's `persist` middleware
- Stores to AsyncStorage on mobile, localStorage on web
- Key: `authStore` (auto-generated by Zustand)

**Important Note:**
> The single source of truth for all relationship date calculations is `relationshipStartDate`.  
> Anniversary date is NEVER stored — it is always derived dynamically using utility functions in `src/utils/relationshipUtils.ts`.

---

## 6. FRONTEND SERVICES & API CLIENTS

### HTTP Client Setup

[mobile-app/src/services/http.ts](mobile-app/src/services/http.ts)

**Base URL Resolution (Priority Order):**
1. `EXPO_PUBLIC_API_URL_DEV` (if configured and not localhost)
2. For Emulator:
   - Android: `http://10.0.2.2:5000/api`
   - iOS: `http://localhost:5000/api`
3. For Physical Device:
   - Android: `http://localhost:5000/api` (via ADB reverse tunnel)
4. Dynamic from Expo CLI hostUri
5. Environment variable fallback or `http://192.168.100.82:5000/api`

**Request Timeout:** 30 seconds

**Request Interceptor:**
- Adds `Authorization: Bearer <token>` header from secure storage

**Response Interceptor:**
- Handles 401: Logs out user, clears token
- Logs all requests/responses with status codes

[mobile-app/src/services/api.ts](mobile-app/src/services/api.ts)
- Re-exports `http` as `api`
- Handles auth interceptor setup and logout logic

### Service Layer

**All Services Follow Pattern:**
```
import { api } from './api';

export const serviceX = {
  methodName: async (params) => {
    const response = await api.method('/endpoint', data);
    return response.data;
  },
};
```

**Available Services:**

| Service | File | Key Methods |
|---|---|---|
| **Auth** | `authService.ts` | signup, verifyEmailOtp, register, login, forgotPassword, verifyResetOtp, resetPassword, updateProfile, me, logout |
| **Chat** | `chatService.ts` | getMessages, markRead |
| **User** | `userService.ts` | updatePartnerNickname, updatePingMessage, updateFcmToken, updateNotificationSettings, getPreferences, updatePreferences, exportUserData |
| **Invite** | `inviteService.ts` | create, join |
| **Memory** | `memoryService.ts` | getMemories, createMemory |
| **Message** | `messageService.ts` | getMessages, markRead, sendMessage, deleteMessage, createMessage, addReaction, etc. |
| **Activity** | `activityService.ts` | getActivities |
| **Achievement** | `achievementService.ts` | getAchievements |
| **Mood** | `moodService.ts` | saveMood, getPartnerMood, getMyMood, getMoodHistory |
| **Goal** | `goalService.ts` | getGoals, createGoal, updateProgress, deleteGoal |
| **Poll** | `pollService.ts` | getPolls, createPoll, votePoll, deletePoll |
| **Note** | `noteService.ts` | saveNote, getPartnerNote, getAllNotes |
| **Timeline** | `timelineService.ts` | getTimelineEvents, createTimelineEvent, deleteTimelineEvent |
| **Event** | `eventService.ts` | getEvents, createEvent, deleteEvent |
| **Socket** | `socket.ts` | connect, disconnect, on, emit, listen to events |

### Socket Service

[mobile-app/src/services/socket.ts](mobile-app/src/services/socket.ts)

**Class:** `SocketService`

**Key Methods:**
```
async connect(): Promise<Socket | null>
disconnect(): void
startHeartbeat(intervalMs = 10000): void
on(event, callback): void
emit(event, data): void
off(event): void
```

**Features:**
- Lazy initialization (connects on first use)
- Automatic reconnection with exponential backoff
- App state listener: 
  - On app active → reconnect if disconnected
  - On app background/inactive → disconnect
- Heartbeat interval (default 10 seconds)
- Deduplicates concurrent connection attempts

**Connection Options:**
```
{
  auth: { token },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
}
```

### Storage Service

[mobile-app/src/services/storageService.ts](mobile-app/src/services/storageService.ts)

**Cross-Platform Storage:**
- Native (iOS/Android): Uses `expo-secure-store` (encrypted)
- Web: Uses `AsyncStorage`

**Methods:**
```
getItem(key): Promise<string | null>
setItem(key, value): Promise<void>
deleteItem(key): Promise<void>
```

**Auth Data Storage:**
From `authStore.ts`:
```
saveAuthData(token, user):
  - storageService.setItem('userToken', token)
  - AsyncStorage.setItem('userData', JSON.stringify(user))

clearAuthData():
  - storageService.deleteItem('userToken')
  - AsyncStorage.removeItem('userData')
```

---

## 7. API ENDPOINTS SUMMARY

### Authentication Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Start signup (send OTP) |
| POST | `/api/auth/verify-email-otp` | No | Verify email OTP |
| POST | `/api/auth/register` | No | Create account with password |
| POST | `/api/auth/login` | No | Login with email/password |
| POST | `/api/auth/forgot-password` | No | Start password reset (send OTP) |
| POST | `/api/auth/verify-reset-otp` | No | Verify reset OTP |
| POST | `/api/auth/reset-password` | No | Update password |
| GET | `/api/auth/me` | Yes | Get current user profile |
| PUT | `/api/auth/profile` | Yes | Update profile (name, birthday, gender) |
| GET | `/api/auth/test-email` | No | Test email sending (dev only) |

### Messages Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/messages/:partnerId` | Yes | Get chat history with partner |
| POST | `/api/messages` | Yes | Create text message |
| PATCH | `/api/messages/:partnerId/read` | Yes | Mark all messages from partner as read |
| DELETE | `/api/messages/:messageId` | Yes | Delete message (sender only) |
| POST | `/api/messages/:messageId/reaction` | Yes | Add/remove emoji reaction |
| POST | `/api/messages/media` | Yes | Upload and send media message |
| POST | `/api/messages/:messageId/pin` | Yes | Pin message |
| DELETE | `/api/messages/pin/:messageId` | Yes | Unpin message |
| POST | `/api/messages/:messageId/save` | Yes | Save message |
| DELETE | `/api/messages/save/:messageId` | Yes | Unsave message |
| PUT | `/api/messages/:messageId` | Yes | Edit message |
| POST | `/api/messages/:messageId/delete-for-me` | Yes | Delete for self only |
| POST | `/api/messages/:messageId/forward` | Yes | Forward message |
| GET | `/api/messages/search` | Yes | Search messages |
| GET | `/api/messages/pinned/:partnerId` | Yes | Get pinned messages with partner |
| GET | `/api/messages/saved/:partnerId` | Yes | Get saved messages with partner |
| GET | `/api/messages/unread/:partnerId` | Yes | Get unread message count |

### Couple Feature Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/couple/profile` | Yes | Get couple profile + relationship date |
| PUT | `/api/couple/relationship-date` | Yes | Update relationship start date |
| GET | `/api/couple/settings` | Yes | Get couple feature settings |
| POST | `/api/couple/request-feature` | Yes | Request couple feature activation |
| POST | `/api/couple/accept-feature` | Yes | Accept feature request |
| POST | `/api/couple/decline-feature` | Yes | Decline feature request |
| POST | `/api/couple/disable-feature` | Yes | Disable couple feature |
| GET | `/api/couple/quick-love-messages` | Yes | Get quick love message templates |
| POST | `/api/couple/quick-love-messages` | Yes | Add quick love message |
| DELETE | `/api/couple/quick-love-messages/:id` | Yes | Delete quick love message |
| GET | `/api/couple/connection-level` | Yes | Get connection level (0-100) |
| POST | `/api/couple/connection-level` | Yes | Update connection level |
| GET | `/api/couple/questions` | Yes | Get couple questions |
| POST | `/api/couple/questions/send` | Yes | Send question to partner |
| POST | `/api/couple/questions/answer` | Yes | Answer partner's question |
| GET | `/api/couple/wishlist` | Yes | Get couple wishlist |
| POST | `/api/couple/wishlist` | Yes | Add wishlist item |
| PUT | `/api/couple/wishlist/:id` | Yes | Update wishlist item |
| DELETE | `/api/couple/wishlist/:id` | Yes | Delete wishlist item |
| GET | `/api/couple/positions` | Yes | Get position statuses (favorites, tried, want to try) |
| POST | `/api/couple/positions/:positionId/status` | Yes | Update position status |
| GET | `/api/couple/ideas` | Yes | Get date ideas with like/complete status |
| POST | `/api/couple/ideas/:ideaId/like` | Yes | Toggle like on date idea |
| POST | `/api/couple/ideas/:ideaId/complete` | Yes | Toggle completion on date idea |
| GET | `/api/couple/challenges` | Yes | Get couple challenges |
| POST | `/api/couple/challenges/:challengeId/complete` | Yes | Toggle challenge completion |

### User Settings Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/users/partner-status` | Yes | Get partner online status |
| PUT | `/api/users/partner-nickname` | Yes | Set partner's nickname |
| PUT | `/api/users/ping-message` | Yes | Set "miss you" ping message |
| PUT | `/api/users/fcm-token` | Yes | Update Firebase Cloud Messaging token |
| PUT | `/api/users/notifications` | Yes | Enable/disable notifications |
| GET | `/api/users/preferences` | Yes | Get language/fontSize preferences |
| PUT | `/api/users/preferences` | Yes | Update preferences |
| GET | `/api/users/export` | Yes | Export all user data (GDPR) |
| POST | `/api/users/reset-status` | Yes | Reset relationship status |
| GET | `/api/users/settings/quick-love-default` | Yes | Get default quick love message |
| POST | `/api/users/settings/quick-love-default` | Yes | Save default quick love message |

### Invite System Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/invite/create` | Yes | Generate 6-char invite code (24h expiry) |
| POST | `/api/invite/join` | Yes | Join couple using invite code |

### Memories Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/memories/:coupleId` | Yes | Get all couple memories |
| POST | `/api/memories` | Yes | Add memory photo |

### Moods Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/moods` | Yes | Save current mood |
| GET | `/api/moods/partner` | Yes | Get partner's latest mood |
| GET | `/api/moods/me` | Yes | Get own latest mood |
| GET | `/api/moods/history` | Yes | Get mood history |

### Goals Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/goals` | Yes | Get couple goals |
| POST | `/api/goals` | Yes | Create goal |
| PATCH | `/api/goals/:id/progress` | Yes | Update goal progress |
| DELETE | `/api/goals/:id` | Yes | Delete goal |

### Polls Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/polls` | Yes | Get couple polls |
| POST | `/api/polls` | Yes | Create poll |
| POST | `/api/polls/:id/vote` | Yes | Vote on poll |
| DELETE | `/api/polls/:id` | Yes | Delete poll |

### Notes Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/notes` | Yes | Save love note |
| GET | `/api/notes/partner` | Yes | Get partner's latest note |
| GET | `/api/notes` | Yes | Get all notes |

### Timeline Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/timeline/:coupleId` | Yes | Get timeline events |
| POST | `/api/timeline` | Yes | Create timeline event |
| DELETE | `/api/timeline/:eventId` | Yes | Delete timeline event |

### Events Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/events` | Yes | Get upcoming events |
| POST | `/api/events` | Yes | Create event |
| DELETE | `/api/events/:id` | Yes | Delete event |

### Activity Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/activities` | Yes | Get activity feed |

### Achievement Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/achievements` | Yes | Get unlocked achievements |

### Notification Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/notifications/miss-you` | Yes | Send miss-you ping |
| POST | `/api/notifications/intimate-question` | Yes | Send intimate question |
| POST | `/api/notifications/date-idea` | Yes | Send date idea |
| POST | `/api/notifications/question-answer` | Yes | Send question answer |

### Chat Legacy Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/chat/messages/:partnerId` | Yes | Get chat history (legacy) |
| PATCH | `/api/chat/messages/:partnerId/read` | Yes | Mark read (legacy) |
| POST | `/api/chat/mute/:partnerId` | Yes | Mute chat (legacy) |

### Dashboard Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/dashboard` | Yes | Get dashboard aggregated data |

---

## 8. ERROR HANDLING

### Backend Error Handling

**Global Error Handler** ([backend/src/app.ts](backend/src/app.ts))
```typescript
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Unhandled Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

**404 Handler**
```typescript
app.use((req, res) => {
  res.status(404).json({ 
    message: "Endpoint not found",
    path: req.path,
    method: req.method 
  });
});
```

**Auth Errors:**
- 401 Unauthorized (missing/invalid token)
- 404 Not Found (when accessing /auth/me with bad token)

**Validation Errors:**
- 400 Bad Request (invalid input, missing required fields)

**Database Errors:**
- 500 Internal Server Error (with details in dev mode)

**OTP/Email Errors:**
- Signup still returns 200 even if email fails (informative message provided)
- Reset still returns 200 even if email fails

### Frontend Error Handling

**HTTP Interceptor** ([mobile-app/src/services/http.ts](mobile-app/src/services/http.ts))
```
- 401: Deletes token, shows notification
- Any error: Logs error details to console
- Network errors: Logs "NO RESPONSE"
```

**Auth Store Error Recovery** ([mobile-app/src/store/authStore.ts](mobile-app/src/store/authStore.ts))
```
- Lazy imports prevent circular dependencies
- refreshUser() called to sync state
- Socket disconnect on logout
```

**Socket Error Handling** ([mobile-app/src/services/socket.ts](mobile-app/src/services/socket.ts))
```
- Connection failures: Automatic exponential backoff reconnect
- App state listener: Handles background/foreground transitions
- Heartbeat failures: Continue attempting connection
```

**Try-Catch Patterns:**
- All async service methods wrapped in try-catch
- Errors logged to console with context
- User-friendly error messages in UI

---

## 9. EXISTING IMPLEMENTED FEATURES

### ✅ Couple Connection
- User A generates 6-char invite code (24h expiry)
- User B joins with code
- Creates Couple record, links partner_id, sets relationship_status to "couple"
- Emits `partner_connected` socket event

### ✅ Real-time Chat
- Text messages with status tracking (sent → delivered → read)
- Media messages (photo, video, audio, document)
- Voice messages with duration
- Message reactions (emoji)
- Reply functionality
- Message editing
- Message deletion (sender only)
- Message pinning/unpinning
- Message saving/unsaving
- Message search
- Typing indicators
- Message read receipts

### ✅ User Presence
- Online/offline status
- Last seen timestamp
- Heartbeat system (10 second interval)
- App state aware (disconnect on background)

### ✅ Quick Love Feature
- Predefined quick love message templates
- Send quick love via socket with instant delivery
- Default quick love message customizable

### ✅ Memories
- Store couple photos with captions
- Indexed by couple_id for fast retrieval

### ✅ Moods
- Log daily mood with emoji
- View partner's current mood
- Mood history tracking

### ✅ Goals/Habits
- Create couple goals with target and progress
- Track progress incrementally
- Mark as complete
- Activity logged when completed

### ✅ Love Notes
- Write and save love notes
- Notes belong to couple
- View partner's notes

### ✅ Timeline
- Create relationship milestones (memory, date, milestone, custom)
- Sort by date
- Track important dates in relationship

### ✅ Events
- Create upcoming events (anniversary, trip, date, milestone, custom)
- Track with dates
- Emoji for visual distinction

### ✅ Polls
- Create couple polls with options
- Vote on polls
- View vote counts
- Track which user voted for what

### ✅ Achievements
- Unlock badges:
  - FIRST_CONNECTION (when couple formed)
  - FIRST_MEMORY
  - FIRST_NOTE
  - 100_DAYS
  - 365_DAYS
- View unlocked achievements

### ✅ Activity Feed
- Log actions: goal_created, goal_completed, poll_created, poll_voted, mood_updated, love_note_sent, memory_added, timeline_added, miss_you_ping
- Activity history with timestamps

### ✅ Preferences
- Language selection (default: 'en')
- Font size (small, medium, large)
- Quick love notifications toggle
- Notification enable/disable

### ✅ Intimate Features (Couple+)
- **Positions:** 10 predefined intimate positions with difficulty/energy level ratings
  - Users can mark: favorites, want to try, tried
  - Add personal notes
- **Date Ideas:** 5 predefined romantic ideas
  - Users can like and mark as completed
- **Challenges:** 5 predefined couple challenges
  - Users can mark completed with timestamp
- **Questions:** Send and answer intimate questions
- **Wishes/Wishlist:** Items users want their partner to gift them
- **Connection Level:** 0-100 connection score

### ✅ Couple Feature Management
- Request couple feature activation
- Accept/decline feature requests
- Disable couple feature

### ✅ Authentication
- Email-based signup with OTP verification
- Email/password login
- Password reset with OTP
- JWT tokens (30-day expiration)
- Secure token storage

### ✅ Push Notifications
- FCM token storage
- Support for miss-you pings
- Intimate questions notifications
- Date idea notifications

### ✅ User Data Export (GDPR)
- Export all user data endpoint

---

## 10. MISSING/INCOMPLETE FEATURES

### ❌ Not Found in Codebase
- **Gender Tracking:** Field exists in User model but minimal usage
- **Period Tracker:** No models or endpoints for menstrual cycle tracking
- **App Lock/Security:** No mention of biometric or PIN-based app lock
- **Relationship Questionnaire:** CoupleQuestion model exists but limited implementation
- **Dark Mode:** No theme configuration found
- **Offline Support:** No offline-first sync mechanism
- **Two-Factor Authentication:** Only OTP for signup/reset, no 2FA for login
- **User Blocking:** No user blocking functionality
- **Rate Limiting:** No rate limiting on endpoints
- **Data Backup:** No automatic backup mechanism
- **Relationship Insights:** No analytics dashboard
- **Couple Collaboration:** Limited collaborative features beyond shared data
- **Video Calls:** No video/audio calling feature
- **Message Search:** Endpoint exists but may have limited UI implementation

---

## 11. FILE LOCATION MAPPING

### Backend Structure
```
backend/
├── src/
│   ├── server.ts                    # Entry point, Socket.io setup
│   ├── app.ts                       # Express app with all routes
│   ├── config/
│   │   ├── db.ts                    # MongoDB connection
│   │   └── env.ts                   # Environment config
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT validation
│   │   └── uploadMiddleware.ts      # File upload handler
│   ├── models/                      # Mongoose schemas (21 files)
│   ├── controllers/                 # Route handlers (16+ files)
│   ├── routes/                      # Express routers (17 files)
│   ├── services/
│   │   ├── achievement.service.ts
│   │   └── otp.service.ts
│   ├── sockets/
│   │   ├── index.ts                 # Socket store/getter
│   │   └── chatSocket.ts            # Socket event handlers
│   ├── modules/
│   │   └── auth/
│   │       └── mail.service.ts      # BREVO SMTP email sending
│   └── utils/
│       ├── seeder.ts                # Demo data seeding
│       └── logger.ts
├── package.json
└── tsconfig.json
```

### Mobile App Structure
```
mobile-app/
├── src/
│   ├── store/
│   │   └── authStore.ts             # Zustand auth state
│   ├── services/
│   │   ├── authService.ts           # Auth API calls
│   │   ├── api.ts                   # Axios with interceptors
│   │   ├── http.ts                  # HTTP client config
│   │   ├── socket.ts                # Socket.io client
│   │   ├── storageService.ts        # Cross-platform storage
│   │   └── [feature]Service.ts      # Feature-specific services (18 files)
│   ├── components/                  # React components
│   ├── screens/                     # Screen components
│   ├── navigation/                  # React Navigation
│   ├── hooks/                       # Custom React hooks
│   ├── types/                       # TypeScript types
│   ├── constants/                   # App constants
│   ├── utils/                       # Utilities
│   ├── lib/                         # Libraries
│   ├── theme/                       # Theme config
│   └── assets/                      # Images, icons
├── App.tsx                          # App entry
├── package.json
└── tsconfig.json
```

---

## 12. KEY DEPENDENCIES

### Backend Dependencies
```
mongoose: ^9.6.3                # MongoDB ODM
express: ^5.2.1                 # Web framework
socket.io: ^4.8.3               # Real-time communication
jsonwebtoken: ^9.0.3            # JWT tokens
bcryptjs: ^2.4.3                # Password hashing
@sendgrid/mail: ^8.1.3          # Email sending
firebase-admin: ^13.10.0        # Push notifications
multer: ^1.4.5-lts.1           # File uploads
cloudinary: ^1.41.3             # Image CDN
nodemailer: ^8.0.9              # Email alternative
twilio: ^4.6.0                  # SMS alternative
otp-generator: ^4.0.1           # OTP generation
cors: ^2.8.6                    # CORS middleware
dotenv: ^17.4.2                 # Environment variables
```

### Frontend Dependencies
```
react-native: 0.85.3            # Mobile framework
expo: ~56.0.12                  # React Native tools
zustand: ^5.0.3                 # State management
socket.io-client: ^4.8.1        # Socket.io client
axios: ^1.7.9                   # HTTP client
@react-navigation/*: 7.x        # Navigation
@react-native-async-storage: ^2.2.0  # Storage
expo-secure-store: ~56.0.4      # Secure storage
expo-notifications: ~56.0.18    # Notifications
@react-native-firebase/*: ^24.0.0   # Firebase
nativewind: ^2.0.11             # Tailwind for RN
```

---

## 13. KEY ARCHITECTURAL PATTERNS

### Database Patterns
1. **Relationship Management:** Uses ObjectId references with `ref` field for Mongoose population
2. **Denormalization:** Some data (partnerNickname, partnerPingMessage) stored on User for quick access
3. **TTL Indexes:** PendingUser auto-deletes after 1 hour
4. **Unique Indexes:** Prevent duplicates on critical fields
5. **Sorting Indexes:** Compound indexes for common queries

### API Patterns
1. **REST for CRUD:** Standard HTTP methods for create/read/update/delete
2. **WebSocket for Real-time:** Chat, presence, notifications
3. **Hybrid:** Message creation via REST (persistent), broadcast via Socket
4. **Auth Pattern:** Bearer token in Authorization header
5. **Response Format:** Consistent JSON with `success`, `message`, `data`

### State Management Patterns
1. **Single Store:** useAuthStore as source of truth for user data
2. **Lazy Imports:** Prevent circular dependencies
3. **Async Persistence:** Store data to disk on change
4. **Derived State:** Anniversary calculated from relationshipStartDate

### Error Handling Patterns
1. **Try-catch wrapping:** All async operations
2. **Console logging:** Detailed error context in dev
3. **User-friendly messages:** Generic messages in production
4. **Graceful degradation:** Features work even if non-critical requests fail

---

## 14. CURRENT TECHNOLOGY STACK SUMMARY

| Layer | Technology | Version |
|---|---|---|
| **Backend Runtime** | Node.js + TypeScript | Latest |
| **Web Framework** | Express.js | 5.2.1 |
| **Database** | MongoDB | (via Atlas) |
| **Database ORM** | Mongoose | 9.6.3 |
| **Real-time** | Socket.io | 4.8.3 |
| **Authentication** | JWT | 9.0.3 |
| **Password Hashing** | bcryptjs | 2.4.3 |
| **Email Sending** | BREVO SMTP (via nodemailer/sendgrid) | Latest |
| **Push Notifications** | Firebase Cloud Messaging | 13.10.0 |
| **File Upload** | Multer + Cloudinary | Latest |
| **Mobile Framework** | React Native + Expo | RN 0.85.3, Expo 56.0 |
| **State Management** | Zustand | 5.0.3 |
| **HTTP Client** | Axios | 1.7.9 |
| **Navigation** | React Navigation | 7.x |
| **Secure Storage** | expo-secure-store | 56.0.4 |
| **Type System** | TypeScript | 6.0.3 |
| **UI Framework** | NativeWind (Tailwind) | 2.0.11 |

---

## 15. DEPLOYMENT CONSIDERATIONS

### Environment Variables Needed
**Backend (.env):**
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<secret-key>
NODE_ENV=production
PORT=5000
BREVO_API_KEY=<key>
SENDGRID_API_KEY=<key> (optional)
FIREBASE_ADMIN_SDK=<json>
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud>
```

**Mobile (.env or eas.json):**
```
EXPO_PUBLIC_API_URL=https://api.justus.com/api
EXPO_PUBLIC_API_URL_DEV=http://localhost:5000/api
```

### Known Issues / Edge Cases
1. **Email Delivery:** Test endpoint available at `/api/auth/test-email`
2. **Android Emulator:** Must use `10.0.2.2` loopback IP
3. **Physical Device:** Requires ADB reverse tunnel or network discovery
4. **Cold Start:** Render free tier can take 30-60 seconds (timeout set to 30s)
5. **Socket Heartbeat:** Client can timeout if no heartbeat response

---

**End of Analysis**
