// /**
//  * ============================================================================
//  * LONGEST SORTED SUBARRAY (Tăng hoặc Giảm)
//  * ============================================================================
//  * 
//  * BÀI TOÁN:
//  * Cho 1 array, tìm subarray dài nhất trong đó các phần tử liền nhau được 
//  * sắp xếp tăng (a[i] < a[i+1]) hoặc giảm dần (a[i] > a[i+1])
//  * 
//  * VÍ DỤ: 
//  * Input: [1, 3, 5, 4, 2, 3, 5, 7, 9, 7, 9, 3]
//  * Output: [2, 3, 5, 7, 9] với độ dài = 5
//  * 
//  * GIẢI THÍCH:
//  * - [1, 3, 5] - tăng (length 3)
//  * - [5, 4, 2] - giảm (length 3)  
//  * - [2, 3, 5, 7, 9] - tăng (length 5) ✓ LỚN NHẤT
//  * - [9, 7] - giảm (length 2)
//  * - [7, 9, 3] - không sorted (length 1)
//  * ============================================================================
//  */

// // ============================================================================
// // SOLUTION 1: Single Pass - O(n) Time, O(n) Space
// // ============================================================================
// /**
//  * Idea: Duyệt array một lần, theo dõi:
//  * - Direction: tăng (1), giảm (-1), hay chưa biết (0)
//  * - Length: độ dài subarray hiện tại
//  * - Start index: vị trí bắt đầu subarray
//  */

// function longestSortedSubarray(arr: number[]): {
//   subarray: number[];
//   length: number;
//   startIndex: number;
//   endIndex: number;
// } {
//   if (arr.length <= 1) {
//     return {
//       subarray: arr,
//       length: arr.length,
//       startIndex: 0,
//       endIndex: arr.length - 1
//     };
//   }

//   let maxLength = 1;
//   let maxStart = 0;
//   let maxEnd = 0;

//   let currentLength = 1;
//   let currentStart = 0;
//   let direction = 0; // 0: unknown, 1: increasing, -1: decreasing

//   for (let i = 1; i < arr.length; i++) {
//     const diff = arr[i] - arr[i - 1];

//     if (diff === 0) {
//       // Phần tử bằng nhau - reset
//       currentLength = 1;
//       currentStart = i;
//       direction = 0;
//     } else if (direction === 0) {
//       // Lần đầu tiên xác định hướng
//       direction = diff > 0 ? 1 : -1;
//       currentLength = 2;
//     } else if ((direction > 0 && diff > 0) || (direction < 0 && diff < 0)) {
//       // Tiếp tục theo hướng hiện tại
//       currentLength++;
//     } else {
//       // Đổi hướng - bắt đầu subarray mới
//       if (currentLength > maxLength) {
//         maxLength = currentLength;
//         maxStart = currentStart;
//         maxEnd = i - 1;
//       }
//       currentLength = 2;
//       currentStart = i - 1;
//       direction = diff > 0 ? 1 : -1;
//     }
//   }

//   // Kiểm tra subarray cuối cùng
//   if (currentLength > maxLength) {
//     maxLength = currentLength;
//     maxStart = currentStart;
//     maxEnd = arr.length - 1;
//   }

//   return {
//     subarray: arr.slice(maxStart, maxEnd + 1),
//     length: maxLength,
//     startIndex: maxStart,
//     endIndex: maxEnd
//   };
// }

// // ============================================================================
// // SOLUTION 2: Strict Mode - chỉ tăng hoặc giảm CHẶT (a[i] < a[i+1])
// // ============================================================================
// /**
//  * Biến thể: chỉ chấp nhận tăng hoặc giảm "chặt"
//  * (không chấp nhận phần tử bằng nhau trong chuỗi)
//  */

// function longestSortedSubarrayStrict(arr: number[]): {
//   subarray: number[];
//   length: number;
//   direction: string;
// } {
//   if (arr.length <= 1) {
//     return {
//       subarray: arr,
//       length: arr.length,
//       direction: "N/A"
//     };
//   }

//   let maxLength = 1;
//   let maxStart = 0;
//   let maxDirection = "N/A";

//   let currentLength = 1;
//   let currentStart = 0;
//   let currentDirection: "increasing" | "decreasing" | "unknown" = "unknown";

