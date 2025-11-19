/**
 * JAVASCRIPT ARRAY METHODS - ÔN TẬP TOÀN DIỆN
 * 
 * Tất cả các hàm thao tác mảng: map, filter, reduce, find, sort, ...
 * Ví dụ code thực tế
 */

// ============================================================================
// 1. MUTATION METHODS (Thay đổi mảng gốc)
// ============================================================================

/**
 * push() - Thêm element vào cuối mảng
 * - Trả về: độ dài mảng sau khi thêm
 * - Mutate: Yes (thay đổi mảng gốc)
 * 
 * ```javascript
 * const arr = [1, 2, 3];
 * const newLength = arr.push(4);
 * console.log(arr);        // [1, 2, 3, 4]
 * console.log(newLength);  // 4
 * ```
 */

/**
 * pop() - Xóa element cuối mảng
 * - Trả về: element bị xóa
 * - Mutate: Yes
 * 
 * ```javascript
 * const arr = [1, 2, 3];
 * const last = arr.pop();
 * console.log(arr);  // [1, 2]
 * console.log(last); // 3
 * ```
 */

/**
 * shift() - Xóa element đầu mảy
 * - Trả về: element bị xóa
 * - Mutate: Yes
 * 
 * ```javascript
 * const arr = [1, 2, 3];
 * const first = arr.shift();
 * console.log(arr);   // [2, 3]
 * console.log(first); // 1
 * ```
 */

/**
 * unshift() - Thêm element vào đầu mảng
 * - Trả về: độ dài mảy sau khi thêm
 * - Mutate: Yes
 * 
 * ```javascript
 * const arr = [2, 3];
 * const newLength = arr.unshift(1);
 * console.log(arr);        // [1, 2, 3]
 * console.log(newLength);  // 3
 * ```
 */

/**
 * splice() - Xóa/thêm elements ở vị trí bất kỳ
 * - Syntax: array.splice(start, deleteCount, item1, item2, ...)
 * - Trả về: mảng các elements bị xóa
 * - Mutate: Yes
 * 
 * ```javascript
 * const arr = [1, 2, 3, 4, 5];
 * 
 * // Xóa 2 elements từ index 1
 * const removed = arr.splice(1, 2);
 * console.log(arr);     // [1, 4, 5]
 * console.log(removed); // [2, 3]
 * 
 * // Thêm elements
 * const arr2 = [1, 2, 3];
 * arr2.splice(1, 0, 'a', 'b'); // Insert at index 1
 * console.log(arr2); // [1, 'a', 'b', 2, 3]
 * 
 * // Replace elements
 * const arr3 = [1, 2, 3];
 * arr3.splice(1, 2, 'x', 'y'); // Delete 2, insert 2
 * console.log(arr3); // [1, 'x', 'y']
 * ```
 */

/**
 * reverse() - Đảo ngược mảy
 * - Trả về: mảy đã đảo ngược
 * - Mutate: Yes
 * 
 * ```javascript
 * const arr = [1, 2, 3];
 * arr.reverse();
 * console.log(arr); // [3, 2, 1]
 * ```
 */

/**
 * sort() - Sắp xếp mảy
 * - Trả về: mảy đã sắp xếp
 * - Mutate: Yes
 * - Mặc định: sắp xếp theo string (lexicographic)
 * 
 * ```javascript
 * // Sắp xếp mặc định (string)
 * const arr = [3, 1, 10, 2];
 * arr.sort();
 * console.log(arr); // [1, 10, 2, 3] ⚠️ NOT numeric!
 * 
 * // Sắp xếp số
 * const numbers = [3, 1, 10, 2];
 * numbers.sort((a, b) => a - b);
 * console.log(numbers); // [1, 2, 3, 10] ✓
 * 
 * // Sắp xếp giảm dần
 * numbers.sort((a, b) => b - a);
 * console.log(numbers); // [10, 3, 2, 1]
 * 
 * // Sắp xếp objects
 * const users = [
 *   { name: 'John', age: 30 },
 *   { name: 'Jane', age: 25 }
 * ];
 * users.sort((a, b) => a.age - b.age);
 * console.log(users); // Jane (25), John (30)
 * ```
 */

