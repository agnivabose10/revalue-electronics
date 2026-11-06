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

Open http://localhost:3000. Run `npm test` for pricing, live-provider filtering/caching, API, health, and image-serving checks.

## Live prices for any brand/model

The brand and model fields accept free text: they are not limited to the example suggestions. Brand suggestions cover major phone, laptop, tablet, console and audio manufacturers; any other company can also be typed. Example model suggestions do not contain prices.

### Enable Google Shopping search on Render

1. Create a SerpAPI account at https://serpapi.com/ and obtain your API key. Check its current pricing and query allowance before choosing a plan.
2. Open your Render service → **Environment** → **Add Environment Variable**.
3. Set `SERPAPI_API_KEY` to your private key, then save and deploy.
4. Reload the site and enter a brand plus exact model/storage/RAM. Search starts after a 1.4-second typing pause; **Search prices** also starts it immediately.

The server uses SerpAPI's `google_shopping` engine with India locale. It accepts only INR listings, filters explicit used/refurbished products and common accessory listings, and requires model-token matches. It fills an exact storage/configuration match automatically when unambiguous. Otherwise, choose **Use this price** beside the matching retailer listing. The selected price, retailer link, and retrieval time are shown and included in estimate downloads. Verify stock, condition, tax and checkout price on the listing.

No external service can guarantee listings for every model ever produced. Older/discontinued devices may have no new retail listings, and search results can omit or misidentify variants. When no match is available, the site requests a verified manual price. It never substitutes an illustrative catalog price for a live price.

The app caches searches in memory for one hour (up to 256 entries), coalesces simultaneous identical searches, and limits uncached provider calls to 30 per minute per Node process. This reduces duplicate calls but is not a complete public-service abuse control; set provider usage limits before sharing widely. Provider keys are used only on the server. No SerpAPI account, paid plan or key is bundled or created by this repository.

### Alternative custom price service

If `SERPAPI_API_KEY` is absent, you can instead set `PRICE_API_URL` and optionally secret `PRICE_API_KEY` in Render. The trusted HTTPS endpoint accepts `GET ?q=<model>&category=<category>&currency=INR`, with an optional Bearer key. Expected response:

```json
{
  "price": 59900,
  "currency": "INR",
  "source": "Retailer name / exact model and storage",
  "checkedAt": "2026-11-06T09:00:00Z",
  "url": "https://retailer.example/product"
}
```

The custom provider must match the exact model and configuration. Quotes older than seven days are rejected. Without either provider, users can still enter any model and a verified current price manually. Never commit keys or `.env` files.

## Simple pricing algorithm

Reference × 0.90 × (1 − annual depreciation)^(days / 365) × condition factor, less battery/accessory deductions. Annual rates: phone 25%, laptop 20%, tablet 22%, console 16%, audio 28%. Condition factors: excellent 100%, good 88%, fair 70%, poor 45%. Battery below 85% deducts 0.6% per percentage point; missing charger 3%, missing box 1% of condition-adjusted value. Minimum 3% of reference. Round to ₹100, display ±10% range, and suggest a listing price +8%.

These are adjustable heuristics, not a trained model or statistical confidence interval. Repairs, market demand and internal faults may change actual offers.

## Photos and design

Uploaded device photos remain in the browser and are not sent to the Node backend. Canvas checks brightness and resolution only. Physical condition is self-reported; the app does not automatically detect scratches or broken components.

Bundled decorative phone and laptop photographs are credited in `public/assets/CREDITS.md`; they do not represent a visitor's exact device.

## Earlier Streamlit version

The Python edition remains in `app.py`, `pricing.py`, `design.py`, `assets/`, and `.streamlit/`. It is not used by the Render Node service. To run it separately: `pip install -r requirements.txt` then `streamlit run app.py`.
