import unittest
from pricing import estimate

class PricingTests(unittest.TestCase):
    def setUp(self):
        self.kwargs = dict(price=59900, days=365, category='Phone', condition='Good', battery=90, charger=True, box=True)
    def test_worked_example(self):
        result = estimate(**self.kwargs)
        self.assertEqual(result['value'], 35600)
        self.assertEqual(result['age_loss'], 19468)
        self.assertEqual(result['condition_loss'], 4852)
        self.assertEqual(result['listing'], 38400)
    def test_reductions(self):
        baseline = estimate(**self.kwargs)['value']
        for patch in [dict(days=730), dict(condition='Fair'), dict(battery=70), dict(charger=False), dict(box=False)]:
            self.assertLess(estimate(**(self.kwargs | patch))['value'], baseline)
    def test_validation(self):
        for patch in [dict(days=-1), dict(days=1.5), dict(price=0), dict(battery=101), dict(category='Invalid'), dict(condition='Invalid')]:
            with self.assertRaises(ValueError):
                estimate(**(self.kwargs | patch))

if __name__ == '__main__':
    unittest.main()
