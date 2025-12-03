# Testing SATIM Payment Module with HTTPS

## Method 1: Using ngrok (Recommended - Easiest)

### Step 1: Install ngrok
```bash
# Download from https://ngrok.com/download
# Or using chocolatey on Windows:
choco install ngrok

# Or using npm:
npm install -g ngrok
```

### Step 2: Start your Express server
```bash
# Using npm script (recommended)
npm run start:express

# OR if you want to build first:
npm run build
npx ts-node examples/express-server.ts

# Server runs on http://localhost:3000
```

### Step 3: Create HTTPS tunnel with ngrok
```bash
ngrok http 3000
```

You'll get output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

### Step 4: Update your .env with ngrok URL
```env
RETURN_URL=https://abc123.ngrok.io/payment/return
FAIL_URL=https://abc123.ngrok.io/payment/failed
```

### Step 5: Test the payment flow
```bash
# Create a payment
curl -X POST https://abc123.ngrok.io/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "DZD",
    "customerEmail": "test@example.com",
    "description": "Test payment"
  }'
```

---

## Method 2: Using LocalTunnel (Alternative)

### Step 1: Install localtunnel
```bash
npm install -g localtunnel
```

### Step 2: Start your server
```bash
npm run start:express
```

### Step 3: Create tunnel
```bash
lt --port 3000 --subdomain mycibpay
# Your URL: https://mycibpay.loca.lt
```

---

## Method 3: Self-Signed SSL Certificate (Development Only)

### Step 1: Generate SSL certificate
```bash
# Using OpenSSL (install from https://slproweb.com/products/Win32OpenSSL.html)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### Step 2: Create HTTPS Express server
Create `examples/express-server-https.ts`:

```typescript
import express from 'express';
import https from 'https';
import fs from 'fs';
import { SatimClient } from '../src';

const app = express();
app.use(express.json());

// Initialize SATIM client
const satimClient = SatimClient.fromEnv();

// Your routes here...
app.post('/api/payments/create', async (req, res) => {
  try {
    const { amount, currency, customerEmail, description } = req.body;
    
    const payment = await satimClient.registerPayment({
      orderId: `ORDER_${Date.now()}`,
      amount,
      currency: currency || 'DZD',
      customerEmail,
      description,
    });

    res.json({
      success: true,
      payment: {
        paymentId: payment.paymentId,
        paymentUrl: payment.paymentUrl,
        orderId: payment.orderId,
        amount: payment.amount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Payment failed',
    });
  }
});

// HTTPS Server
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const PORT = 3000;
https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
});
```

### Step 3: Run the HTTPS server
```bash
npx ts-node examples/express-server-https.ts
```

**Note**: Browsers will show a warning for self-signed certificates. Click "Advanced" → "Proceed to localhost".

---

## Method 4: Using Cloudflare Tunnel (Free & Permanent URL)

### Step 1: Install cloudflared
```bash
# Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### Step 2: Start tunnel
```bash
cloudflared tunnel --url http://localhost:3000
```

You'll get a URL like: `https://xyz.trycloudflare.com`

---

## Complete Test Script

Create `test-payment.ps1`:

```powershell
# Start the Express server in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run build; node dist/examples/express-server.js"

# Wait for server to start
Start-Sleep -Seconds 3

# Start ngrok tunnel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 3000"

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "1. Copy the ngrok HTTPS URL from the ngrok window"
Write-Host "2. Update .env RETURN_URL and FAIL_URL with that URL"
Write-Host "3. Restart the Express server"
Write-Host "4. Visit the ngrok URL to test"
```

Run it:
```bash
.\test-payment.ps1
```

---

## Testing Checklist for SATIM Certification

### Pre-Payment Page Requirements

- [ ] **SSL Certificate**: Site has valid HTTPS certificate
- [ ] **Amount Display**: Final amount shown prominently (bold, large font)
  ```html
  <p style="font-size: 24px; font-weight: bold; color: #000;">
    Montant : 5966.56 DZD
  </p>
  ```

- [ ] **CAPTCHA**: reCAPTCHA or similar on payment button page
  ```html
  <script src="https://www.google.com/recaptcha/api.js"></script>
  <div class="g-recaptcha" data-sitekey="YOUR_SITE_KEY"></div>
  ```

- [ ] **CIB Logo**: On payment button
  ```html
  <button>
    <img src="/cib-logo.png" alt="CIB" />
    Payer par CIB
  </button>
  ```

- [ ] **Terms & Conditions**: Display with checkbox
  ```html
  <input type="checkbox" required /> 
  J'accepte les conditions générales de paiement
  ```

### Payment Return Page Requirements

#### For Successful Payment (respCode: "00", ErrorCode: "0", OrderStatus: 2)

- [ ] Display `respCode_desc` from params
- [ ] Display `orderId` (SATIM transaction ID)
- [ ] Display `orderNumber` (Your order number)
- [ ] Display `approvalCode` (Authorization code)
- [ ] Display transaction date/time
- [ ] Display amount with currency
- [ ] Display payment method (CIB/EDAHABIA)
- [ ] Show SATIM support: "3020 3020"
- [ ] Enable receipt printing
- [ ] Enable PDF download
- [ ] Enable email sending

#### For Rejected Payment (OrderStatus: 3)

