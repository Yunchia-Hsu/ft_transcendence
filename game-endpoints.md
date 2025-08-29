## Matchmaking

- `POST    /api/matchmaking/queue` — join the queue (current user)
- `DELETE  /api/matchmaking/queue` — leave the queue (current user)
- `GET     /api/matchmaking/status` — queue/status for current user

### Bodies & returns

- **POST /queue**
  Body: `{ mode: "1v1" }` (optional)
  201: `{ status: "queued", userId, mode }`
- **DELETE /queue**
  204: no body
- **GET /status**
  200: `{ status: "idle" | "queued" | "matched", opponent?: { userId, nickname }, matchId?: string }`

---

## Tournaments

- `GET     /api/tournaments` — list tournaments
- `POST    /api/tournaments` — create tournament (admin or organizer)
- `GET     /api/tournaments/:tournamentId` — details
- `DELETE  /api/tournaments/:tournamentId` — delete (admin/owner)

Participation:

- `POST    /api/tournaments/:tournamentId/participants` — join (current user)
- `DELETE  /api/tournaments/:tournamentId/participants` — leave (current user)

Lifecycle & reporting:

- `POST    /api/tournaments/:tournamentId/start` — start (locks bracket)
- `POST    /api/tournaments/:tournamentId/matches` — record a result (minimal)

Bracket:

- `GET     /api/tournaments/:tournamentId/bracket` — current bracket tree

### Bodies & returns (minimal)

- **POST /api/tournaments**
  Body: `{ name, type: "single_elim", size: 8 }`
  201: `{ id, name, type, size, status: "pending", createdAt }`
- **GET /api/tournaments**
  200: `{ items: [{ id, name, status }], total }`
- **GET /\:id**
  200: `{ id, name, status: "pending"|"ongoing"|"completed", size, participants: [{ userId, nickname }], rounds: number }`
- **POST /\:id/participants**
  201: `{ joined: true }`
- **DELETE /\:id/participants**
  204: no body
- **POST /\:id/start**
  200: `{ status: "ongoing", bracketGenerated: true }`
- **POST /\:id/matches** (record result)
  Body: `{ matchId, winnerUserId, loserUserId, score?: string }`
  201: `{ recorded: true, matchId }`
- **GET /\:id/bracket**
  200: `{ rounds: [[{ matchId, p1?, p2?, winner? }], ...] }`

---

## Player stats

- `GET     /api/stats/users/:userId` — get stats
- `PATCH   /api/stats/users/:userId/rating` — update rating (server-calculated is preferred; client sends delta minimally)

### Bodies & returns

- **GET**
  200: `{ userId, rating, wins, losses }`
- **PATCH /rating**
  Body: `{ delta: number }`
  200: `{ userId, rating }`

---

## Match history

(Unify under a single resource `matches`; filter via query)

- `GET     /api/matches` — list (pagination; optional filters)
  - Query: `?page=1&pageSize=20&playerId=xxx`

- `POST    /api/matches` — create a new match record (non-tournament or friendly)
- `GET     /api/matches/:matchId` — details

### Bodies & returns

- **GET /api/matches**
  200: `{ items: [{ id, players: [userId1, userId2], winnerUserId, playedAt }], page, pageSize, total }`
- **POST /api/matches**
  Body: `{ playerA, playerB, winnerUserId, score?: string, source?: "ladder"|"friendly" }`
  201: `{ id, created: true }`
- **GET /api/matches/\:matchId**
  200: `{ id, players, winnerUserId, score?, playedAt, tournamentId? }`

---

## Avatars (profile pictures)

Keep it simple and tied to the current user.

- `PUT     /api/users/me/avatar` — upload/replace avatar (multipart/form-data or base64)
- `DELETE  /api/users/me/avatar` — remove avatar

### Bodies & returns

- **PUT** (multipart)
  Body: `FormData { file: Blob }`
  200: `{ url }`
- **DELETE**
  204: no body

---

# 🧠 Minimal pseudocode handlers

> Pseudocode; replace `db.*`, `mq.*`, `auth.userId`, etc. with your stack (NestJS/Express/Prisma/TypeORM, etc.)

## Matchmaking

```ts
POST /api/matchmaking/queue
auth userId = auth.userId
body { mode? }
if (db.queue.has(userId)) return 200 { status: "queued", userId }
db.queue.add({ userId, mode: body.mode ?? "1v1", enqueuedAt: now() })
opponent = db.queue.findOpponent(userId)
if (!opponent) return 201 { status: "queued", userId, mode: "1v1" }
matchId = db.matches.createPending({ players: [userId, opponent.userId] })
db.queue.remove(userId); db.queue.remove(opponent.userId)
notify([userId, opponent.userId], { type: "matched", matchId })
return 201 { status: "matched", matchId, opponent: { userId: opponent.userId } }
```

