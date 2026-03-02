import hashlib
import json
import time
from datetime import datetime
from typing import Dict, List, Optional


class Block:
    def __init__(self, student_record: Dict, previous_hash: str, timestamp: Optional[float] = None):
        self.student_record = student_record
        self.timestamp = timestamp or time.time()
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        block_string = json.dumps({
            'student_record': self.student_record,
            'timestamp': self.timestamp,
            'previous_hash': self.previous_hash
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def to_dict(self) -> Dict:
        return {
            'student_record': self.student_record,
            'timestamp': self.timestamp,
            'previous_hash': self.previous_hash,
            'hash': self.hash
        }
    
    @classmethod
    def from_dict(cls, block_dict: Dict):
        block = cls(
            student_record=block_dict['student_record'],
            previous_hash=block_dict['previous_hash'],
            timestamp=block_dict['timestamp']
        )
        block.hash = block_dict['hash']
        return block


class Blockchain:
    def __init__(self, storage_file: str = 'blockchain_data.json'):
        self.storage_file = storage_file
        self.chain: List[Block] = []
        self.load_chain()
    
    def create_genesis_block(self):
        genesis_block = Block(
            student_record={'type': 'genesis', 'message': 'First block in the chain'},
            previous_hash='0'
        )
        self.chain.append(genesis_block)
        self.save_chain()
    
    def add_block(self, student_record: Dict) -> Block:
        if not self.chain:
            self.create_genesis_block()
        
        previous_block = self.chain[-1]
        new_block = Block(
            student_record=student_record,
            previous_hash=previous_block.hash
        )
        self.chain.append(new_block)
        self.save_chain()
        return new_block
    
    def verify_chain(self) -> Dict:
        if not self.chain:
            return {'valid': False, 'message': 'Chain is empty'}
        
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            if current_block.hash != current_block.calculate_hash():
                return {
                    'valid': False,
                    'message': f'Block {i} hash mismatch',
                    'block_index': i
                }
            
            if current_block.previous_hash != previous_block.hash:
                return {
                    'valid': False,
                    'message': f'Block {i} previous hash mismatch',
                    'block_index': i
                }
        
        return {'valid': True, 'message': 'Chain is valid'}
    
    def update_student_record(self, student_id: str, updated_record: Dict) -> Block:
        update_record = {
            'type': 'update',
            'student_id': student_id,
            'updated_data': updated_record,
            'update_timestamp': time.time()
        }
        return self.add_block(update_record)
    
    def get_student_history(self, student_id: str) -> List[Dict]:
        history = []
        for block in self.chain:
            if block.student_record.get('student_id') == student_id:
                history.append(block.to_dict())
        return history

    def get_student_current(self, student_id: str) -> Optional[Dict]:
        current = None
        for b in self.chain:
            sr = b.student_record or {}
            sid = sr.get('student_id')
            if sid != student_id:
                continue
            if sr.get('type') == 'update':
                if current:
                    upd = sr.get('updated_data') or {}
                    if isinstance(upd, dict):
                        # Shallow merge into credential_data if present, else into root
                        if isinstance(current.get('credential_data'), dict) and isinstance(upd, dict):
                            current['credential_data'] = {**current.get('credential_data', {}), **upd}
                        else:
                            current.update(upd)
                continue
            # Base credential block
            current = {
                'student_id': sr.get('student_id'),
                'first_name': sr.get('first_name'),
                'last_name': sr.get('last_name'),
                'roll_no': sr.get('roll_no') or sr.get('student_id'),
                'credential_type': sr.get('credential_type'),
                'credential_data': sr.get('credential_data'),
                'issuer': sr.get('issuer'),
                'issue_date': sr.get('issue_date'),
            }
        return current
    
    def save_chain(self):
        chain_data = [block.to_dict() for block in self.chain]
        with open(self.storage_file, 'w') as f:
            json.dump(chain_data, f, indent=2)
    
    def load_chain(self):
        try:
            with open(self.storage_file, 'r') as f:
                chain_data = json.load(f)
                self.chain = [Block.from_dict(block_data) for block_data in chain_data]
        except (FileNotFoundError, json.JSONDecodeError):
            self.chain = []
            self.create_genesis_block()
    
    def get_chain_info(self) -> Dict:
        return {
            'length': len(self.chain),
            'latest_block': self.chain[-1].to_dict() if self.chain else None,
            'chain_valid': self.verify_chain()['valid']
        }
