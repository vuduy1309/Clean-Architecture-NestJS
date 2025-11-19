/**
 * RESTFUL API & CÁC CHUẨN API KHÁC
 * 
 * So sánh, ví dụ, và khi nào dùng cái nào
 */

// ============================================================================
// 1. REST (Representational State Transfer)
// ============================================================================

/**
 * REST = Chuẩn API sử dụng HTTP methods để tương tác với resources
 * 
 * Nguyên tắc:
 * 1. Resource-based (API tập trung vào resource: /users, /posts, /comments)
 * 2. HTTP methods (GET, POST, PUT, DELETE, PATCH)
 * 3. Stateless (mỗi request độc lập)
 * 4. Client-Server (client request, server response)
 * 5. Uniform interface (chuẩn nhất quán)
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: RESTful API (CRUD users)
 * 
 * GET /users
 * - Lấy danh sách tất cả users
 * - Response: [{ id: 1, name: "John" }, { id: 2, name: "Jane" }]
 * 
 * GET /users/1
 * - Lấy chi tiết user có id=1
 * - Response: { id: 1, name: "John", email: "john@example.com" }
 * 
 * POST /users
 * - Tạo user mới
 * - Body: { name: "Bob", email: "bob@example.com" }
 * - Response: { id: 3, name: "Bob", email: "bob@example.com" }
 * 
 * PUT /users/1
 * - Cập nhật toàn bộ user id=1
 * - Body: { name: "John Updated", email: "john.new@example.com" }
 * - Response: { id: 1, name: "John Updated", email: "john.new@example.com" }
 * 
 * PATCH /users/1
 * - Cập nhật một phần user id=1 (chỉ field cần thay đổi)
 * - Body: { name: "John Patched" }
 * - Response: { id: 1, name: "John Patched", email: "john@example.com" }
 * 
 * DELETE /users/1
 * - Xóa user có id=1
 * - Response: { message: "User deleted" }
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ CODE: NestJS RESTful API
 * 
 * ```typescript
 * @Controller('users')
 * export class UsersController {
 *   @Get()
 *   findAll() {
 *     return this.usersService.findAll();
 *   }
 * 
 *   @Get(':id')
 *   findOne(@Param('id') id: string) {
 *     return this.usersService.findOne(+id);
 *   }
 * 
 *   @Post()
 *   create(@Body() createUserDto: CreateUserDto) {
 *     return this.usersService.create(createUserDto);
 *   }
 * 
 *   @Put(':id')
 *   update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
 *     return this.usersService.update(+id, updateUserDto);
 *   }
 * 
 *   @Patch(':id')
 *   partialUpdate(@Param('id') id: string, @Body() updateUserDto: Partial<UpdateUserDto>) {
 *     return this.usersService.partialUpdate(+id, updateUserDto);
 *   }
 * 
 *   @Delete(':id')
 *   remove(@Param('id') id: string) {
 *     return this.usersService.remove(+id);
 *   }
 * }
 * ```
 * 
 * Ưu điểm:
 * ✓ Simple & easy to understand
 * ✓ Standard (widely adopted)
 * ✓ Stateless (scalable)
 * ✓ Browser friendly (use GET)
 * ✓ Good for CRUD operations
 * 
 * Nhược điểm:
 * ❌ Over-fetching (GET /users lấy toàn bộ field, dù chỉ cần vài cái)
 * ❌ Under-fetching (GET /users?include=posts cần multiple requests)
 * ❌ API versioning phức tạp (/v1/users, /v2/users)
 * ❌ Nested resources khó (/users/1/posts/5/comments/10)
 */

// ============================================================================
// 2. GraphQL
// ============================================================================

