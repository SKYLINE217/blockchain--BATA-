import requests
import json

BASE = "http://127.0.0.1:5000"

def jprint(title, resp):
    try:
        data = resp.json()
    except Exception:
        data = resp.text
    print(f"\n== {title} ==")
    print("Status:", resp.status_code)
    if isinstance(data, str):
        print(data)
    else:
        print(json.dumps(data, indent=2))

def main():
    r = requests.post(f"{BASE}/tools/generate_csv", json={"count": 60, "output_path": "data/students.csv"})
    jprint("Generate CSV", r)

    r = requests.post(
        f"{BASE}/tools/hash_csv",
        json={"input_path": "data/students.csv", "output_path": "data/students_hashed.csv"},
    )
    jprint("Hash CSV", r)

    r = requests.post(f"{BASE}/tools/import_csv", json={"input_path": "data/students.csv"})
    jprint("Import CSV", r)

    r = requests.get(f"{BASE}/blockchain/info")
    jprint("Blockchain Info After Import", r)

if __name__ == "__main__":
    main()
