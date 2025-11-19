/**
 * SSR vs CSR vs MPA vs SPA - CHI TIẾT & VÍ DỤ CODE
 * 
 * Giải thích toàn diện các khái niệm rendering
 */

// ============================================================================
// 1. CSR (Client-Side Rendering)
// ============================================================================

/**
 * CSR = Server chỉ gửi JS, client tự render HTML
 * 
 * ❌ KHÔNG TỐT CHO SEO
 * ✓ TỐT CHO UX (mượt, chuyển trang nhanh)
 * 
 * Flow:
 * 1. User request: http://myapp.com
 * 2. Server response: index.html (gần như trống) + app.js
 * 3. Browser download JS
 * 4. JS chạy, tạo HTML, render giao diện (blank → loaded)
 * 5. User thấy trang sau 2-3 giây (slow initial load)
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: React SPA (create-react-app)
 * 
 * src/index.html:
 * ```html
 * <!DOCTYPE html>
 * <html>
 *   <head>
 *     <title>My App</title>
 *   </head>
 *   <body>
 *     <div id="root"></div>  <!-- Empty! -->
 *     <script src="app.js"></script>  <!-- JS sẽ render vào đây -->
 *   </body>
 * </html>
 * ```
 * 
 * src/App.tsx:
 * ```tsx
 * export function App() {
 *   const [users, setUsers] = useState([]);
 * 
 *   useEffect(() => {
 *     // Fetch data ở client
 *     fetch('/api/users')
 *       .then(r => r.json())
 *       .then(data => setUsers(data));
 *   }, []);
 * 
 *   return (
 *     <div>
 *       <h1>Users</h1>
 *       {users.map(u => <p key={u.id}>{u.name}</p>)}
 *     </div>
 *   );
 * }
 * ```
 * 
 * Timeline:
 * T=0ms:      User click → fetch started
 * T=100ms:    index.html loaded (blank page)
 * T=500ms:    app.js loaded
 * T=1000ms:   JS executed, API call started
 * T=1500ms:   API response received
 * T=1600ms:   HTML rendered (users appear)
 * ────────────
 * Total: ~1600ms (SLOW!)
 * 
 * SEO: ❌ Google bot nhận index.html rỗng, không crawl data
 * 
 * Ưu điểm:
 * - Chuyển trang nhanh (JS handle, không reload)
 * - Trải nghiệm mượt mà
 * - Code bên client (responsive, interactive)
 * 
 * Nhược điểm:
 * - Trang đầu tải chậm
 * - SEO kém
 * - Cần tối ưu để cải thiện
 */

// ============================================================================
// 2. SSR (Server-Side Rendering)
// ============================================================================

/**
 * SSR = Server render HTML, gửi về client đã có nội dung
 * 
 * ✓ TỐT CHO SEO
 * ✓ TỐT CHO INITIAL LOAD
 * ❌ Server phải render mỗi lần (costly)
 * 
 * Flow:
 * 1. User request: http://myapp.com
 * 2. Server fetch data (từ DB hoặc API)
 * 3. Server render React → HTML string
 * 4. Server response: HTML đã có nội dung + JS
 * 5. Browser hiển thị ngay (fast initial load)
 * 6. JS hydrate (attach event listeners)
 * 7. Trang tương tác bình thường (SPA mode)
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: Next.js (SSR framework)
 * 
 * pages/users.tsx:
 * ```tsx
 * export async function getServerSideProps() {
 *   // Chạy trên SERVER, mỗi lần request
 *   const res = await fetch('http://api.example.com/users');
 *   const users = await res.json();
 * 
 *   return {
 *     props: { users },
 *     revalidate: 60  // Revalidate mỗi 60s
 *   };
 * }
 * 
 * export default function UsersPage({ users }) {
 *   return (
 *     <div>
 *       <h1>Users</h1>
 *       {users.map(u => <p key={u.id}>{u.name}</p>)}
 *     </div>
 *   );
 * }
 * ```
 * 
 * Timeline:
 * T=0ms:      User click
 * T=50ms:     Server fetch API
 * T=100ms:    Server render React to HTML
 * T=150ms:    Server response sent (HTML + JS)
 * T=200ms:    Browser receive HTML, display (FAST!)
 * T=500ms:    JS downloaded & hydrated
 * T=600ms:    Trang tương tác được
 * ────────────
 * Total initial render: ~200ms (FAST!)
 * 
 * SEO: ✓ Google bot nhận HTML đầy đủ, crawl được data
 * 
 * Ưu điểm:
 * - Trang đầu tải cực nhanh (200ms vs 1600ms)
 * - SEO tốt (HTML có sẵn)
 * - Chuyển trang vẫn nhanh (SPA mode sau hydrate)
 * 
 * Nhược điểm:
 * - Server phải render mỗi request (resource intensive)
 * - Latency cao nếu API chậm
 */

