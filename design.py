import base64
from functools import lru_cache
from pathlib import Path
import streamlit as st

ASSETS = Path(__file__).parent / 'assets'

@lru_cache(maxsize=2)
def photo(name):
    return 'data:image/jpeg;base64,' + base64.b64encode((ASSETS / (name + '.jpg')).read_bytes()).decode('ascii')

def render_header():
    st.markdown('''<style>
    .stApp {background:#f6f7f1;color:#253c33;}
    .block-container {max-width:1240px;padding-top:2rem;padding-bottom:3rem;}
    h1,h2,h3 {letter-spacing:-.04em;}
    [data-testid="stHeadingWithActionElements"] h3 {font-size:1.35rem;}
    .pp-nav {display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #dce4d7;padding:8px 0 23px;margin-bottom:30px;gap:16px;}
    .pp-logo {font-size:27px;font-weight:800;letter-spacing:-1px;display:flex;align-items:center;gap:10px;}
    .pp-logo b {background:#254435;color:#c7f17b;width:35px;height:35px;display:grid;place-items:center;border-radius:10px;font-size:23px;}
    .pp-nav-note {font-size:12px;color:#71836b;}
    .pp-hero {display:grid;grid-template-columns:1.05fr 1fr;gap:40px;align-items:center;margin:15px 0 35px;}
    .pp-kicker {font-size:10px;letter-spacing:2px;font-weight:700;color:#65834e;margin-bottom:20px;}
    .pp-title {font-size:clamp(38px,4.4vw,60px);font-weight:750;line-height:1.08;letter-spacing:-3px;margin:0 0 20px;}
    .pp-title span {color:#859e72;}
    .pp-intro {font-size:15px;line-height:1.8;color:#73806d;max-width:390px;margin-bottom:22px;}
    .pp-tags {display:flex;gap:8px;flex-wrap:wrap;}
    .pp-tags span {font-size:10px;border:1px solid #d9e2ce;border-radius:20px;padding:7px 11px;background:#fff;}
    .pp-collage {display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:center;position:relative;padding:10px 0;}
    .pp-photo {overflow:hidden;border-radius:20px;background:#e6ecdf;position:relative;box-shadow:0 12px 30px #2941250b;}
    .pp-photo img {display:block;width:100%;height:290px;object-fit:cover;}
    .pp-photo:first-child {transform:rotate(-4deg);margin-top:30px;}
    .pp-photo:last-child {transform:rotate(4deg);margin-top:-25px;}
    .pp-photo:last-child img {object-position:50% 50%;height:270px;}
    .pp-photo-label {position:absolute;bottom:12px;left:12px;right:12px;background:#ffffffed;border-radius:10px;padding:11px 12px;font-size:11px;color:#2b4433;}
    .pp-photo-label strong {display:block;font-size:13px;margin-bottom:3px;}
    .pp-photo-label span {font-size:9px;color:#7a8d70;}
    .pp-flow {display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #dce4d4;background:#edf2e5;border-radius:14px;padding:18px 23px;gap:18px;margin:0 0 34px;}
    .pp-flow-item {display:flex;align-items:center;gap:12px;}
    .pp-flow-item b {width:29px;height:29px;border:1px solid #c9d5b8;border-radius:50%;display:grid;place-items:center;font-size:10px;color:#6a834e;flex-shrink:0;}
    .pp-flow-item strong {display:block;font-size:12px;font-weight:600;}
    .pp-flow-item span {font-size:10px;color:#809172;}
    .st-key-device-form,.st-key-estimate-panel {background:#fff;border-radius:18px!important;border-color:#dfe6d9!important;padding:22px!important;box-shadow:0 8px 24px #25412b04;}
    [data-testid="stWidgetLabel"] p {font-size:13px;font-weight:500;}
    [data-testid="stNumberInputContainer"],[data-baseweb="select"]>div {border-radius:9px;}
    [data-testid="stFileUploaderDropzone"] {background:#f5f8ee;border:1px dashed #bbcba7;border-radius:12px;}
    button[kind="primary"] {background:#c7f17b!important;color:#254132!important;border:0!important;min-height:49px;font-weight:650;}
    [data-testid="stMetric"] {background:#254435;color:#edf6e5;padding:25px;border-radius:14px;}
    [data-testid="stMetricLabel"] {color:#c1d1b6;}
    [data-testid="stMetricValue"] {color:#d4f59b;font-size:43px;letter-spacing:-1.5px;}
    .pp-preview {position:relative;overflow:hidden;border-radius:13px;margin:0 0 19px;background:#e7edde;}
    .pp-preview img {width:100%;height:200px;object-fit:cover;display:block;}
    .pp-preview div {position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,#1d352bed);padding:35px 18px 16px;color:white;}
    .pp-preview strong {font-size:18px;letter-spacing:-.5px;display:block;}
    .pp-preview span {font-size:10px;color:#e0ebd7;}
    .pp-tip {background:#edf4e2;border-radius:12px;padding:17px;margin:20px 0 4px;}
    .pp-tip strong {font-size:12px;}.pp-tip p {font-size:11px;color:#728268;line-height:1.8;margin:6px 0 0;}
    .pp-footer {display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:11px;color:#84917a;padding-top:15px;}
    .pp-footer strong {font-size:18px;color:#2c4435;letter-spacing:-.5px;}
    @media(max-width:740px){.pp-hero{grid-template-columns:1fr;gap:20px}.pp-title{font-size:45px;letter-spacing:-2px}.pp-collage{max-width:480px;margin:0 auto;width:100%;gap:12px}.pp-photo img{height:230px}.pp-photo:last-child img{height:210px}.pp-nav-note{font-size:9px}.pp-flow{padding:15px;gap:12px;grid-template-columns:1fr}.pp-flow-item span{font-size:11px}.st-key-device-form,.st-key-estimate-panel{padding:14px!important}.block-container{padding-left:1.1rem;padding-right:1.1rem}.pp-preview img{height:190px}}
    @media(prefers-reduced-motion:no-preference){.pp-photo{transition:transform .25s}.pp-photo:hover{transform:rotate(0deg) translateY(-4px)}}
    </style>''', unsafe_allow_html=True)
    st.markdown(f'''
    <div class="pp-nav"><div class="pp-logo"><b>p↗</b> pritipriya.</div><span class="pp-nav-note">A second life. A fair price.</span></div>
    <section class="pp-hero"><div><div class="pp-kicker">MORE LIFE. LESS LANDFILL.</div><h1 class="pp-title">Your old tech.<br><span>Someone’s next<br>favourite.</span></h1><p class="pp-intro">Discover what your pre-loved electronics could be worth. A few details, a clearer price, a fresh beginning.</p><div class="pp-tags"><span>↗ Transparent estimates</span><span>◎ Photo-assisted review</span><span>♧ Less e-waste</span></div></div>
    <div class="pp-collage"><div class="pp-photo"><img src="{photo('phone')}" alt="Smartphone with a teal screen beside a laptop"><div class="pp-photo-label"><strong>Small device. More possibilities.</strong><span>PHONES & TABLETS</span></div></div><div class="pp-photo"><img src="{photo('laptop')}" alt="Silver laptop on a bright wooden desk"><div class="pp-photo-label"><strong>Ready for its next chapter.</strong><span>LAPTOPS & MORE</span></div></div></div></section>
    <div class="pp-flow"><div class="pp-flow-item"><b>01</b><div><strong>Tell us about your tech</strong><span>Model, age & reference price</span></div></div><div class="pp-flow-item"><b>02</b><div><strong>Show its good side</strong><span>Add photos & review the condition</span></div></div><div class="pp-flow-item"><b>03</b><div><strong>Find a fair starting price</strong><span>Get a range & see the breakdown</span></div></div></div>
    ''', unsafe_allow_html=True)

def render_device_preview(category):
    name = 'laptop' if category in ('Laptop', 'Console') else 'phone'
    heading = 'A fresh start for good tech.' if name == 'laptop' else 'There’s more life in your device.'
    st.markdown(f'<div class="pp-preview"><img src="{photo(name)}" alt="Decorative {name} photograph"><div><strong>{heading}</strong><span>KEEP THE MEMORIES. DISCOVER THE VALUE.</span></div></div>', unsafe_allow_html=True)

def render_tip():
    st.markdown('<div class="pp-tip"><strong>✳ A little care goes a long way.</strong><p>Clean your device, take clear photos in daylight, and include the original accessories. Be upfront about wear for a smoother sale.</p></div>', unsafe_allow_html=True)

def render_footer():
    st.markdown('<div class="pp-footer"><strong>pritipriya.</strong><span>Good for your pocket. Better for the planet.</span><span>Estimates, not guaranteed offers.</span></div>', unsafe_allow_html=True)