/**
 * GraphQL = Query language cho API (client chỉ định chính xác data cần)
 * 
 * Khác REST:
 * - 1 endpoint duy nhất (thường là /graphql)
 * - Client gửi query chỉ định fields cần
 * - Server trả về đúng data yêu cầu (no over-fetching)
 * - Tự động join multiple resources (no under-fetching)
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: GraphQL Query
 * 
 * Query 1: Lấy users với chỉ name & email
 * ```graphql
 * query {
 *   users {
 *     id
 *     name
 *     email
 *   }
 * }
 * ```
 * 
 * Response:
 * ```json
 * {
 *   "data": {
 *     "users": [
 *       { "id": 1, "name": "John", "email": "john@example.com" },
 *       { "id": 2, "name": "Jane", "email": "jane@example.com" }
 *     ]
 *   }
 * }
 * ```
 * 
 * Query 2: Lấy user với posts (nested)
 * ```graphql
 * query {
 *   user(id: 1) {
 *     id
 *     name
 *     posts {
 *       id
 *       title
 *       comments {
 *         id
 *         text
 *       }
 *     }
 *   }
 * }
 * ```
 * 
 * Response:
 * ```json
 * {
 *   "data": {
 *     "user": {
 *       "id": 1,
 *       "name": "John",
 *       "posts": [
 *         {
 *           "id": 1,
 *           "title": "Post 1",
 *           "comments": [
 *             { "id": 1, "text": "Comment 1" }
 *           ]
 *         }
 *       ]
 *     }
 *   }
 * }
 * ```
 * 
 * Mutation (thay đổi data):
 * ```graphql
 * mutation {
 *   createUser(input: { name: "Bob", email: "bob@example.com" }) {
 *     id
 *     name
 *     email
 *   }
 * }
 * ```
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ CODE: NestJS + GraphQL
 * 
 * ```typescript
 * import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
 * 
 * @Resolver(() => User)
 * export class UsersResolver {
 *   @Query(() => [User])
 *   users() {
 *     return this.usersService.findAll();
 *   }
 * 
 *   @Query(() => User)
 *   user(@Args('id', { type: () => Int }) id: number) {
 *     return this.usersService.findOne(id);
 *   }
 * 
 *   @Mutation(() => User)
 *   createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
 *     return this.usersService.create(createUserInput);
 *   }
 * }
 * ```
 * 
 * Ưu điểm:
 * ✓ No over-fetching (client chỉ định fields cần)
 * ✓ No under-fetching (nested query in 1 request)
 * ✓ Strongly typed schema
 * ✓ Auto-generated documentation
 * ✓ Powerful queries & filters
 * 
 * Nhược điểm:
 * ❌ Learning curve cao
 * ❌ Caching phức tạp (khác HTTP caching)
 * ❌ File upload không đơn giản
 * ❌ Rate limiting khó
 * ❌ Monitoring khó (logs không rõ)
 * 
 * Khi nào dùng:
 * - Mobile app (bandwidth quan trọng)
 * - Complex nested data
 * - Multiple client types (web, mobile, desktop)
 * - Real-time updates (Subscription)
 */

// ============================================================================
// 3. gRPC
// ============================================================================

