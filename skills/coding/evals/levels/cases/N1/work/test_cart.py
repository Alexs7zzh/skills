import unittest

from cart import Line, total_cents


class CartTotalTests(unittest.TestCase):
    def test_quantities_and_shipping_are_charged_once(self):
        lines = [Line(125, 3), Line(60, 2)]
        self.assertEqual(total_cents(lines, 40), 535)

    def test_single_units(self):
        self.assertEqual(total_cents([Line(125, 1), Line(60, 1)], 40), 225)

    def test_empty_cart(self):
        self.assertEqual(total_cents([], 40), 40)


if __name__ == "__main__":
    unittest.main()
