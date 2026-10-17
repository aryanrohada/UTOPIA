import {
  createEvent,
  loadStore,
  publishEvent,
  registerForEvent,
  revokePass,
  switchRole,
  verifyAndCheckIn,
} from '../src/lib/demoStore'

const initial = loadStore()
const vip = switchRole(initial, 'vip')
const registration = registerForEvent(vip, 'evt_field_notes')
if (!registration.ok || !registration.pass) throw new Error(`Expected a new VIP pass, got: ${registration.message}`)

const adminForScan = switchRole(registration.store, 'admin')
const firstScan = verifyAndCheckIn(adminForScan, registration.pass.token, 'evt_field_notes', 'South Gate')
if (!firstScan.ok || firstScan.store.checkIns[0]?.gate !== 'South Gate') throw new Error(`Expected the first scan to succeed at the selected gate, got: ${firstScan.message}`)

const repeatedScan = verifyAndCheckIn(firstScan.store, registration.pass.token, 'evt_field_notes')
if (repeatedScan.ok || repeatedScan.kind !== 'used') throw new Error('Expected a repeated scan to be rejected as already used.')

const invalidScan = verifyAndCheckIn(adminForScan, 'GP-NOT-A-REAL-PASS', 'evt_field_notes')
if (invalidScan.ok || invalidScan.kind !== 'invalid') throw new Error('Expected an unknown code to be rejected.')

const wrongEventScan = verifyAndCheckIn(adminForScan, registration.pass.token, 'evt_quiet_signal')
if (wrongEventScan.ok || wrongEventScan.kind !== 'wrong-event') throw new Error('Expected a valid pass at the wrong event to be rejected.')

const revoked = revokePass(adminForScan, 'pass_mina_quiet_signal')
if (!revoked.ok) throw new Error(`Expected admin revocation to succeed, got: ${revoked.message}`)
const revokedScan = verifyAndCheckIn(revoked.store, 'GP-QUIET-7K4M-8Q2P', 'evt_quiet_signal')
if (revokedScan.ok || revokedScan.kind !== 'revoked') throw new Error('Expected a revoked pass to be rejected.')

const expiredDraft = createEvent(adminForScan, { title: 'Expired Room', date: '2026-10-01', dateLabel: '01 OCT 2026', timeLabel: '18:00 — 20:00', venue: 'Old Hall', city: 'Leeds · LS1', capacity: 10, tag: 'Archive check', accent: 'sage', description: 'An expired test event.' })
const expiredEvent = expiredDraft.events[0]
const publishedExpired = publishEvent(expiredDraft, expiredEvent.id)
const expiredRegistration = registerForEvent(switchRole(publishedExpired.store, 'guest'), expiredEvent.id)
if (!expiredRegistration.ok || !expiredRegistration.pass) throw new Error('Expected the expired event to still issue a test pass before scan validation.')
const expiredScan = verifyAndCheckIn(switchRole(expiredRegistration.store, 'admin'), expiredRegistration.pass.token, expiredEvent.id)
if (expiredScan.ok || expiredScan.kind !== 'expired') throw new Error('Expected an expired event pass to be rejected.')

const capacityDraft = createEvent(adminForScan, { title: 'Small Room', date: '2026-12-01', dateLabel: '01 DEC 2026', timeLabel: '18:00 — 20:00', venue: 'Small Hall', city: 'York · YO1', capacity: 1, tag: 'Capacity check', accent: 'coral', description: 'A capacity test event.' })
const capacityEvent = capacityDraft.events[0]
const publishedCapacity = publishEvent(capacityDraft, capacityEvent.id)
const firstGuest = registerForEvent(switchRole(publishedCapacity.store, 'guest'), capacityEvent.id)
if (!firstGuest.ok) throw new Error('Expected the first guest to claim the only capacity slot.')
const secondGuest = registerForEvent(switchRole(firstGuest.store, 'vip'), capacityEvent.id)
if (secondGuest.ok || !secondGuest.message.toLowerCase().includes('capacity')) throw new Error('Expected the second guest to be rejected at capacity.')

const guestCannotScan = verifyAndCheckIn(switchRole(firstGuest.store, 'guest'), firstGuest.pass?.token ?? '', capacityEvent.id)
if (guestCannotScan.ok || guestCannotScan.kind !== 'forbidden') throw new Error('Expected a guest scanner attempt to be rejected.')

console.log('GatePass workflow passed: registration → pass issuance → selected-gate check-in → duplicate, invalid, wrong-event, revoked, expired, capacity, and role rejection.')