```ts
DELETE /api/matchmaking/queue
auth userId
db.queue.remove(userId) // no-op if not present
return 204
```

```ts
GET /api/matchmaking/status
auth userId
if (!db.queue.has(userId)) return 200 { status: "idle" }
if (db.matches.findPendingFor(userId)) return 200 { status: "matched", matchId, opponent }
return 200 { status: "queued" }
```

## Tournaments

```ts
GET /api/tournaments
query { page=1, pageSize=20 }
items = db.tournaments.list({ page, pageSize })
total = db.tournaments.count()
return 200 { items: items.map(t => ({ id:t.id, name:t.name, status:t.status })), total }
```

```ts
POST /api/tournaments
auth organizerId
body { name, type, size }
id = db.tournaments.create({ name, type, size, status:"pending", ownerId: organizerId })
return 201 { id, name, type, size, status:"pending", createdAt: now() }
```

```ts
GET /api/tournaments/:id
t = db.tournaments.get(id)
if (!t) return 404
return 200 { id:t.id, name:t.name, status:t.status, size:t.size,
             participants: db.tournaments.participants(id),
             rounds: t.rounds }
```

```ts
DELETE /api/tournaments/:id
auth userId
t = db.tournaments.get(id)
if (!t || !isOwnerOrAdmin(userId, t)) return 403
db.tournaments.delete(id)
return 204
```

```ts
POST /api/tournaments/:id/participants
auth userId
t = db.tournaments.get(id)
if (!t || t.status !== "pending") return 400
if (db.tournaments.isFull(id)) return 409
db.tournaments.addParticipant(id, userId)
return 201 { joined: true }
```

```ts
DELETE /api/tournaments/:id/participants
auth userId
t = db.tournaments.get(id)
if (!t || t.status !== "pending") return 400
db.tournaments.removeParticipant(id, userId)
return 204
```

```ts
POST /api/tournaments/:id/start
auth userId
t = db.tournaments.get(id)
if (!t || !isOwnerOrAdmin(userId, t)) return 403
if (t.status !== "pending") return 400
bracket = bracketify(db.tournaments.participants(id)) // generate matches tree
db.tournaments.setBracket(id, bracket)
db.tournaments.setStatus(id, "ongoing")
return 200 { status:"ongoing", bracketGenerated:true }
```

```ts
POST /api/tournaments/:id/matches
auth userId
body { matchId, winnerUserId, loserUserId, score? }
m = db.tournamentMatches.get(id, matchId)
if (!m) return 404
if (m.completed) return 409
db.tournamentMatches.complete(matchId, { winnerUserId, loserUserId, score })
advanceBracket(id, matchId, winnerUserId)
if (db.tournaments.isCompleted(id)) db.tournaments.setStatus(id, "completed")
return 201 { recorded:true, matchId }
```

```ts
GET /api/tournaments/:id/bracket
t = db.tournaments.get(id)
if (!t) return 404
return 200 { rounds: t.bracket.rounds }
```

## Player stats

```ts
GET /api/stats/users/:userId
s = db.stats.get(userId) ?? { rating: 1000, wins:0, losses:0 }
return 200 { userId, rating:s.rating, wins:s.wins, losses:s.losses }
```

```ts
PATCH /api/stats/users/:userId/rating
auth adminOrServer
body { delta }
s = db.stats.get(userId) ?? { rating: 1000, wins:0, losses:0 }
s.rating += body.delta
db.stats.save(userId, s)
return 200 { userId, rating: s.rating }
```

## Match history

```ts
GET /api/matches
query { page=1, pageSize=20, playerId? }
items = db.matches.list({ page, pageSize, playerId })
total = db.matches.count({ playerId })
return 200 { items: items.map(m => ({ id:m.id, players:m.players, winnerUserId:m.winnerUserId, playedAt:m.playedAt })), page, pageSize, total }
```

```ts
POST /api/matches
auth reporterId
body { playerA, playerB, winnerUserId, score?, source? }
id = db.matches.create({ players:[playerA, playerB], winnerUserId, score, source, playedAt: now() })
updateStatsFromMatch({ playerA, playerB, winnerUserId })
return 201 { id, created:true }
```

```ts
GET /api/matches/:matchId
m = db.matches.get(matchId)
if (!m) return 404
return 200 { id:m.id, players:m.players, winnerUserId:m.winnerUserId, score:m.score, playedAt:m.playedAt, tournamentId:m.tournamentId }
```

## Avatars

```ts
PUT /api/users/me/avatar
auth userId
file = parseMultipart("file")
url = storage.upload(`avatars/${userId}`, file)
db.users.update(userId, { avatarUrl: url })
return 200 { url }
```

```ts
DELETE /api/users/me/avatar
auth userId
storage.delete(`avatars/${userId}`)
db.users.update(userId, { avatarUrl: null })
return 204
```
