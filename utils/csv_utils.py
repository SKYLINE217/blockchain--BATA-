import csv
import json
import os
import hashlib
from datetime import datetime, timedelta


def _ensure_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def generate_students_csv(output_path: str = "data/students.csv", count: int = 50) -> str:
    """Generate a CSV with at least `count` student records.

    Columns: student_id, first_name, last_name, credential_type, credential_data, issuer, issue_date
    `credential_data` is a JSON string.
    """
    if count < 50:
        count = 50

    _ensure_dir(output_path)

    first_names = [
        "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Cameron",
        "Parker", "Quinn"
    ]
    last_names = [
        "Smith", "Johnson", "Lee", "Brown", "Davis", "Miller", "Wilson", "Moore",
        "Taylor", "Anderson"
    ]
    cred_types = ["degree", "transcript", "certificate"]

    start_date = datetime(2022, 1, 15)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "student_id",
            "first_name",
            "last_name",
            "credential_type",
            "credential_data",
            "issuer",
            "issue_date"
        ])

        for i in range(1, count + 1):
            sid = f"STU{i:03d}"
            fn = first_names[(i - 1) % len(first_names)]
            ln = last_names[(i - 1) % len(last_names)]
            ctype = cred_types[(i - 1) % len(cred_types)]
            issuer = "University System"
            issue_date = (start_date + timedelta(days=i * 10)).strftime("%Y-%m-%d")

            if ctype == "degree":
                cdata = {
                    "degree_name": "Bachelor of Science",
                    "major": "Computer Science",
                    "graduation_date": issue_date,
                    "gpa": round(3.0 + (i % 10) * 0.05, 2)
                }
            elif ctype == "transcript":
                cdata = {
                    "semester": "Spring 2024",
                    "courses": [
                        {"course": "CS101", "grade": "A"},
                        {"course": "MATH201", "grade": "B+"},
                        {"course": "ENG101", "grade": "A-"}
                    ],
                    "semester_gpa": round(3.2 + (i % 5) * 0.1, 2)
                }
            else:  # certificate
                cdata = {
                    "certificate_name": "Blockchain Development",
                    "grade": "A",
                    "instructor": "Dr. Smith",
                    "completion_date": issue_date
                }

            cdata_str = json.dumps(cdata, separators=(",", ":"))
            writer.writerow([sid, fn, ln, ctype, cdata_str, issuer, issue_date])

    return output_path


def _row_hash(row: dict) -> str:
    payload = {
        "student_id": row.get("student_id"),
        "first_name": row.get("first_name"),
        "last_name": row.get("last_name"),
        "credential_type": row.get("credential_type"),
        "credential_data": row.get("credential_data"),
        "issuer": row.get("issuer"),
        "issue_date": row.get("issue_date"),
    }
    s = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def hash_csv(input_path: str = "data/students.csv", output_path: str = "data/students_hashed.csv") -> str:
    """Compute a SHA-256 hash for each CSV row and write to a new file with column `record_hash`."""
    _ensure_dir(output_path)

    with open(input_path, "r", newline="", encoding="utf-8") as fin:
        reader = csv.DictReader(fin)
        fieldnames = reader.fieldnames + ["record_hash"]
        with open(output_path, "w", newline="", encoding="utf-8") as fout:
            writer = csv.DictWriter(fout, fieldnames=fieldnames)
            writer.writeheader()
            for row in reader:
                row["record_hash"] = _row_hash(row)
                writer.writerow(row)

    return output_path
