# ع الحلة — System Architecture & Delivery Plan

Last reviewed: 2026-11-05

## 1. Current verified architecture

### Customer storefront
- Static GitHub Pages site: `https://3al7ella.github.io`
- Main source: `index.html`
- Customer orders are written to Firebase Firestore collection `orders` through `fb.js`.
- Customer tracking reads the Firestore order document.
- The storefront order payload currently includes fields such as `name`, `phone`, `area`, `addr`, `when`, `pay`, `items`, `sub`, `delivery`, `total`, and `status`.

### Kitchen / order operations
- Admin page: `admin.html`
- Uses Firebase Authentication and Firestore.
- Reads Firestore orders in real time and updates their operational status.
- Current order statuses include new, confirmed, cooking, out, delivered, and cancelled.
- Prep view aggregates ordered item quantities by delivery day.

### Accounting / management
- Admin accounting page: `accounts.html`
- Uses Supabase Auth and the `alhella-import` Edge Function.
- Owner authorization is checked against `alhella_allowed_emails` with role `owner`.
- Business records are stored in `public.alhella_records`, keyed by `collection, record_id`.
- Verified collections: orders, expenses, stockMoves, stockItems, labor, custody, months, catalog, staff, config.
- The accounting UI currently has separate entry screens for orders, expenses, stock movements, labor, and custody.

## 2. Critical integration finding

The storefront / kitchen workflow and accounting workflow currently use different backends:
- Storefront and kitchen operations: Firebase Firestore.
- Accounting and inventory ledger: Supabase.

The code reviewed confirms Firebase order creation and Firebase operational updates, while the accounting screen loads its records from Supabase. A reliable automatic synchronization contract between these two systems has not yet been implemented and verified. Therefore, do not assume a website order or a kitchen status change automatically updates the accounting ledger.

The next integration must be idempotent and traceable:
1. Preserve the Firestore document ID as an external source ID in the Supabase record.
2. Use an upsert key so repeated syncs never duplicate an order.
3. Map the Firestore order fields into the accounting model without guessing delivery date, area, payment state, or delivery cost.
4. Keep operational status changes synchronized without overwriting accounting-only fields.
5. Log sync time, result, and any rejected or incomplete records.
6. Reconcile counts and totals before enabling automatic sync in production.

## 3. Closed-month protection

Owner decision recorded: October 2026 is closed permanently unless the owner explicitly authorizes a correction.

Protection now exists at two layers:
- `accounts.html`: October records are visibly marked locked; edit/delete controls are hidden; new records dated October are blocked; labor close for October is blocked; October rows are skipped during backup import.
- `alhella-import` Edge Function: save, delete, and import requests containing October records are rejected server-side.

The November 2026 month remains open. Do not close it without explicit owner approval.

## 4. Staff identity and accounting rules

- مُني and أم حمزة are the same person and must not be counted twice.
- The staff master record currently contains a worker named أم حمزة with a daily rate of 150 EGP.
- Other active staff and monthly rates are stored in the staff collection. The staff rules and current payroll records must be reconciled before automating payroll.
- Courier accounts are not to be treated as kitchen labor; courier costs are reported separately using the approved area-based delivery rule.
- Monthly 10% profit share for أم حمزة is a separate month-end calculation and must not be mixed into daily wages.

Do not auto-generate historical attendance or payroll entries until the current payroll rules, absences, and already-paid periods have been reconciled.

## 5. Payroll and leave operating rules

- Fixed monthly wages are managed as period-based entitlements, not repeated daily wage expense entries.
- The owner explicitly reports each employee's leave/absence and date. No absence is inferred from missing attendance records.
- Only owner-reported leave can create a payroll deduction.
- Weekly settlement closes Thursday for the Friday-to-Thursday period and creates one reviewed labor-expense settlement.
- Month-end settlement closes monthly-paid staff after applying only explicitly reported leave and creates one reviewed labor-expense settlement.
- Track entitlement, leave deductions, amount paid, remaining balance, and payment date separately.
- Do not retroactively generate settlements or rewrite historical payroll. Set a controlled go-live date after opening balances are reconciled.

## 6. Delivery and order accounting rules

- Wardian delivery cost: 30 EGP per order.
- Outside Wardian delivery cost: 75 EGP per order.
- Courier names and courier settlements are excluded from accounting reports.
- Weekly delivery reporting is Monday through Sunday.
- A non-empty address containing الورديان is treated as Wardian; another non-empty address is outside Wardian; an empty address is unknown unless the order contains an explicit area classification.

## 7. Delivery roadmap

### Phase A — Protect and stabilize
- [x] Inspect existing GitHub, Firebase, and Supabase architecture.
- [x] Preserve October 2026 as a locked accounting period in the UI and Edge Function.
- [x] Confirm existing records remain present after code changes.
- [ ] Test the live UI with an owner session and confirm locked rows cannot be changed through normal screens.
- [ ] Review backups and restore procedure.

### Phase B — Reconcile the data model
- [ ] Define a canonical order schema shared by storefront, kitchen, and accounting.
- [ ] Map all Firebase order fields to accounting fields.
- [ ] Identify duplicate or missing order IDs and reconcile November totals.
- [ ] Normalize staff IDs and aliases without deleting history.
- [ ] Separate delivery cost, customer delivery charge, and courier settlement.

### Phase C — Reliable synchronization
- [ ] Add authenticated, idempotent Firebase-to-Supabase order synchronization.
- [ ] Sync kitchen status changes and delivery outcomes.
- [ ] Add a sync log and a reconciliation report.
- [ ] Add retry handling for transient failures without creating duplicates.

### Phase D — Kitchen and inventory workflow
- [ ] Link each order to a preparation ticket.
- [ ] Build daily production totals and prep status.
- [ ] Link ingredient consumption to approved recipes / bill of materials.
- [ ] Record purchases, stock receipts, waste, transfers, and physical counts distinctly.
- [ ] Calculate stock balances from movements, with a controlled stocktake adjustment process.

### Phase E — Financial management and owner dashboard
- [ ] Build a transparent month profit calculation from sales, consumed stock cost, labor, delivery, rent, packaging allocation, and approved adjustments.
- [ ] Calculate the monthly 10% profit share only after the month is reconciled.
- [ ] Add receivables, supplier balances, cash / wallet / InstaPay reconciliation, and custody balances.
- [ ] Provide owner KPIs and exception alerts on mobile.

## 8. Safety and release rules

- No destructive schema or data changes without a verified backup and a rollback path.
- No edits to October 2026 records.
- No automatic month closing.
- No payroll generation or staff identity merging until historical records are reconciled.
- No claims of automatic order synchronization until an end-to-end test proves the same order appears once in both systems and subsequent status updates are reflected.
- Test on a small, controlled sample before enabling production-wide automation.