/**
 * fill() - Điền value vào mảy
 * - Syntax: array.fill(value, start, end)
 * - Trả về: mảy đã điền
 * - Mutate: Yes
 * 
 * ```javascript
 * const arr = [1, 2, 3, 4, 5];
 * arr.fill(0);
 * console.log(arr); // [0, 0, 0, 0, 0]
 * 
 * const arr2 = [1, 2, 3, 4, 5];
 * arr2.fill(0, 1, 3);
 * console.log(arr2); // [1, 0, 0, 4, 5]
 * ```
 */

/**
 * copyWithin() - Copy elements trong mảy
 * - Syntax: array.copyWithin(target, start, end)
 * - Mutate: Yes
 * 
 * ```javascript
 * const arr = [1, 2, 3, 4, 5];
 * arr.copyWithin(0, 3);
 * console.log(arr); // [4, 5, 3, 4, 5]
 * ```
 */

// ============================================================================
// 2. NON-MUTATION METHODS (Không thay đổi mảy gốc)
// ============================================================================

/**
 * concat() - Nối nhiều mảy
 * - Trả về: mảy mới
 * - Mutate: No
 * 
 * ```javascript
 * const arr1 = [1, 2];
 * const arr2 = [3, 4];
 * const result = arr1.concat(arr2);
 * console.log(result);  // [1, 2, 3, 4]
 * console.log(arr1);    // [1, 2] (unchanged)
 * 
 * // Spread operator (modern)
 * const result2 = [...arr1, ...arr2];
 * console.log(result2); // [1, 2, 3, 4]
 * ```
 */

/**
 * slice() - Cắt mảy
 * - Syntax: array.slice(start, end)
 * - Trả về: mảy cắt (shallow copy)
 * - Mutate: No
 * - end không bao gồm
 * 
 * ```javascript
 * const arr = [1, 2, 3, 4, 5];
 * const sliced = arr.slice(1, 3);
 * console.log(sliced); // [2, 3]
 * console.log(arr);    // [1, 2, 3, 4, 5] (unchanged)
 * 
 * // Slice để copy
 * const copy = arr.slice();
 * console.log(copy);   // [1, 2, 3, 4, 5]
 * 
 * // Slice từ cuối
 * const last2 = arr.slice(-2);
 * console.log(last2);  // [4, 5]
 * ```
 */

/**
 * join() - Nối các elements thành string
 * - Syntax: array.join(separator)
 * - Trả về: string
 * - Mutate: No
 * 
 * ```javascript
 * const arr = [1, 2, 3];
 * const result = arr.join('-');
 * console.log(result); // '1-2-3'
 * 
 * const csv = arr.join(',');
 * console.log(csv);    // '1,2,3'
 * 
 * const words = ['Hello', 'World'];
 * console.log(words.join(' ')); // 'Hello World'
 * ```
 */

/**
 * indexOf() - Tìm index của element
 * - Syntax: array.indexOf(searchElement, fromIndex)
 * - Trả về: index (hoặc -1 nếu không tìm thấy)
 * - Mutate: No
 * - Tìm từ đầu mảy
 * 
 * ```javascript
 * const arr = [1, 2, 3, 2, 1];
 * console.log(arr.indexOf(2));    // 1
 * console.log(arr.indexOf(2, 2)); // 3 (tìm từ index 2)
 * console.log(arr.indexOf(5));    // -1
 * ```
 */

/**
 * lastIndexOf() - Tìm index của element từ cuối
 * - Trả về: index (hoặc -1)
 * - Mutate: No
 * 
 * ```javascript
 * const arr = [1, 2, 3, 2, 1];
 * console.log(arr.lastIndexOf(2)); // 3
 * console.log(arr.lastIndexOf(1)); // 4
 * ```
 */

