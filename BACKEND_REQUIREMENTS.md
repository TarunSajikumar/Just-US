# 🔧 Backend Requirements - Home Screen 2.0

## API Endpoints Required

### Partner Status
```
GET /api/users/partner-status
Response: {
  isOnline: boolean,
  lastSeen: ISO8601 string | null,
  lastActiveTime?: number (ms)
}
```

### Couple Settings
```
GET /api/couple/settings
Response: {
  coupleModeSetting: 'normal' | 'couple+',
  coupleStatusFromPartner: 'pending' | 'active' | 'declined' | null,
  coupleStatusFromMe: 'pending' | 'active' | 'declined' | null
}

POST /api/couple/request-feature
Body: {}
Response: { success: boolean, status: 'pending' }

POST /api/couple/accept-feature
Body: {}
Response: { success: boolean, status: 'active' }

POST /api/couple/decline-feature
Body: {}
Response: { success: boolean, status: 'declined' }

POST /api/couple/disable-feature
Body: {}
Response: { success: boolean, status: null }
```

### Connection Level (Couple+)
```
GET /api/couple/connection-level
Response: { level: number } // 0-100

POST /api/couple/connection-level
Body: { level: number }
Response: { success: boolean, level: number }
```

### Quick Love Messages
```
POST /api/messages/quick-love
Body: { message: string }
Response: { success: boolean }

Socket Event: quick_love_received
Payload: { message: string, userId: string }
```

### Couple Questions (Couple+)
```
GET /api/couple/questions
Response: [
  { id: string, text: string },
  ...
]

POST /api/couple/questions/send
Body: { question: string }
Response: { success: boolean }

Socket Event: couple_question_received
Payload: { question: string }
```

---

## Database Schema Changes

### Users Table - Add Columns
```sql
ALTER TABLE users ADD COLUMN quick_love_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN couple_feature_enabled BOOLEAN DEFAULT false;
```

### New Table: CoupleSettings
```sql
CREATE TABLE couple_settings (
  id UUID PRIMARY KEY,
  user_a_id UUID REFERENCES users(id),
  user_b_id UUID REFERENCES users(id),
  
  status_from_a 'pending' | 'active' | 'declined' | null,
  status_from_b 'pending' | 'active' | 'declined' | null,
  
  connection_level INT DEFAULT 75,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  UNIQUE(user_a_id, user_b_id)
);
```

### New Table: QuickLoveMessages
```sql
CREATE TABLE quick_love_messages (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP
);
```

### New Table: CoupleQuestions
```sql
CREATE TABLE couple_questions (
  id UUID PRIMARY KEY,
  couple_id UUID REFERENCES couple_settings(id),
  sender_id UUID REFERENCES users(id),
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## Socket.io Events (Real-Time)

### Server Emits

#### Partner Status
```typescript
socket.emit('partner_status_updated', {
  isOnline: boolean,
  lastSeen: string | null
});
```

#### Mood Changes
```typescript
socket.emit('partner_mood_updated', {
  mood: string,
  emoji: string
});
```

#### Love Notes
```typescript
socket.emit('partner_note_added', {
  content: string,
  createdAt: string
});
```

#### Quick Love Messages
```typescript
socket.emit('quick_love_received', {
  message: string
});
```

#### Couple+ Requests
```typescript
socket.emit('couple_feature_request', {
  status: 'pending'
});

socket.emit('couple_feature_accepted', {
  status: 'active'
});
```

#### Connection Level
```typescript
socket.emit('connection_level_updated', {
  level: number
});
```

#### Goals/Polls/Events
```typescript
socket.emit('goal_updated', goalData);
socket.emit('poll_voted', pollData);
socket.emit('event_created', eventData);
socket.emit('activity_updated', activityData);
```

---

## Authentication & Authorization

### Couple+ Approval Logic
```
1. User A sets couple feature to true
2. Server checks if couple exists
3. Server sends notification to User B
4. User B receives couple_feature_request event
5. User B clicks Accept in modal
6. Server sets both users' status to 'active'
7. Server emits couple_feature_accepted to both
8. Both clients show Connection Meter

RULE: Cannot be active unless BOTH approve
RULE: Either can decline/disable
```

---

## Error Handling

### Expected Errors
```
400 Bad Request
  - Invalid couple+ request
  - User not in couple

401 Unauthorized
  - Token invalid/expired

403 Forbidden
  - Trying to approve own request
  - Not couple with user

404 Not Found
  - Couple settings not found
  - Partner not found

409 Conflict
  - Request already pending
  - Already in couple+

500 Internal Server Error
  - Database error
  - Socket connection error