/**
 * gRPC = Remote Procedure Call, dùng Protocol Buffers (binary format)
 * 
 * Khác REST:
 * - Binary protocol (nhẹ, nhanh)
 * - HTTP/2 (multiplexing, streaming)
 * - Strongly typed (Proto definition)
 * - Request-Response + Streaming
 * - Server-to-Server (internal API)
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: gRPC Proto definition
 * 
 * users.proto:
 * ```protobuf
 * syntax = "proto3";
 * 
 * package users;
 * 
 * message User {
 *   int32 id = 1;
 *   string name = 2;
 *   string email = 3;
 * }
 * 
 * message GetUserRequest {
 *   int32 id = 1;
 * }
 * 
 * message ListUsersRequest {}
 * 
 * service UsersService {
 *   rpc GetUser(GetUserRequest) returns (User);
 *   rpc ListUsers(ListUsersRequest) returns (stream User);
 *   rpc CreateUser(User) returns (User);
 * }
 * ```
 * 
 * VÍ DỤ CODE: NestJS + gRPC
 * 
 * ```typescript
 * @Controller()
 * export class UsersController {
 *   @GrpcMethod('UsersService', 'GetUser')
 *   getUser(data: GetUserRequest) {
 *     return this.usersService.findOne(data.id);
 *   }
 * 
 *   @GrpcMethod('UsersService', 'ListUsers')
 *   listUsers() {
 *     return this.usersService.findAll();
 *   }
 * }
 * ```
 * 
 * Ưu điểm:
 * ✓ Binary format (nhẹ, nhanh)
 * ✓ HTTP/2 (tốc độ cao)
 * ✓ Strongly typed
 * ✓ Streaming support (real-time)
 * ✓ Tốt cho microservices
 * 
 * Nhược điểm:
 * ❌ Browser không support (need gateway)
 * ❌ Learning curve cao
 * ❌ Debugging khó
 * ❌ Tool support kém
 * 
 * Khi nào dùng:
 * - Microservices (internal service-to-service)
 * - Real-time streaming
 * - High performance
 * - Bandwidth bị hạn chế
 */

// ============================================================================
// 4. SOAP (Simple Object Access Protocol)
// ============================================================================

/**
 * SOAP = Protocol dùng XML, chủ yếu trong enterprise systems
 * 
 * Khác REST:
 * - XML-based (verbose, nặng)
 * - HTTP POST duy nhất (không dùng GET, PUT, DELETE)
 * - WSDL definition (Web Services Description Language)
 * - Strongly typed
 * - ACID transactions support
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: SOAP Request/Response
 * 
 * Request:
 * ```xml
 * <?xml version="1.0"?>
 * <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap-envelope/">
 *   <soap:Body>
 *     <GetUser xmlns="http://myapi.com">
 *       <id>1</id>
 *     </GetUser>
 *   </soap:Body>
 * </soap:Envelope>
 * ```
 * 
 * Response:
 * ```xml
 * <?xml version="1.0"?>
 * <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap-envelope/">
 *   <soap:Body>
 *     <GetUserResponse xmlns="http://myapi.com">
 *       <user>
 *         <id>1</id>
 *         <name>John</name>
 *         <email>john@example.com</email>
 *       </user>
 *     </GetUserResponse>
 *   </soap:Body>
 * </soap:Envelope>
 * ```
 * 
 * Ưu điểm:
 * ✓ Enterprise standard (banks, insurance)
 * ✓ ACID transactions
 * ✓ Built-in security
 * ✓ Strongly typed
 * 
 * Nhược điểm:
 * ❌ Verbose (XML overhead)
 * ❌ Chậm
 * ❌ Phức tạp
 * ❌ Lỗi thời (ít dùng ngày nay)
 * 
 * Khi nào dùng:
 * - Legacy systems
 * - Enterprise integration
 * - Banking APIs
 * ⚠️ Tránh nếu có thể!
 */

// ============================================================================
// 5. JSON-RPC
// ============================================================================

/**
 * JSON-RPC = Remote Procedure Call dùng JSON
 * 
 * Khác REST:
 * - 1 endpoint duy nhất
 * - POST requests chứa method name & params
 * - JSON request/response
 * - Request-Response pairing (id)
 * - Simpler than SOAP, less powerful than GraphQL
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: JSON-RPC Request/Response
 * 
 * Request:
 * ```json
 * POST /api HTTP/1.1
 * Content-Type: application/json
 * 
 * {
 *   "jsonrpc": "2.0",
 *   "method": "getUser",
 *   "params": { "id": 1 },
 *   "id": 1
 * }
 * ```
 * 
 * Response:
 * ```json
 * {
 *   "jsonrpc": "2.0",
 *   "result": {
 *     "id": 1,
 *     "name": "John",
 *     "email": "john@example.com"
 *   },
 *   "id": 1
 * }
 * ```
 * 
 * Ưu điểm:
 * ✓ Simple
 * ✓ JSON (readable)
 * ✓ Lightweight
 * 
 * Nhược điểm:
 * ❌ Ít dùng (niche)
 * ❌ No standard tooling
 * ❌ Caching khó
 * 
 * Khi nào dùng:
 * - Blockchain (Ethereum JSON-RPC)
 * - Legacy systems
 * - Simple internal APIs
 */

