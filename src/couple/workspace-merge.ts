// src/couple/workspace-merge.ts
// Hợp nhất danh sách events/goals của phòng theo TỪNG MỤC (id + updatedAt),
// thay cho kiểu ghi đè cả mảng. Xóa mục = ghi một tombstone { id, deletedAt }.

export interface SyncItem {
  id: string;
  updatedAt?: string;
  deletedAt?: string | null;
  [key: string]: unknown;
}

const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000; // chặn đồng hồ máy chạy lệch quá xa
const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_ITEMS = 1000;
const MAX_ID_LENGTH = 100;

const toMs = (value: unknown): number => {
  if (typeof value !== 'string') return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
};

const isSyncItem = (value: unknown): value is SyncItem =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as SyncItem).id === 'string' &&
  (value as SyncItem).id.length > 0 &&
  (value as SyncItem).id.length <= MAX_ID_LENGTH;

export const sanitizeItems = (value: unknown): SyncItem[] =>
  Array.isArray(value) ? value.filter(isSyncItem).slice(0, MAX_ITEMS) : [];

const versionOf = (item: SyncItem): number =>
  Math.max(toMs(item.updatedAt), toMs(item.deletedAt));

const clampMs = (ms: number, nowMs: number): number =>
  Math.min(ms, nowMs + MAX_FUTURE_SKEW_MS);

export function mergeSyncItems(
  existingRaw: unknown,
  incomingRaw: unknown,
  nowMs: number = Date.now(),
): SyncItem[] {
  const byId = new Map<string, SyncItem>();
  for (const item of sanitizeItems(existingRaw)) byId.set(item.id, item);

  for (const inc of sanitizeItems(incomingRaw)) {
    const cur = byId.get(inc.id);

    // Tombstone: xóa nếu mới hơn hoặc bằng phiên bản đang có
    if (inc.deletedAt) {
      const delMs = clampMs(toMs(inc.deletedAt) || nowMs, nowMs);
      if (!cur || delMs >= versionOf(cur)) {
        const iso = new Date(delMs).toISOString();
        byId.set(inc.id, { id: inc.id, deletedAt: iso, updatedAt: iso });
      }
      continue;
    }

    const incMs = clampMs(toMs(inc.updatedAt), nowMs);
    const stamped: SyncItem = {
      ...inc,
      deletedAt: null,
      ...(incMs > 0 ? { updatedAt: new Date(incMs).toISOString() } : {}),
    };

    if (!cur) {
      byId.set(inc.id, stamped);
      continue;
    }
    // Chỉ ghi đè khi bản gửi lên MỚI HƠN hẳn. Bằng nhau (kể cả cùng bằng 0) thì giữ bản cũ.
    if (incMs > versionOf(cur)) byId.set(inc.id, stamped);
  }

  const result: SyncItem[] = [];
  for (const item of byId.values()) {
    if (item.deletedAt && nowMs - toMs(item.deletedAt) > TOMBSTONE_TTL_MS) continue;
    result.push(item);
  }
  return result;
}
