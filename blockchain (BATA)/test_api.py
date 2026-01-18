import requests
import json
import time

def test_blockchain_api():
    base_url = "http://localhost:5000"
    
    print("🚀 Testing Student Blockchain API...")
    
    try:
        print("\n1. Testing health check...")
        response = requests.get(f"{base_url}/health")
        print(f"Health check: {response.json()}")
        
        print("\n2. Adding first student credential...")
        student1 = {
            "student_id": "STU001",
            "credential_type": "degree",
            "credential_data": {
                "degree_name": "Bachelor of Computer Science",
                "graduation_date": "2023-05-15",
                "gpa": 3.8,
                "honors": "Magna Cum Laude"
            },
            "issuer": "State University"
        }
        
        response = requests.post(f"{base_url}/blockchain/add", json=student1)
        result = response.json()
        print(f"Add credential response: {result}")
        
        print("\n3. Adding second student credential...")
        student2 = {
            "student_id": "STU002",
            "credential_type": "transcript",
            "credential_data": {
                "semester": "Fall 2023",
                "courses": [
                    {"course": "CS101", "grade": "A"},
                    {"course": "MATH201", "grade": "B+"},
                    {"course": "ENG101", "grade": "A-"}
                ],
                "semester_gpa": 3.7
            }
        }
        
        response = requests.post(f"{base_url}/blockchain/add", json=student2)
        result = response.json()
        print(f"Add credential response: {result}")
        
        print("\n4. Updating student record...")
        update_data = {
            "student_id": "STU001",
            "updated_data": {
                "degree_name": "Bachelor of Computer Science with Honors",
                "additional_info": "Thesis: Blockchain Technology in Education"
            }
        }
        
        response = requests.post(f"{base_url}/blockchain/update", json=update_data)
        result = response.json()
        print(f"Update record response: {result}")
        
        print("\n5. Verifying blockchain...")
        response = requests.get(f"{base_url}/blockchain/verify")
        result = response.json()
        print(f"Verification result: {result}")
        
        print("\n6. Getting student history...")
        response = requests.get(f"{base_url}/blockchain/student/STU001")
        result = response.json()
        print(f"Student STU001 history: {json.dumps(result, indent=2)}")
        
        print("\n7. Getting blockchain info...")
        response = requests.get(f"{base_url}/blockchain/info")
        result = response.json()
        print(f"Blockchain info: {result}")
        
        print("\n8. Getting full chain...")
        response = requests.get(f"{base_url}/blockchain/chain")
        result = response.json()
        print(f"Full chain length: {result['length']}")
        
        print("\n✅ All tests completed successfully!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API. Make sure the server is running on port 5000.")
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")

if __name__ == "__main__":
    test_blockchain_api()