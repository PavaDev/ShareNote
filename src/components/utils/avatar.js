// ใช้รูปนี้เมื่อไม่พบรูปผู้ใช้ (วางไฟล์ไว้ที่ /public/default-avatar.svg)
export const DEFAULT_AVATAR = '/default-avatar.svg';

/**
 * รับค่ารูปดิบจาก backend แล้วแปลงเป็น URL ที่เบราว์เซอร์เปิดได้เสมอ
 * - ถ้าเป็น http/https: ใช้ตามนั้น
 * - ถ้าเป็น /api/...: ใช้ตามนั้น
 * - ถ้าเป็น /... หรือ ไม่มี /api: เติม /api นำหน้า
 * - ถ้าไม่มีค่า: คืน default avatar
 * ใส่ cache-buster ด้วย updatedAt/เวลาปัจจุบัน เพื่อให้รูปใหม่ไม่ติดแคช
 */
export function resolveAvatar(raw, ver) {
  const version = ver || Date.now();

  if (!raw) return `${DEFAULT_AVATAR}?v=${version}`;

  // URL เต็ม
  if (/^https?:\/\//i.test(raw)) {
    return `${raw}${raw.includes('?') ? '&' : '?'}v=${version}`;
  }

  // เริ่มด้วย /api อยู่แล้ว
  if (raw.startsWith('/api/')) {
    return `${raw}${raw.includes('?') ? '&' : '?'}v=${version}`;
  }

  // พาธภายใน เช่น /uploads/... หรือ uploads/...
  const path = raw.startsWith('/') ? `/api${raw}` : `/api/${raw}`;
  return `${path}${path.includes('?') ? '&' : '?'}v=${version}`;
}

/** ใช้กับ <img @error="onAvatarError"> เพื่อ fallback เป็น default */
export function onAvatarError(e) {
  e.target.src = `${DEFAULT_AVATAR}?v=${Date.now()}`;
}
