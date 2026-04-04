# 💳 Square Payment Configuration

## ✅ Current Configuration Status

Your Square payment integration is now **fully configured** for both development and production environments!

### Development Environment (Local & Preview)
- **Application ID**: `sandbox-sq0idb-wmodH19wX_VVwhJOkrunbw`
- **Environment**: `sandbox`
- **Status**: ✅ Configured and Validated

### Production Environment
- **Application ID**: `sq0idp-ILxW5EBGufGuE1-FsJTpbg`
- **Environment**: `production`
- **Status**: ✅ Configured in Vercel

---

## 🔑 Credentials Overview

### Sandbox (Development/Testing)
```env
SQUARE_APPLICATION_ID=sandbox-sq0idb-wmodH19wX_VVwhJOkrunbw
SQUARE_ACCESS_TOKEN=REDACTED_SQUARE_TOKEN
SQUARE_ENVIRONMENT=sandbox
```

### Production (Live Payments)
```env
SQUARE_APPLICATION_ID=sq0idp-ILxW5EBGufGuE1-FsJTpbg
SQUARE_ACCESS_TOKEN=REDACTED_SQUARE_TOKEN
SQUARE_ENVIRONMENT=production
```

---

## 🚀 Quick Commands

### Verify Configuration
```bash
# Check local configuration
npm run validate:env

# Check health status
curl http://localhost:7777/api/system/health-check | grep -A5 "Payment"

# View Vercel configuration
vercel env ls | grep SQUARE
```

### Update Credentials
```bash
# Update local (edit .env.local)
nano .env.local

# Update Vercel production
echo "new-value" | vercel env add SQUARE_ACCESS_TOKEN production

# Update Vercel preview/development
echo "new-value" | vercel env add SQUARE_ACCESS_TOKEN preview development
```

---

## 🧪 Testing Payment Integration

### 1. Test in Development (Sandbox)
```bash
# Start dev server
npm run dev

# Test payment endpoint (example)
curl -X POST http://localhost:7777/api/payment/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "USD"}'
```

### 2. Sandbox Test Cards
Use these test card numbers in sandbox mode:

| Card Type | Number | CVV | ZIP |
|-----------|--------|-----|-----|
| Visa | 4111 1111 1111 1111 | Any | Any |
| Mastercard | 5105 1051 0510 5100 | Any | Any |
| Amex | 3782 822463 10005 | Any | Any |
| Discover | 6011 1111 1111 1117 | Any | Any |

### 3. Test Scenarios
- **Successful Payment**: Use any test card above
- **Declined Payment**: Use card `4000 0000 0000 0002`
- **CVV Failure**: Use card `4000 0000 0000 0127`
- **Postal Code Failure**: Use card `4000 0000 0000 0036`

---

## 📊 Square Dashboard Access

### Development (Sandbox)
- **URL**: https://developer.squareup.com/apps
- **Environment**: Sandbox
- **Use for**: Testing, development, preview deployments

### Production
- **URL**: https://squareup.com/dashboard
- **Environment**: Production
- **Use for**: Live transactions, production deployments

---

## 🔄 Environment-Specific Behavior

The application automatically uses the correct Square configuration based on the environment:

| Environment | Square Mode | Vercel Branch |
|-------------|-------------|---------------|
| Local Development | Sandbox | - |
| Vercel Preview | Sandbox | development, feature branches |
| Vercel Production | Production | main |

---

## 🛡️ Security Best Practices

1. **Never commit access tokens** to version control
2. **Rotate tokens regularly** (every 90 days recommended)
3. **Use different tokens** for development and production
4. **Monitor Square dashboard** for suspicious activity
5. **Enable webhooks** for payment notifications
6. **Implement proper error handling** for payment failures

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Payment Not Processing
```bash
# Check configuration
npm run validate:env

# Verify Square service health
curl http://localhost:7777/api/system/health-check

# Check Square credentials format
# Application ID should start with:
# - Sandbox: "sandbox-sq0idb-"
# - Production: "sq0idp-"
```

#### Invalid Credentials Error
1. Verify tokens in Square Dashboard
2. Ensure correct environment (sandbox vs production)
3. Check token hasn't expired
4. Regenerate token if necessary

#### Environment Mismatch
- Sandbox credentials won't work in production mode
- Production credentials won't work in sandbox mode
- Check `SQUARE_ENVIRONMENT` matches your credentials

---

## 📝 Implementation Files

Key files for Square integration:

```
lib/
├── services/
│   └── SquarePaymentService.ts           # Main payment processor (Square)
└── interfaces/
    ├── IPaymentProcessor.ts              # ISP: payment-only contract (processor)
    └── IPaymentService.ts                # Shared payment types (no broad interface)

app/
└── api/
    ├── payment/
    │   ├── create-intent/route.ts        # Create "intent" payload (Square SDK compatible)
    │   ├── process/route.ts              # Process payment with Square
    │   └── validate-coupon/route.ts      # Payment flow coupon validation
    └── coupons/
        ├── validate/route.ts             # Coupon validation (preferred separation)
        └── apply/route.ts                # Apply coupon (compute discounted amount)
```

---

## 🚢 Deployment Checklist

Before deploying with Square:

- [ ] ✅ Local sandbox testing complete
- [ ] ✅ Production credentials set in Vercel
- [ ] ✅ Health check shows payment service healthy
- [ ] ✅ Test transactions successful in sandbox
- [ ] Enable production mode in Square Dashboard
- [ ] Set up webhooks for payment notifications
- [ ] Configure error alerting
- [ ] Test production with small transaction

---

## 📞 Support Resources

- **Square Documentation**: https://developer.squareup.com/docs
- **Square API Reference**: https://developer.squareup.com/reference/square
- **Square Support**: https://squareup.com/help
- **Status Page**: https://status.squareup.com/

---

## ✅ Configuration Complete!

Your Square payment integration is now:
- **Configured** for both sandbox and production
- **Validated** locally with health checks
- **Deployed** to Vercel with proper credentials
- **Ready** for testing and live transactions

To test payments, use the sandbox test cards above in development mode. When ready for production, the live credentials are already configured in Vercel!