/**
 * includes() - Kiểm tra element có trong mảy không
 * - Trả về: true/false
 * - Mutate: No
 * 
 * ```javascript
 * const arr = [1, 2, 3];
 * console.log(arr.includes(2));    // true
 * console.log(arr.includes(5));    // false
 * console.log(arr.includes(2, 2)); // false (tìm từ index 2)
 * ```
 */

// ============================================================================
// 3. ITERATION METHODS - MAP, FILTER, REDUCE
// ============================================================================

/**
 * map() - Transform mỗi element
 * - Trả về: mảy mới
 * - Mutate: No
 * - Số elements giữ nguyên
 * 
 * ```javascript
 * const numbers = [1, 2, 3];
 * 
 * // Nhân đôi
 * const doubled = numbers.map(n => n * 2);
 * console.log(doubled); // [2, 4, 6]
 * 
 * // Extract property
 * const users = [
 *   { name: 'John', age: 30 },
 *   { name: 'Jane', age: 25 }
 * ];
 * const names = users.map(u => u.name);
 * console.log(names); // ['John', 'Jane']
 * 
 * // Callback parameters
 * const result = numbers.map((value, index, array) => {
 *   console.log(`Index ${index}: ${value}`);
 *   return value * 2;
 * });
 * ```
 */

/**
 * filter() - Lọc elements thỏa condition
 * - Trả về: mảy mới (có thể ít hơn)
 * - Mutate: No
 * 
 * ```javascript
 * const numbers = [1, 2, 3, 4, 5];
 * 
 * // Lọc số chẵn
 * const evens = numbers.filter(n => n % 2 === 0);
 * console.log(evens); // [2, 4]
 * 
 * // Lọc users
 * const users = [
 *   { name: 'John', age: 30 },
 *   { name: 'Jane', age: 25 },
 *   { name: 'Bob', age: 35 }
 * ];
 * const adults = users.filter(u => u.age >= 30);
 * console.log(adults); // John (30), Bob (35)
 * 
 * // Lọc truthy values
 * const mixed = [0, 1, '', 'hello', false, true];
 * const truthy = mixed.filter(Boolean);
 * console.log(truthy); // [1, 'hello', true]
 * ```
 */

/**
 * reduce() - Tích lũy thành 1 value
 * - Syntax: array.reduce(callback, initialValue)
 * - Trả về: giá trị tích lũy
 * - Mutate: No
 * - Callback: (accumulator, currentValue, currentIndex, array) => newAccumulator
 * 
 * ```javascript
 * const numbers = [1, 2, 3, 4, 5];
 * 
 * // Tổng
 * const sum = numbers.reduce((acc, n) => acc + n, 0);
 * console.log(sum); // 15
 * 
 * // Tích
 * const product = numbers.reduce((acc, n) => acc * n, 1);
 * console.log(product); // 120
 * 
 * // Tìm max
 * const max = numbers.reduce((acc, n) => n > acc ? n : acc);
 * console.log(max); // 5
 * 
 * // Group by
 * const users = [
 *   { name: 'John', role: 'admin' },
 *   { name: 'Jane', role: 'user' },
 *   { name: 'Bob', role: 'admin' }
 * ];
 * const grouped = users.reduce((acc, user) => {
 *   if (!acc[user.role]) acc[user.role] = [];
 *   acc[user.role].push(user);
 *   return acc;
 * }, {});
 * // { admin: [John, Bob], user: [Jane] }
 * 
 * // Flatten array
 * const nested = [[1, 2], [3, 4], [5]];
 * const flat = nested.reduce((acc, arr) => [...acc, ...arr], []);
 * console.log(flat); // [1, 2, 3, 4, 5]
 * ```
 */

