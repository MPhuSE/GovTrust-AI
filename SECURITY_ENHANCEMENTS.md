# Security Enhancements - Registration Flow

## Overview
Enhanced password security, validation, and PII protection for the GovTrust-AI registration system.

## Changes Made

### 1. Password Security Strengthening

#### Backend (`apps/core-svc/src/modules/auth/`)

**DTOs (`dto/auth.dto.ts`)**:
- Increased minimum password length: 6 → 8 characters
- Added regex validation requiring:
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)  
  - At least 1 digit (0-9)
  - At least 1 special character (@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/])
- Added custom validation messages in Vietnamese

**Auth Service (`auth.service.ts`)**:
- Increased bcrypt rounds: 10 → 12 (stronger hashing)
- Added `validatePasswordStrength()` method for server-side validation
- Applied to both `register()` and `registerWithEkyc()` methods

#### Frontend (`apps/web/src/app/register/page.tsx`)

- Updated minimum password validation: 6 → 8 characters
- Added client-side password strength validation matching backend rules
- Updated hint text: "Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
- Provides immediate feedback before form submission

### 2. PII Hashing in Database

**Implementation (`auth.service.ts`)**:

Added `hashPii()` function using SHA-256 one-way hashing:
```typescript
function hashPii(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
```

**Fields Hashed in `users` Collection**:
- `cccdNumber` (CCCD number) - hashed before storage
- `cccdOriginLocation` (origin address) - hashed before storage
- `cccdRecentLocation` (recent address) - hashed before storage

**Fields NOT Hashed** (retained for display/functionality):
- `cccdFullName` - needed for display
- `cccdBirthDay` - date of birth
- `cccdGender` - gender
- `cccdNationality` - nationality
- `cccdValidDate` - CCCD expiration date

**Profile Retrieval (`getProfile()`)**:
- Returns `'***'` placeholder for hashed fields
- Cannot reverse-engineer original values from hash
- Prevents PII exposure in API responses

### 3. Username Auto-Fill from CCCD

**Frontend**:
- Removed manual username input field
- Added info box: "💡 Tên đăng nhập sẽ là số CCCD của bạn sau khi xác thực"
- Username no longer sent in registration FormData

**Backend**:
- `RegisterDto.username` marked as optional
- `registerWithEkyc()` automatically uses CCCD number as username if not provided
- Validates CCCD extraction before proceeding
- Returns unhashed CCCD in registration response for immediate display

## Security Benefits

### 1. Password Security
- **Stronger passwords**: 8+ chars with mixed case, numbers, and special chars
- **Harder to crack**: Bcrypt rounds increased from 2^10 to 2^12 iterations
- **Defense in depth**: Validation at both client and server layers

### 2. PII Protection
- **Data minimization**: Sensitive PII (CCCD number, addresses) hashed one-way
- **Breach mitigation**: Even if database is compromised, cannot reverse hashes to original PII
- **Compliance**: Aligns with GDPR/privacy best practices for sensitive data

### 3. User Experience
- **Simplified registration**: No need to create username (auto-filled)
- **Clear guidance**: Password requirements shown upfront
- **Immediate feedback**: Client-side validation prevents server round-trips

## Migration Notes

**Existing users**: Already-registered users with plaintext CCCD data in the database will continue to work. New registrations will have hashed PII.

**Optional migration script**: To hash existing PII in the database, create a migration script that:
1. Fetches all users with plaintext `cccdNumber`
2. Hashes sensitive fields
3. Updates documents in place

## Testing Checklist

- [ ] Register new user with weak password → should fail validation
- [ ] Register with strong password (8+ chars, mixed case, number, special) → success
- [ ] Verify CCCD number is hashed in MongoDB `users` collection
- [ ] Verify addresses are hashed in MongoDB
- [ ] Call GET /auth/me → verify sensitive fields show `'***'`
- [ ] Login with CCCD number as username → should work
- [ ] Verify bcrypt hash strength (should take noticeably longer to hash)

## Future Enhancements

- [ ] Add password history (prevent reuse of last N passwords)
- [ ] Implement password expiration policy
- [ ] Add rate limiting on login attempts
- [ ] Add 2FA/MFA support
- [ ] Implement account lockout after failed attempts
- [ ] Add audit logging for PII access
