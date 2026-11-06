import math

RATES = {'Phone': .25, 'Laptop': .20, 'Tablet': .22, 'Console': .16, 'Audio': .28}
FACTORS = {'Excellent': 1, 'Good': .88, 'Fair': .70, 'Poor': .45}
CATALOG = {
    'Apple iPhone 15 · 128 GB': ('Phone', 59900),
    'Apple iPhone 14 · 128 GB': ('Phone', 49900),
    'Samsung Galaxy S24 · 128 GB': ('Phone', 64999),
    'Google Pixel 8 · 128 GB': ('Phone', 49999),
    'Apple MacBook Air M2 · 8 GB / 256 GB': ('Laptop', 79900),
    'Apple iPad 10th generation · 64 GB Wi-Fi': ('Tablet', 34900),
    'Sony PlayStation 5 · Slim Disc edition': ('Console', 54990),
    'Sony WH-1000XM5': ('Audio', 24990),
}

def estimate(price, days, category, condition, battery=100, charger=True, box=True):
    if not math.isfinite(price) or not 100 <= price <= 10000000:
        raise ValueError('Reference price must be between ₹100 and ₹1,00,00,000.')
    if not isinstance(days, int) or not 0 <= days <= 7300:
        raise ValueError('Days used must be a whole number between 0 and 7,300.')
    if not math.isfinite(battery) or not 0 <= battery <= 100:
        raise ValueError('Battery health must be between 0 and 100.')
    if category not in RATES or condition not in FACTORS:
        raise ValueError('Choose a valid category and condition.')
    age_value = price * .9 * (1 - RATES[category]) ** (days / 365)
    condition_value = age_value * FACTORS[condition]
    battery_loss = condition_value * max(0, 85 - battery) * .006 if category in ('Phone', 'Laptop', 'Tablet') else 0
    accessories = condition_value * ((0 if charger else .03) + (0 if box else .01))
    value = max(price * .03, condition_value - battery_loss - accessories)
    rounded = lambda n: math.floor(n / 100 + .5) * 100
    return dict(value=rounded(value), low=rounded(value * .9), high=rounded(value * 1.1),
                listing=rounded(value * 1.08), age_loss=math.floor(price - age_value + .5),
                condition_loss=math.floor(age_value - condition_value + .5),
                battery_loss=math.floor(battery_loss + .5), accessory_loss=math.floor(accessories + .5),
                retained=math.floor(value / price * 100 + .5))
