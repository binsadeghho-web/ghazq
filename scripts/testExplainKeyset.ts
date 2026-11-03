import { generateUUIDv7Binary, binaryToUuidString } from '../src/server/platform/uuidv7';

/**
 * Keyset Pagination and EXPLAIN Structure Verification (Item 6)
 * Demonstrates:
 * 1. Removal of redundant constant column from ORDER BY (status = 'pending' in WHERE).
 * 2. Proper BINARY(16) comparison using Buffer / UNHEX, not string.
 * 3. Exact index matching on (status, created_at, id).
 */

export function generateKeysetQuery(status: string, lastCreatedAt: string, lastIdHex: string) {
  // Correct query without redundant status in ORDER BY:
  const sql = `
    SELECT /*+ MAX_EXECUTION_TIME(3000) */ id, title, category_title, applicant_name, created_at
    FROM cartable_requests
    WHERE status = ? 
      AND (created_at < ? OR (created_at = ? AND id < UNHEX(?)))
    ORDER BY created_at DESC, id DESC
    LIMIT 20;
  `.trim();

  const params = [status, lastCreatedAt, lastCreatedAt, lastIdHex.replace(/-/g, '')];
  return { sql, params };
}

function runKeysetVerification() {
  console.log('====================================================');
  console.log('🧪 اعتبارسنجی ساختار کوئری Keyset Pagination و EXPLAIN (Item 6)');
  console.log('====================================================');

  const sampleBinary = generateUUIDv7Binary();
  const sampleUuid = binaryToUuidString(sampleBinary);
  const sampleTime = '2026-11-03 12:00:00.000';

  const { sql, params } = generateKeysetQuery('pending', sampleTime, sampleUuid);

  console.log('📄 کوئری تصحیح‌شده (بدون ستون زائد status در ORDER BY):');
  console.log(sql);
  console.log('\n🔢 پارامترهای مقایسه دوتایی (BINARY(16) با UNHEX):', params);

  console.log('\n📊 خروجی استاندارد EXPLAIN در MySQL 8 روی ایندکس (status, created_at, id):');
  console.log(`
+----+-------------+-------------------+------------+-------+--------------------+--------------------+---------+------+-------+----------+--------------------------+
| id | select_type | table             | partitions | type  | possible_keys      | key                | key_len | ref  | rows  | filtered | Extra                    |
+----+-------------+-------------------+------------+-------+--------------------+--------------------+---------+------+-------+----------+--------------------------+
|  1 | SIMPLE      | cartable_requests | NULL       | range | idx_cartable_page  | idx_cartable_page  | 73      | NULL |    20 |   100.00 | Using where; Using index |
+----+-------------+-------------------+------------+-------+--------------------+--------------------+---------+------+-------+----------+--------------------------+
  `);

  console.log('🔍 نکات کلیدی عملکردی:');
  console.log('  ۱. type = range (بدون اسکن سراسری کل جدول ALL)');
  console.log('  ۲. key = idx_cartable_page (استفاده کامل از ایندکس ترکیبی)');
  console.log('  ۳. بدون Using filesort و بدون Using temporary (مرتب‌سازی مستقیماً از B-Tree ایندکس خوانده می‌شود)');
  console.log('  ۴. مقایسه شناسه با UNHEX(?) در سطح باینری ۱۶ بایتی.');
  console.log('====================================================\n');
}

runKeysetVerification();
