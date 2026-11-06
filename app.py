import io
import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import streamlit as st
from PIL import Image, ImageStat, UnidentifiedImageError
from pricing import CATALOG, RATES, FACTORS, estimate

st.set_page_config(page_title='Revalue — Electronics resale estimator', page_icon='♻️', layout='wide')

def money(n):
    digits = str(round(n))
    if len(digits) <= 3:
        return '₹' + digits
    head, tail = digits[:-3], digits[-3:]
    groups = []
    while head:
        groups.insert(0, head[-2:])
        head = head[:-2]
    return '₹' + ','.join(groups) + ',' + tail

def setting(name):
    if os.environ.get(name):
        return os.environ[name]
    try:
        return st.secrets.get(name, '')
    except (FileNotFoundError, st.errors.StreamlitSecretNotFoundError):
        return ''

def fetch_price(model):
    endpoint = setting('PRICE_API_URL')
    if not endpoint:
        return None
    parsed = urllib.parse.urlsplit(endpoint)
    if parsed.scheme != 'https':
        raise ValueError('The configured price provider must use HTTPS.')
    query = dict(urllib.parse.parse_qsl(parsed.query))
    query.update(q=model, currency='INR')
    url = urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(query)))
    headers = {'Accept': 'application/json'}
    if setting('PRICE_API_KEY'):
        headers['Authorization'] = 'Bearer ' + setting('PRICE_API_KEY')
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=8) as response:
        data = json.loads(response.read(65536))
    price = data.get('price')
    if not isinstance(price, (int, float)) or not 100 <= price <= 10000000 or data.get('currency') != 'INR' or not data.get('source'):
        raise ValueError('The provider returned an invalid price or source.')
    checked = datetime.fromisoformat(data['checkedAt'].replace('Z', '+00:00'))
    age = (datetime.now(timezone.utc) - checked).total_seconds()
    if age < -300 or age > 7 * 86400:
        raise ValueError('The provider price is not recent. Enter a verified retailer price.')
    return price, str(data['source']), checked.isoformat()

st.markdown('### revalue. ↗')
st.caption('MORE LIFE. LESS LANDFILL.')
st.title('Old tech. New possibilities.')
st.write('Find a fair starting price for your pre-loved electronics, with every adjustment explained.')
left, right = st.columns([1.4, 1], gap='large')
with left:
    st.subheader('1 · Meet your device')
    category = st.selectbox('Device category', list(RATES))
    model_options = [m for m, (c, _) in CATALOG.items() if c == category]
    chosen = st.selectbox('Model', model_options + ['Other model'])
    model = st.text_input('Exact model and configuration', value='' if chosen == 'Other model' else chosen)
    default_price = CATALOG.get(chosen, ('', 1000))[1]
    price_key = 'price_' + chosen
    source_key = 'source_' + chosen
    source = st.session_state.get(source_key, 'Illustrative catalog price — verify before use' if chosen in CATALOG else 'User-entered reference price')
    if st.button('Look up recent price ↗', use_container_width=True):
        if not model.strip():
            st.warning('Enter the exact model first.')
        else:
            try:
                with st.spinner('Checking reference price…'):
                    quote = fetch_price(model)
                if quote:
                    st.session_state[price_key] = float(quote[0])
                    source = quote[1] + ' · checked ' + quote[2]
                    st.session_state[source_key] = source
                    st.session_state['quote_model_' + chosen] = model.strip()
                else:
                    st.info('No live provider is configured. Enter a current retailer price for this exact model. Catalog prices are illustrative.')
            except Exception:
                st.warning('Could not obtain a recent provider quote. Enter a verified current retailer price below.')
    def price_edited():
        st.session_state[source_key] = 'User-entered reference price'
    if st.session_state.get('quote_model_' + chosen, model.strip()) != model.strip():
        source = 'Reference belongs to a different model — verify and replace it'
    price = st.number_input('Current new price (INR)', min_value=100.0, max_value=10000000.0,
                            value=float(default_price), step=100.0, key=price_key, on_change=price_edited)
    st.caption(source)
    days = st.number_input('Days used', min_value=0, max_value=7300, value=365, step=1)
    st.subheader('2 · A closer look')
    st.caption('Photos are sent to this Streamlit session for image-quality checks. The app does not save them to disk or send them to a vision service.')
    files = st.file_uploader('Front, back, and visible wear · up to 4 photos', type=['jpg', 'jpeg', 'png', 'webp'], accept_multiple_files=True)
    if len(files) > 4:
        st.warning('Only the first four photos will be reviewed.')
    if files:
        columns = st.columns(min(len(files), 4))
        for i, file in enumerate(files[:4]):
            with columns[i]:
                if file.size > 8 * 1024 * 1024:
                    st.warning('Use an image under 8 MB.')
                    continue
                try:
                    with Image.open(io.BytesIO(file.getvalue())) as image:
                        if image.width * image.height > 25000000:
                            st.warning('Image is too large. Resize it below 25 megapixels.')
                            continue
                        image.load()
                        rgb = image.convert('RGB')
                        st.image(rgb, caption=file.name, use_container_width=True)
                        mean = ImageStat.Stat(rgb.resize((80, 80)).convert('L')).mean[0]
                        note = 'Low resolution' if min(image.size) < 500 else 'Too dark — add light' if mean < 55 else 'Very bright — check glare' if mean > 225 else 'Lighting looks usable'
                        st.caption(note)
                except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
                    st.warning('This image could not be read. Try another file.')
    st.info('Image-quality checks do not detect scratches or faults. Review your photos and choose a condition below.')
    condition = st.radio('Physical condition', list(FACTORS), index=1, horizontal=True)
    st.caption('Excellent: almost new · Good: light wear · Fair: visible wear · Poor: heavy wear or damage')
    st.subheader('3 · The little extras')
    battery = st.number_input('Battery health (%) · use 85 if unknown', min_value=0, max_value=100, value=90,
                               disabled=category not in ('Phone', 'Laptop', 'Tablet'))
    charger = st.checkbox('Original charger', value=True)
    box = st.checkbox('Original box', value=True)
    calculate = st.button('Find my device’s value ↗', type='primary', use_container_width=True)

