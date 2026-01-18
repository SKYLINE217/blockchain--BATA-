import requests
import json
import time
import threading
import os

BASE_URL = 'http://localhost:5000'

def print_result(test_name, success, details=""):
    icon = "✅" if success else "❌"
    print(f"{icon} {test_name}: {details}")

def test_tampering():
    print("\n--- Testing Chain Tampering ---")
    # 1. Verify chain is valid initially
    r = requests.get(f"{BASE_URL}/blockchain/verify")
    if not r.json().get('verification', {}).get('valid'):
        print_result("Initial Chain Validation", False, "Chain was already invalid!")
        return

    # 2. Read the raw file
    try:
        with open('student_blockchain.json', 'r') as f:
            chain_data = json.load(f)
    except FileNotFoundError:
        print_result("Tamper Test", False, "Could not find blockchain file")
        return

    if len(chain_data) < 2:
        print_result("Tamper Test", False, "Chain too short to tamper safely")
        return

    # 3. Modify a block (not the last one, to break the chain link)
    original_record = chain_data[1]['student_record']
    chain_data[1]['student_record']['hacked'] = 'true'
    
    with open('student_blockchain.json', 'w') as f:
        json.dump(chain_data, f)
    
    # 4. Verify chain again
    r = requests.get(f"{BASE_URL}/blockchain/verify")
    res = r.json()
    is_detected = not res.get('verification', {}).get('valid')
    
    print_result("Tamper Detection", is_detected, f"API Response: {res.get('verification', {}).get('message')}")

    # 5. Restore file
    chain_data[1]['student_record'] = original_record
    with open('student_blockchain.json', 'w') as f:
        json.dump(chain_data, f)
    
    # Verify restoration
    r = requests.get(f"{BASE_URL}/blockchain/verify")
    if r.json().get('verification', {}).get('valid'):
        print("   (Chain restored successfully)")
    else:
        print("   (Failed to restore chain integrity)")

def test_large_payload():
    print("\n--- Testing Large Payload (DoS Risk) ---")
    large_data = "A" * 1000000 # 1MB string
    payload = {
        "student_id": "STU_DOS",
        "credential_type": "Degree",
        "credential_data": {"notes": large_data}
    }
    
    start = time.time()
    try:
        r = requests.post(f"{BASE_URL}/blockchain/add", json=payload)
        duration = time.time() - start
        if r.status_code == 201:
            print_result("Large Payload Handling", True, f"Accepted 1MB payload in {duration:.2f}s")
        else:
            print_result("Large Payload Handling", False, f"Failed with {r.status_code}: {r.text[:100]}")
    except Exception as e:
        print_result("Large Payload Handling", False, f"Request failed: {e}")

def test_injection():
    print("\n--- Testing Input Injection ---")
    # Trying to inject a script tag. 
    # Since this is an API, we check if it's stored raw or sanitized. 
    # Storing raw is fine for an API as long as the consumer handles it, but worth noting.
    payload = {
        "student_id": "STU_XSS",
        "first_name": "<script>alert('hacked')</script>",
        "credential_type": "Degree",
        "credential_data": {}
    }
    
    r = requests.post(f"{BASE_URL}/blockchain/add", json=payload)
    if r.status_code == 201:
        # Fetch it back
        r2 = requests.get(f"{BASE_URL}/blockchain/student/STU_XSS")
        history = r2.json().get('history', [])
        if history:
            stored_name = history[-1]['student_record'].get('first_name')
            if stored_name == "<script>alert('hacked')</script>":
                print_result("Input Sanitization", False, "Input stored raw (Potential XSS if displayed in browser without escaping)")
            else:
                print_result("Input Sanitization", True, f"Input modified: {stored_name}")
        else:
            print_result("Input Injection", False, "Could not retrieve record")

if __name__ == "__main__":
    test_tampering()
    test_large_payload()
    test_injection()
