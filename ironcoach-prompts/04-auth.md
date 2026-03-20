# Prompt 04 — Auth Module

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–03 complete. NestJS running, guards exist.

---

## Task

Build the complete authentication module at `apps/api/src/auth/`.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Coach self-registration |
| POST | `/auth/login` | Public | Returns token pair |
| POST | `/auth/refresh` | Public | Rotate refresh token |
| POST | `/auth/logout` | JWT | Revoke refresh token |
| POST | `/auth/forgot-password` | Public | Send reset email |
| POST | `/auth/reset-password` | Public | Set new password |
| POST | `/auth/verify-email` | Public | Mark email verified |
| POST | `/auth/accept-invite` | Public | Trainee accepts invite + sets password |

---

## Implementation Details

### `POST /auth/register`
1. Validate `RegisterDto` (firstName, lastName, email, password, phone?)
2. Check email uniqueness → `409` if taken
3. Hash password with bcrypt (12 rounds)
4. Create `User` row
5. Create `Organization` row (name = `${firstName}'s Coaching`, slug = sanitized email prefix + random suffix)
6. Create `OrganizationMember` row with `roleKey: RoleKey.OWNER`
7. Create `TrainerProfile` row
8. Send welcome email via Resend (template: `welcome-coach`)
9. Return `{ accessToken, refreshToken, user, organization }`

### `POST /auth/login`
1. Find user by email → `401` if not found
2. Compare password with bcrypt → `401` if mismatch
3. Check `user.isActive` → `403` if false
4. Load organization membership → get `roleKey` and `organizationId`
5. Generate access token: payload `{ sub: userId, orgId, role: roleKey, email }`
6. Generate refresh token: `crypto.randomBytes(64).toString('hex')`
7. Store `SHA-256(refreshToken)` in `RefreshToken` table with `expiresAt = now + 7d`, `deviceInfo` from User-Agent header
8. Return `{ accessToken, refreshToken, user: { id, email, firstName, lastName, avatarUrl }, organization: { id, name, slug, plan } }`

### `POST /auth/refresh`
Body: `{ refreshToken: string }`
1. Hash incoming token with SHA-256
2. Find `RefreshToken` by hash → `401` if not found
3. Check `revokedAt === null` → `401` if revoked
4. Check `expiresAt > now` → `401` if expired
5. **Rotate**: mark old token `revokedAt = now`, create new `RefreshToken` row
6. Generate new access token + new refresh token
7. Return `{ accessToken, refreshToken }`

### `POST /auth/logout`
Body: `{ refreshToken: string }`
1. Hash incoming token
2. Set `revokedAt = now` on matching `RefreshToken` row
3. Return `{ success: true }`

### `POST /auth/forgot-password`
Body: `{ email: string }`
1. Find user by email (always return 200 to prevent enumeration)
2. If found: generate 32-byte hex token, store `SHA-256(token)` in `User.passwordResetToken`, set `User.passwordResetExpiry = now + 1h`
3. Send reset email via Resend with raw token in link

### `POST /auth/reset-password`
Body: `{ token: string, password: string }`
1. Hash token, find user by `passwordResetToken`
2. Check `passwordResetExpiry > now` → `400` if expired
3. Hash new password, update user
4. Clear `passwordResetToken` and `passwordResetExpiry`
5. Revoke ALL active `RefreshToken` rows for this user
6. Return `{ success: true }`

### `POST /auth/verify-email`
Body: `{ token: string }`
1. Find user by `emailVerificationToken`
2. Set `emailVerifiedAt = now`, clear token
3. Return `{ success: true }`

### `POST /auth/accept-invite`
Body: `{ token: string, password: string, firstName?: string, lastName?: string }`

This is the endpoint hit when a trainee clicks their invite link.

1. SHA-256 hash the incoming token
2. Find `InviteToken` by `tokenHash` → `404` if not found
3. Check `acceptedAt === null` → `400 "invite_already_used"` if already accepted
4. Check `expiresAt > now` → `400 "invite_expired"` if expired
5. Find the `User` row created during invite (has no password yet)
6. Hash the new password with bcrypt (12 rounds), set on user
7. Set `user.emailVerifiedAt = now`, `user.isActive = true`
8. If `firstName`/`lastName` provided, update user
9. Mark `InviteToken.acceptedAt = now`
10. Load org membership → get `orgId` and `roleKey`
11. Generate access token + refresh token (same as login)
12. Send `welcome-trainee` email via Resend
13. Return `{ accessToken, refreshToken, user, organization }`

**Note:** `InviteToken` is created in `TrainersService.invite` (Prompt 06). The raw token goes in the invite email link as `?token=RAW_TOKEN`. Only the SHA-256 hash is stored in DB.

---

## Files Required

```
apps/api/src/auth/
  auth.module.ts
  auth.controller.ts
  auth.service.ts
  token.service.ts          ← generate/verify JWT + refresh token logic
  dto/
    register.dto.ts
    login.dto.ts
    refresh.dto.ts
    forgot-password.dto.ts
    reset-password.dto.ts
    verify-email.dto.ts
    accept-invite.dto.ts
  strategies/
    jwt.strategy.ts         ← passport-jwt, extracts payload
    local.strategy.ts       ← passport-local, validates credentials
  auth.service.spec.ts      ← unit tests
  token.service.spec.ts     ← unit tests
```

---

## DTOs (class-validator + class-transformer)

**RegisterDto**: firstName (string, min 2), lastName (string, min 2), email (IsEmail), password (min 8, matches `/^(?=.*[A-Z])(?=.*[0-9])/`), phone? (optional string)

**LoginDto**: email (IsEmail), password (IsString, IsNotEmpty)

**RefreshDto**: refreshToken (IsString, IsNotEmpty)

**ForgotPasswordDto**: email (IsEmail)

**ResetPasswordDto**: token (IsString), password (min 8, same regex as register)

---

## Unit Tests (`auth.service.spec.ts`)

Test cases:
- `register`: creates user, org, member, returns tokens
- `register`: throws 409 on duplicate email
- `login`: returns tokens on valid credentials
- `login`: throws 401 on wrong password
- `login`: throws 403 on inactive user
- `refresh`: rotates tokens successfully
- `refresh`: throws 401 on revoked token
- `refresh`: throws 401 on expired token
- `resetPassword`: updates password, revokes all refresh tokens
- `resetPassword`: throws 400 on expired reset token

---

## Output Requirements

- All files complete, no placeholders
- Tests pass: `pnpm test auth`
- `POST /api/v1/auth/register` returns `201` with token pair
