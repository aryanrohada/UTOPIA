export type Role = 'admin' | 'guest' | 'vip'
export type EventStatus = 'live' | 'upcoming' | 'draft'

export type Session = {
  userId: string
  name: string
  email: string
  role: Role
}

export type EventRecord = {
  id: string
  title: string
  date: string
  dateLabel: string
  timeLabel: string
  venue: string
  city: string
  capacity: number
  status: EventStatus
  tag: string
  accent: 'lime' | 'coral' | 'pine' | 'sage'
  description: string
  createdAt: string
}

export type Registration = {
  id: string
  eventId: string
  guestName: string
  guestEmail: string
  role: Role
  privilege: string
  registeredAt: string
  status: 'confirmed' | 'revoked'
}

export type PassRecord = {
  id: string
  eventId: string
  registrationId: string
  holderName: string
  holderEmail: string
  role: Role
  privilege: string
  token: string
  issuedAt: string
  revokedAt?: string
}

export type CheckIn = {
  id: string
  passId: string
  eventId: string
  checkedInAt: string
  gate: string
}

export type AuditLog = {
  id: string
  actor: string
  action: string
  detail: string
  at: string
  tone: 'neutral' | 'positive' | 'warning'
}

export type GatePassStore = {
  session: Session
  events: EventRecord[]
  registrations: Registration[]
  passes: PassRecord[]
  checkIns: CheckIn[]
  auditLogs: AuditLog[]
}

export type CreateEventInput = Pick<EventRecord, 'title' | 'date' | 'dateLabel' | 'timeLabel' | 'venue' | 'city' | 'capacity' | 'tag' | 'accent' | 'description'>

const STORAGE_KEY = 'gatepass-demo-store-v1'
const now = '2026-10-17T09:00:00.000Z'

const sessions: Record<Role, Session> = {
  admin: { userId: 'usr_admin_ayla', name: 'Ayla Rodriguez', email: 'ayla@gatepass.demo', role: 'admin' },
  guest: { userId: 'usr_guest_mina', name: 'Mina Park', email: 'mina@gatepass.demo', role: 'guest' },
  vip: { userId: 'usr_vip_luca', name: 'Luca Bennett', email: 'luca@gatepass.demo', role: 'vip' },
}

const seededEvents: EventRecord[] = [
  {
    id: 'evt_quiet_signal',
    title: 'The Quiet Signal',
    date: '2026-10-24',
    dateLabel: '24 OCT 2026',
    timeLabel: '18:30 — 22:00',
    venue: 'Atrium 06',
    city: 'London · SE1',
    capacity: 180,
    status: 'live',
    tag: 'Featured event',
    accent: 'lime',
    description: 'A listening room for people shaping what comes next. One night, three rooms, no stage.',
    createdAt: now,
  },
  {
    id: 'evt_field_notes',
    title: 'Field Notes: Night Shift',
    date: '2026-11-06',
    dateLabel: '06 NOV 2026',
    timeLabel: '20:00 — 01:00',
    venue: 'The Foundry',
    city: 'Manchester · M1',
    capacity: 240,
    status: 'upcoming',
    tag: 'New listing',
    accent: 'coral',
    description: 'A late-hour exchange for operators, artists, and the people who keep the lights on.',
    createdAt: now,
  },
  {
    id: 'evt_common_ground',
    title: 'Common Ground / 04',
    date: '2026-11-19',
    dateLabel: '19 NOV 2026',
    timeLabel: '17:00 — 21:30',
    venue: 'Morrow House',
    city: 'Bristol · BS1',
    capacity: 120,
    status: 'upcoming',
    tag: 'Community',
    accent: 'pine',
    description: 'The monthly room for independent makers, thoughtful guests, and useful collisions.',
    createdAt: now,
  },
]

