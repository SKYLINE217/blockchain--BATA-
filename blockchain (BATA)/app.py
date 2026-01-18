from flask import Flask, request, jsonify, send_from_directory
from blockchain import Blockchain
from utils.csv_utils import generate_students_csv, hash_csv, _row_hash
import csv
import os
import hashlib
import json

app = Flask(__name__)

blockchain = Blockchain('student_blockchain.json')

@app.route('/', methods=['GET'])
def serve_frontend():
    return send_from_directory('static', 'login.html')

@app.route('/data/credentials', methods=['GET'])
def serve_credentials_file():
    return send_from_directory('data', 'user_credentials.json')

@app.route('/blockchain/add', methods=['POST'])
def add_credential():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['student_id', 'credential_type', 'credential_data']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        student_record = {
            'student_id': data['student_id'],
            'first_name': data.get('first_name'),
            'last_name': data.get('last_name'),
            'roll_no': data.get('roll_no') or data.get('student_id'),
            'credential_type': data['credential_type'],
            'credential_data': data['credential_data'],
            'issue_date': data.get('issue_date', None),
            'issuer': data.get('issuer', 'University System')
        }
        
        new_block = blockchain.add_block(student_record)
        
        return jsonify({
            'message': 'Credential added successfully',
            'block_hash': new_block.hash,
            'timestamp': new_block.timestamp,
            'block_index': len(blockchain.chain) - 1
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/blockchain/verify', methods=['GET'])
def verify_chain():
    try:
        verification_result = blockchain.verify_chain()
        chain_info = blockchain.get_chain_info()
        
        return jsonify({
            'verification': verification_result,
            'chain_info': chain_info
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/blockchain/update', methods=['POST'])
def update_record():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['student_id', 'updated_data']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        update_block = blockchain.update_student_record(
            data['student_id'],
            data['updated_data']
        )
        
        return jsonify({
            'message': 'Student record updated successfully',
            'block_hash': update_block.hash,
            'timestamp': update_block.timestamp,
            'block_index': len(blockchain.chain) - 1
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/blockchain/student/<student_id>', methods=['GET'])
def get_student_history(student_id):
    try:
        history = blockchain.get_student_history(student_id)
        
        if not history:
            return jsonify({'message': 'No records found for this student'}), 404
        
        return jsonify({
            'student_id': student_id,
            'record_count': len(history),
            'history': history
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/blockchain/chain', methods=['GET'])
def get_full_chain():
    try:
        chain_data = [block.to_dict() for block in blockchain.chain]
        
        return jsonify({
            'length': len(chain_data),
            'chain': chain_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/blockchain/info', methods=['GET'])
def get_blockchain_info():
    try:
        chain_info = blockchain.get_chain_info()
        
        return jsonify(chain_info), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'student-blockchain-api'}), 200

# CSV Tools
@app.route('/tools/generate_csv', methods=['POST'])
def api_generate_csv():
    try:
        data = request.get_json(silent=True) or {}
        count = int(data.get('count', 50))
        output_path = data.get('output_path', 'data/students.csv')
        path = generate_students_csv(output_path=output_path, count=count)
        return jsonify({'message': 'CSV generated', 'path': path, 'count': max(count, 50)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tools/hash_csv', methods=['POST'])
def api_hash_csv():
    try:
        data = request.get_json(silent=True) or {}
        input_path = data.get('input_path', 'data/students.csv')
        output_path = data.get('output_path', 'data/students_hashed.csv')
        path = hash_csv(input_path=input_path, output_path=output_path)
        return jsonify({'message': 'CSV hashed', 'path': path}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tools/import_csv', methods=['POST'])
def api_import_csv():
    try:
        data = request.get_json(silent=True) or {}
        input_path = data.get('input_path', 'data/students.csv')
        imported = 0
        errors = []
        with open(input_path, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=1):
                try:
                    cred_data = row.get('credential_data', '{}')
                    try:
                        cred_data_json = json.loads(cred_data)
                    except Exception:
                        cred_data_json = {'raw': cred_data}
                    student_record = {
                        'student_id': row.get('student_id'),
                        'first_name': row.get('first_name'),
                        'last_name': row.get('last_name'),
                        'roll_no': row.get('student_id'),
                        'credential_type': row.get('credential_type'),
                        'credential_data': cred_data_json,
                        'issue_date': row.get('issue_date'),
                        'issuer': row.get('issuer', 'University System')
                    }
                    blockchain.add_block(student_record)
                    imported += 1
                except Exception as e:
                    errors.append({'row': idx, 'error': str(e)})
        return jsonify({'message': 'Import complete', 'imported': imported, 'errors': errors, 'chain_length': len(blockchain.chain)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/teacher/upload', methods=['POST'])
def teacher_upload_csv():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        imported = 0
        errors = []
        stream = (line.decode('utf-8') for line in file.stream)
        reader = csv.DictReader(stream)
        for idx, row in enumerate(reader, start=1):
            try:
                cred_data = row.get('credential_data', '{}')
                try:
                    cred_data_json = json.loads(cred_data)
                except Exception:
                    cred_data_json = {'raw': cred_data}
                student_record = {
                    'student_id': row.get('student_id'),
                    'first_name': row.get('first_name'),
                    'last_name': row.get('last_name'),
                    'roll_no': row.get('student_id'),
                    'credential_type': row.get('credential_type'),
                    'credential_data': cred_data_json,
                    'issue_date': row.get('issue_date'),
                    'issuer': row.get('issuer', 'University System')
                }
                blockchain.add_block(student_record)
                imported += 1
            except Exception as e:
                errors.append({'row': idx, 'error': str(e)})
        return jsonify({'message': 'Upload complete', 'imported': imported, 'errors': errors, 'chain_length': len(blockchain.chain)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/verify/enrollment/<student_id>', methods=['GET'])
def verify_by_enrollment(student_id):
    try:
        current = blockchain.get_student_current(student_id)
        if not current:
            return jsonify({'found': False, 'message': 'Student not found'}), 404
        return jsonify({'found': True, 'student': current}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/verify/name_roll', methods=['POST'])
def verify_by_name_roll():
    try:
        data = request.get_json(silent=True) or {}
        fn = (data.get('first_name') or '').strip()
        ln = (data.get('last_name') or '').strip()
        roll = (data.get('roll_no') or '').strip()
        if not roll:
            return jsonify({'error': 'roll_no is required'}), 400
        current = blockchain.get_student_current(roll)
        if not current:
            return jsonify({'found': False, 'message': 'Student not found'}), 404
        name_ok = True
        if fn:
            name_ok = name_ok and (str(current.get('first_name') or '').strip().lower() == fn.lower())
        if ln:
            name_ok = name_ok and (str(current.get('last_name') or '').strip().lower() == ln.lower())
        return jsonify({'found': True, 'name_match': name_ok, 'student': current}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/tools/verify_hash', methods=['POST'])
def api_verify_hash():
    try:
        data = request.get_json(silent=True) or {}
        content = data.get('content', '')
        expected = data.get('expected_hash')
        computed = hashlib.sha256(content.encode('utf-8')).hexdigest()
        # Normalize expected: strip and lowercase to match hex representation
        expected_norm = (expected.strip().lower() if isinstance(expected, str) and expected.strip() else None)
        matches = (expected_norm is not None) and (computed == expected_norm)
        return jsonify({
            'computed_hash': computed,
            'expected_hash': expected_norm,
            'matches': matches
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/tools/verify_csv', methods=['POST'])
def api_verify_csv():
    try:
        data = request.get_json(silent=True) or {}
        input_path = data.get('input_path', 'data/students.csv')
        hashed_path = data.get('hashed_path', 'data/students_hashed.csv')
        mismatches = []
        total = 0
        with open(input_path, 'r', newline='', encoding='utf-8') as fin, \
             open(hashed_path, 'r', newline='', encoding='utf-8') as hf:
            reader = csv.DictReader(fin)
            hreader = csv.DictReader(hf)
            for idx, (row, hrow) in enumerate(zip(reader, hreader), start=1):
                total += 1
                computed = _row_hash(row)
                given = hrow.get('record_hash', '')
                if computed != given:
                    mismatches.append({
                        'row': idx,
                        'student_id': row.get('student_id'),
                        'computed': computed,
                        'given': given
                    })
        return jsonify({
            'total': total,
            'mismatches_count': len(mismatches),
            'mismatches': mismatches
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tools/verify_student_hash', methods=['POST'])
def api_verify_student_hash():
    try:
        data = request.get_json(silent=True) or {}
        row = data.get('row') or {}
        expected = data.get('expected_hash')
        expected_norm = (expected.strip().lower() if isinstance(expected, str) and expected.strip() else None)
        computed = _row_hash(row)
        matches = (expected_norm is not None) and (computed == expected_norm)
        return jsonify({
            'computed_hash': computed,
            'expected_hash': expected_norm,
            'matches': matches,
            'row': row
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tools/find_student_by_hash', methods=['POST'])
def api_find_student_by_hash():
    try:
        data = request.get_json(silent=True) or {}
        hashed_path = data.get('hashed_path', 'data/students_hashed.csv')
        target = data.get('hash')
        target_norm = (target.strip().lower() if isinstance(target, str) and target.strip() else None)
        if not target_norm:
            return jsonify({'error': 'No hash provided'}), 400
        found_row = None
        with open(hashed_path, 'r', newline='', encoding='utf-8') as hf:
            reader = csv.DictReader(hf)
            for row in reader:
                if (row.get('record_hash', '').strip().lower() == target_norm):
                    found_row = row
                    break
        if found_row:
            return jsonify({'found': True, 'source': 'csv', 'row': found_row}), 200
        block_match = None
        for b in blockchain.chain:
            h = getattr(b, 'hash', '')
            if isinstance(h, str) and h.strip().lower() == target_norm:
                block_match = b.to_dict()
                break
        if block_match:
            return jsonify({'found': True, 'source': 'blockchain', 'block': block_match}), 200
        return jsonify({'found': False, 'message': 'Not found'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    print("Starting Student Blockchain API...")
    print(f"Blockchain file: {blockchain.storage_file}")
    print(f"Chain length: {len(blockchain.chain)}")
    print(f"Chain valid: {blockchain.verify_chain()['valid']}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
