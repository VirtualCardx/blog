// 生成站点图片资产：public/og.png、public/apple-touch-icon.png、public/favicon-32.png
// 运行前需临时安装 sharp：npm i -D sharp && node scripts/generate-images.mjs
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const HAN = 'KaiTi, SimSun, Microsoft YaHei, serif';

const favicon = await readFile('public/favicon.svg');

await sharp(favicon, { density: 300 }).resize(32, 32).png().toFile('public/favicon-32.png');

await sharp(favicon, { density: 300 })
  .resize(180, 180)
  .flatten({ background: '#7a6f5d' }) // 苹果设备会给透明区域垫黑色，这里垫成徽标底色
  .png()
  .toFile('public/apple-touch-icon.png');

const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#faf9f6"/>
  <rect x="44" y="44" width="1112" height="542" rx="18" fill="none" stroke="#e4e1d8" stroke-width="2"/>
  <text x="120" y="270" font-family="${HAN}" font-size="150" font-weight="bold" fill="#3a3833">安豆</text>
  <text x="124" y="368" font-family="${HAN}" font-size="52" fill="#6f6c64">我想和这个世界谈谈。</text>
  <text x="124" y="512" font-family="Segoe UI, sans-serif" font-size="30" fill="#847e72">blog.andou.eu.org</text>
  <rect x="924" y="120" width="132" height="132" rx="26" fill="#7a6f5d"/>
  <text x="990" y="208" font-family="${HAN}" font-size="64" fill="#faf9f6" text-anchor="middle">安</text>
</svg>`;

await sharp(Buffer.from(banner)).png().toFile('public/og.png');

console.log('done: og.png, apple-touch-icon.png, favicon-32.png');
