### REST (HTTP)

**Games**

- `POST /api/games/start`
- `GET  /api/games` (optional: `?status&player`)
- `GET  /api/games/:gameId`

**Matchmaking**

- `POST   /api/matchmaking/queue`
- `DELETE /api/matchmaking/queue/:userId`
- `GET    /api/matchmaking/status/:userId`

**Tournaments**

- `POST /api/tournaments`
- `GET  /api/tournaments`
- `GET  /api/tournaments/:id`
- `POST /api/tournaments/:id/join`
- `POST /api/tournaments/:id/leave`
- `POST /api/tournaments/:id/start`
- `POST /api/tournaments/:id/advance`

### WebSocket (required for live gameplay)

- `GET /ws` \_(upgrade to WS; used during active matches for inputs/state; room keyed by `gameId`)

# What “matchmaking” does

It pairs two users for a 1v1 Pong match. Think of it as a simple **waiting line**: the first player waits; the next player joins and instantly gets paired → a new game is created.

---

## 1) `POST /api/matchmaking/queue`

**Purpose:** “Put me in the waiting line (and match me if someone is already waiting).”

**Behavior**

- If nobody else is waiting → you’re added to the queue → response: `{ matched: false }`.
- If someone _is_ waiting → server **pairs** you with the earliest queued user, **creates a game**, and returns it immediately:

  ```json
  {
    "matched": true,
    "game": {
      "game_id": "...",
      "player1": "other",
      "player2": "you",
      "status": "In Progress",
      "score": "0-0"
    }
  }
  ```

**Idempotency & guards**

- If you’re already queued, it should just return `{ matched: false }` again (no duplicates).
- If you’re already in an active game, return a `409 Conflict` (or decide your rule).

**Why POST?** You’re mutating server state (entering the queue and maybe creating a game).

---

## 2) `DELETE /api/matchmaking/queue/:userId`

**Purpose:** “Take me out of the waiting line.”

**Behavior**

- Removes the user from the queue if present.
- **Idempotent**: if the user isn’t queued, still return `{ "ok": true }`.

**Why DELETE?** You’re removing a queued resource (your place in line).

---

## 3) `GET /api/matchmaking/status/:userId`

**Purpose:** “What’s my current matchmaking state?”

**Behavior**
Returns one of:

```json
{ "status": "none" }                    // not queued and not matched
{ "status": "queued" }                  // currently waiting
{ "status": "matched", "gameId": "..." } // already paired; go join that game
```

**Why GET?** Pure read—useful for polling a UI that’s showing “searching for opponent…”.

---

## How they fit together (flow)

1. Client calls **POST /queue** → gets `{ matched:false }` (usually).
2. UI shows “Searching…”, polls **GET /status**.
3. When another user enqueues, server pairs them → both clients will see
   `{ status:"matched", gameId:"..." }` on the next status poll.
   _(If the second user enqueues while you’re waiting, that second user’s enqueue response will be `{ matched:true, game }` immediately.)_
4. Either user can back out with **DELETE /queue/\:userId** before they’re matched.

---

## Simple data model (SQLite)

- `matchmaking_queue(user_id TEXT PRIMARY KEY, queued_at TEXT)`
  - One row per waiting user (PRIMARY KEY ensures no duplicates).

- You already have `games` (use it when pairing).

**GET /status** can decide:

- “queued” → user exists in `matchmaking_queue`.
- “matched” → a **recent** game exists with `player1=user OR player2=user` and status `"In Progress" | "Waiting"`.
- “none” → neither queued nor matched.

---

## Edge cases you’ll want to handle (MVP rules)

- **Race conditions**: Two users enqueue at the same time—use a DB transaction to atomically pick the earliest waiting user and delete their row when pairing.
- **Timeouts**: Optionally auto-drop stale queue rows after N minutes (cleaner UX).
- **Already in game**: Decide whether to block enqueue with 409 or allow it (usually block).