function createSeedStore(): GatePassStore {
  const registration: Registration = {
    id: 'reg_mina_quiet_signal',
    eventId: 'evt_quiet_signal',
    guestName: 'Mina Park',
    guestEmail: 'mina@gatepass.demo',
    role: 'guest',
    privilege: 'General access',
    registeredAt: '2026-10-12T12:20:00.000Z',
    status: 'confirmed',
  }
  const vipRegistration: Registration = {
    id: 'reg_luca_quiet_signal',
    eventId: 'evt_quiet_signal',
    guestName: 'Luca Bennett',
    guestEmail: 'luca@gatepass.demo',
    role: 'vip',
    privilege: 'Front-row access · Guest lounge',
    registeredAt: '2026-10-13T15:44:00.000Z',
    status: 'confirmed',
  }
  return {
    session: sessions.admin,
    events: seededEvents,
    registrations: [registration, vipRegistration],
    passes: [
      {
        id: 'pass_mina_quiet_signal',
        eventId: 'evt_quiet_signal',
        registrationId: registration.id,
        holderName: 'Mina Park',
        holderEmail: 'mina@gatepass.demo',
        role: 'guest',
        privilege: registration.privilege,
        token: 'GP-QUIET-7K4M-8Q2P',
        issuedAt: '2026-10-12T12:20:02.000Z',
      },
      {
        id: 'pass_luca_quiet_signal',
        eventId: 'evt_quiet_signal',
        registrationId: vipRegistration.id,
        holderName: 'Luca Bennett',
        holderEmail: 'luca@gatepass.demo',
        role: 'vip',
        privilege: vipRegistration.privilege,
        token: 'GP-VIP-5A9D-2L8X',
        issuedAt: '2026-10-13T15:44:02.000Z',
      },
    ],
    checkIns: [],
    auditLogs: [
      { id: 'log_1', actor: 'Ayla Rodriguez', action: 'Event published', detail: 'The Quiet Signal is open for registration', at: '2026-10-16T17:10:00.000Z', tone: 'positive' },
      { id: 'log_2', actor: 'Ayla Rodriguez', action: 'VIP pass issued', detail: 'Luca Bennett · Front-row access', at: '2026-10-13T15:44:02.000Z', tone: 'neutral' },
      { id: 'log_3', actor: 'System', action: 'Capacity threshold', detail: 'The Quiet Signal reached 1% of capacity', at: '2026-10-12T12:20:03.000Z', tone: 'warning' },
    ],
  }
}

export function loadStore(): GatePassStore {
  if (typeof window === 'undefined') return createSeedStore()
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) as GatePassStore : createSeedStore()
  } catch {
    return createSeedStore()
  }
}

export function saveStore(store: GatePassStore): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function switchRole(store: GatePassStore, role: Role): GatePassStore {
  const next = { ...store, session: sessions[role] }
  saveStore(next)
  return next
}

export function getEvent(store: GatePassStore, eventId: string): EventRecord | undefined {
  return store.events.find((event) => event.id === eventId)
}

export function getMyPasses(store: GatePassStore): PassRecord[] {
  return store.passes.filter((pass) => pass.holderEmail === store.session.email && !pass.revokedAt)
}

export function getEventRegistrationCount(store: GatePassStore, eventId: string): number {
  return store.registrations.filter((registration) => registration.eventId === eventId && registration.status === 'confirmed').length
}

export function getEventCheckInCount(store: GatePassStore, eventId: string): number {
  return store.checkIns.filter((checkIn) => checkIn.eventId === eventId).length
}

export function createEvent(store: GatePassStore, input: CreateEventInput): GatePassStore {
  if (store.session.role !== 'admin') return store
  const id = `evt_${input.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}_${Date.now()}`
  const next: GatePassStore = {
    ...store,
    events: [{ ...input, id, status: 'draft', createdAt: new Date().toISOString() }, ...store.events],
    auditLogs: [{ id: `log_${Date.now()}`, actor: store.session.name, action: 'Draft created', detail: input.title, at: new Date().toISOString(), tone: 'neutral' }, ...store.auditLogs],
  }
  saveStore(next)
  return next
}

export function updateEvent(store: GatePassStore, eventId: string, input: CreateEventInput): GatePassStore {
  const event = getEvent(store, eventId)
  if (!event || store.session.role !== 'admin') return store
  const next: GatePassStore = {
    ...store,
    events: store.events.map((item) => item.id === eventId ? { ...item, ...input } : item),
    auditLogs: [{ id: `log_${Date.now()}`, actor: store.session.name, action: 'Event updated', detail: input.title, at: new Date().toISOString(), tone: 'neutral' }, ...store.auditLogs],
  }
  saveStore(next)
  return next
}

export function publishEvent(store: GatePassStore, eventId: string): MutationResult {
  const event = getEvent(store, eventId)
  if (store.session.role !== 'admin') return { ok: false, message: 'Only admins can publish events.', store }
  if (!event) return { ok: false, message: 'Event not found.', store }
  const next: GatePassStore = {
    ...store,
    events: store.events.map((item) => item.id === eventId ? { ...item, status: 'live' } : item),
    auditLogs: [{ id: `log_${Date.now()}`, actor: store.session.name, action: 'Event published', detail: event.title, at: new Date().toISOString(), tone: 'positive' }, ...store.auditLogs],
  }
  saveStore(next)
  return { ok: true, message: `${event.title} is live for registration.`, store: next }
}

export type MutationResult = { ok: boolean; message: string; store: GatePassStore; pass?: PassRecord }

