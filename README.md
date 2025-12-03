# SATIM Payment Module

[![npm version](https://img.shields.io/npm/v/@cibpay/satim-payment-module.svg)](https://www.npmjs.com/package/@cibpay/satim-payment-module)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

A comprehensive TypeScript/JavaScript module for integrating SATIM (GIE Monétique) payment gateway in Algeria. Supports CIB and Edahabia card payments with full type safety and security.

## Features

- Complete SATIM REST API integration (register, verify, refund)
- Full TypeScript support with type definitions
- Sandbox and production environment support
- Built-in security features and HTTPS enforcement
- Comprehensive test card library for development
- Express.js middleware for webhook handling
- Detailed error handling with localized messages
- PCI-DSS compliant implementation

## Installation

```bash
npm install @cibpay/satim-payment-module
```

## Quick Start

### 1. Configuration

Create a `.env` file (never commit this):

```bash
# Get these from SATIM/GIE Monétique
SATIM_TERMINAL_ID=your_terminal_id
SATIM_USERNAME=your_username
SATIM_PASSWORD=your_password

# Your URLs
RETURN_URL=https://yoursite.com/payment/success
FAIL_URL=https://yoursite.com/payment/failed

# Environment
NODE_ENV=sandbox  # or production
```

### 2. Initialize Client

```typescript
import { SatimClient } from '@cibpay/satim-payment-module';

// Load from environment variables
const client = SatimClient.fromEnv();
```

## API Routes

### POST `/payments/create`

Create a new payment.

**Request Body:**
```json
{
  "amount": 5000,                    // Required: centimes (50.00 DZD)
  "currency": "DZD",                 // Required
  "description": "Order #12345",     // Optional
  "customerEmail": "user@email.com"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "abc123xyz",
  "paymentUrl": "https://test2.satim.dz/payment/...",
  "orderId": "ORD-1234567890",
  "amount": 5000,
  "currency": "DZD"
}
```

**Example:**
```typescript
app.post('/payments/create', async (req, res) => {
  try {
    const payment = await client.registerPayment({
      amount: req.body.amount,
      currency: req.body.currency,
      description: req.body.description,
      customerEmail: req.body.customerEmail
    });
    
    res.json({
      success: true,
      paymentId: payment.paymentId,
      paymentUrl: payment.paymentUrl
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});
```

---

### GET `/payments/:paymentId/verify`

Verify payment status after customer returns.

**URL Parameters:**
- `paymentId`: The payment ID from creation

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "paymentId": "abc123xyz",
  "orderId": "ORD-1234567890",
  "amount": 5000,
  "currency": "DZD",
  "approvalCode": "123456"
}
```

**Example:**
```typescript
app.get('/payments/:paymentId/verify', async (req, res) => {
  try {
    const verification = await client.verifyPayment(req.params.paymentId);
    
    res.json({
      success: true,
      status: verification.status,
      paymentId: verification.paymentId,
      amount: verification.amount
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});
```

---

### POST `/payments/:paymentId/refund`

Refund a completed payment.

**URL Parameters:**
- `paymentId`: The payment ID to refund

**Request Body:**
```json
{
  "amount": 5000,                  // Optional: defaults to full amount
  "reason": "Customer requested"   // Optional
}
```

**Response:**
```json
{
  "success": true,
  "refundId": "ref123xyz",
  "paymentId": "abc123xyz",
  "amount": 5000,
  "status": "refunded"
}
```

**Example:**
```typescript
app.post('/payments/:paymentId/refund', async (req, res) => {
  try {
    const refund = await client.refundPayment(
      req.params.paymentId,
      {
        amount: req.body.amount,
        reason: req.body.reason
      }
    );
    
    res.json({
      success: true,
      refundId: refund.refundId,
      status: refund.status
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});
```

---

### GET `/payments/:paymentId/status`

Get payment status without verification.

**URL Parameters:**
- `paymentId`: The payment ID

**Response:**
```json
{
  "success": true,
  "paymentId": "abc123xyz",
  "status": "completed"
}
```

**Example:**
```typescript
app.get('/payments/:paymentId/status', async (req, res) => {
  try {
    const status = await client.getPaymentStatus(req.params.paymentId);
    
    res.json({
      success: true,
      paymentId: status.paymentId,
      status: status.status
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});
```

---

### GET `/payment/return`

Customer return URL after payment (SATIM redirects here).

**Query Parameters (sent by SATIM):**
- `orderId`: Payment ID
- `respCode`: Response code
- `errorCode`: Error code (if any)
- `orderStatus`: Order status

**Example:**
```typescript
app.get('/payment/return', async (req, res) => {
  const { orderId, respCode, errorCode, orderStatus } = req.query;
  
  try {
    const verification = await client.verifyPayment(orderId);
    
    if (verification.status === 'completed') {
      res.redirect('/success');
    } else {
      res.redirect('/failed');
    }
  } catch (error) {
    res.status(400).send('Payment verification error');
  }
});
```

---

## Testing

### Sandbox Mode

Set `NODE_ENV=sandbox` in your `.env` file.

### Test Cards

| Card Number         | CVV | Password | Result                    |
|---------------------|-----|----------|---------------------------|
| 6280581110007215    | 373 | 123456   | Success                   |
| 6280581110006712    | 897 | 123456   | Blocked                   |
| 6280580610061110    | 260 | 123456   | Insufficient balance      |
| 6280581110006514    | 205 | 123456   | Wrong CVV                 |

**Expiry Date:** 01/2027 for all test cards

---

## Security

- Never expose `.env` file
- Never log credentials
- All communication over HTTPS
- PCI compliant (no card data touches your server)

---

## Payment Flow

```
1. Customer clicks "Pay"
   ↓
2. POST /payments/create → Get paymentUrl
   ↓
3. Redirect customer to paymentUrl (SATIM page)
   ↓
4. Customer enters card details on SATIM
   ↓
5. SATIM redirects to your RETURN_URL
   ↓
6. GET /payments/:paymentId/verify → Confirm payment
   ↓
7. Show success/failure message
```

---

## Error Handling

```typescript
try {
  const payment = await client.registerPayment(order);
} catch (error) {
  // Error message in French/English/Arabic
  console.error(error.message);
  
  // Handle specific cases
  if (error.message.includes('Duplicate')) {
    // Order already exists
  }
}
```

### Common Errors

| Error | Meaning |
|-------|---------|
| Duplicate order | Order number already used |
| Invalid amount | Amount < 5000 or not multiple of 100 |
| Invalid credentials | Wrong terminal/username/password |
| Payment not found | Invalid payment ID |

---

## Full Example

```typescript
import express from 'express';
import { SatimClient } from '@cibpay/satim-payment-module';

const app = express();
app.use(express.json());

const client = SatimClient.fromEnv();

// Create payment
app.post('/api/payments', async (req, res) => {
  try {
    const payment = await client.registerPayment({
      amount: req.body.amount,
      currency: 'DZD',
      description: req.body.description,
      customerEmail: req.body.email
    });

    res.json({
      success: true,
      paymentUrl: payment.paymentUrl,
      paymentId: payment.paymentId
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Verify payment
app.get('/api/payments/:id/verify', async (req, res) => {
  try {
    const verification = await client.verifyPayment(req.params.id);
    res.json({ success: true, verification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Return URL
app.get('/payment/return', async (req, res) => {
  const orderId = req.query.orderId;
  
  try {
    const verification = await client.verifyPayment(orderId);
    
    if (verification.status === 'completed') {
      res.send('Payment successful!');
    } else {
      res.send('Payment failed');
    }
  } catch (error) {
    res.status(400).send('Error verifying payment');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## Support

- **SATIM Hotline:** 3020 3020 (Algeria)
- **Documentation:** [GitHub Repository](https://github.com/yourusername/satim-payment-module)
- **Issues:** [GitHub Issues](https://github.com/yourusername/satim-payment-module/issues)

---

## License

MIT License - see LICENSE file for details

---

## Important Notes

1. **Amounts:** Always in centimes (multiply by 100)
2. **Minimum:** 5000 centimes (50 DZD)
3. **HTTPS:** Required in production
4. **Credentials:** Never commit `.env` file
5. **Verification:** Always verify payment after customer returns

---

Built for Algerian developers
