# pritypriya for Streamlit

Electronics resale estimates with transparent, basic depreciation rules, photo-quality checks, and downloadable estimates.

## Local run

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

## Streamlit Community Cloud

1. Push this directory to a GitHub repository.
2. Sign in at https://share.streamlit.io/ with the account that can access it.
3. Create an app, select the repository and branch, and set the entrypoint to `app.py`.
4. Deploy. Streamlit supplies the final `.streamlit.app` URL.

No secret is needed for sample/manual pricing. For live prices, configure `PRICE_API_URL` and optionally `PRICE_API_KEY` in Streamlit's app secrets. Do not commit secrets. The HTTPS endpoint accepts `?q=<model>&currency=INR` and returns a JSON object with numeric `price`, `currency: "INR"`, a `source` identifying the exact variant, and ISO `checkedAt`. Quotes must be no older than seven days.

Catalog prices are illustrative. There is no bundled live retailer integration. Physical condition is self-reported. Photos are uploaded to the Streamlit session for brightness/resolution checks; this app does not write them to disk or send them to a vision provider. Checks cannot detect damage or internal faults.

The original Node.js app is retained separately. This edition uses Python because Streamlit requires a Python entrypoint.

## Checks

```sh
python -m unittest test_pricing.py
python test_app.py
```