```

---

## Validation Rules

```
Quick Love Message:
  - Max 200 characters
  - Not empty
  - Must be in default 5 messages

Connection Level:
  - Min: 0
  - Max: 100
  - Must be integer

Couple Question:
  - Max 500 characters
  - Not empty

Couple+ Request:
  - User must be in couple
  - Both users active in relationship
  - Cannot request own self
```

---

## Endpoints Dependency Map

```
CoupleHomeScreen needs:
├── GET /users/partner-status (Real-time)
├── GET /couple/settings (Couple+ status)
├── GET /couple/connection-level (Couple+ only)
├── POST /messages/quick-love (Quick Love)
├── GET /mood/partner (Mood)
├── GET /notes/partner (Love note)
├── GET /goals (Existing)
├── GET /polls (Existing)
├── GET /events (Existing)
└── GET /activities (Existing)

SettingsScreen needs:
├── POST /couple/request-feature (Enable Couple+)
├── POST /couple/accept-feature (Accept request)
├── POST /couple/decline-feature (Decline request)
├── POST /couple/disable-feature (Disable Couple+)
└── POST /preferences (Quick Love notifications)
```

---

## Migration Checklist

- [ ] Create CoupleSettings table
- [ ] Create QuickLoveMessages table
- [ ] Create CoupleQuestions table
- [ ] Add columns to Users table
- [ ] Create indexes on couple_id
- [ ] Set up Socket.io listeners
- [ ] Implement couple+ approval logic
- [ ] Add validation & error handling
- [ ] Test all endpoints
- [ ] Document API responses
- [ ] Add rate limiting
- [ ] Set up monitoring/logging

---

## Testing Requirements

### Unit Tests
```
✓ Couple+ approval (mutual consent)
✓ Couple+ decline (can decline)
✓ Couple+ disable (can disable)
✓ Quick Love message sending
✓ Connection level updates
✓ Validation rules
```

### Integration Tests
```
✓ Full approval flow User A → B
✓ Real-time socket updates
✓ Concurrent requests handling
✓ Error scenarios
✓ Database consistency
```

### Load Tests
```
✓ 1000 concurrent users
✓ Socket.io broadcast performance
✓ Database query optimization
✓ Connection pooling
```

---

## Monitoring & Logging

### Metrics to Track
```
✓ Couple+ activation rate
✓ Quick Love message volume
✓ Real-time update latency
✓ Socket connection drop rate
✓ API endpoint response times
```

### Logs to Track
```
✓ Couple+ requests/responses
✓ Socket errors
✓ Database errors
✓ Authentication failures
✓ Validation errors
```

---

## Performance Considerations

### Optimization Strategies
```
1. Index couple-related queries
2. Cache couple settings
3. Batch socket emissions
4. Implement socket connection pooling
5. Use database connection pooling
6. Implement rate limiting per user
7. Archive old messages (30+ days)
8. Optimize love note queries
```

### Query Optimization
```sql
-- Index for quick lookups
CREATE INDEX idx_couple_settings_users 
ON couple_settings(user_a_id, user_b_id);

CREATE INDEX idx_quick_love_sender 
ON quick_love_messages(sender_id, created_at DESC);

CREATE INDEX idx_couple_questions_couple 
ON couple_questions(couple_id, created_at DESC);
```

---

## Security Considerations

### Data Privacy
```
✓ Couple data only visible to couple
✓ Private wishlist encrypted
✓ Questions not logged
✓ Messages can be deleted
✓ User can export/delete all data
```

### Access Control
```
✓ Verify couple relationship before accessing
✓ Validate user owns data
✓ Rate limit API calls
✓ Validate input strictly
✓ Use HTTPS only
```

---

## Deployment Order

1. **Database migrations** (backward compatible)
2. **New endpoints** (new routes only)
3. **Socket.io listeners** (new events)
4. **Frontend deployment** (can use old endpoints)
5. **Cutover** (enable new features)

---

## Rollback Plan

If issues arise:
1. Disable new API endpoints
2. Set feature flags to false
3. Revert Socket.io listeners
4. Keep data (non-destructive)
5. Users see old interface

---

## Documentation Needed

For Backend Team:
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Database schema diagram
- [ ] Socket.io event reference
- [ ] Authentication flow diagram
- [ ] Error codes reference
- [ ] Rate limiting policy
- [ ] Data retention policy

---

## Contact & Questions

**Frontend Developer:** Ready to integrate once endpoints are available
**Expected Timeline:** 2 weeks for backend implementation
**Priority:** High - blocks home screen release

---

**Last Updated:** 2026-06-07  
**Version:** 2.0.0  
**Status:** Ready for Backend Development  

