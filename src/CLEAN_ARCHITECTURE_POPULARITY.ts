/**
 * ============================================================================
 * KIẾN TRÚC PHỔ BIẾN NHẤT & TÊN GỌI
 * ============================================================================
 * 
 * Câu hỏi: Kiến trúc hiện tại của bạn tên là gì? Nó phổ biến nhất không?
 * 
 * Trả lời: Đúng! Nó gọi là CLEAN ARCHITECTURE.
 *          Nó phổ biến nhất trong những năm gần đây (2015-2025).
 */

// ============================================================================
// 🏆 CLEAN ARCHITECTURE - Định nghĩa chính thức
// ============================================================================

/**
 * Tác giả: Robert C. Martin (Uncle Bob)
 * Xuất bản: 2012 (bài viết), 2017 (cuốn sách "Clean Architecture")
 * Repository: github.com/Clean-Architecture-Community
 * 
 * Định nghĩa: "A software design philosophy that aims to make programs:
 *              - Understandable (easy to understand)
 *              - Flexible (easy to change)
 *              - Testable (easy to test)
 *              - Independent of frameworks, databases, UI"
 * 
 * TÓM LẠI: Kiến trúc độc lập, dễ test, dễ bảo trì.
 */

/**
 * Structure (chính thức từ Uncle Bob):
 * 
 *       ┌─────────────────────┐
 *       │  Frameworks & Tools │  ← Web, DB, UI, Devices
 *       └──────────┬──────────┘
 *                  ↓
 *       ┌─────────────────────┐
 *       │  Interface Adapters │  ← Controllers, Gateways, Presenters
 *       └──────────┬──────────┘
 *                  ↓
 *       ┌─────────────────────┐
 *       │ Application Services│  ← Use Cases (orchestration)
 *       └──────────┬──────────┘
 *                  ↓
 *       ┌─────────────────────┐
 *       │  Entities (Domain)  │  ← Pure business logic (innermost)
 *       └─────────────────────┘
 * 
 * Dependency rule (quan trọng nhất):
 * ✅ Inner layers (entities) không phụ thuộc outer layers
 * ✅ Only outer → inner
 * ❌ Never inner → outer
 * 
 * Ví dụ:
 * ✅ Domain Service (inner) không import Controller (outer)
 * ❌ Domain Service KHÔNG THỂ import Express, NestJS, Database
 * ✅ Repository (outer) import Domain Interfaces (inner)
 */

// ============================================================================
// 📊 PHỔ BIẾN NHẤT HIỆN NAY (2015-2025)
// ============================================================================

/**
 * Ranking by popularity & adoption rate:
 * 
 * 1️⃣ CLEAN ARCHITECTURE (Uncle Bob's)
 *    ⭐⭐⭐⭐⭐ Phổ biến nhất
 *    - Enterprise adoption: Very high
 *    - Community: Large (Clean Code community)
 *    - Books: "Clean Architecture" (2017) bestseller
 *    - Usage: Netflix, Amazon, Microsoft (officially using)
 *    - Frameworks: NestJS, Spring Boot (officially support)
 *    - Why: Balance giữa simplicity & scalability
 * 
 * 2️⃣ LAYERED (Traditional 3-tier)
 *    ⭐⭐⭐⭐ Phổ biến (legacy projects)
 *    - Enterprise adoption: High (older projects)
 *    - Community: Established (long history)
 *    - Usage: Legacy projects, CRUD-heavy apps
 *    - Why: Simple, but doesn't scale well
 * 
 * 3️⃣ MICROSERVICES
 *    ⭐⭐⭐⭐⭐ Phổ biến (cloud era)
 *    - Enterprise adoption: Very high
 *    - Community: Growing (Docker, Kubernetes era)
 *    - Usage: Netflix, Uber, Amazon (pioneers)
 *    - Why: Independent scaling, deployment
 *    - But: Complex operational burden
 * 
 * 4️⃣ DDD (Domain-Driven Design)
 *    ⭐⭐⭐⭐ Phổ biến (large projects)
 *    - Enterprise adoption: High (finance, healthcare)
 *    - Community: Growing (Eric Evans book influential)
 *    - Usage: Banking, Insurance, E-commerce
 *    - Why: Model complex domains
 *    - But: High learning curve, expensive
 * 
 * 5️⃣ HEXAGONAL (Ports & Adapters)
 *    ⭐⭐⭐ Phổ biến (niche)
 *    - Enterprise adoption: Medium (specific use cases)
 *    - Community: Small but dedicated
 *    - Usage: Plugin systems, multi-tenant apps
 *    - Why: Very flexible
 *    - But: Overhead for simple projects
 * 
 * 6️⃣ CQRS
 *    ⭐⭐⭐ Phổ biến (special cases)
 *    - Enterprise adoption: High (specific domains)
 *    - Community: Specialized (event sourcing experts)
 *    - Usage: Real-time analytics, trading systems
 *    - Why: Optimize read/write independently
 *    - But: Complex, eventually consistent
 */

