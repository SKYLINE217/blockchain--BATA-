<div align="center">

<!-- Animated Header Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0D1117,50:FFB800,100:FF6B6B&height=220&section=header&text=Blockchain%20Credential%20System&fontSize=40&fontColor=FFFFFF&animation=fadeIn&fontAlignY=35&desc=Tamper-Proof%20Academic%20Credential%20Platform%20%E2%80%A2%20BATA%20Project&descSize=17&descAlignY=55&descColor=94A3B8" width="100%" />

<!-- Animated Typing SVG -->
<a href="https://github.com/SKYLINE217/blockchain--BATA-">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=22&duration=3000&pause=1000&color=FFB800&center=true&vCenter=true&multiline=true&repeat=true&width=750&height=80&lines=Decentralised+Academic+Credential+Issuance;SHA-256+Hashing+%7C+Immutable+Ledger+%7C+JWT+Auth;Role-Based+Dashboards%3A+Student+%7C+Employer+%7C+University" alt="Typing SVG" />
</a>

<br/>

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-REST%20API-000000?style=for-the-badge&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Auth%20Store-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![SHA-256](https://img.shields.io/badge/SHA--256-Cryptographic%20Hash-FFB800?style=for-the-badge)

</div>

---

> [!CAUTION]
> **Research & Demo Only** — This is a mock blockchain implementation for academic portfolio purposes. It does not implement a real distributed consensus mechanism. **Not intended for production use.**

---

## 🌐 Overview

**Blockchain Credential System** (BATA Project) is a decentralised academic credential issuance and verification platform using **cryptographic hashing** and an **immutable append-only ledger** to ensure tamper-proof academic records.

| | |
|:---:|:---|
| 🔗 **Blockchain Core** | SHA-256 hashing, immutable ledger, hash-chain continuity |
| 🔐 **Auth** | MongoDB-backed JWT login with role-gated dashboards |
| ⚡ **API** | Flask REST endpoints for credential CRUD + CSV tools |
| 📊 **Verification** | Chain integrity check, tamper detection, per-student history |
| 💾 **Persistence** | `student_blockchain.json` + MongoDB (`acms.users`) |

---

## 🏗️ Architecture

```mermaid
%%{init: {\'theme\': \'dark\', \'themeVariables\': {\'primaryColor\': \'#FFB800\', \'edgeLabelBackground\':\'#0D1117\', \'fontSize\': \'15px\'}}}%%
graph LR
    subgraph Clients["👤 ROLE-BASED CLIENTS"]
        S[("🎓 Student Dashboard")]
        E[("🏢 Employer Dashboard")]
        U[("🏛️ University Dashboard")]
    end
    subgraph API["⚡ FLASK REST API :5000"]
        AUTH["/auth/login JWT Issuance"]
        BC["/blockchain/* CRUD + Verify"]
        CSV["/tools/* CSV Utilities"]
    end
    subgraph Core["🔗 BLOCKCHAIN CORE"]
        CHAIN["Blockchain append-only"]
        HASH["SHA-256 Hash Chain"]
        FILE["student_blockchain.json"]
    end
    S & E & U -->|JWT Token| AUTH
    AUTH -->|Validate| MONGO[("MongoDB acms.users")]
    S & E & U --> BC & CSV
    BC --> CHAIN --> HASH --> FILE
    style S fill:#1a1a2e,stroke:#FFB800,color:#fff
    style E fill:#1a1a2e,stroke:#FFB800,color:#fff
    style U fill:#1a1a2e,stroke:#FFB800,color:#fff
    style AUTH fill:#1a1a2e,stroke:#4D6AF5,color:#fff
    style BC fill:#1a1a2e,stroke:#41CD52,color:#fff
    style CSV fill:#1a1a2e,stroke:#00D4FF,color:#fff
    style CHAIN fill:#1a1a2e,stroke:#EE4C2C,color:#fff
    style HASH fill:#1a1a2e,stroke:#F59E0B,color:#fff
    style FILE fill:#1a1a2e,stroke:#41CD52,color:#fff
    style MONGO fill:#1a1a2e,stroke:#47A248,color:#fff
```

### 🔗 Block Structure

```json
{
  "student_record": { "student_id": "...", "degree": "...", "grade": "..." },
  "timestamp": 1722800000.123,
  "previous_hash": "a3f7b2c1...",
  "hash": "d9e4f1a8..."
}
```

---

## 🔑 Key Features

| Feature | Description |
|:---:|:---|
| 🔗 **Immutable Ledger** | SHA-256 hash-chained blocks — no overwrite, append-only |
| 🔄 **Update Mechanism** | Corrections appended as new blocks preserving full history |
| ✅ **Chain Verification** | Detect tampering across the full credential chain |
| 🔐 **JWT Auth** | MongoDB-backed login for Student / Employer / University roles |
| 📦 **CSV Toolchain** | Generate, hash, import, verify CSVs against the blockchain |

---

## 🔐 Role-Based Access Control

| Role | Permissions |
|:---|:---|
| 🎓 **Student** | View own credentials |
| 🏢 **Employer** | Verify any credential |
| 🏛️ **University** | Issue & upload credentials |

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `POST` | `/blockchain/add` | Add a new credential block | `X-API-Key` |
| `POST` | `/blockchain/update` | Append a correction block | `X-API-Key` |
| `GET` | `/blockchain/verify` | Verify chain integrity | — |
| `GET` | `/blockchain/student/{student_id}` | Get student block history | — |
| `GET` | `/blockchain/chain` | Full chain dump | — |
| `GET` | `/blockchain/info` | Summary (length, latest, validity) | — |
| `GET` | `/health` | Service health | — |
| `POST` | `/auth/login` | Authenticate user with role | — |
| `POST` | `/tools/generate_csv` | Generate demo records CSV | `X-API-Key` |
| `POST` | `/tools/hash_csv` | Create hashed CSV | `X-API-Key` |
| `POST` | `/tools/import_csv` | Import CSV into blockchain | `X-API-Key` |
| `POST` | `/tools/verify_csv` | Compare CSV against hashed CSV | — |
| `POST` | `/university/upload` | Upload CSV file | `X-API-Key` |
| `GET` | `/verify/enrollment/{student_id}` | Retrieve current synthesised record | — |

---

## 🚀 Installation & Usage

```bash
# 1. Clone the repository
git clone https://github.com/SKYLINE217/blockchain--BATA-.git
cd blockchain--BATA-

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start MongoDB (default: mongodb://localhost:27017/)

# 4. Run in development
python app.py

# 5. Run in production (Waitress)
waitress-serve --host=0.0.0.0 --port=5000 app:app

# 6. Test
python test_api.py
python security_test.py
```

---

## 🔒 Security Features

| Feature | Implementation |
|:---|:---|
| **SHA-256 Hashing** | Every block cryptographically linked to its predecessor |
| **Tamper Detection** | `verify_chain()` recomputes all hashes and checks continuity |
| **Append-Only Updates** | Corrections create new blocks — original data preserved |
| **API Key Protection** | Write operations require `X-API-Key` header |
| **JWT Auth** | Role-based dashboard access controlled by signed tokens |

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0D1117,50:FFB800,100:FF6B6B&height=120&section=footer" width="100%"/>

[![GitHub](https://img.shields.io/badge/GitHub-SKYLINE217-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/SKYLINE217)

*Built with ❤️ for decentralised trust.*

</div>