export function registerForEvent(store: GatePassStore, eventId: string): MutationResult {
  const event = getEvent(store, eventId)
  if (!event) return { ok: false, message: 'This event could not be found.', store }
  if (store.session.role === 'admin') return { ok: false, message: 'Admin accounts cannot register guests.', store }
  if (event.status === 'draft') return { ok: false, message: 'This event is not open for registration.', store }
  const existing = store.registrations.find((registration) => registration.eventId === eventId && registration.guestEmail === store.session.email && registration.status === 'confirmed')
  if (existing) return { ok: false, message: 'You already hold a pass for this event.', store }
  if (getEventRegistrationCount(store, eventId) >= event.capacity) return { ok: false, message: 'This event has reached capacity.', store }

  const privilege = store.session.role === 'vip' ? 'Front-row access · Guest lounge' : 'General access'
  const registration: Registration = {
    id: `reg_${Date.now()}`,
    eventId,
    guestName: store.session.name,
    guestEmail: store.session.email,
    role: store.session.role,
    privilege,
    registeredAt: new Date().toISOString(),
    status: 'confirmed',
  }
  const pass: PassRecord = {
    id: `pass_${Date.now()}`,
    eventId,
    registrationId: registration.id,
    holderName: store.session.name,
    holderEmail: store.session.email,
    role: store.session.role,
    privilege,
    token: `GP-${event.title.slice(0, 5).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    issuedAt: new Date().toISOString(),
  }
  const next: GatePassStore = {
    ...store,
    registrations: [registration, ...store.registrations],
    passes: [pass, ...store.passes],
    auditLogs: [{ id: `log_${Date.now()}`, actor: store.session.name, action: 'Pass issued', detail: `${event.title} · ${privilege}`, at: new Date().toISOString(), tone: 'positive' }, ...store.auditLogs],
  }
  saveStore(next)
  return { ok: true, message: `Your ${store.session.role === 'vip' ? 'VIP ' : ''}pass is ready.`, store: next, pass }
}

export function revokePass(store: GatePassStore, passId: string): MutationResult {
  if (store.session.role !== 'admin') return { ok: false, message: 'Only admins can revoke passes.', store }
  const pass = store.passes.find((item) => item.id === passId)
  if (!pass) return { ok: false, message: 'Pass not found.', store }
  const next: GatePassStore = {
    ...store,
    passes: store.passes.map((item) => item.id === passId ? { ...item, revokedAt: new Date().toISOString() } : item),
    registrations: store.registrations.map((item) => item.id === pass.registrationId ? { ...item, status: 'revoked' } : item),
    auditLogs: [{ id: `log_${Date.now()}`, actor: store.session.name, action: 'Pass revoked', detail: pass.token, at: new Date().toISOString(), tone: 'warning' }, ...store.auditLogs],
  }
  saveStore(next)
  return { ok: true, message: 'Pass revoked. Entry will be rejected at the door.', store: next }
}

export type VerificationResult = { ok: boolean; kind: 'valid' | 'invalid' | 'revoked' | 'expired' | 'wrong-event' | 'used' | 'forbidden'; message: string; pass?: PassRecord; store: GatePassStore }

export function verifyAndCheckIn(store: GatePassStore, query: string, eventId = 'evt_quiet_signal', gate = 'North Gate'): VerificationResult {
  if (store.session.role !== 'admin') return { ok: false, kind: 'forbidden', message: 'Only an admin scanner can record entry.', store }
  const normalized = query.trim().toUpperCase()
  const pass = store.passes.find((item) => item.token.toUpperCase() === normalized || item.id.toUpperCase() === normalized)
  if (!pass) return { ok: false, kind: 'invalid', message: 'No pass matches that code.', store }
  if (pass.eventId !== eventId) return { ok: false, kind: 'wrong-event', message: 'Valid pass, wrong event.', pass, store }
  if (pass.revokedAt) return { ok: false, kind: 'revoked', message: 'This pass has been revoked.', pass, store }
  const event = getEvent(store, pass.eventId)
  const eventEnd = event ? new Date(`${event.date}T23:59:59`) : null
  if (eventEnd && Date.now() > eventEnd.getTime()) return { ok: false, kind: 'expired', message: 'This pass is expired.', pass, store }
  if (store.checkIns.some((checkIn) => checkIn.passId === pass.id)) return { ok: false, kind: 'used', message: 'Already checked in. Entry denied.', pass, store }

  const checkIn: CheckIn = { id: `check_${Date.now()}`, passId: pass.id, eventId: pass.eventId, checkedInAt: new Date().toISOString(), gate }
  const next: GatePassStore = {
    ...store,
    checkIns: [checkIn, ...store.checkIns],
    auditLogs: [{ id: `log_${Date.now()}`, actor: store.session.name, action: 'Check-in recorded', detail: `${pass.holderName} · ${pass.token}`, at: new Date().toISOString(), tone: 'positive' }, ...store.auditLogs],
  }
  saveStore(next)
  return { ok: true, kind: 'valid', message: 'Pass verified. Welcome inside.', pass, store: next }
}

export function resetDemoStore(): GatePassStore {
  const fresh = createSeedStore()
  saveStore(fresh)
  return fresh
}