/**
 * forEach() - Loop qua mỗi element
 * - Trả về: undefined
 * - Mutate: No (nhưng có thể modify elements)
 * - Không thể break, continue
 * 
 * ```javascript
 * const numbers = [1, 2, 3];
 * 
 * numbers.forEach((n, index) => {
 *   console.log(`Index ${index}: ${n}`);
 * });
 * 
 * // Không return
 * const result = numbers.forEach(n => n * 2);
 * console.log(result); // undefined
 * ```
 */

// ============================================================================
// 4. SEARCH METHODS
// ============================================================================

/**
 * find() - Tìm element đầu tiên thỏa condition
 * - Trả về: element hoặc undefined
 * - Mutate: No
 * 
 * ```javascript
 * const users = [
 *   { id: 1, name: 'John' },
 *   { id: 2, name: 'Jane' },
 *   { id: 3, name: 'Bob' }
 * ];
 * 
 * const user = users.find(u => u.id === 2);
 * console.log(user); // { id: 2, name: 'Jane' }
 * 
 * const notFound = users.find(u => u.id === 999);
 * console.log(notFound); // undefined
 * ```
 */

/**
 * findIndex() - Tìm index của element đầu tiên
 * - Trả về: index hoặc -1
 * - Mutate: No
 * 
 * ```javascript
 * const numbers = [1, 2, 3, 4, 5];
 * const index = numbers.findIndex(n => n > 3);
 * console.log(index); // 3 (element 4)
 * ```
 */

/**
 * findLast() - Tìm element cuối cùng (ES2023)
 * - Trả về: element hoặc undefined
 * 
 * ```javascript
 * const numbers = [1, 2, 3, 4, 5];
 * const last = numbers.findLast(n => n % 2 === 0);
 * console.log(last); // 4
 * ```
 */

/**
 * findLastIndex() - Tìm index của element cuối cùng (ES2023)
 * - Trả về: index hoặc -1
 * 
 * ```javascript
 * const numbers = [1, 2, 3, 4, 5];
 * const index = numbers.findLastIndex(n => n % 2 === 0);
 * console.log(index); // 3 (element 4)
 * ```
 */

/**
 * some() - Kiểm tra có element nào thỏa condition không
 * - Trả về: true/false
 * - Mutate: No
 * - Dừng ngay khi tìm thấy
 * 
 * ```javascript
 * const numbers = [1, 2, 3, 4, 5];
 * console.log(numbers.some(n => n > 3));    // true
 * console.log(numbers.some(n => n > 10));   // false
 * 
 * const hasAdmin = users.some(u => u.role === 'admin');
 * console.log(hasAdmin); // true/false
 * ```
 */

/**
 * every() - Kiểm tra tất cả elements có thỏa condition không
 * - Trả về: true/false
 * - Mutate: No
 * - Dừng ngay khi tìm thấy element không thỏa
 * 
 * ```javascript
 * const numbers = [1, 2, 3, 4, 5];
 * console.log(numbers.every(n => n > 0));   // true
 * console.log(numbers.every(n => n > 3));   // false
 * 
 * const allAdults = users.every(u => u.age >= 18);
 * console.log(allAdults); // true/false
 * ```
 */

// ============================================================================
// 5. ADVANCED METHODS
// ============================================================================

/**
 * flat() - Làm phẳng mảy lồng (nested array)
 * - Syntax: array.flat(depth)
 * - Trả về: mảy mới
 * - Mutate: No
 * 
 * ```javascript
 * const nested = [1, [2, 3], [[4, 5]]];
 * 
 * console.log(nested.flat());     // [1, 2, 3, [4, 5]]
 * console.log(nested.flat(2));    // [1, 2, 3, 4, 5]
 * console.log(nested.flat(Infinity)); // [1, 2, 3, 4, 5]
 * ```
 */

/**
 * flatMap() - map + flat
 * - Trả về: mảy mới
 * - Mutate: No
 * 
 * ```javascript
 * const numbers = [1, 2, 3];
 * const result = numbers.flatMap(n => [n, n * 2]);
 * console.log(result); // [1, 2, 2, 4, 3, 6]
 * 
 * // Tương đương với
 * const result2 = numbers.map(n => [n, n * 2]).flat();
 * ```
 */

