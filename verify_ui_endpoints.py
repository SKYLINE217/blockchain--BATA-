import requests

BASE = "http://127.0.0.1:5000"

def check(path):
    url = f"{BASE}{path}"
    r = requests.get(url)
    print(f"GET {path}: {r.status_code}, bytes={len(r.content)}")

def main():
    print("\n== UI Endpoint Checks ==")
    for p in ["/", "/static/index.html", "/static/app.js", "/static/styles.css"]:
        check(p)

if __name__ == "__main__":
    main()
