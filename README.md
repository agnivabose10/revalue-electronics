# pritipriya — JavaScript UI + Node.js

A responsive electronics resale estimator with bundled phone/laptop photography, photo previews, transparent pricing adjustments, and downloadable estimates. The main website is vanilla HTML/CSS/JavaScript, served by a dependency-free Node.js backend.

## Deploy to Render

[Deploy on Render](https://render.com/deploy?repo=https://github.com/agnivabose10/revalue-electronics)

The included `render.yaml` creates a free Node web service named `pritipriya`. Authorize GitHub, review the Blueprint, and deploy. Render supplies the final `.onrender.com` URL; the name may require a suffix if already taken. The free service can sleep when idle, so its first request may be slower.

For a manual Web Service configuration:

- Repository: `agnivabose10/revalue-electronics`
- Branch: `main`
- Runtime: Node
- Root directory: leave blank
- Build command: `npm ci`
- Start command: `npm start`
- Health check: `/health`
- Plan: Free

The server binds `0.0.0.0` and uses Render's `PORT` environment variable.

## Run locally

Use Node.js 24:

```sh
npm ci
npm start
```

Open http://localhost:3000. Run `npm test` for pricing, API, health, and image-serving checks.

## Current price lookup

Bundled catalog prices are **illustrative, not live quotes**. A user can enter a verified current retailer price for any exact model and configuration.

For live lookup, set `PRICE_API_URL` and optionally the secret `PRICE_API_KEY` in the Render dashboard. No paid price provider is bundled. The trusted HTTPS endpoint accepts `GET ?q=<model>&currency=INR`. The backend adds `Authorization: Bearer <PRICE_API_KEY>` when configured. Expected JSON:

```json
{
  "price": 59900,
  "currency": "INR",
  "source": "Retailer name / exact model and storage",
  "checkedAt": "2026-11-06T09:00:00Z"
}
```

Prices must have a timestamp within the last seven days. Provider keys stay on the server. Never commit `.env` files.

## Simple pricing algorithm

Reference × 0.90 × (1 − annual depreciation)^(days / 365) × condition factor, less battery/accessory deductions. Annual rates: phone 25%, laptop 20%, tablet 22%, console 16%, audio 28%. Condition factors: excellent 100%, good 88%, fair 70%, poor 45%. Battery below 85% deducts 0.6% per percentage point; missing charger 3%, missing box 1% of condition-adjusted value. Minimum 3% of reference. Round to ₹100, display ±10% range, and suggest a listing price +8%.

These are adjustable heuristics, not a trained model or statistical confidence interval. Repairs, market demand and internal faults may change actual offers.

## Photos and design

Uploaded device photos remain in the browser and are not sent to the Node backend. Canvas checks brightness and resolution only. Physical condition is self-reported; the app does not automatically detect scratches or broken components.

Bundled decorative phone and laptop photographs are credited in `public/assets/CREDITS.md`; they do not represent a visitor's exact device.

## Earlier Streamlit version

The Python edition remains in `app.py`, `pricing.py`, `design.py`, `assets/`, and `.streamlit/`. It is not used by the Render Node service. To run it separately: `pip install -r requirements.txt` then `streamlit run app.py`.