//   for (let i = 1; i < arr.length; i++) {
//     if (arr[i] === arr[i - 1]) {
//       // Reset khi phần tử bằng nhau
//       if (currentLength > maxLength) {
//         maxLength = currentLength;
//         maxStart = currentStart;
//         maxDirection = currentDirection === "unknown" ? "N/A" : currentDirection;
//       }
//       currentLength = 1;
//       currentStart = i;
//       currentDirection = "unknown";
//     } else if (arr[i] > arr[i - 1]) {
//       // Tăng
//       if (currentDirection === "unknown" || currentDirection === "increasing") {
//         currentLength++;
//         currentDirection = "increasing";
//       } else {
//         // Đổi từ giảm sang tăng
//         if (currentLength > maxLength) {
//           maxLength = currentLength;
//           maxStart = currentStart;
//           maxDirection = currentDirection;
//         }
//         currentLength = 2;
//         currentStart = i - 1;
//         currentDirection = "increasing";
//       }
//     } else {
//       // Giảm
//       if (currentDirection === "unknown" || currentDirection === "decreasing") {
//         currentLength++;
//         currentDirection = "decreasing";
//       } else {
//         // Đổi từ tăng sang giảm
//         if (currentLength > maxLength) {
//           maxLength = currentLength;
//           maxStart = currentStart;
//           maxDirection = currentDirection;
//         }
//         currentLength = 2;
//         currentStart = i - 1;
//         currentDirection = "decreasing";
//       }
//     }
//   }

//   // Kiểm tra subarray cuối cùng
//   if (currentLength > maxLength) {
//     maxLength = currentLength;
//     maxStart = currentStart;
//     maxDirection = currentDirection === "unknown" ? "N/A" : currentDirection;
//   }

//   return {
//     subarray: arr.slice(maxStart, maxStart + maxLength),
//     length: maxLength,
//     direction: maxDirection
//   };
// }

// // ============================================================================
// // SOLUTION 3: Theo dõi cả tăng và giảm - trả về tất cả subarray
// // ============================================================================
// /**
//  * Trả về tất cả các sorted subarray (dài hơn 1)
//  */

// function allSortedSubarrays(arr: number[]): {
//   subarray: number[];
//   length: number;
//   direction: "increasing" | "decreasing";
//   startIndex: number;
//   endIndex: number;
// }[] {
//   if (arr.length <= 1) return [];

//   const result = [];
//   let currentLength = 1;
//   let currentStart = 0;
//   let direction: "increasing" | "decreasing" | null = null;

//   for (let i = 1; i < arr.length; i++) {
//     const diff = arr[i] - arr[i - 1];

//     if (diff === 0) {
//       // Reset
//       if (currentLength > 1 && direction) {
//         result.push({
//           subarray: arr.slice(currentStart, i),
//           length: currentLength,
//           direction,
//           startIndex: currentStart,
//           endIndex: i - 1
//         });
//       }
//       currentLength = 1;
//       currentStart = i;
//       direction = null;
//     } else if (direction === null) {
//       // Set direction
//       direction = diff > 0 ? "increasing" : "decreasing";
//       currentLength = 2;
//     } else if (
//       (direction === "increasing" && diff > 0) ||
//       (direction === "decreasing" && diff < 0)
//     ) {
//       // Continue
//       currentLength++;
//     } else {
//       // Change direction
//       if (currentLength > 1) {
//         result.push({
//           subarray: arr.slice(currentStart, i),
//           length: currentLength,
//           direction,
//           startIndex: currentStart,
//           endIndex: i - 1
//         });
//       }
//       currentLength = 2;
//       currentStart = i - 1;
//       direction = diff > 0 ? "increasing" : "decreasing";
//     }
//   }

//   // Last subarray
//   if (currentLength > 1 && direction) {
//     result.push({
//       subarray: arr.slice(currentStart),
//       length: currentLength,
//       direction,
//       startIndex: currentStart,
//       endIndex: arr.length - 1
//     });
//   }

//   return result;
// }

// // ============================================================================
// // TEST CASES
// // ============================================================================