// ============================================================================
// 6. Webhook
// ============================================================================

/**
 * Webhook = Server push events to client (push notification, real-time)
 * 
 * Khác REST:
 * - Client register URL để nhận events
 * - Server gửi HTTP POST khi có events
 * - Async (không wait response)
 * - Event-driven
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: Webhook Flow
 * 
 * 1. Client register:
 * ```
 * POST /webhooks
 * {
 *   "url": "https://myapp.com/webhooks/payment",
 *   "events": ["payment.success", "payment.failed"]
 * }
 * ```
 * 
 * 2. Payment event happens:
 * Server automatically sends:
 * ```
 * POST https://myapp.com/webhooks/payment
 * {
 *   "event": "payment.success",
 *   "data": {
 *     "orderId": 123,
 *     "amount": 100,
 *     "timestamp": "2025-11-18T10:00:00Z"
 *   }
 * }
 * ```
 * 
 * 3. Client handler:
 * ```typescript
 * @Post('/webhooks/payment')
 * handlePaymentWebhook(@Body() data: PaymentEvent) {
 *   console.log('Payment received:', data);
 *   // Update order status, send email, etc
 * }
 * ```
 * 
 * Ưu điểm:
 * ✓ Real-time notifications
 * ✓ Asynchronous (không block)
 * ✓ Reduces polling
 * 
 * Nhược điểm:
 * ❌ Tricky (retry logic, idempotency)
 * ❌ Debugging khó
 * ❌ Security (validate signature)
 * 
 * Khi nào dùng:
 * - Payment providers (Stripe, PayPal)
 * - GitHub events
 * - Real-time notifications
 * - Event-driven architecture
 */

// ============================================================================
// 7. SERVER-SENT EVENTS (SSE)
// ============================================================================

/**
 * SSE = Server push updates to client over HTTP (one-way, continuous)
 * 
 * Khác REST:
 * - Client open connection
 * - Server sends stream of updates
 * - One-way (server → client only)
 * - HTTP persistent connection
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: SSE
 * 
 * Client:
 * ```javascript
 * const eventSource = new EventSource('/api/events');
 * 
 * eventSource.addEventListener('message', (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Received:', data);
 * });
 * ```
 * 
 * Server (NestJS):
 * ```typescript
 * @Get('events')
 * events(@Sse()) {
 *   return new Observable((subscriber) => {
 *     const interval = setInterval(() => {
 *       subscriber.next({ data: { message: 'Update' } });
 *     }, 1000);
 * 
 *     return () => clearInterval(interval);
 *   });
 * }
 * ```
 * 
 * Ưu điểm:
 * ✓ Real-time updates
 * ✓ Simple (just HTTP)
 * ✓ Automatic reconnect
 * 
 * Nhược điểm:
 * ❌ One-way (server only)
 * ❌ Limited browser support
 * ❌ Not for high-frequency updates
 * 
 * Khi nào dùng:
 * - Live notifications
 * - Stock updates
 * - News feeds
 */

// ============================================================================
// 8. WEBSOCKET
// ============================================================================

