"""App Store Connect'te uygulama içi satın alma ürünlerini oluşturur ve tamamlar.

data/iap_products.json'daki her ürün için (zaten varsa atlanır, eksikse tamamlanır):
  1. Ürün kaydı (tüketilebilir / tüketilemez)
  2. Türkçe ve İngilizce ad ve açıklama
  3. ABD fiyatı (diğer ülkelerin fiyatını Apple otomatik hesaplar); "try" verilmişse Türkiye'ye
     özel fiyat. Takvim farklıysa yeniden kurulur, böylece fiyat değişikliği de bu araçla yapılır.
  4. Tüm ülkelerde satış
  5. Apple incelemesi için mağaza ekran görüntüsü (assets/store/iap_review.png)
"""
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from asc_setup import call  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLE = os.environ.get("BUNDLE_ID", "com.cankyra.stainedglass")
LOCALES = {"en": "en-US", "tr": "tr"}
SCREENSHOT = os.path.join(ROOT, "assets", "store", "iap_review.png")


def get_all(path):
    """Sayfalı GET: links.next izlenir."""
    out = []
    url = path
    while url:
        status, res = call("GET", url)
        if status != 200:
            return status, res, out
        out.extend(res.get("data", []))
        url = res.get("links", {}).get("next")
    return 200, None, out


def v2(path):
    return "/v2" + path


def fail(msg, res=None):
    print(f"::error::{msg}" + (f" {json.dumps(res.get('errors', res))[:800]}" if res else ""))


def find_app():
    status, res = call("GET", "/apps?filter[bundleId]=" + BUNDLE)
    apps = res.get("data", []) if status == 200 else []
    return apps[0]["id"] if apps else None


def ensure_product(app_id, p, existing):
    if p["product"] in existing:
        return existing[p["product"]]
    body = {"data": {"type": "inAppPurchases",
                     "attributes": {"name": p["en"][0], "productId": p["product"], "inAppPurchaseType": p["type"],
                                    "reviewNote": "Test with sandbox account. Purchases appear in the in-game shop (coin button at the top right)."},
                     "relationships": {"app": {"data": {"type": "apps", "id": app_id}}}}}
    status, res = call("POST", v2("/inAppPurchases"), body)
    if status != 201:
        fail(f"{p['product']} oluşturulamadı ({status})", res)
        return None
    print(f"  oluşturuldu: {p['product']}")
    return res["data"]


def ensure_localizations(iap_id, p):
    status, res = call("GET", v2(f"/inAppPurchases/{iap_id}/inAppPurchaseLocalizations"))
    have = {d["attributes"]["locale"] for d in res.get("data", [])} if status == 200 else set()
    for key, locale in LOCALES.items():
        if locale in have:
            continue
        name, desc = p[key]
        body = {"data": {"type": "inAppPurchaseLocalizations",
                         "attributes": {"locale": locale, "name": name, "description": desc},
                         "relationships": {"inAppPurchaseV2": {"data": {"type": "inAppPurchases", "id": iap_id}}}}}
        s, r = call("POST", "/inAppPurchaseLocalizations", body)
        if s == 201:
            print(f"  {locale} metni eklendi")
        else:
            fail(f"{p['product']} {locale} metni eklenemedi ({s})", r)


def _point(iap_id, territory, price):
    status, res, points = get_all(v2(f"/inAppPurchases/{iap_id}/pricePoints?filter[territory]={territory}&limit=200"))
    if status != 200:
        fail(f"{territory} fiyat noktaları okunamadı ({status})", res)
        return None
    match = [pt for pt in points if pt["attributes"].get("customerPrice") == price]
    if match:
        return match[0]["id"]
    near = sorted({pt["attributes"].get("customerPrice") for pt in points},
                  key=lambda v: abs(float(v) - float(price)))[:6]
    fail(f"{territory} için {price} fiyat noktası yok. En yakınlar: {', '.join(sorted(near, key=float))}")
    return None


def _current_prices(iap_id):
    s, r = call("GET", v2(f"/inAppPurchases/{iap_id}/iapPriceSchedule"))
    if s != 200 or not r.get("data"):
        return {}
    sid = r["data"]["id"]
    s2, r2 = call("GET", f"/inAppPurchasePriceSchedules/{sid}/manualPrices?include=inAppPurchasePricePoint,territory&limit=50")
    if s2 != 200:
        return {}
    points = {i["id"]: i["attributes"].get("customerPrice") for i in r2.get("included", []) if i["type"] == "inAppPurchasePricePoints"}
    out = {}
    for d in r2.get("data", []):
        rel = d.get("relationships", {})
        terr = (rel.get("territory", {}).get("data") or {}).get("id")
        pp = (rel.get("inAppPurchasePricePoint", {}).get("data") or {}).get("id")
        if terr and pp in points:
            out[terr] = points[pp]
    return out


