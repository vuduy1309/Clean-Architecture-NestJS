/**
 * FILE: src/auth/bcrypt.pool.ts
 * 
 * Worker Pool: Quản lý 4 worker threads
 * - Tái sử dụng workers (không tạo mới mỗi lần)
 * - Queue tasks nếu workers bận
 * - Non-blocking: main thread xử lý requests khác
 */

import { Injectable } from '@nestjs/common';
import { Worker } from 'worker_threads';
import * as path from 'path';

// Job queue interface
interface Job {
  operation: string;
  data: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

@Injectable()
export class BcryptPool {
  // Mảng chứa workers đang rảnh
  private workers: Worker[] = [];
  
  // Queue chứa jobs chờ xử lý
  private queue: Job[] = [];
  
  // Đường dẫn tới worker file
  private workerPath: string;

  constructor() {
    // Tìm path tới bcrypt.worker file
    this.workerPath = path.join(__dirname, 'bcrypt.worker.ts');
    
    // Khởi tạo 4 workers
    const poolSize = 4;
    for (let i = 0; i < poolSize; i++) {
      this.createWorker();
    }
    
    console.log(`✓ Bcrypt pool initialized with ${poolSize} workers`);
  }

  /**
   * Tạo một worker thread
   */
  private createWorker() {
    // Tạo worker mới
    const worker = new Worker(this.workerPath);

    // Lắng nghe message từ worker (khi xong job)
    worker.on('message', (message: any) => {
      // Lấy job từ queue
      const job = this.queue.shift();
      
      if (job) {
        // Có job trong queue, resolve/reject
        if (message.success) {
          job.resolve(message.result);
        } else {
          job.reject(new Error(message.error));
        }
        
        // Xử lý job tiếp theo từ queue
        this.processQueue(worker);
      } else {
        // Queue trống, worker rảnh
        this.workers.push(worker);
      }
    });

    // Handle error
    worker.on('error', (error) => {
      const job = this.queue.shift();
      if (job) {
        job.reject(error);
      }
    });

    // Thêm worker vào mảng workers
    this.workers.push(worker);
  }

  /**
   * Xử lý job tiếp theo từ queue
   */
  private processQueue(worker: Worker) {
    const job = this.queue.shift();
    if (job) {
      // Gửi job tới worker
      worker.postMessage({
        operation: job.operation,
        ...job.data,
      });
    } else {
      // Queue trống, thêm worker vào mảng
      this.workers.push(worker);
    }
  }

  /**
   * Hash password
   * @param password - Plain password
   * @param rounds - Bcrypt rounds (mặc định: 10)
   * @returns Hashed password
   */
  async hash(password: string, rounds: number = 10): Promise<string> {
    return new Promise((resolve, reject) => {
      // Lấy worker rảnh
      const availableWorker = this.workers.pop();

      if (availableWorker) {
        // Có worker rảnh, gửi job ngay
        availableWorker.postMessage({
          operation: 'hash',
          password,
          rounds,
        });

        // Lắng nghe kết quả từ worker
        availableWorker.once('message', (message: any) => {
          if (message.success) {
            resolve(message.result);
            // Thêm worker vào mảng (đã xong)
            this.workers.push(availableWorker);
            // Xử lý job tiếp theo
            this.processQueue(availableWorker);
          } else {
            reject(new Error(message.error));
          }
        });

        availableWorker.once('error', reject);
      } else {
        // Tất cả workers bận, queue job
        this.queue.push({
          operation: 'hash',
          data: { password, rounds },
          resolve,
          reject,
        });
      }
    });
  }

  /**
   * Compare password with hash
   * @param password - Plain password
   * @param hash - Hashed password
   * @returns true nếu khớp, false nếu không
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Lấy worker rảnh
      const availableWorker = this.workers.pop();

      if (availableWorker) {
        // Có worker rảnh
        availableWorker.postMessage({
          operation: 'compare',
          password,
          hash,
        });

        availableWorker.once('message', (message: any) => {
          if (message.success) {
            resolve(message.result);
            this.workers.push(availableWorker);
            this.processQueue(availableWorker);
          } else {
            reject(new Error(message.error));
          }
        });

        availableWorker.once('error', reject);
      } else {
        // Tất cả workers bận, queue job
        this.queue.push({
          operation: 'compare',
          data: { password, hash },
          resolve,
          reject,
        });
      }
    });
  }

  /**
   * Terminate tất cả workers
   */
  terminate() {
    this.workers.forEach(w => w.terminate());
  }
}
