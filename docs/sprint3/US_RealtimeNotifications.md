# User Story: Realtime Notifications

---

## Card

| | |
|---|---|
| **As a** | Staff (Sales / Engineer / Manager) or Customer |
| **I want** | Receive instant popup notifications on screen when important events occur — new message received, production stage changed, or a new RFQ created — without refreshing the page |
| **So that** | I never miss critical updates while working in another tab, enabling faster response times and improved operational efficiency |

---

## Summary

The Realtime Notifications module delivers instant push notifications via **Socket.IO**, running in parallel with the existing DB polling mechanism. When one of three key events occurs — (1) a staff member advances an order's production stage, (2) a user sends a chat message, or (3) a customer creates a new RFQ — the system emits a clickable toast popup that navigates directly to the relevant content. Each event also creates a Notification record in the database so users can review it later in the notification bell list.

---

## Scopes

**Notification Type 1 — Production Stage Update:**
- When staff moves a Kanban card to a new stage → Customer receives a popup
- Content: new stage name (e.g., "Packaging", "Delivering")
- "Done" stage triggers a special message: "Your order has completed the full production process"
- Click popup → opens **Production Progress** tab

**Notification Type 2 — New Message:**
- Customer sends a message → all Staff (sales, manager, engineer) receive a popup
- Staff sends a message → the Customer who owns that RFQ receives a popup
- Content: sender name + first 80 characters of the message as preview
- Click popup → opens **Messages** tab, automatically selects the correct conversation

**Notification Type 3 — New RFQ Created:**
- Customer creates an RFQ → all Staff receive a popup
- Content: customer name + RFQ code
- Click popup → opens **Quotation Requests** tab and refreshes the list

**General Behavior:**
- Popup auto-dismisses after 6–7 seconds
- Every popup is clickable for navigation
- Notification is also saved to DB and reflected in the bell badge
- Unread badge count updates in real time

---

## Out of Scope

- Email notifications (to be handled in a future sprint using nodemailer)
- Browser push notifications (PWA)
- Notifications when staff edits RFQ content
- Notifications when a message or RFQ is deleted
- Sound alerts on notification

---

## Trigger

- **Production stage:** Staff clicks the `▶` button on a Kanban card to advance to the next stage
- **New message:** Any user presses **Send** or hits Enter in the chat window
- **New RFQ:** Customer submits the "Create New Request" form successfully

---

## Precondition

- User must be logged in to the system
- Socket.IO connection must be established (automatically on Dashboard / CustomerDashboard mount)
- Each user must have joined their own room identified by their `userId`

---

## Business Rule and Error Message

**BR-01:** Each user only receives notifications within their own scope — staff receive notifications from all customers; customers only receive notifications related to their own orders.

**BR-02:** Popup toast must NOT appear for the sender of a message (a user should not receive a popup from their own action).

**BR-03:** When multiple requests simultaneously receive a 401 error (expired token), the system calls `/refresh-token` only once (mutex pattern) — other requests queue and wait for the new token before retrying.

**BR-04:** If the Socket.IO connection drops, the 5-second DB polling fallback ensures no notifications are lost.

**Error Handling:** If socket emit fails → no popup is shown, but the DB notification record is still created. The user will see it on the next polling cycle or page reload.

---

## Screen Design

**Staff Dashboard — New message popup:**
> Toast appears top-right, white background, rounded corners, shadow. Line 1 bold: "💬 New Message — RFQ-2025-001". Line 2: "Nguyen Van A: 'I'd like to ask about the dimensions...'". Line 3 in blue: "Click to open chat →". Auto-dismisses after 6 seconds.

**Staff Dashboard — New RFQ popup:**
> Icon 🆕. Line 1: "New Quotation Request!". Line 2: "ABC Company — RFQ-2025-015". Auto-dismisses after 7 seconds.

**Customer Dashboard — Production stage popup:**
> Icon 🏭. Line 1: "Order RFQ-2025-001 progress updated". Line 2: "Your order is now at stage: Packaging." Line 3: "Click to view progress →"

---

## Screen Description

| Component | Description | Type | Notes |
|---|---|---|---|
| Toast container | Popup display area (top-right corner) | UI Component | Uses react-hot-toast |
| Toast title | Bold notification headline | Text | Max 60 characters |
| Toast body | Detailed content / preview | Text | Max 80 characters |
| Toast CTA | Blue clickable action hint | Text | "Click to view X →" |
| Duration | Auto-dismiss time | Number | 6000ms (message), 7000ms (new RFQ) |
| Bell badge | Red unread count on bell icon | Badge | Updates in real time |
| Socket room | Room identified by userId | System | Auto-joined on component mount |

---

## Acceptance Criteria

1. When staff moves order RFQ-2025-001 to the "Packaging" stage, the logged-in customer receives a popup within < 2 seconds without refreshing the page.

2. Clicking the production stage popup → the "Production Progress" tab in CustomerDashboard becomes active.

3. When a customer sends a message in RFQ-2025-003, all currently online staff members receive a popup with the message preview.

4. Clicking the message popup (staff side) → the "Messages" tab opens and automatically selects the conversation for RFQ-2025-003.

5. When a customer creates a new RFQ, all staff receive a popup showing the correct customer name and newly created RFQ code.

6. When the access token expires mid-session, the system silently refreshes the token without showing a login screen, and all DB notifications remain visible in the bell list.

7. If the user closes the browser and reopens it, all unread notifications still appear in the notification list with the correct badge count.

8. A user who sends a message does NOT receive a popup notification from their own message.
