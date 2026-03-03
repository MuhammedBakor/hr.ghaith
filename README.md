# نظام غيث ERP | Ghaith ERP System

<div dir="rtl">

## نظام إدارة موارد المؤسسة المتكامل

نظام غيث هو نظام ERP متكامل مبني بتقنيات حديثة، يغطي 18 وحدة وظيفية مع 5 طبقات أمان و231 جدول بيانات.

</div>

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

---

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Tailwind CSS 4 + Vite 7 |
| **Backend** | Express 4 + tRPC Server + Node.js |
| **Database** | MySQL 2 + Drizzle ORM (231 tables) |
| **Auth** | JWT (Jose) + BCrypt + Cookie Sessions |
| **UI Library** | Radix UI + shadcn/ui |
| **State** | TanStack Query + tRPC Client |
| **Testing** | Vitest (65 test files) |
| **Storage** | AWS S3 |
| **Comms** | Nodemailer (SMTP) + WhatsApp API |

---

## 📦 Modules (18 وحدة)

### Core Modules
| Module | Files | Lines | Status |
|--------|-------|-------|--------|
| 🧑‍💼 **HR** | 29 | 16,291 | ✅ Complete |
| 💰 **Finance** | 16 | 10,116 | ✅ Complete |
| 🚗 **Fleet** | 25 | 7,681 | ✅ Complete |
| 🏢 **Property** | 6 | 2,878 | ✅ Complete |
| 🛡️ **Governance** | 11 | 3,769 | ✅ Advanced |
| ⚖️ **Legal** | 12 | 2,820 | ✅ Partial |
| 📢 **Marketing** | 17 | 1,173 | ✅ Complete |
| 🏭 **Operations** | 3 | 749 | ✅ Basic |
| 🛒 **Store** | 16 | 1,494 | ✅ Complete |

### Support Modules
| Module | Files | Lines | Status |
|--------|-------|-------|--------|
| 🌐 **Public Site** | 66 | 4,573 | ✅ Advanced |
| 📊 **BI/Analytics** | 7 | 1,623 | ✅ Complete |
| 📧 **Correspondence** | 3 | 1,569 | ✅ Complete |
| 📄 **Documents** | 4 | 1,169 | ✅ Complete |
| 📋 **Reports** | 3 | 1,756 | ✅ Complete |
| 📝 **Requests** | 3 | 1,544 | ✅ Complete |
| ⚙️ **Settings** | 11 | 3,556 | ✅ Complete |
| 🖥️ **Platform** | 12 | 4,580 | ✅ Advanced |
| 👤 **Admin** | 16 | 7,479 | ✅ Advanced |

---

## 🔒 Security Architecture (5 Layers)

```
Layer 1: Authentication     → JWT + Cookie Sessions
Layer 2: RBAC              → 55+ protected procedures per module
Layer 3: Scope Enforcement → Company / Branch / Department
Layer 4: Decision Kernel   → Checks every operation, can block/escalate
Layer 5: Governance Gates  → Enforce institutional policies
```

---

## 🏗️ Core Engines

| Engine | Description |
|--------|-------------|
| **Decision Kernel** | Central decision engine for every operation |
| **Governance Engine** | 12+ governance files, compliance gates |
| **Scope Enforcement** | Company/branch/department access control |
| **Automation Kernel** | Rules engine with event binding |
| **Event Bus** | Event system with job/notification integration |
| **SLA Engine** | Service level agreements with escalation |
| **Financial Engine** | Double-entry accounting, commitments, ledger |
| **Cross-Module Integration** | HR↔Fleet↔Finance↔Governance hub |
| **Audit Logger** | Comprehensive operation logging with evidence |
| **Cache Layer** | In-memory caching with tag/pattern invalidation |

---

## 📁 Project Structure

```
ghaith-ui/
├── client/                    # Frontend (React)
│   └── src/
│       ├── pages/            # 18 module pages
│       ├── components/       # Shared UI components
│       ├── contexts/         # App context
│       ├── hooks/            # Custom hooks
│       ├── lib/              # tRPC client, utils
│       └── __tests__/        # Frontend E2E tests
├── server/                    # Backend (Express + tRPC)
│   ├── routers.ts            # Main router (12K+ lines)
│   ├── routers/              # Split router modules
│   │   ├── hr.ts             # HR router (1,283 lines)
│   │   ├── fleet.ts          # Fleet router (782 lines)
│   │   ├── finance.ts        # Finance router (1,083 lines)
│   │   ├── property.ts       # Property router (284 lines)
│   │   └── store.ts          # Store router (198 lines)
│   ├── _core/                # Core engines
│   │   ├── DecisionKernel.ts
│   │   ├── governanceIntegration.ts
│   │   ├── scopeEnforcement.ts
│   │   ├── automationKernel.ts
│   │   ├── eventBus.ts
│   │   ├── slaEngine.ts
│   │   ├── cacheLayer.ts
│   │   └── trpc.ts           # RBAC procedures
│   ├── db.ts                 # Database operations
│   └── hrAdvanced.ts         # HR advanced features
├── drizzle/
│   └── schema.ts             # 231 tables
├── scripts/
│   └── consolidate-migrations.mjs
└── shared/                    # Shared types
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test
pnpm vitest run server/decisionKernel.test.ts

# Run frontend tests
pnpm vitest run client/src/__tests__/
```

**Coverage:** 65 test files, ~3,000+ test cases covering:
- Unit tests: Decision engines, accounting, RBAC
- Integration tests: Module integration, full workflows
- E2E tests: Store checkout, HR flows, Finance operations
- Security tests: Permissions, sessions, encryption
- Cache tests: CRUD, invalidation, performance

---

## 🔧 Environment Variables

```env
DATABASE_URL=mysql://user:password@localhost:3306/ghaith
JWT_SECRET=your-jwt-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=your-api-key
```

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Total Code Lines | 223,962 |
| Files | 617+ |
| Database Tables | 231 |
| Test Files | 65 |
| tRPC Routes | 200+ |
| Migration Files | 57 |
| Frontend Pages | 176 (all API-connected) |

---

## 📜 License

Proprietary - © 2026 Ghaith ERP



## التشغيل

### التطوير
```bash
npm install
npm run dev
```

### الإنتاج مع Docker
```bash
docker-compose up -d
```

### الإنتاج بدون Docker
```bash
npm install
npm run build
npm start
```

## المتطلبات
- Node.js 20+
- MySQL 8.0+
- متغيرات البيئة (انسخ .env.example إلى .env)