// console.log("════════════════════════════════════════════════════════════════");
// console.log("TEST CASE 1: Ví dụ từ đề bài");
// console.log("════════════════════════════════════════════════════════════════");
// const test1 = [1, 3, 5, 4, 2, 3, 5, 7, 9, 7, 9, 3];
// console.log("Input:", test1);
// console.log("Result:", longestSortedSubarray(test1));
// console.log();

// console.log("════════════════════════════════════════════════════════════════");
// console.log("TEST CASE 2: Toàn bộ tăng dần");
// console.log("════════════════════════════════════════════════════════════════");
// const test2 = [1, 2, 3, 4, 5];
// console.log("Input:", test2);
// console.log("Result:", longestSortedSubarray(test2));
// console.log();

// console.log("════════════════════════════════════════════════════════════════");
// console.log("TEST CASE 3: Toàn bộ giảm dần");
// console.log("════════════════════════════════════════════════════════════════");
// const test3 = [5, 4, 3, 2, 1];
// console.log("Input:", test3);
// console.log("Result:", longestSortedSubarray(test3));
// console.log();

// console.log("════════════════════════════════════════════════════════════════");
// console.log("TEST CASE 4: Có phần tử bằng nhau");
// console.log("════════════════════════════════════════════════════════════════");
// const test4 = [1, 2, 2, 3, 4, 5];
// console.log("Input:", test4);
// console.log("Result:", longestSortedSubarray(test4));
// console.log();

// console.log("════════════════════════════════════════════════════════════════");
// console.log("TEST CASE 5: Nhiều subarray gần bằng nhau");
// console.log("════════════════════════════════════════════════════════════════");
// const test5 = [1, 2, 3, 5, 4, 3, 2, 1, 0];
// console.log("Input:", test5);
// console.log("Result:", longestSortedSubarray(test5));
// console.log();

// console.log("════════════════════════════════════════════════════════════════");
// console.log("TEST CASE 6: Single element và edge cases");
// console.log("════════════════════════════════════════════════════════════════");
// const test6 = [5];
// console.log("Input:", test6);
// console.log("Result:", longestSortedSubarray(test6));
// console.log();

// console.log("════════════════════════════════════════════════════════════════");
// console.log("TEST CASE 7: Strict Mode - chỉ chặt (không bằng nhau)");
// console.log("════════════════════════════════════════════════════════════════");
// const test7 = [1, 3, 5, 4, 2, 3, 5, 7, 9, 7, 9, 3];
// console.log("Input:", test7);
// console.log("Result:", longestSortedSubarrayStrict(test7));
// console.log();

// console.log("════════════════════════════════════════════════════════════════");
// console.log("TEST CASE 8: Tất cả sorted subarray");
// console.log("════════════════════════════════════════════════════════════════");
// const test8 = [1, 3, 5, 4, 2, 3, 5, 7, 9, 7, 9, 3];
// console.log("Input:", test8);
// console.log("Tất cả sorted subarray:");
// allSortedSubarrays(test8).forEach((item, idx) => {
//   console.log(
//     `  ${idx + 1}. [${item.subarray.join(", ")}] - ${item.direction} (length: ${item.length})`
//   );
// });
// console.log();

// // ============================================================================
// // COMPLEXITY ANALYSIS
// // ============================================================================

// console.log("════════════════════════════════════════════════════════════════");
// console.log("COMPLEXITY ANALYSIS");
// console.log("════════════════════════════════════════════════════════════════");
// console.log(`
// TIME COMPLEXITY:
//   - Solution 1 & 2 & 3: O(n) - duyệt array 1 lần
//   - Space: O(1) cho variables tracking (không count output array)

// APPROACH:
//   1. One-pass scanning dengan state tracking
//   2. Theo dõi 3 thứ:
//      - Current sequence length
//      - Current direction (increasing/decreasing)
//      - Max length found so far
//   3. Khi phát hiện đổi hướng → lưu subarray, reset

// OPTIMIZATION:
//   - Không cần sort hay lưu nhiều intermediate arrays
//   - Space optimal: chỉ cần 5-6 variables
//   - Time optimal: single linear scan
// `);

// // ============================================================================
// // VARIATIONS & EXTENSIONS
// // ============================================================================

// console.log("════════════════════════════════════════════════════════════════");
// console.log("VARIATIONS & EXTENSIONS");
// console.log("════════════════════════════════════════════════════════════════");