// ============================================================================
// 3. MPA (Multi-Page Application)
// ============================================================================

/**
 * MPA = Mỗi route là trang HTML riêng, mỗi click chuyển trang reload
 * 
 * ✓ TỐT CHO SEO
 * ❌ CHUYỂN TRANG CHẬM (reload)
 * 
 * Flow:
 * 1. User request: http://myapp.com/home
 * 2. Server response: home.html
 * 3. Browser hiển thị
 * 4. User click link → /about
 * 5. Browser reload, request /about
 * 6. Server response: about.html
 * 7. Browser reload, hiển thị
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: Traditional PHP/Rails MPA
 * 
 * Laravel routes/web.php:
 * ```php
 * Route::get('/users', [UserController::class, 'index']);
 * Route::get('/users/{id}', [UserController::class, 'show']);
 * ```
 * 
 * app/Http/Controllers/UserController.php:
 * ```php
 * class UserController extends Controller {
 *   public function index() {
 *     $users = User::all();
 *     return view('users.index', ['users' => $users]);
 *   }
 * 
 *   public function show($id) {
 *     $user = User::find($id);
 *     return view('users.show', ['user' => $user]);
 *   }
 * }
 * ```
 * 
 * resources/views/users/index.blade.php:
 * ```blade
 * <html>
 *   <body>
 *     <h1>Users</h1>
 *     <ul>
 *       @foreach($users as $user)
 *         <li>
 *           <a href="/users/{{ $user->id }}">{{ $user->name }}</a>
 *         </li>
 *       @endforeach
 *     </ul>
 *   </body>
 * </html>
 * ```
 * 
 * Timeline:
 * T=0ms:      User click /users
 * T=100ms:    Server fetch & render
 * T=200ms:    Response received
 * T=300ms:    Page displayed
 * 
 * User click /users/1:
 * T=400ms:    Browser reload (blank screen)
 * T=500ms:    Server fetch & render
 * T=600ms:    Response received
 * T=700ms:    Page displayed (CHUYỂN TRANG CHẬM!)
 * 
 * SEO: ✓ Mỗi trang có riêng HTML, dễ crawl
 * 
 * Ưu điểm:
 * - SEO tốt (truyền thống)
 * - Mỗi trang độc lập
 * - Server-side logic dễ
 * 
 * Nhược điểm:
 * - Chuyển trang chậm (reload)
 * - UX kém (blink, flash)
 * - Không mượt như SPA
 */

// ============================================================================
// 4. SPA (Single-Page Application)
// ============================================================================

