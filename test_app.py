from streamlit.testing.v1 import AppTest

app = AppTest.from_file('app.py').run(timeout=20)
assert not app.exception, app.exception
app.button[1].click().run()
assert not app.exception, app.exception
assert app.metric[0].value == '₹35,600', app.metric[0].value
app.number_input[1].set_value(730).run()
assert any('Details changed' in item.value for item in app.warning)
app.button[1].click().run()
assert not app.exception, app.exception
assert app.metric[0].value != '₹35,600'
app.selectbox[0].select('Audio').run()
assert not app.exception, app.exception
assert app.number_input[2].disabled
print('Streamlit UI checks passed: render, calculate, stale results, category change.')