- [ ] Display: "Votre transaction a été rejetée / Your transaction was rejected / تم رفض معاملتك"
- [ ] Show SATIM support: "3020 3020"

#### For Other Errors

- [ ] Display `respCode_desc` or `actionCodeDescription`
- [ ] Show SATIM support: "3020 3020"

---

## Example Payment Return Page

Create `examples/payment-return-page.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Résultat du Paiement - SATIM</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; }
    .error { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px; }
    .amount { font-size: 28px; font-weight: bold; color: #155724; margin: 20px 0; }
    .detail { margin: 10px 0; font-size: 16px; }
    .label { font-weight: bold; }
    .support { background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .actions { margin-top: 30px; }
    .btn { padding: 12px 24px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
    .btn-primary { background: #007bff; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
  </style>
</head>
<body>
  <div id="result"></div>

  <script>
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    const orderStatus = params.get('orderStatus');
    const errorCode = params.get('errorCode');
    const respCode = params.get('respCode');

    // Fetch transaction details
    fetch(`/api/payments/verify?paymentId=${orderId}`)
      .then(res => res.json())
      .then(data => {
        const resultDiv = document.getElementById('result');
        
        if (errorCode === '0' && orderStatus === '2') {
          // Successful payment
          resultDiv.innerHTML = `
            <div class="success">
              <h1>✓ Paiement Accepté</h1>
              <p class="amount">Montant : ${(data.amount / 100).toFixed(2)} DZD</p>
              
              <div class="detail">
                <span class="label">Transaction ID:</span> ${data.orderId}
              </div>
              <div class="detail">
                <span class="label">Numéro de commande:</span> ${data.orderNumber}
              </div>
              <div class="detail">
                <span class="label">Code d'autorisation:</span> ${data.approvalCode}
              </div>
              <div class="detail">
                <span class="label">Date/Heure:</span> ${new Date().toLocaleString('fr-DZ')}
              </div>
              <div class="detail">
                <span class="label">Mode de paiement:</span> CIB/EDAHABIA
              </div>
              <div class="detail">
                <span class="label">Status:</span> ${data.actionCodeDescription}
              </div>

              <div class="support">
                <strong>Support SATIM:</strong> En cas de problème, contactez le 3020 3020
              </div>

              <div class="actions">
                <button class="btn btn-primary" onclick="window.print()">
                  🖨️ Imprimer le reçu
                </button>
                <button class="btn btn-primary" onclick="downloadPDF()">
                  📥 Télécharger PDF
                </button>
                <button class="btn btn-secondary" onclick="sendEmail()">
                  📧 Envoyer par email
                </button>
              </div>
            </div>
          `;
        } else if (orderStatus === '3') {
          // Rejected payment
          resultDiv.innerHTML = `
            <div class="error">
              <h1>✗ Transaction Rejetée</h1>
              <p>Votre transaction a été rejetée</p>
              <p>Your transaction was rejected</p>
              <p>تم رفض معاملتك</p>

              <div class="support">
                <strong>Support SATIM:</strong> En cas de problème, contactez le 3020 3020
              </div>
            </div>
          `;
        } else {
          // Other errors
          resultDiv.innerHTML = `
            <div class="error">
              <h1>✗ Erreur de Paiement</h1>
              <p>${data.respCode_desc || data.actionCodeDescription || 'Erreur inconnue'}</p>

              <div class="support">
                <strong>Support SATIM:</strong> En cas de problème, contactez le 3020 3020
              </div>
            </div>
          `;
        }
      });

    function downloadPDF() {
      window.location.href = `/api/payments/receipt/${orderId}/pdf`;
    }

    function sendEmail() {
      const email = prompt('Adresse email:');
      if (email) {
        fetch(`/api/payments/receipt/${orderId}/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }).then(() => alert('Email envoyé!'));
      }
    }
  </script>
</body>
</html>
```

---

## Quick Start Commands

```bash
# 1. Install ngrok
npm install -g ngrok

# 2. Start server
npm run start:express
# Server runs on http://localhost:3000

# 3. In another terminal, start ngrok
ngrok http 3000

# 4. Copy the HTTPS URL and update .env
# Example: https://abc123.ngrok.io

# 5. Restart server to load new .env

# 6. Test payment creation
curl -X POST https://abc123.ngrok.io/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"customerEmail":"test@example.com","description":"Test"}'
```

---

## Production Deployment Checklist

When deploying to production:

- [ ] Use real SSL certificate (Let's Encrypt, Cloudflare, etc.)
- [ ] Set `NODE_ENV=production` in .env
- [ ] Use production SATIM credentials
- [ ] Update `RETURN_URL` and `FAIL_URL` to production domain
- [ ] Test all 27 card scenarios from SATIM checklist
- [ ] Implement proper error handling
- [ ] Set up logging and monitoring
- [ ] Create backup of transaction logs
- [ ] Implement rate limiting
- [ ] Add CAPTCHA on payment page
- [ ] Display CIB logo on payment button
- [ ] Show terms and conditions with checkbox
- [ ] Enable receipt printing/download/email

---

**Need Help?**

For SATIM API issues: Contact SATIM Support at 3020 3020
For technical integration: Check `docs/SATIM_API.md`