/**
 * at() - Truy cập element bằng index (âm hay dương)
 * - Trả về: element hoặc undefined
 * - Mutate: No
 * 
 * ```javascript
 * const arr = ['a', 'b', 'c'];
 * console.log(arr.at(0));   // 'a'
 * console.log(arr.at(-1));  // 'c' (phần tử cuối)
 * console.log(arr.at(-2));  // 'b' (phần tử thứ 2 từ cuối)
 * ```
 */

/**
 * with() - Tạo mảy mới với element tại index được thay đổi (ES2023)
 * - Trả về: mảy mới
 * - Mutate: No
 * 
 * ```javascript
 * const arr = [1, 2, 3];
 * const newArr = arr.with(1, 99);
 * console.log(newArr); // [1, 99, 3]
 * console.log(arr);    // [1, 2, 3] (unchanged)
 * ```
 */

/**
 * toReversed() - Đảo ngược mà không mutate (ES2023)
 * - Trả về: mảy mới
 * - Mutate: No
 * 
 * ```javascript
 * const arr = [1, 2, 3];
 * const reversed = arr.toReversed();
 * console.log(reversed); // [3, 2, 1]
 * console.log(arr);      // [1, 2, 3] (unchanged)
 * ```
 */

/**
 * toSorted() - Sắp xếp mà không mutate (ES2023)
 * - Trả về: mảy mới
 * - Mutate: No
 * 
 * ```javascript
 * const arr = [3, 1, 2];
 * const sorted = arr.toSorted((a, b) => a - b);
 * console.log(sorted); // [1, 2, 3]
 * console.log(arr);    // [3, 1, 2] (unchanged)
 * ```
 */

// ============================================================================
// 6. STATIC METHODS
// ============================================================================

/**
 * Array.from() - Convert iterable/array-like thành Array
 * - Trả về: mảy mới
 * 
 * ```javascript
 * // String
 * const str = 'hello';
 * const chars = Array.from(str);
 * console.log(chars); // ['h', 'e', 'l', 'l', 'o']
 * 
 * // NodeList (DOM)
 * const elements = document.querySelectorAll('div');
 * const divs = Array.from(elements);
 * 
 * // Set
 * const set = new Set([1, 2, 3]);
 * const arr = Array.from(set);
 * console.log(arr); // [1, 2, 3]
 * 
 * // Map function
 * const result = Array.from([1, 2, 3], x => x * 2);
 * console.log(result); // [2, 4, 6]
 * 
 * // Create array of length
 * const range = Array.from({ length: 5 }, (_, i) => i);
 * console.log(range); // [0, 1, 2, 3, 4]
 * ```
 */

/**
 * Array.isArray() - Kiểm tra có phải Array không
 * - Trả về: true/false
 * 
 * ```javascript
 * console.log(Array.isArray([1, 2, 3]));    // true
 * console.log(Array.isArray('hello'));      // false
 * console.log(Array.isArray({ length: 2 })); // false
 * ```
 */

/**
 * Array.of() - Tạo Array từ arguments
 * - Trả về: mảy mới
 * 
 * ```javascript
 * console.log(Array.of(1, 2, 3));      // [1, 2, 3]
 * console.log(Array.of(5));            // [5]
 * console.log(new Array(5));           // [empty × 5]
 * console.log(Array.of(5));            // [5]
 * ```
 */

// ============================================================================
// 7. COMPARISONS & PATTERNS
// ============================================================================