/**
 * WebSocket = Bi-directional real-time communication (client ↔ server)
 * 
 * Khác REST:
 * - Persistent connection
 * - Two-way communication
 * - Low latency (<100ms)
 * - Binary or text frames
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * VÍ DỤ: WebSocket
 * 
 * Client:
 * ```javascript
 * const ws = new WebSocket('ws://localhost:3000/chat');
 * 
 * ws.onmessage = (event) => {
 *   console.log('Message:', event.data);
 * };
 * 
 * ws.send(JSON.stringify({ type: 'message', text: 'Hello' }));
 * ```
 * 
 * Server (NestJS):
 * ```typescript
 * @WebSocketGateway()
 * export class ChatGateway {
 *   @SubscribeMessage('message')
 *   handleMessage(client: Socket, payload: any) {
 *     client.broadcast.emit('message', payload);
 *   }
 * }
 * ```
 * 
 * Ưu điểm:
 * ✓ Real-time bi-directional
 * ✓ Low latency
 * ✓ Perfect for chat, gaming, collaboration
 * ✓ Reduces overhead (no HTTP headers)
 * 
 * Nhược điểm:
 * ❌ Stateful (harder to scale)
 * ❌ Requires special handling
 * ❌ Firewall/proxy issues
 * 
 * Khi nào dùng:
 * - Chat / messaging
 * - Online games
 * - Collaborative tools (Figma, Google Docs)
 * - Live notifications
 */

// ============================================================================
// SO SÁNH TẤT CẢ API STANDARDS
// ============================================================================

/**
 * ┌────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
 * │ Tiêu chí   │ REST     │ GraphQL  │ gRPC     │ SOAP     │ WebSocket│
 * ├────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
 * │ Learning   │ ⭐⭐⭐⭐⭐│ ⭐⭐⭐   │ ⭐⭐     │ ⭐       │ ⭐⭐⭐⭐  │
 * │ Tốc độ     │ ⭐⭐⭐   │ ⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐│ ⭐       │ ⭐⭐⭐⭐⭐│
 * │ Flexibility│ ⭐⭐⭐   │ ⭐⭐⭐⭐⭐│ ⭐⭐     │ ⭐⭐     │ ⭐⭐⭐⭐  │
 * │ Caching    │ ⭐⭐⭐⭐⭐│ ⭐⭐     │ ⭐⭐⭐   │ ⭐⭐⭐   │ ❌       │
 * │ Monitoring │ ⭐⭐⭐⭐⭐│ ⭐⭐⭐   │ ⭐⭐⭐   │ ⭐⭐⭐   │ ⭐⭐⭐   │
 * │ Real-time  │ ❌       │ ⭐⭐⭐   │ ⭐⭐⭐⭐  │ ❌       │ ⭐⭐⭐⭐⭐│
 * │ Type-safe  │ ❌       │ ⭐⭐⭐⭐⭐│ ⭐⭐⭐⭐⭐│ ⭐⭐⭐⭐⭐│ ⭐⭐     │
 * │ Browser    │ ✓        │ ✓        │ ❌       │ ✗        │ ✓        │
 * │ Adoption   │ ⭐⭐⭐⭐⭐│ ⭐⭐⭐⭐  │ ⭐⭐⭐   │ ⭐       │ ⭐⭐⭐⭐  │
 * └────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
 */

// ============================================================================
// CHỌN API STANDARD NÀO?
// ============================================================================

/**
 * Chọn REST:
 * ✓ Public APIs
 * ✓ Web applications
 * ✓ CRUD operations
 * ✓ Simple, standard
 * ✓ Caching important (CDN)
 * Ví dụ: Twitter, GitHub, Stripe
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * Chọn GraphQL:
 * ✓ Mobile apps (bandwidth critical)
 * ✓ Multiple client types
 * ✓ Complex nested data
 * ✓ Real-time subscriptions
 * ✓ Strongly typed frontend
 * Ví dụ: GitHub API v4, Shopify
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * Chọn gRPC:
 * ✓ Microservices (internal)
 * ✓ High-performance systems
 * ✓ Streaming data
 * ✓ Latency-critical
 * ✓ Bandwidth-critical
 * Ví dụ: Google APIs, Kubernetes, etcd
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * Chọn WebSocket:
 * ✓ Real-time bi-directional
 * ✓ Chat/messaging
 * ✓ Collaborative tools
 * ✓ Gaming
 * ✓ Live updates
 * Ví dụ: Slack, Discord, Google Docs
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * Chọn Webhook:
 * ✓ Event-driven
 * ✓ Async notifications
 * ✓ Third-party integrations
 * ✓ Payment notifications
 * Ví dụ: Stripe, GitHub, Twilio
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * Chọn SOAP:
 * ❌ Không chọn! (Lỗi thời)
 * ✓ Chỉ dùng nếu legacy system require
 */