/**
 * SPA = Chỉ 1 file HTML, chuyển trang bằng JS (không reload)
 * 
 * ✓ UX MƯỢT (no reload)
 * ❌ SEO KÉM (mặc định)
 * 
 * Flow:
 * 1. User request: http://myapp.com
 * 2. Server response: index.html + app.js
 * 3. JS chạy, hydrate route (React Router, Vue Router, etc)
 * 4. User click link → /about
 * 5. JS handle route change (NO RELOAD!)
 * 6. JS fetch data, render new component
 * 7. URL change (History API)
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: React Router SPA
 * 
 * src/App.tsx:
 * ```tsx
 * import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
 * import Home from './pages/Home';
 * import Users from './pages/Users';
 * 
 * export function App() {
 *   return (
 *     <Router>
 *       <Routes>
 *         <Route path="/" element={<Home />} />
 *         <Route path="/users" element={<Users />} />
 *       </Routes>
 *     </Router>
 *   );
 * }
 * ```
 * 
 * src/pages/Users.tsx:
 * ```tsx
 * import { useEffect, useState } from 'react';
 * 
 * export default function Users() {
 *   const [users, setUsers] = useState([]);
 * 
 *   useEffect(() => {
 *     // Fetch mỗi khi component mount
 *     fetch('/api/users')
 *       .then(r => r.json())
 *       .then(setUsers);
 *   }, []);
 * 
 *   return (
 *     <div>
 *       <h1>Users</h1>
 *       <ul>
 *         {users.map(u => (
 *           <li key={u.id}>
 *             <a href={`/users/${u.id}`}>{u.name}</a>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 * 
 * Timeline:
 * T=0ms:      User request /
 * T=500ms:    app.js loaded, React init
 * T=600ms:    /users route init, fetch data
 * 
 * User click /users:
 * T=700ms:    NO RELOAD! Route handler triggered
 * T=800ms:    Fetch /api/users
 * T=850ms:    Component update (SMOOTH!)
 * ────────────
 * Page switch: ~150ms (mượt!)
 * 
 * SEO: ❌ Initial HTML rỗng, need SSR
 * 
 * Ưu điểm:
 * - Chuyển trang cực nhanh (JS handle)
 * - UX mượt (no flash, no reload)
 * - App-like feel
 * - Tiết kiệm bandwidth (chỉ fetch data, không HTML)
 * 
 * Nhược điểm:
 * - Trang đầu tải chậm
 * - SEO kém (need SSR hoặc pre-render)
 */

// ============================================================================
// 5. MPA vs SPA SO SÁNH
// ============================================================================

/**
 * ┌───────────────────┬──────────────────┬──────────────────┐
 * │ Đặc điểm          │ MPA              │ SPA              │
 * ├───────────────────┼──────────────────┼──────────────────┤
 * │ Trang đầu         │ ✓ Nhanh (200ms)  │ ❌ Chậm (1.5s)   │
 * │ Chuyển trang      │ ❌ Chậm (reload) │ ✓ Nhanh (no re)  │
 * │ SEO               │ ✓ Tốt            │ ❌ Kém (need opt)│
 * │ UX                │ ❌ Flash          │ ✓ Mượt           │
 * │ Server load       │ ❌ Cao (render)  │ ✓ Thấp           │
 * │ Bandwidth         │ ❌ Cao (HTML)    │ ✓ Thấp (JSON)    │
 * │ Ví dụ             │ Rails, Django    │ React, Vue       │
 * └───────────────────┴──────────────────┴──────────────────┘
 */

// ============================================================================
// 6. HYBRID: SSR + SPA (Best of both worlds)
// ============================================================================

/**
 * Kết hợp SSR (trang đầu nhanh + SEO) + SPA (chuyển trang mượt)
 * 
 * Flow:
 * 1. Initial request: /users
 * 2. Server SSR render + response HTML (200ms - FAST!)
 * 3. Browser display (user sees content)
 * 4. JS hydrate (attach event listeners)
 * 5. User click → /users/1
 * 6. JS fetch data, no reload (SMOOTH!)
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: Next.js (SSR + SPA hybrid)
 * 
 * pages/users/[id].tsx:
 * ```tsx
 * export async function getServerSideProps({ params }) {
 *   // SERVER: Fetch & render lần đầu
 *   const user = await fetch(`/api/users/${params.id}`).then(r => r.json());
 *   return { props: { user } };
 * }
 * 
 * export default function UserDetail({ user }) {
 *   const [comments, setComments] = useState([]);
 * 
 *   // CLIENT: Dynamic data fetch (SPA mode)
 *   useEffect(() => {
 *     fetch(`/api/users/${user.id}/comments`)
 *       .then(r => r.json())
 *       .then(setComments);
 *   }, [user.id]);
 * 
 *   return (
 *     <div>
 *       <h1>{user.name}</h1>
 *       <p>{user.bio}</p>
 *       <h2>Comments</h2>
 *       {comments.map(c => <p key={c.id}>{c.text}</p>)}
 *     </div>
 *   );
 * }
 * ```
 * 
 * Timeline:
 * Initial page load:
 * T=0ms:      User request /users/1
 * T=50ms:     Server fetch user data
 * T=100ms:    Server SSR render
 * T=150ms:    Response sent (HTML + JS)
 * T=200ms:    Browser display user name (FAST!)
 * T=500ms:    JS hydrate complete
 * 
 * Page switch (client):
 * User click /users/2:
 * T=600ms:    JS route handler
 * T=700ms:    Fetch /api/users/2 (JSON, not HTML!)
 * T=750ms:    Update (SMOOTH!)
 * 
 * Benefits:
 * ✓ Trang đầu nhanh (SSR)
 * ✓ Chuyển trang mượt (SPA)
 * ✓ SEO tốt (HTML có sẵn)
 * ✓ UX tuyệt vời
 */

