# Top Scholar · 14周年 11.11 大优惠 Landing Page (Demo)

一个纯静态的 HTML / CSS / JS 网站，不需要 build，可以直接部署到 Vercel。

| 页面 | 文件 | 说明 |
| --- | --- | --- |
| ① 造势 Landing Page (Waiting List) | `index.html` | 倒数到 11.11 开卖、收集 WhatsApp / 电话号码 |
| ② 商品 Order Page | `order.html` | 正式开卖：配套卡片、分类切换、限时倒数、抢购弹窗 |

## 动态效果

- 实时倒数：`index.html` 倒数到 2026-11-11 00:00（马来西亚时间），`order.html` 倒数到 11.11 23:59
- 英雄区背景缓慢推镜 + 跟随鼠标的视差，金色光点 / 浪花粒子动画
- 滚动渐入、数字滚动增长（14、100,000+）
- 配套分类 Tab（小学 / 中学 / 热门组合 / 全部配套）
- 表单验证 + 成功提示 + 彩带动画；品牌影片弹窗；抢购弹窗
- 手机版：汉堡菜单、底部固定抢购栏

## 部署到 Vercel

1. 在 Vercel 点 **Add New → Project**，导入这个 GitHub 仓库。
2. Root Directory 保持默认（仓库根目录）。
3. Framework Preset 选 **Other**，Build Command 和 Output Directory 都留空。
4. 点 **Deploy**。

也可以用 CLI：在仓库根目录运行 `npx vercel --prod`

## 上线前要替换的内容

- 品牌 Logo：`assets/ts-mark.png`（导航和页脚用的圆形 A+ 标志）、`assets/favicon.png`、`assets/apple-touch-icon.png`，都是从 `assets/topscholar-logo.jpg`（正式 Logo 原图）裁出来的。
- 高清素材：`assets/hero-sunset.jpg`（Section 1 背景）、`assets/anniv-14th.png`（14TH ANNIVERSARY 标题）、`assets/students-wall.jpg` 与 `assets/flag-my.png`（Section 3，从 100,000+ 原图拆出来的学生墙和国旗）、`assets/promo-1111.jpg`（Section 4）。
- 低清占位图：`assets/film-face.jpg`（影片缩略图）和商品页的其他图，正式上线请换成原始高清图（文件名保持不变即可）。
- 倒数时间：在 HTML 里搜索 `data-countdown`。
- 表单目前只是 Demo（号码只存在浏览器的 localStorage）。正式版可在 `js/main.js` 里标注 `Demo only` 的地方接入 Google Sheet、Formspree 或你的 CRM。
- 品牌影片：把 `#filmModal` 里的 `.film-teaser` 换成 YouTube / Vimeo 的 iframe。

## 本地预览

```bash
cd landing-page
python3 -m http.server 8080   # 然后打开 http://localhost:8080
```
