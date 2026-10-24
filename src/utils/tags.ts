// 标签页路径必须是纯 ASCII：中文标签用 FNV-1a 哈希做 slug，
// 避免 Cloudflare 静态资产等托管平台对非 ASCII 路径的兼容问题；
// 真实标签名仍显示在页面标题与正文里
export function tagSlug(tag: string): string {
  if (/^[\w\s-]+$/.test(tag)) {
    return tag.trim().toLowerCase().replace(/\s+/g, '-');
  }
  let h = 0x811c9dc5;
  for (const ch of tag) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