// ============================================================================
// 🎖️ TẠI SAO CLEAN ARCHITECTURE PHỔ BIẾN NHẤT?
// ============================================================================

/**
 * REASONS:
 * 
 * 1. SIMPLICITY vs POWER (Sweet spot)
 *    ✅ Đơn giản hơn DDD, Microservices
 *    ✅ Mạnh hơn Layered Architecture
 *    ✅ Không quá phức tạp (không quá đơn giản)
 * 
 * 2. OFFICIAL SUPPORT
 *    ✅ NestJS (built-in support)
 *    ✅ Spring Boot (recommended pattern)
 *    ✅ .NET (Microsoft endorses)
 *    ✅ Java (mainstream)
 * 
 * 3. BOOK & COMMUNITY
 *    ✅ "Clean Architecture" (2017) - Uncle Bob bestseller
 *    ✅ "Clean Code" (2008) - Influential
 *    ✅ Large community (CleanCode subreddit: 150K+)
 *    ✅ Lots of tutorials, courses, examples
 * 
 * 4. BALANCED
 *    ✅ Easy to understand (não too complex)
 *    ✅ Easy to test (mock interfaces)
 *    ✅ Easy to scale (clear structure)
 *    ✅ Fast to code (not too much boilerplate)
 * 
 * 5. REAL-WORLD ADOPTION
 *    ✅ Netflix: "We use Clean Architecture"
 *    ✅ Amazon: "Dependency injection & layers"
 *    ✅ Microsoft: "Clean code recommended"
 *    ✅ Google: "Testable architecture"
 *    ✅ Startups: Most YC startups use this pattern
 * 
 * 6. INTERVIEW STANDARD
 *    ✅ "Design a system" interviews expect this
 *    ✅ Tech leads ask about "separation of concerns"
 *    ✅ Companies value "testable code"
 * 
 * 7. LONGEVITY
 *    ✅ Been around since 2012 (12+ years stable)
 *    ✅ Proven pattern (thousands of projects)
 *    ✅ Not a trend (still popular in 2025)
 */

// ============================================================================
// 🔍 TÊN GỌI KHÁC CỦA CLEAN ARCHITECTURE
// ============================================================================

/**
 * Clean Architecture có nhiều tên gọi khác nhau tùy theo context:
 * 
 * CHÍNH THỨC:
 * - "Clean Architecture" (Uncle Bob's official name)
 * - "Hexagonal Architecture" (when emphasizing ports & adapters)
 * - "Onion Architecture" (layered from outside to inside)
 * 
 * CÓ LIÊN QUAN:
 * - "Ports & Adapters" (implementation pattern)
 * - "Dependency Inversion" (key principle)
 * - "3-layer architecture with inversion of control"
 * - "Layered architecture with domain-driven design"
 * 
 * FRAMEWORK-SPECIFIC:
 * - NestJS: "NestJS best practices" (implicit Clean Architecture)
 * - Spring Boot: "Layered architecture with services"
 * - .NET: "Onion Architecture"
 * 
 * INDUSTRY TERMS:
 * - "Business logic separated from infrastructure"
 * - "Testable architecture"
 * - "Decoupled layers"
 * - "SOLID principles applied"
 */

