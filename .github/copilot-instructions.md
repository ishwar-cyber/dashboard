# Copilot Instructions for Shoppyness E-commerce Backend

## Overview
- Framework: Node.js + Express (ES modules)
- Current state: incremental migration from MongoDB/Mongoose to PostgreSQL using Prisma. Both data layers may still exist in the repo during migration; new work should prefer Prisma and `src/config/prisma.js`.

## Project Structure (high level)
- Entrypoint: `app.js` (no build step; run with Node/Nodemon)
- API prefix: `/api/v1/`
- Controllers: `src/controllers/*` — HTTP handlers, request/response
- Services: `src/services/*` — business logic, DB operations (prefer Prisma)
- Utilities: `src/utilities/*` — helpers (email, cloudinary, validation, sitemap, orderNumber)
- Config: `src/config/prisma.js` (Prisma client), `config/env.js` for environment constants

## Databases
- Primary (target): PostgreSQL via Prisma. Schema is in `prisma/schema.prisma` and client used via `import prisma from '../config/prisma.js'`.
- Legacy: MongoDB models and Mongoose code still remain in some places; search the repo for `models/*.js` to find remaining Mongoose usage. New code should use Prisma.

## Conventions & Patterns
- Responses: JSON shaped `{ success: boolean, message?: string, data?: any }`.
- Errors: Controllers typically wrap logic in `try/catch` and send status + message; service functions should throw errors to be handled by middleware.
- IDs: Prisma models use numeric `Int` ids (autoincrement). Validate/convert incoming ids with `Number()` before using in Prisma queries.
- Nested creates: Use Prisma nested create (e.g., create order with items and address via `items: { create: [...] }`, `address: { create: {...} }`).
- Transactions: Use `prisma.$transaction()` for atomic operations (inventory deduction, antivirus key claim, etc.).

## Auth & Roles
- JWT tokens used (Authorization: Bearer ...). Middleware located in `src/middleware/` (e.g., `tokenVerify`).
- Roles: `USER` and `ADMIN` (Prisma `Role` enum in the schema). Use role checks for admin-only endpoints.

## File Uploads
- Cloudinary is used via `src/utilities/cloudnary.js` (uploadFile/deleteFile). Controllers pass `req.file` from Multer and store `{ url, publicId }` in related image models.

## Payments & External Integrations
- Cashfree: used for order payments and refunds. Webhooks handled in `src/controllers/payment.controller.js`. Environment keys: `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_BASE_URL`, `CASHFREE_API_VERSION`.
- Shiprocket: shipping/ratings in `src/services/shipping/*`.

## Sitemaps & SEO
- Sitemap generation moved to `src/utilities/sitemap.js` (now uses Prisma to list products and categories). Serve via `src/controllers/sitemap.controllers.js`.

## Recommended Practices for Contributors
- Prefer Prisma for new data access. If you must read legacy Mongoose code, treat it as transitional.
- Keep service functions pure and testable — controllers should be thin.
- Use transactions for multi-step DB mutations that must be atomic.
- When updating image data, delete previous Cloudinary assets to avoid orphaned storage.

## Running & Testing
- Start the app:
```bash
npm install
npm start
```
- Run Prisma migrations locally when schema changes:
```bash
npx prisma migrate dev --name <migration-name>
```

## Where to look for examples
- Orders & payments: `src/controllers/order.controllers.js`, `src/controllers/payment.controller.js` (examples of nested creates and Cashfree integration).
- Cart logic: `src/services/cart.service.js` and `src/services/cart.calculater.service.js`.
- Brand/Category/SubCategory: services and controllers in `src/services/*` and `src/controllers/*` show patterns for images and counts using Prisma.

## Notes
- The repository is mid-migration: some controllers still use Mongoose models (e.g., product reviews) — verify before changing other files.
- Validate assumptions by checking `prisma/schema.prisma` and `src/config/prisma.js` when writing Prisma queries.

If you need me to update more controllers/services to Prisma style or to run the app and exercise core flows, tell me which tasks you'd like next.