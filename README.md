# AutoShop — REAL ONLINE STARTER

This version moves orders out of browser localStorage and into a server-side persistent JSON database (`data/store.json`). It also protects Admin order management with an `ADMIN_KEY`.

## Run on a computer/server
1. Install Node.js 18+.
2. Open this folder in Terminal.
3. Set an admin key:
   - Windows PowerShell: `$env:ADMIN_KEY="your-secret-key"`
   - macOS/Linux: `export ADMIN_KEY="your-secret-key"`
4. Run: `npm start`
5. Open `http://localhost:3000`

If `ADMIN_KEY` is not set, the server uses `change-this-admin-key`; change it before any public deployment.

## What is now real
- Products are served by the server API.
- Customer orders are saved on the server, not only in browser storage.
- Each browser receives a customer session token for its orders.
- Admin order list is protected by `ADMIN_KEY`.
- Admin can advance: Order Placed → Supplier Confirmed → Packed → Shipped → Out for Delivery → Delivered.

## Still needed for a production store
- HTTPS/domain deployment
- Proper customer accounts/login
- Real database (PostgreSQL/Supabase, etc.) for scale and backups
- Real payment gateway and webhook verification
- Real supplier integrations
- Real courier integration/tracking
- Admin roles, audit logs, rate limiting and stronger security

This starter intentionally keeps Cash on Delivery enabled and does not pretend that online payment or courier delivery is live.