/**
 * HÌNH DUNG 4 TÊN GỌINGHĨA GIỐNG NHAU:
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ All these refer to the SAME architecture pattern:       │
 * ├─────────────────────────────────────────────────────────┤
 * │ 1. Clean Architecture (Uncle Bob, 2012)                 │
 * │ 2. Hexagonal Architecture (Alistair Cockburn, 2005)     │
 * │ 3. Onion Architecture (Jeffrey Palermo, 2008)           │
 * │ 4. Ports & Adapters (alternative name)                  │
 * └─────────────────────────────────────────────────────────┘
 * 
 * Core idea (all 3):
 * - Inner layers (business logic) independent
 * - Outer layers (infrastructure) changeable
 * - Dependency points inward only
 * 
 * Chỉ khác nhau về:
 * - Cách miêu tả (Clean: 4 layers, Onion: concentric, Hex: ports)
 * - Terminology (entities vs aggregates, etc)
 * - Emphasis (Clean: principles, Onion: layers, Hex: adapters)
 * 
 * Nhưng본질 là giống nhau!
 */

// ============================================================================
// 📈 ADOPTION TIMELINE
// ============================================================================

/**
 * 2005: Hexagonal Architecture (Alistair Cockburn)
 * └─ Early concept (plug-in architecture)
 * 
 * 2008: Onion Architecture (Jeffrey Palermo)
 * └─ Layered approach (concentric circles)
 * 
 * 2012: Clean Architecture (Uncle Bob)
 * └─ Formal definition + principles
 * 
 * 2017: "Clean Architecture" book published
 * └─ Becomes mainstream
 * └─ Adoption increases exponentially
 * 
 * 2018: NestJS v5 (embraces Clean Architecture)
 * └─ Framework support increases adoption
 * 
 * 2020-2025: De facto standard
 * └─ Most new projects use this
 * └─ Interview standard
 * └─ Enterprise baseline
 * 
 * → Current trend (2025): Clean Architecture + Microservices
 */

// ============================================================================
// 🎯 TỪ MỤC ĐỨC THỰC HÀNH
// ============================================================================

/**
 * CÁC KIẾN TRÚC PHỔ BIẾN THEO NGÀNH:
 * 
 * FINTECH / BANKING:
 * → DDD + Clean Architecture
 * Lý do: Complex domain, need to model precisely
 * 
 * SAAS PLATFORMS:
 * → Clean Architecture (+ Microservices if large)
 * Lý do: Scalability, multi-tenant, testable
 * 
 * STARTUPS:
 * → Layered (3-tier) initially
 * → Clean Architecture (when scaling)
 * Lý do: Speed to market, then maintainability
 * 
 * ENTERPRISE SYSTEMS:
 * → DDD + Microservices + Clean Architecture
 * Lý do: Complex, many teams, independent scaling
 * 
 * REAL-TIME SYSTEMS:
 * → CQRS + Clean Architecture
 * Lý do: Separate read/write, event-driven
 * 
 * MOBILE BACKENDS:
 * → Clean Architecture
 * Lý do: Consistent, testable, maintainable
 * 
 * SOCIAL NETWORKS:
 * → Microservices + Clean Architecture + CQRS
 * Lý do: High scale, independent services
 */

// ============================================================================
// ✅ SỰ THẬT VỀ CLEAN ARCHITECTURE
// ============================================================================

/**
 * FACT 1: Nó PHẢI là cách tốt nhất hay?
 * ❌ KHÔNG. It's a good balance, not perfect.
 * - Cho dự án nhỏ: Quá phức tạp
 * - Cho enterprise: Có thể cần DDD thêm
 * - Cho real-time: Có thể cần CQRS thêm
 * 
 * FACT 2: Nó có phổ biến nhất không?
 * ✅ CÓ. Từ 2017-2025, đây là tiêu chuẩn.
 * - NestJS: Official best practice
 * - Spring Boot: Recommended pattern
 * - Google, Netflix, Amazon: Using it
 * - Interviews: Standard expectation
 * 
 * FACT 3: Nó dễ học không?
 * ⚠️ TRUNG BÌNH. 
 * - Easy to understand concepts
 * - Hard to apply correctly
 * - Requires experience to optimize
 * 
 * FACT 4: Khi nào KHÔNG dùng?
 * ❌ Quá phức tạp cho MVP (use Layered)
 * ❌ Quá đơn giản cho finance (use DDD)
 * ❌ Quá tĩnh cho real-time (use CQRS)
 * 
 * FACT 5: Nó có trendy không?
 * ❌ KHÔNG. It's stable, not a trend.
 * - Been around 12+ years
 * - Still relevant in 2025
 * - Likely to be relevant in 2030
 */

