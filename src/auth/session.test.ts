import { beforeEach, describe, expect, it } from 'vitest'
import { parseLoginResponse, readSession, saveSession, SESSION_KEY } from './session'

const user = { id: 1, name: 'Admin Laundry', username: 'admin', email: 'admin@example.com', role: 'admin' }
const response = { access_token: 'test-token', token_type: 'Bearer', expires_in: 3600, user }

beforeEach(() => sessionStorage.clear())

describe('authentication session', () => {
  it('stores only the token, expiry, and public user fields', () => {
    const session = parseLoginResponse({ ...response, user: { ...user, password_hash: 'must-not-be-stored' } }, 1000)
    expect(session.expiresAt).toBe(3601000)
    saveSession(session)
    expect(readSession(1000)).toEqual(session)
    expect(sessionStorage.getItem(SESSION_KEY)).not.toContain('password')
  })

  it.each([
    { ...response, access_token: '' },
    { ...response, token_type: 'Basic' },
    { ...response, expires_in: 0 },
    { ...response, expires_in: 86401 },
    { ...response, expires_in: '3600' },
    { ...response, user: { ...user, role: 'unknown' } },
    { ...response, user: { ...user, id: -1 } },
  ])('rejects malformed token or user responses', value => {
    expect(() => parseLoginResponse(value)).toThrow()
  })

  it('removes expired sessions and corrupted storage', () => {
    saveSession(parseLoginResponse(response, 1000))
    expect(readSession(3601000)).toBeNull()
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
    sessionStorage.setItem(SESSION_KEY, '{broken')
    expect(readSession()).toBeNull()
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })
})
