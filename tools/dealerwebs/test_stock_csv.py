import csv, io, unittest
from stock_csv import FIELDS, decode
MAP={k:i for i,k in enumerate(FIELDS)}
def fixture(rows):
    f=io.StringIO(newline="")
    w=csv.writer(f); w.writerow(FIELDS)
    for row in rows: w.writerow([row.get(k,"") for k in FIELDS])
    f.seek(0); return f
def bike(**changes):
    return dict({"dealer_id":"dealer1","stock_id":"001","make":"BMW","model":"R 1300 GS","price_gbp":"15995.00","mileage":"0","vat_qualifying":"false","description":'One owner, "excellent"\nSecond line',"images":"https://example.com/a.jpg;https://example.com/b.jpg;https://example.com/a.jpg"},**changes)
class DecoderTests(unittest.TestCase):
    def test_quoted_csv(self):
        r=decode(fixture([bike()]),MAP)
        self.assertTrue(r["ready_for_review"]); self.assertFalse(r["publish"])
        b=r["records"][0]; self.assertEqual(b["stock_id"],"001"); self.assertEqual(b["mileage"],0); self.assertIs(b["vat_qualifying"],False)
        self.assertEqual(b["description"],bike()["description"]); self.assertEqual(len(b["images"]),2)
    def test_duplicate(self):
        r=decode(fixture([bike(),bike()]),MAP); self.assertFalse(r["ready_for_review"]); self.assertEqual(len(r["errors"]),1)
    def test_dealer_scope(self):
        self.assertTrue(decode(fixture([bike(),bike(dealer_id="dealer2")]),MAP)["ready_for_review"])
    def test_invalid_price(self):
        for p in ("0","NaN","-5","Infinity","abc"):
            self.assertFalse(decode(fixture([bike(price_gbp=p)]),MAP)["ready_for_review"])
    def test_unknown_vat(self):
        self.assertIsNone(decode(fixture([bike(vat_qualifying="")]),MAP)["records"][0]["vat_qualifying"])
    def test_invalid_images(self):
        self.assertFalse(decode(fixture([bike(images="file:///etc/passwd")]),MAP)["ready_for_review"])
    def test_empty_snapshot(self):
        self.assertFalse(decode(fixture([]),MAP)["ready_for_review"])
    def test_large_batch(self):
        r=decode(fixture([bike(stock_id=str(i)) for i in range(12000)]),MAP)
        self.assertTrue(r["ready_for_review"]); self.assertEqual(len(r["records"]),12000)
if __name__=="__main__": unittest.main()