// /**
//  * VARIATION 1: Tìm subarray tăng hoặc giảm với độ dài >= k
//  */
// function longestSortedSubarrayMinLength(arr: number[], minLength: number) {
//   const result = longestSortedSubarray(arr);
//   if (result.length >= minLength) {
//     return result;
//   }
//   return { subarray: [], length: 0, startIndex: -1, endIndex: -1 };
// }

// /**
//  * VARIATION 2: Kiểm tra xem array có phải sorted (tăng/giảm) không
//  */
// function isSorted(arr: number[]): {
//   isSorted: boolean;
//   direction: "increasing" | "decreasing" | "N/A";
// } {
//   if (arr.length <= 1) {
//     return { isSorted: true, direction: "N/A" };
//   }

//   let direction: "increasing" | "decreasing" | "N/A" = "N/A";

//   for (let i = 1; i < arr.length; i++) {
//     if (arr[i] === arr[i - 1]) {
//       return { isSorted: false, direction: "N/A" };
//     }
//     if (arr[i] > arr[i - 1]) {
//       if (direction === "decreasing") {
//         return { isSorted: false, direction: "N/A" };
//       }
//       direction = "increasing";
//     } else {
//       if (direction === "increasing") {
//         return { isSorted: false, direction: "N/A" };
//       }
//       direction = "decreasing";
//     }
//   }

//   return { isSorted: true, direction };
// }

// /**
//  * VARIATION 3: Tìm k longest sorted subarrays
//  */
// function kLongestSortedSubarrays(arr: number[], k: number) {
//   const all = allSortedSubarrays(arr);
//   return all
//     .sort((a, b) => b.length - a.length)
//     .slice(0, k)
//     .map((item, idx) => ({
//       rank: idx + 1,
//       subarray: item.subarray,
//       length: item.length,
//       direction: item.direction
//     }));
// }

// console.log("\nVARIATION 1: Min length >= 3");
// const varTest1 = [1, 3, 5, 4, 2, 3, 5, 7, 9, 7];
// console.log("Input:", varTest1);
// console.log("Result:", longestSortedSubarrayMinLength(varTest1, 3));

// console.log("\nVARIATION 2: Check if sorted");
// console.log("Array [1,2,3,4]:", isSorted([1, 2, 3, 4]));
// console.log("Array [5,4,3,2]:", isSorted([5, 4, 3, 2]));
// console.log("Array [1,3,2,4]:", isSorted([1, 3, 2, 4]));

// console.log("\nVARIATION 3: Top 3 longest subarray");
// const varTest3 = [1, 3, 5, 4, 2, 3, 5, 7, 9, 7];
// console.log("Input:", varTest3);
// kLongestSortedSubarrays(varTest3, 3).forEach((item) => {
//   console.log(
//     `  #${item.rank}: [${item.subarray.join(", ")}] (${item.direction}, length: ${item.length})`
//   );
// });

// // ============================================================================
// // INTERVIEW TIPS
// // ============================================================================

// console.log("\n════════════════════════════════════════════════════════════════");
// console.log("INTERVIEW TIPS");
// console.log("════════════════════════════════════════════════════════════════");
// console.log(`
// 1. CLARIFY WITH INTERVIEWER:
//    - Có cần trả về subarray hay chỉ cần độ dài?
//    - Phần tử bằng nhau được tính là gì?
//    - Cần "increasing" hay "non-decreasing" (a[i] <= a[i+1])?

// 2. EDGE CASES:
//    - Empty array: return []
//    - Single element: return [element] with length 1
//    - All same elements: return [element] or [] depending on spec
//    - All increasing: return entire array
//    - All decreasing: return entire array

// 3. OPTIMIZATION:
//    - Single pass O(n) is optimal
//    - No need for nested loops or sorting
//    - Could add hashing for other variants

// 4. FOLLOW-UP QUESTIONS:
//    - "Tìm k longest sorted subarrays?"
//    - "Với minimum length >= k?"
//    - "Return indices instead of values?"
//    - "Support both increasing AND decreasing at same time?"

// 5. IMPLEMENTATION NOTES:
//    - Carefully handle "change direction" case
//    - Don't forget the last subarray after loop
//    - Reset currentStart when changing direction (should be i-1)
//    - Handle equal elements explicitly
// `);
