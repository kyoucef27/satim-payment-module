# SATIM Test Cards for Certification

This document contains the test cards provided by SATIM for certification testing.

## Test Card List

Use these cards for testing different payment scenarios during sandbox integration:

### ✅ Valid Card
| Card Number | Expiry | CVV2 | Password | Status |
|------------|--------|------|----------|---------|
| 6280581110007215 | 01/2027 | 373 | 123456 | Valid card |

### 🔒 Blocked/Locked Cards
| Card Number | Expiry | CVV2 | Password | Status |
|------------|--------|------|----------|---------|
| 6280581110006712 | 01/2027 | 897 | 123456 | TEMPORARILY BLOCKED |
| 6280581110006316 | 01/2027 | 657 | 123456 | LOST |
| 6280581110006415 | 01/2027 | 958 | 123456 | STOLEN |

### ❌ Error Scenarios
| Card Number | Expiry | CVV2 | Password | Status/Error |
|------------|--------|------|----------|--------------|
| 6280581110006613 | 08/2027 | 411 | 123456 | Incorrect expiration date entry |
| 6280581110003927 | 01/2025 | 834 | 123456 | Card no longer exists on issuer's server |
| 6280580610061219 | 01/2027 | 049 | 123456 | Card limit exceeded |
| 6280580610061110 | 01/2027 | 260 | 123456 | Insufficient card balance |
| 6280581110006514 | 01/2027 | 205 | 123456 | Incorrect CVV2 |
| 6280580610061318 | 01/2027 | 930 | 666666 | Exceeded allowed number of passwords (3 incorrect codes) |

### ⚠️ Service Restrictions
| Card Number | Expiry | CVV2 | Password | Status |
|------------|--------|------|----------|---------|
| 6280581110007017 | 01/2027 | 632 | 123456 | Card not authorized for online payment service |
| 6280581110007116 | 01/2027 | 040 | 123456 | Card not active and valid for online payment service |

### 💳 Limit Issues
| Card Number | Expiry | CVV2 | Password | Status |
|------------|--------|------|----------|---------|
| 6280581110007314 | 01/2027 | 821 | 123456 | Terminal/Transaction amount limit exceeded (MAX FLOOR LMT / AMT) |
| 6280580610056615 | 12/2022 | 428 | 123456 | Expired card |

### ✅ Credit Card (Valid)
| Card Number | Expiry | CVV2 | Password | Status |
|------------|--------|------|----------|---------|
| 6280580610061011 | 01/2027 | 992 | 123456 | Valid credit |

## Testing Guidelines

### Recommended Test Sequence

1. **Success Flow** - Use `6280581110007215`
   - Create payment
   - Complete payment with valid card
   - Verify success status
   - Test refund

2. **Insufficient Funds** - Use `6280580610061110`
   - Create payment
   - Attempt payment
   - Verify declined status

3. **Blocked Card** - Use `6280581110006712`
   - Create payment
   - Attempt payment
   - Verify blocked card error

4. **Incorrect CVV** - Use `6280581110006514`
   - Create payment
   - Enter incorrect CVV
   - Verify CVV error

5. **Expired Card** - Use `6280580610056615`
   - Create payment
   - Attempt payment
   - Verify expiration error

## Important Notes

⚠️ **These cards only work in the sandbox environment (https://test2.satim.dz)**

⚠️ **Always use the correct password for each card (usually 123456, except where noted)**

⚠️ **Document all test results for SATIM certification submission**

## SATIM Sandbox Credentials

From SATIM documentation:

```
Username: your_sandbox_username
Password: your_sandbox_password
Terminal ID: your_sandbox_terminal_id
```

## Test Payment Amounts

Remember: Amounts must be in centimes and multiples of 100, minimum 5000 (50 DA)

```typescript
// Examples:
50.00 DA = 5000 centimes
100.00 DA = 10000 centimes
500.00 DA = 50000 centimes
```

## API URLs

**Sandbox (Test):**
```
https://test2.satim.dz/payment/rest
```

**Production:**
```
https://satim.dz/payment/rest
```

## Next Steps for Certification

1. ✅ Test all card scenarios
2. ✅ Document results with screenshots
3. ✅ Test refund functionality
4. ✅ Verify all error handling
5. ✅ Submit test reports to SATIM

---

**For certification support, contact SATIM/GIE Monétique**