// ============================================================================
// HYBRID APPROACH
// ============================================================================

/**
 * Kết hợp REST + WebSocket:
 * - REST cho CRUD (GET, POST, PUT, DELETE)
 * - WebSocket cho real-time updates
 * 
 * Ví dụ: E-commerce (carts, orders)
 * ```typescript
 * // REST API (CRUD)
 * POST /api/orders (create order)
 * GET /api/orders/123 (get order)
 * 
 * // WebSocket (real-time)
 * ws://api.com/orders/123/updates
 * Event: order.shipped, order.delivered
 * ```
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * Kết hợp REST + GraphQL:
 * - REST cho public API (simple)
 * - GraphQL cho mobile clients (advanced)
 * 
 * Ví dụ: E-learning platform
 * ```
 * REST: /api/courses (public, simple)
 * GraphQL: /graphql (mobile, complex queries)
 * ```
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * Kết hợp REST + gRPC:
 * - REST cho client-facing API
 * - gRPC cho service-to-service
 * 
 * Ví dụ: Microservices architecture
 * ```
 * Client → REST API Gateway → gRPC → Microservices
 * ```
 */

// ============================================================================
// RESTFUL API BEST PRACTICES
// ============================================================================

/**
 * 1. Resource naming (danh từ, không động từ)
 * ✓ GET /users (danh từ)
 * ✗ GET /getUsers (động từ)
 * 
 * 2. HTTP Methods
 * ✓ GET /users (lấy danh sách)
 * ✓ POST /users (tạo mới)
 * ✓ PUT /users/1 (cập nhật toàn bộ)
 * ✓ PATCH /users/1 (cập nhật một phần)
 * ✓ DELETE /users/1 (xóa)
 * 
 * 3. Status codes
 * ✓ 200 OK (success)
 * ✓ 201 Created (resource created)
 * ✓ 204 No Content (success, no response)
 * ✓ 400 Bad Request (invalid input)
 * ✓ 401 Unauthorized (need auth)
 * ✓ 403 Forbidden (no permission)
 * ✓ 404 Not Found (resource not found)
 * ✓ 500 Internal Server Error (server error)
 * 
 * 4. Versioning
 * ✓ /v1/users, /v2/users (URL versioning)
 * ✓ Accept: application/vnd.api+json;version=1 (header versioning)
 * ✓ Deprecation headers (slow migration)
 * 
 * 5. Pagination
 * ✓ GET /users?page=1&limit=10
 * ✓ Response: { data: [...], total: 100, page: 1 }
 * 
 * 6. Filtering & Sorting
 * ✓ GET /users?role=admin&sort=-createdAt
 * ✓ GET /users?filter[email]=john@example.com
 * 
 * 7. Error handling
 * ✓ Consistent error format:
 * {
 *   "error": {
 *     "code": "INVALID_EMAIL",
 *     "message": "Invalid email format",
 *     "details": { "field": "email" }
 *   }
 * }
 * 
 * 8. Authentication
 * ✓ Authorization: Bearer <token>
 * ✓ API key in header
 * ✓ OAuth 2.0 for third-party
 * 
 * 9. Rate limiting
 * ✓ Headers: X-RateLimit-Limit, X-RateLimit-Remaining
 * ✓ 429 Too Many Requests
 * 
 * 10. Documentation
 * ✓ OpenAPI/Swagger
 * ✓ Request/Response examples
 * ✓ Error cases
 */

console.log('✓ RESTful API & API Standards guide created');