// ============================================================================
// 7. SEO OPTIMIZATION
// ============================================================================

/**
 * SEO = Tối ưu để Google crawl & rank cao
 * 
 * ✓ TỐT CHO SEO:
 * - SSR / MPA (HTML có sẵn)
 * - Semantic HTML (<h1>, <article>, <nav>)
 * - Meta tags (<title>, <meta description>, og:image)
 * - Structured data (JSON-LD)
 * - Fast loading speed
 * - Mobile responsive
 * 
 * ❌ KÉM CHO SEO:
 * - CSR / SPA (HTML rỗng, need JS)
 * - Slow loading
 * - JavaScript errors
 * - Missing meta tags
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: SEO tối ưu cho React SPA
 * 
 * Option 1: Helmet (client-side meta tags)
 * ```tsx
 * import { Helmet } from 'react-helmet';
 * 
 * export function ProductPage({ product }) {
 *   return (
 *     <>
 *       <Helmet>
 *         <title>{product.name} - My Store</title>
 *         <meta name="description" content={product.description} />
 *         <meta property="og:image" content={product.image} />
 *       </Helmet>
 *       <h1>{product.name}</h1>
 *       <p>{product.description}</p>
 *     </>
 *   );
 * }
 * ```
 * 
 * ⚠️ Nhưng Google crawler có thể không chạy JS!
 * 
 * Option 2: Pre-render (static generation)
 * ```tsx
 * // next.js
 * export async function getStaticProps({ params }) {
 *   const product = await fetchProduct(params.id);
 *   return {
 *     props: { product },
 *     revalidate: 60  // Regenerate mỗi 60s
 *   };
 * }
 * ```
 * 
 * Option 3: Dynamic rendering
 * - Detect Googlebot user-agent
 * - Return SSR HTML for bot
 * - Return SPA JS for user
 * 
 * Option 4: Next.js (SSR by default)
 * - Tự động SSR
 * - Tự động meta tags via Helmet
 * - Tự động image optimization
 */

// ============================================================================
// 8. CHỌN TECHNOLOGY NÀO?
// ============================================================================

/**
 * Chọn CSR/SPA (React, Vue, Angular):
 * - Internal tools (admin dashboard, CRUD app)
 * - Real-time app (chat, collaboration)
 * - App-like interface (Gmail, Trello)
 * - User không quan tâm SEO
 * 
 * Chọn SSR (Next.js, Nuxt.js, SvelteKit):
 * - Public website (blog, e-commerce, landing page)
 * - SEO quan trọng
 * - Trang đầu tải phải nhanh
 * - Muốn vừa fast + mượt
 * 
 * Chọn MPA (Rails, Django, Laravel, PHP):
 * - Server-side rendering đơn giản
 * - SEO quan trọng
 * - Ít interaction, chủ yếu display
 * - Team quen server-side
 * 
 * Chọn Static (Hugo, Jekyll, Gatsby):
 * - Blog, documentation
 * - Nội dung ít thay đổi
 * - Tối ưu SEO
 * - Tốc độ siêu nhanh (CDN)
 */

console.log('✓ SSR/CSR/MPA/SPA/SEO guide created');
