import requests
import json
import time
import hashlib
from datetime import datetime

def test_blockchain_comprehensive():
    """Comprehensive test suite for the blockchain implementation"""
    
    base_url = "http://localhost:5000"
    test_results = []
    
    def log_test(test_name, success, details=""):
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"  Details: {details}")
    
    print("🚀 Starting Comprehensive Blockchain Testing...")
    print("=" * 60)
    
    # Test 1: Server Health Check
    print("\n1️⃣ Testing Server Connectivity...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            log_test("Server Health Check", True, f"Response: {response.json()}")
        else:
            log_test("Server Health Check", False, f"Status Code: {response.status_code}")
    except Exception as e:
        log_test("Server Health Check", False, str(e))
        return  # Stop testing if server is not available
    
    # Test 2: Blockchain Info
    print("\n2️⃣ Testing Blockchain Info...")
    try:
        response = requests.get(f"{base_url}/blockchain/info")
        if response.status_code == 200:
            data = response.json()
            chain_length = data.get('length', 0)
            is_valid = data.get('chain_valid', False)
            log_test("Blockchain Info", True, f"Length: {chain_length}, Valid: {is_valid}")
        else:
            log_test("Blockchain Info", False, f"Status Code: {response.status_code}")
    except Exception as e:
        log_test("Blockchain Info", False, str(e))
    
    # Test 3: Chain Verification
    print("\n3️⃣ Testing Chain Verification...")
    try:
        response = requests.get(f"{base_url}/blockchain/verify")
        if response.status_code == 200:
            data = response.json()
            is_valid = data.get('verification', {}).get('valid', False)
            message = data.get('verification', {}).get('message', 'No message')
            log_test("Chain Verification", is_valid, f"Verification: {message}")
        else:
            log_test("Chain Verification", False, f"Status Code: {response.status_code}")
    except Exception as e:
        log_test("Chain Verification", False, str(e))
    
    # Test 4: Add New Student Credential
    print("\n4️⃣ Testing Add New Credential...")
    new_student = {
        "student_id": "STU003",
        "credential_type": "certificate",
        "credential_data": {
            "certificate_name": "Blockchain Development",
            "issue_date": "2024-01-15",
            "grade": "A+",
            "instructor": "Dr. Smith"
        },
        "issuer": "Tech Institute"
    }
    
    try:
        response = requests.post(f"{base_url}/blockchain/add", json=new_student)
        if response.status_code == 201:
            data = response.json()
            block_hash = data.get('block_hash')
            block_index = data.get('block_index')
            log_test("Add New Credential", True, f"Block #{block_index}, Hash: {block_hash[:16]}...")
        else:
            log_test("Add New Credential", False, f"Status Code: {response.status_code}")
    except Exception as e:
        log_test("Add New Credential", False, str(e))
    
    # Test 5: Add Duplicate Student (should work - different credential)
    print("\n5️⃣ Testing Add Duplicate Student (Different Credential)...")
    duplicate_student = {
        "student_id": "STU003",
        "credential_type": "transcript",
        "credential_data": {
            "semester": "Spring 2024",
            "courses": [
                {"course": "BLOCK101", "grade": "A"},
                {"course": "CRYPT201", "grade": "A-"}
            ],
            "semester_gpa": 3.85
        }
    }
    
    try:
        response = requests.post(f"{base_url}/blockchain/add", json=duplicate_student)
        if response.status_code == 201:
            data = response.json()
            block_hash = data.get('block_hash')
            log_test("Add Duplicate Student", True, f"Additional credential added, Hash: {block_hash[:16]}...")
        else:
            log_test("Add Duplicate Student", False, f"Status Code: {response.status_code}")
    except Exception as e:
        log_test("Add Duplicate Student", False, str(e))
    
    # Test 6: Update Student Record
    print("\n6️⃣ Testing Update Student Record...")
    update_data = {
        "student_id": "STU003",
        "updated_data": {
            "certificate_status": "Completed with Honors",
            "completion_date": "2024-02-01",
            "additional_notes": "Excellent performance in blockchain fundamentals"
        }
    }
    
    try:
        response = requests.post(f"{base_url}/blockchain/update", json=update_data)
        if response.status_code == 200:
            data = response.json()
            block_hash = data.get('block_hash')
            log_test("Update Student Record", True, f"Update block created, Hash: {block_hash[:16]}...")
        else:
            log_test("Update Student Record", False, f"Status Code: {response.status_code}")
    except Exception as e:
        log_test("Update Student Record", False, str(e))
    
    # Test 7: Get Student History
    print("\n7️⃣ Testing Get Student History...")
    try:
        response = requests.get(f"{base_url}/blockchain/student/STU003")
        if response.status_code == 200:
            data = response.json()
            record_count = data.get('record_count', 0)
            history = data.get('history', [])
            log_test("Get Student History", True, f"Found {record_count} records for STU003")
            
            # Verify that we have the expected records
            credential_types = []
            for record in history:
                cred_type = record.get('student_record', {}).get('credential_type')
                if cred_type:
                    credential_types.append(cred_type)
                elif record.get('student_record', {}).get('type') == 'update':
                    credential_types.append('update')
            
            if len(credential_types) >= 3:  # Should have certificate, transcript, and update
                log_test("Student History Validation", True, f"Record types: {credential_types}")
            else:
                log_test("Student History Validation", False, f"Expected 3+ records, found {len(credential_types)}")
                
        elif response.status_code == 404:
            log_test("Get Student History", False, "Student not found")
        else:
            log_test("Get Student History", False, f"Status Code: {response.status_code}")
    except Exception as e:
        log_test("Get Student History", False, str(e))
    
    # Test 8: Get Non-existent Student
    print("\n8️⃣ Testing Get Non-existent Student...")
    try:
        response = requests.get(f"{base_url}/blockchain/student/INVALID999")
        if response.status_code == 404:
            log_test("Get Non-existent Student", True, "Correctly returned 404 for invalid student")
        else:
            log_test("Get Non-existent Student", False, f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test("Get Non-existent Student", False, str(e))
    
    # Test 9: Invalid Add Request (missing fields)
    print("\n9️⃣ Testing Invalid Add Request...")
    invalid_data = {
        "student_id": "STU004",
        # Missing required fields
    }
    
    try:
        response = requests.post(f"{base_url}/blockchain/add", json=invalid_data)
        if response.status_code == 400:
            data = response.json()
            error_message = data.get('error', 'No error message')
            log_test("Invalid Add Request", True, f"Correctly rejected: {error_message}")
        else:
            log_test("Invalid Add Request", False, f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_test("Invalid Add Request", False, str(e))
    
    # Test 10: Get Full Chain
    print("\n🔟 Testing Get Full Chain...")
    try:
        response = requests.get(f"{base_url}/blockchain/chain")
        if response.status_code == 200:
            data = response.json()
            chain_length = data.get('length', 0)
            chain_data = data.get('chain', [])
            
            # Validate chain structure
            validation_errors = []
            if chain_length != len(chain_data):
                validation_errors.append("Length mismatch")
            
            # Check each block has required fields
            for i, block in enumerate(chain_data):
                required_fields = ['student_record', 'timestamp', 'previous_hash', 'hash']
                missing_fields = [field for field in required_fields if field not in block]
                if missing_fields:
                    validation_errors.append(f"Block {i} missing fields: {missing_fields}")
                
                # Verify hash calculation (for non-genesis blocks)
                if i > 0 and 'hash' in block:
                    block_copy = block.copy()
                    calculated_hash = hashlib.sha256(json.dumps({
                        'student_record': block['student_record'],
                        'timestamp': block['timestamp'],
                        'previous_hash': block['previous_hash']
                    }, sort_keys=True).encode()).hexdigest()
                    
                    if calculated_hash != block['hash']:
                        validation_errors.append(f"Block {i} hash verification failed")
            
            if not validation_errors:
                log_test("Get Full Chain", True, f"Chain length: {chain_length}, all blocks valid")
            else:
                log_test("Get Full Chain", False, f"Validation errors: {validation_errors}")
        else:
            log_test("Get Full Chain", False, f"Status Code: {response.status_code}")
    except Exception as e:
        log_test("Get Full Chain", False, str(e))
    
    # Test 11: Chain Integrity After Multiple Operations
    print("\n1️⃣1️⃣ Testing Final Chain Integrity...")
    try:
        response = requests.get(f"{base_url}/blockchain/verify")
        if response.status_code == 200:
            data = response.json()
            is_valid = data.get('verification', {}).get('valid', False)
            message = data.get('verification', {}).get('message', 'No message')
            log_test("Final Chain Integrity", is_valid, f"Final verification: {message}")
        else:
            log_test("Final Chain Integrity", False, f"Status Code: {response.status_code}")
    except Exception as e:
        log_test("Final Chain Integrity", False, str(e))
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(test_results)
    passed_tests = sum(1 for result in test_results if result['success'])
    failed_tests = total_tests - passed_tests
    
    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {passed_tests}")
    print(f"❌ Failed: {failed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if failed_tests > 0:
        print("\nFailed Tests:")
        for result in test_results:
            if not result['success']:
                print(f"  ❌ {result['test']}: {result['details']}")
    
    print("\n📋 Detailed Results:")
    for result in test_results:
        status = "✅" if result['success'] else "❌"
        print(f"  {status} {result['test']}")
        if result['details']:
            print(f"     {result['details']}")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = test_blockchain_comprehensive()
    if success:
        print("\n🎉 ALL TESTS PASSED! Blockchain implementation is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please review the results above.")
    exit(0 if success else 1)