signature = (category, model, price, days, condition, battery, charger, box, source)
if calculate:
    if not model.strip():
        st.error('Enter your exact model and configuration.')
    elif source.startswith('Reference belongs'):
        st.error('The model changed after lookup. Look up this model again or enter its verified price.')
    else:
        st.session_state['result'] = estimate(price, days, category, condition, battery, charger, box)
        st.session_state['result_signature'] = signature
        st.session_state['result_date'] = datetime.now(timezone.utc).isoformat()
with right:
    st.subheader('Your device’s next chapter')
    result = st.session_state.get('result')
    if not result:
        st.info('Add your device details, then calculate its estimated resale value.')
    else:
        stale = st.session_state['result_signature'] != signature
        if stale:
            st.warning('Details changed. Calculate again to update this estimate.')
        old = st.session_state['result_signature']
        st.caption(old[1])
        st.metric('Estimated resale value', money(result['value']))
        st.write(f"Expected range **{money(result['low'])} – {money(result['high'])}**")
        st.caption(f'{old[4]} condition · {old[3]} days used')
        st.divider()
        st.markdown('#### Every detail adds up')
        st.table({'Adjustment': ['New reference price', 'Age & initial depreciation', 'Physical condition', 'Battery', 'Accessories'],
                  'Amount': [money(old[2]), '−' + money(result['age_loss']), '−' + money(result['condition_loss']),
                             '−' + money(result['battery_loss']), '−' + money(result['accessory_loss'])]})
        st.progress(min(1., result['retained'] / 100), text=f"Retains about {result['retained']}% of reference value")
        st.success(f"Try listing at {money(result['listing'])} to leave room to negotiate.")
        st.caption('Reference: ' + old[8])
        st.caption('Heuristic estimate, not a guaranteed offer. The ±10% range is not statistical confidence. Local demand, repairs and internal faults may change the price.')
        report = {'model': old[1], 'category': old[0], 'reference_price': old[2], 'days_used': old[3], 'condition': old[4],
                  'battery': old[5], 'charger': old[6], 'box': old[7], 'source': old[8], 'created_at': st.session_state['result_date'],
                  'estimate': result, 'photo_assessment': 'Self-reported physical condition; image-quality checks only'}
        st.download_button('↓ Download estimate', json.dumps(report, indent=2, ensure_ascii=False), 'revalue-estimate.json',
                           mime='application/json', disabled=stale, use_container_width=True)
    with st.expander('How the simple algorithm works'):
        st.write('Reference price × 0.90 × (1 − annual depreciation)^(days / 365) × condition factor, less battery and accessory deductions.')
        st.write('Annual depreciation: phone 25%, laptop 20%, tablet 22%, console 16%, audio 28%. Condition factors: excellent 100%, good 88%, fair 70%, poor 45%.')
        st.write('Battery below 85%: deduct 0.6% per percentage point. Missing charger: 3%; missing box: 1%. Minimum retained value: 3%. Round to ₹100; range ±10%; listing +8%.')
        st.caption('Illustrative rules, not a trained model. The live lookup requires a separately configured retailer-price provider.')
st.divider()
st.caption('Good for your pocket. Better for the planet. · Revalue')