def ensure_price(iap_id, p):
    want = {"USA": p["usd"]}
    if p.get("try"):
        want["TUR"] = p["try"]
    have = _current_prices(iap_id)
    if all(have.get(t) == v for t, v in want.items()):
        return
    ids = {}
    for terr, price in want.items():
        pid = _point(iap_id, terr, price)
        if not pid:
            return
        ids[terr] = pid
    refs, included = [], []
    for n, (terr, pid) in enumerate(ids.items()):
        ref = "${price%d}" % n
        refs.append({"type": "inAppPurchasePrices", "id": ref})
        included.append({"type": "inAppPurchasePrices", "id": ref,
                         "attributes": {"startDate": None},
                         "relationships": {
                             "inAppPurchaseV2": {"data": {"type": "inAppPurchases", "id": iap_id}},
                             "inAppPurchasePricePoint": {"data": {"type": "inAppPurchasePricePoints", "id": pid}}}})
    body = {
        "data": {"type": "inAppPurchasePriceSchedules",
                 "relationships": {
                     "inAppPurchase": {"data": {"type": "inAppPurchases", "id": iap_id}},
                     "baseTerritory": {"data": {"type": "territories", "id": "USA"}},
                     "manualPrices": {"data": refs}}},
        "included": included,
    }
    s, r = call("POST", "/inAppPurchasePriceSchedules", body)
    if s == 201:
        print("  fiyat: " + ", ".join(f"{t} {v}" for t, v in want.items()) + (f" (önceki: {have})" if have else ""))
    else:
        fail(f"{p['product']} fiyatı ayarlanamadı ({s})", r)


def ensure_availability(iap_id, p, territories):
    s, r = call("GET", v2(f"/inAppPurchases/{iap_id}/inAppPurchaseAvailability"))
    if s == 200 and r.get("data"):
        return
    body = {"data": {"type": "inAppPurchaseAvailabilities",
                     "attributes": {"availableInNewTerritories": True},
                     "relationships": {
                         "inAppPurchase": {"data": {"type": "inAppPurchases", "id": iap_id}},
                         "availableTerritories": {"data": [{"type": "territories", "id": t} for t in territories]}}}}
    s, r = call("POST", "/inAppPurchaseAvailabilities", body)
    if s == 201:
        print(f"  {len(territories)} ülkede satışta")
    else:
        fail(f"{p['product']} satış ülkeleri ayarlanamadı ({s})", r)


def ensure_screenshot(iap_id, p):
    if not os.path.isfile(SCREENSHOT):
        return
    s, r = call("GET", v2(f"/inAppPurchases/{iap_id}/appStoreReviewScreenshot"))
    if s == 200 and r.get("data"):
        st = r["data"]["attributes"].get("assetDeliveryState", {}) or {}
        if st.get("state") not in ("FAILED", "AWAITING_UPLOAD"):
            return
        call("DELETE", f"/inAppPurchaseAppStoreReviewScreenshots/{r['data']['id']}")
    data = open(SCREENSHOT, "rb").read()
    body = {"data": {"type": "inAppPurchaseAppStoreReviewScreenshots",
                     "attributes": {"fileName": "iap_review.png", "fileSize": len(data)},
                     "relationships": {"inAppPurchaseV2": {"data": {"type": "inAppPurchases", "id": iap_id}}}}}
    s, r = call("POST", "/inAppPurchaseAppStoreReviewScreenshots", body)
    if s == 409 and "already exists" in json.dumps(r):
        print("  inceleme ekran görüntüsü zaten var")
        return
    if s != 201:
        fail(f"{p['product']} ekran görüntüsü ayrılamadı ({s})", r)
        return
    shot_id = r["data"]["id"]
    for op in r["data"]["attributes"]["uploadOperations"]:
        chunk = data[op["offset"]:op["offset"] + op["length"]]
        req = urllib.request.Request(op["url"], data=chunk, method=op["method"])
        for h in op.get("requestHeaders", []):
            req.add_header(h["name"], h["value"])
        try:
            urllib.request.urlopen(req).read()
        except urllib.error.HTTPError as e:
            fail(f"{p['product']} ekran görüntüsü yüklenemedi ({e.code})")
            return
    body = {"data": {"type": "inAppPurchaseAppStoreReviewScreenshots", "id": shot_id,
                     "attributes": {"uploaded": True, "sourceFileChecksum": hashlib.md5(data).hexdigest()}}}
    s, r = call("PATCH", f"/inAppPurchaseAppStoreReviewScreenshots/{shot_id}", body)
    if s == 200:
        print("  inceleme ekran görüntüsü yüklendi")
    else:
        fail(f"{p['product']} ekran görüntüsü onaylanamadı ({s})", r)


def main():
    if not os.environ.get("ASC_KEY_P8"):
        print("::warning::ASC anahtarları yok; ürünler oluşturulmadı.")
        return 0
    products = json.load(open(os.path.join(ROOT, "data", "iap_products.json"), encoding="utf-8"))
    app_id = find_app()
    if not app_id:
        print(f"::warning::App Store Connect'te {BUNDLE} uygulaması henüz oluşturulmadı; IAP adımı atlandı.")
        return 0
    status, res, existing_list = get_all(f"/apps/{app_id}/inAppPurchasesV2?limit=200")
    if status != 200:
        fail(f"Mevcut ürünler okunamadı ({status})", res)
        return 1
    existing = {d["attributes"]["productId"]: d for d in existing_list}
    status, res, terr = get_all("/territories?limit=200")
    territories = [t["id"] for t in terr]
    for p in products:
        print(f"== {p['product']} ({p['type']}, {p['usd']} USD" + (f", {p['try']} TL" if p.get("try") else "") + ")")
        iap = ensure_product(app_id, p, existing)
        if not iap:
            continue
        iap_id = iap["id"]
        ensure_localizations(iap_id, p)
        ensure_price(iap_id, p)
        ensure_availability(iap_id, p, territories)
        ensure_screenshot(iap_id, p)
    status, res, final = get_all(f"/apps/{app_id}/inAppPurchasesV2?limit=200")
    print("\nDurum:")
    for d in final:
        print(f"  {d['attributes']['productId']}: {d['attributes'].get('state')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