/**
 * MAP vs FILTER vs REDUCE COMPARISON
 * 
 * map:    transform elements → mảy cùng độ dài
 * filter: lọc elements → mảy có thể ngắn hơn
 * reduce: tích lũy → 1 value
 * 
 * ```javascript
 * const numbers = [1, 2, 3, 4, 5];
 * 
 * // map: [1,2,3,4,5] → [2,4,6,8,10]
 * const doubled = numbers.map(n => n * 2);
 * 
 * // filter: [1,2,3,4,5] → [2,4]
 * const evens = numbers.filter(n => n % 2 === 0);
 * 
 * // reduce: [1,2,3,4,5] → 15
 * const sum = numbers.reduce((acc, n) => acc + n, 0);
 * 
 * // Kết hợp: sum of even numbers = 6 (2 + 4)
 * const sumEvens = numbers
 *   .filter(n => n % 2 === 0)    // [2, 4]
 *   .reduce((acc, n) => acc + n, 0); // 6
 * ```
 */

/**
 * COMMON PATTERNS
 * 
 * 1. Remove duplicates
 * ```javascript
 * const arr = [1, 2, 2, 3, 3, 3];
 * const unique = [...new Set(arr)];
 * console.log(unique); // [1, 2, 3]
 * ```
 * 
 * 2. Remove null/undefined
 * ```javascript
 * const arr = [1, null, 2, undefined, 3];
 * const cleaned = arr.filter(x => x != null);
 * console.log(cleaned); // [1, 2, 3]
 * ```
 * 
 * 3. Flatten + filter
 * ```javascript
 * const nested = [[1, 2], [3, 4], [5]];
 * const flatEvens = nested
 *   .flat()
 *   .filter(n => n % 2 === 0);
 * console.log(flatEvens); // [2, 4]
 * ```
 * 
 * 4. Group by property
 * ```javascript
 * const users = [
 *   { name: 'John', role: 'admin' },
 *   { name: 'Jane', role: 'user' },
 *   { name: 'Bob', role: 'admin' }
 * ];
 * const grouped = users.reduce((acc, user) => {
 *   (acc[user.role] ??= []).push(user);
 *   return acc;
 * }, {});
 * ```
 * 
 * 5. Create object from pairs
 * ```javascript
 * const pairs = [['a', 1], ['b', 2], ['c', 3]];
 * const obj = Object.fromEntries(pairs);
 * console.log(obj); // { a: 1, b: 2, c: 3 }
 * ```
 * 
 * 6. Swap elements
 * ```javascript
 * const arr = [1, 2, 3];
 * [arr[0], arr[2]] = [arr[2], arr[0]];
 * console.log(arr); // [3, 2, 1]
 * ```
 */

// ============================================================================
// 8. CHEAT SHEET - MUTATE vs NON-MUTATE
// ============================================================================

/**
 * ┌──────────────┬──────────┬──────────┐
 * │ Method       │ Mutate   │ Return   │
 * ├──────────────┼──────────┼──────────┤
 * │ push         │ YES      │ length   │
 * │ pop          │ YES      │ element  │
 * │ shift        │ YES      │ element  │
 * │ unshift      │ YES      │ length   │
 * │ splice       │ YES      │ removed  │
 * │ reverse      │ YES      │ array    │
 * │ sort         │ YES      │ array    │
 * │ fill         │ YES      │ array    │
 * ├──────────────┼──────────┼──────────┤
 * │ concat       │ NO       │ array    │
 * │ slice        │ NO       │ array    │
 * │ join         │ NO       │ string   │
 * │ map          │ NO       │ array    │
 * │ filter       │ NO       │ array    │
 * │ reduce       │ NO       │ value    │
 * │ flat         │ NO       │ array    │
 * │ flatMap      │ NO       │ array    │
 * │ find         │ NO       │ element  │
 * │ findIndex    │ NO       │ index    │
 * │ indexOf      │ NO       │ index    │
 * │ includes     │ NO       │ boolean  │
 * │ some         │ NO       │ boolean  │
 * │ every        │ NO       │ boolean  │
 * │ forEach      │ NO       │ undefined│
 * └──────────────┴──────────┴──────────┘
 */

console.log('✓ JavaScript Array Methods guide created');
