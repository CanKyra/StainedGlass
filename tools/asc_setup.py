"""App Store Connect kurulumu: paket kimliğini (bundle ID) kaydeder, uygulama kaydını kontrol eder.

GitHub Actions'ta secrets ile çalışır; anahtar dosyası hiçbir yere yazılmaz ya da yazdırılmaz.
Ortam değişkenleri: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8, BUNDLE_ID
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

import jwt  # PyJWT

API = "https://api.appstoreconnect.apple.com/v1"
DEFAULT_BUNDLE = "com.cankyra.stainedglass"


def token() -> str:
    now = int(time.time())
    payload = {"iss": os.environ["ASC_ISSUER_ID"], "iat": now, "exp": now + 900, "aud": "appstoreconnect-v1"}
    return jwt.encode(payload, os.environ["ASC_KEY_P8"], algorithm="ES256", headers={"kid": os.environ["ASC_KEY_ID"], "typ": "JWT"})


def call(method: str, path: str, body=None):
    if path.startswith("http"):
        url = path
    elif path.startswith("/v2/"):
        url = API[: -len("/v1")] + path
    else:
        url = API + path
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body else None)
    req.add_header("Authorization", "Bearer " + token())
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def main() -> int:
    missing = [k for k in ("ASC_KEY_ID", "ASC_ISSUER_ID", "ASC_KEY_P8") if not os.environ.get(k)]
    if missing:
        print("::warning::Eksik secrets: " + ", ".join(missing) + ". GitHub -> Settings -> Secrets and variables -> Actions bölümüne ekleyin.")
        return 0
    bundle = os.environ.get("BUNDLE_ID", DEFAULT_BUNDLE)
    q = urllib.parse.urlencode({"filter[identifier]": bundle})
    status, res = call("GET", "/bundleIds?" + q)
    if status == 401:
        print("::error::Apple anahtarı reddetti (401). Key ID, Issuer ID ve .p8 içeriğini kontrol edin.")
        return 1
    if status != 200:
        print(f"::error::Paket kimlikleri okunamadı ({status}): {res.get('errors', res)}")
        return 1
    exact = [b for b in res.get("data", []) if b["attributes"]["identifier"] == bundle]
    if exact:
        print(f"Paket kimliği zaten kayıtlı: {bundle}")
    else:
        body = {"data": {"type": "bundleIds", "attributes": {"identifier": bundle, "name": "Stained Glass", "platform": "IOS"}}}
        status, res = call("POST", "/bundleIds", body)
        if status == 201:
            print(f"::notice::Paket kimliği kaydedildi: {bundle}")
        else:
            print(f"::error::Paket kimliği kaydedilemedi ({status}): {res.get('errors', res)}")
            return 1
    status, res = call("GET", "/apps?" + urllib.parse.urlencode({"filter[bundleId]": bundle}))
    apps = res.get("data", []) if status == 200 else []
    if apps:
        a = apps[0]["attributes"]
        print(f"::notice::App Store Connect uygulama kaydı hazır: {a.get('name')} ({bundle}). TestFlight yüklemesi yapılabilir.")
    else:
        print(f"::warning::App Store Connect'te {bundle} için uygulama kaydı yok. appstoreconnect.apple.com -> Uygulamalar -> + -> Yeni Uygulama ile oluşturun (SKU: stainedglass-001).")
    return 0


def find_bundle_id(bundle: str):
    status, res = call("GET", "/bundleIds?" + urllib.parse.urlencode({"filter[identifier]": bundle}))
    for b in res.get("data", []) if status == 200 else []:
        if b["attributes"]["identifier"] == bundle:
            return b["id"]
    return None


def signing(csr_path: str, out_dir: str) -> int:
    bundle = os.environ.get("BUNDLE_ID", DEFAULT_BUNDLE)
    run = os.environ.get("GITHUB_RUN_ID", str(int(time.time())))
    bid = find_bundle_id(bundle)
    if not bid:
        body = {"data": {"type": "bundleIds", "attributes": {"identifier": bundle, "name": "Stained Glass", "platform": "IOS"}}}
        st, r = call("POST", "/bundleIds", body)
        if st == 201:
            bid = r["data"]["id"]
        else:
            print(f"::error::Paket kimliği bulunamadı ve oluşturulamadı: {bundle}")
            return 1
    csr = open(csr_path).read()
    status, res = call("POST", "/certificates", {"data": {"type": "certificates", "attributes": {"csrContent": csr, "certificateType": "DISTRIBUTION"}}})
    if status != 201:
        print(f"::error::Dağıtım sertifikası oluşturulamadı ({status}): {res.get('errors', res)}")
        return 1
    cert_id = res["data"]["id"]
    with open(os.path.join(out_dir, "ids.env"), "w") as f:
        f.write(f"CERT_ID={cert_id}\n")
    with open(os.path.join(out_dir, "dist.cer"), "wb") as f:
        f.write(base64.b64decode(res["data"]["attributes"]["certificateContent"]))
    name = f"StainedGlass CI {run}"
    body = {
        "data": {
            "type": "profiles",
            "attributes": {"name": name, "profileType": "IOS_APP_STORE"},
            "relationships": {
                "bundleId": {"data": {"type": "bundleIds", "id": bid}},
                "certificates": {"data": [{"type": "certificates", "id": cert_id}]},
            },
        }
    }
    status, res = call("POST", "/profiles", body)
    if status != 201:
        print(f"::error::Profil oluşturulamadı ({status}): {res.get('errors', res)}")
        return 1
    a = res["data"]["attributes"]
    with open(os.path.join(out_dir, "profile.mobileprovision"), "wb") as f:
        f.write(base64.b64decode(a["profileContent"]))
    with open(os.path.join(out_dir, "ids.env"), "a") as f:
        f.write(f"PROFILE_ID={res['data']['id']}\nPROFILE_UUID={a['uuid']}\nPROFILE_NAME='{name}'\n")
    print(f"Geçici sertifika ve profil hazır: {name}")
    return 0


def cleanup(ids_path: str) -> int:
    if not os.path.exists(ids_path):
        return 0
    ids = {}
    for line in open(ids_path):
        if "=" in line:
            k, v = line.strip().split("=", 1)
            ids[k] = v.strip("'")
    if ids.get("PROFILE_ID"):
        status, _ = call("DELETE", "/profiles/" + ids["PROFILE_ID"])
        print(f"Profil silindi ({status})")
    if ids.get("CERT_ID"):
        status, _ = call("DELETE", "/certificates/" + ids["CERT_ID"])
        print(f"Sertifika silindi ({status})")
    return 0


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "setup"
    if cmd == "signing":
        sys.exit(signing(sys.argv[2], sys.argv[3]))
    if cmd == "cleanup":
        sys.exit(cleanup(sys.argv[2]))
    sys.exit(main())
