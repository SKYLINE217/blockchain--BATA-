

# Student Blockchain Credential System

A mock blockchain implementation for managing student credentials with tamper-proof record keeping, role-based sign-in, and MongoDB-backed authentication.

## Features

- **Blockchain Core**: SHA-256 hashing, immutable ledger, cryptographic linking
- **Student Records**: Store degrees, transcripts, and other credentials
- **Update Mechanism**: Append correction blocks without overwriting existing data
- **Chain Verification**: Detect tampering and validate integrity
- **REST API**: Flask-based endpoints for easy integration
- **Auth**: `/auth/login` with MongoDB users; role-based dashboards for Student, Employer, University

## API Endpoints

### Blockchain
- `POST /blockchain/add` — add a credential block (requires `X-API-Key`)
- `POST /blockchain/update` — append an update block (requires `X-API-Key`)
- `GET /blockchain/verify` — verify chain integrity
- `GET /blockchain/student/{student_id}` — get a student’s block history
- `GET /blockchain/chain` — full chain dump
- `GET /blockchain/info` — summary info (length, latest, validity)
- `GET /health` — service health
- `POST /auth/login` — authenticate user with role (`student|employer|university`)

### CSV Tools
- `POST /tools/generate_csv` — generate demo records CSV (requires `X-API-Key`)
- `POST /tools/hash_csv` — create hashed CSV with `record_hash` (requires `X-API-Key`)
- `POST /tools/import_csv` — import CSV rows into blockchain (requires `X-API-Key`)
- `POST /tools/verify_csv` — compare CSV rows against hashed CSV
- `POST /tools/verify_student_hash` — compute row hash and compare with expected
- `POST /tools/find_student_by_hash` — locate by hash in hashed CSV or blockchain

### University Upload
- `POST /university/upload` — upload a CSV file via form-data (requires `X-API-Key`)

### Verification by Enrollment
- `GET /verify/enrollment/{student_id}` — retrieve current synthesized record

## Installation & Usage

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure MongoDB is running locally at `mongodb://localhost:27017/` (default). You may override with `MONGO_URI`.

3. Run in development (Flask):
```bash
python app.py
```

4. Run in production (WSGI via Waitress):
```bash
waitress-serve --host=0.0.0.0 --port=5000 app:app
```

5. Test the API:
```bash
python test_api.py
```

6. Quick UI checks:
```bash
python verify_ui_endpoints.py
python verify_csv_endpoints.py
```

## Blockchain Structure

Each block contains:
- `student_record`: Student credential data
- `timestamp`: Unix timestamp
- `previous_hash`: Hash of the previous block
- `hash`: SHA-256 hash of the current block

## Data Persistence

The blockchain is automatically saved to `student_blockchain.json` after each operation. User accounts are stored in MongoDB under database `acms`, collection `users`.

## Testing

- `test_api.py` — basic end-to-end API flow
- `detailed_test.py` — comprehensive verification of endpoints and behaviors
- `verify_ui_endpoints.py` — fetch static UI assets and root page
- `verify_csv_endpoints.py` — exercise CSV tool endpoints
- `security_test.py` — tamper detection and integrity scenarios

## Code Structure

- `app.py` — Flask app, routes, and startup banner
  - Frontend routes: `/` (login), static assets under `/static/*`
  - Data routes: `/data/credentials`
  - Auth routes: `/auth/login`
  - Blockchain routes: add, update, verify, info, chain, history, health
  - CSV tool routes: generate, hash, import, verify, verify_student_hash, find_student_by_hash
  - University routes: CSV upload

- `blockchain.py` — blockchain primitives and operations
  - `class Block` with `calculate_hash()`, `to_dict()`, `from_dict()`
  - `class Blockchain` with `add_block()`, `verify_chain()`, `update_student_record()`, `get_student_history()`, `get_student_current()`, `save_chain()`, `load_chain()`, `get_chain_info()`

- `utils/csv_utils.py` — CSV helpers
  - `generate_students_csv(output_path, count)`
  - `hash_csv(input_path, output_path)`
  - `_row_hash(row)`

- `static/` — simple UI and dashboards
  - `login.html`, `student.html`, `employer.html`, `university.html`
  - `react_app.js` (React UMD UI), `app.js` (utility UI), `styles.css`

- `requirements.txt` — dependencies (`Flask`, `Werkzeug`, `requests`, `waitress`, `pymongo`)

## Security Features

- SHA-256 cryptographic hashing
- Immutable record keeping
- Tamper detection through chain verification
- Append-only update mechanism
- API key protection on write operations
- MongoDB-backed login for role-based dashboards
