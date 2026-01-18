# Student Blockchain Credential System

A mock blockchain implementation for managing student credentials with tamper-proof record keeping.

## Features

- **Blockchain Core**: SHA-256 hashing, immutable ledger, cryptographic linking
- **Student Records**: Store degrees, transcripts, and other credentials
- **Update Mechanism**: Append correction blocks without overwriting existing data
- **Chain Verification**: Detect tampering and validate integrity
- **REST API**: Flask-based endpoints for easy integration

## API Endpoints

### Add Credential
```
POST /blockchain/add
Content-Type: application/json

{
    "student_id": "STU001",
    "credential_type": "degree",
    "credential_data": {
        "degree_name": "Bachelor of Computer Science",
        "graduation_date": "2023-05-15",
        "gpa": 3.8
    },
    "issuer": "State University"
}
```

### Verify Chain
```
GET /blockchain/verify
```

### Update Record
```
POST /blockchain/update
Content-Type: application/json

{
    "student_id": "STU001",
    "updated_data": {
        "degree_name": "Bachelor of Computer Science with Honors"
    }
}
```

### Get Student History
```
GET /blockchain/student/{student_id}
```

### Get Full Chain
```
GET /blockchain/chain
```

### Get Blockchain Info
```
GET /blockchain/info
```

## Installation & Usage

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start the API server:
```bash
python app.py
```

3. Test the API:
```bash
python test_api.py
```

## Blockchain Structure

Each block contains:
- `student_record`: Student credential data
- `timestamp`: Unix timestamp
- `previous_hash`: Hash of the previous block
- `hash`: SHA-256 hash of the current block

## Data Persistence

The blockchain is automatically saved to `student_blockchain.json` after each operation.

## Testing

The `test_api.py` script demonstrates all API endpoints with sample student data.

## Security Features

- SHA-256 cryptographic hashing
- Immutable record keeping
- Tamper detection through chain verification
- Append-only update mechanism