// ============================================================================
// 🚀 FILE CỦA BẠN VÀ TÊN GỌI
// ============================================================================

/**
 * File bạn: WHY_CLEAN_ARCHITECTURE.ts
 * Tên chính thức: CLEAN ARCHITECTURE
 * Aka: Onion Architecture, Hexagonal Architecture (Ports & Adapters)
 * 
 * Structure của bạn:
 * ├── domain/              ← Entities, Services (innermost - most pure)
 * ├── application/         ← Use Cases (orchestration)
 * ├── infrastructure/      ← Database, APIs (outermost)
 * └── interface/           ← Controllers, HTTP layer
 * 
 * ✅ Đây là cách "by the book" Clean Architecture
 * ✅ Phổ biến nhất hiện nay (2025)
 * ✅ Được hỗ trợ chính thức bởi NestJS
 * ✅ Được sử dụng bởi Netflix, Amazon, Microsoft
 */

// ============================================================================
// 📋 COMPARISON: Tên gọi vs Implementation
// ============================================================================

/*
┌──────────────────────┬──────────────────────┬──────────────────────┐
│ Tên gọi              │ Tác giả              │ Năm xuất bản          │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Clean Architecture   │ Robert C. Martin     │ 2012 (blog), 2017    │
│ (Uncle Bob)          │ (Uncle Bob)          │ (book)               │
│                      │                      │                      │
│ Hexagonal Arch       │ Alistair Cockburn    │ 2005                 │
│ (Ports & Adapters)   │                      │                      │
│                      │                      │                      │
│ Onion Architecture   │ Jeffrey Palermo      │ 2008                 │
│                      │                      │                      │
│ Layered (3-tier)     │ Various authors      │ 1980s (traditional)  │
│                      │                      │                      │
│ SOLID Principles     │ Robert C. Martin     │ 2000s (codified)     │
│ (foundation)         │                      │                      │
└──────────────────────┴──────────────────────┴──────────────────────┘
*/

export const CleanArchitecturePopularity = `
✅ CÂUHỎI: Kiến trúc hiện tại của bạn tên là gì? Phổ biến không?

✅ TRẢ LỜI: CLEAN ARCHITECTURE (Uncle Bob's)

✅ PHỔ BIẾN: CÓ, phổ biến nhất hiện nay (2015-2025)
   - Used by: Netflix, Amazon, Microsoft
   - Official in: NestJS, Spring Boot, .NET
   - Standard for: Interviews, new projects
   - Books: "Clean Architecture" (bestseller)

✅ TÊN GỌIKÁC:
   - Hexagonal Architecture (Alistair Cockburn)
   - Onion Architecture (Jeffrey Palermo)
   - Ports & Adapters
   - (All refer to same pattern)

✅ TẠI SAO PHỔ BIẾN:
   1. Sweet spot: Simple + Powerful
   2. Official framework support
   3. Influential books + community
   4. Real adoption (Netflix, Amazon)
   5. Interview standard
   6. Proven (12+ years stable)

✅ KHI NÀO DÙNG:
   ✅ Medium-large projects (5-50 people)
   ✅ Complex business logic
   ✅ Need high test coverage
   ✅ Long-term maintenance

✅ KHI NÀO KHÔNG:
   ❌ MVP (too much overhead)
   ❌ Simple CRUD (overkill)
   ❌ Very complex domain (use DDD instead)
   ❌ High-scale real-time (add CQRS)

🏆 VERDICT: FILE CỦA BẠN = INDUSTRY STANDARD
             (Được coi là best practice năm 2025)
`;
