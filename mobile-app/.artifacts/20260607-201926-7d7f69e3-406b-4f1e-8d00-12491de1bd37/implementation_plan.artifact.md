# Implementation Plan - 18+ Couple Intimacy Features

This plan outlines the changes needed to support the "Intimate Couple Version (18+)" features in the mobile app. This involves updating the backend models, adding new API endpoints, implementing socket events for real-time updates, and refining the mobile app services and UI.

## User Review Required

> [!IMPORTANT]
> - **Data Privacy**: 18+ features like "Desire Box" will be stored in the database. While they are "private" to the couple, they are currently stored in plain text on the server. Does the user require end-to-end encryption or server-side encryption for these specific fields?
> - **Streak Logic**: I will implement a simple daily streak logic. If the intimacy level is updated today, the streak continues. If a day is missed, it resets. Does the user have a different requirement for streak calculation?

## Proposed Changes

### [Backend - Models]

#### [Couple.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/models/Couple.ts)
- Add fields for intimacy tracking:
    - `intimacyLevel`: Number (default 65)
    - `spiceLevel`: Number (default 45)
    - `desires`: Array of Strings (default [])
    - `intimacyStreak`: Number (default 0)
    - `lastIntimacyUpdate`: Date
    - `rewards`: Array of Strings (default [])

---

### [Backend - Controllers & Routes]

#### [NEW] [intimacy.controller.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/controllers/intimacy.controller.ts)
- `getIntimacyData`: Fetch all intimacy-related data (level, spice, streak, rewards).
- `updateIntimacyLevel`: Update intimacy level and increment streak if it's a new day.
- `updateSpiceLevel`: Update spice level.

#### [NEW] [desire.controller.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/controllers/desire.controller.ts)
- `getDesires`: List all shared desires.
- `addDesire`: Add a new desire to the shared list.

#### [NEW] [intimacy.routes.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/routes/intimacy.routes.ts)
- `GET /api/intimacy/data`
- `POST /api/intimacy/update`
- `POST /api/spice/update`

#### [NEW] [desire.routes.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/routes/desire.routes.ts)
- `GET /api/desires/list`
- `POST /api/desires/add`

#### [app.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/app.ts)
- Register the new routes.

---

### [Backend - Notifications & Sockets]

#### [notification.controller.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/controllers/notification.controller.ts)
- Add `sendIntimateQuestion` and `sendDateIdea` handlers.

#### [notification.routes.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/routes/notification.routes.ts)
- Add `POST /api/notifications/intimate-question`
- Add `POST /api/notifications/date-idea`

#### [chatSocket.ts](file:///C:/Users/USER/Downloads/JUSTUS/backend/src/sockets/chatSocket.ts)
- Add listeners and emitters for:
    - `intimacy_updated`
    - `spice_updated`
    - `desire_added`

---

### [Mobile App - Services & UI]

#### [notificationService.ts](file:///C:/Users/USER/Downloads/JUSTUS/mobile-app/src/services/notificationService.ts)
- Add `sendIntimateQuestion(question: string)`
- Add `sendDateIdea(idea: string)`

#### [CoupleHomeScreen.tsx](file:///C:/Users/USER/Downloads/JUSTUS/mobile-app/src/screens/couple/CoupleHomeScreen.tsx)
- Update `fetchDashboardData` to fetch all intimacy data (not just level).
- Ensure it uses the new `/api/intimacy/data` endpoint or separate calls.
- Fix any minor bugs in the 18+ implementation.

## Verification Plan

### Automated Tests
- Since there are no existing backend tests for these specific features, I will verify using `curl` or manual tests via the app.
- I will check if there are any existing unit tests for controllers and try to add a basic one for `IntimacyController` if possible.

### Manual Verification
1. **Intimacy Update**: Update intimacy level in the app and verify it persists and notifies the partner.
2. **Spice Level**: Tap to add spice and verify partner receives notification.
3. **Desire Box**: Add a desire and verify it appears in the shared list.
4. **Intimate Questions**: Send a question and verify partner receives it.
5. **Date Ideas**: Send a date idea and verify partner receives it.
6. **Streak**: Verify streak increments correctly when updating intimacy level on consecutive days.
