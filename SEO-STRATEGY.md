# CNQ SEO 战略手册（执行版）

> 用途：每篇新文章上线前，先读本手册对照执行。
> 状态：2026-08-27 修订（新增 9.2 三类型规则、第 12 节上线 SOP；FAQPage / robots / ANCHOR-LOG 待办落档；E-E-A-T 补充），用户已确认。

---

## 1. 整站定位

- 保留中文内容（`data-zh` 双语切换），**只做英文 SEO**
- 竞争对手：SGS、BV、QIMA 等大厂
- 核心优势：**17 年真实验货/验厂经验与记录**（每篇案例都有 AQL 报告、缺陷数据、现场见证）
- 打法：不硬拼大厂头词，用真实记录做 T3 长尾垄断，靠主题簇蜘蛛网把权重包抄到 T1/T2

## 1.1 域名与 Canonical

- 主域：**https://www.chinaqualityservice.com**（www 主域，全站 URL 统一走 www）
- 规则：全站每个页面 `<link rel="canonical" href="https://www.chinaqualityservice.com/对应路径">`，格式统一，禁止裸域/带参数重复收录
- 待办：全站核对 canonical 标签是否已统一（执行阶段 0 处理）

## 2. 关键词资产地图

| 层级 | 页面 | 目标词 |
|---|---|---|
| T1/T2 | `/` | **China Product Inspection** |
| T1/T2 | `/about` | **China Inspection Company** |
| T1/T2 | `/services#inspection` | **China Inspection Services** |
| T2 | `/services/china-factory-audit` | factory audit in China 系列 |
| T3 | 每篇案例/工厂文章 | 长尾词（如 `KD furniture inspection`、`toy factory audit in China`） |

## 2.1 核心页定义（裁决依据，2026-08-26 用户确认）

- **核心页 = 支柱页**，仅限：`/`（主页）、`/about`、`/services`（含 `#inspection` 等服务锚点）及服务子页（`/services/china-factory-audit`、`/services/pre-shipment-inspection`、`/services/initial-production-check`）
- **非核心页**：工具页（`/tools/aql-calculator` 等）、法律页（`/terms`、`/privacy`）、目录页（`/insights`、`/inspection-cases/`、`/factory-resource/`、`/industry-updates/`）、`/download`、`/contact`
- **裁决规则**：判断"是否核心页"一律以此为准；工具页/法律页的职责是**向外送权重到核心页**，不作为内链目标

## 3. 支柱页分工

| 页面 | 职责 | 禁则 |
|---|---|---|
| `/` | 只谈验货：服务类型、流程、AQL 标准 | 不掺工厂审核内容 |
| `/about` | 17 年履历、验货员团队、资质背书 | — |
| `/services#inspection` | 服务清单、行业案例入口、FAQ | — |

## 4. 锚文本策略（轮换制）

**不是"一用就废"，而是"不连续重复"。** 同一目标页的锚文本按比例轮换：

| 类型 | 占比 | 说明 |
|---|---|---|
| 精确匹配 | 20-30% | 只给最高权重位置（相关卡片标题、首页正文） |
| 部分匹配/变体 | 40-50% | 池内轮着用 |
| 自然短语 | 20-30% | 关键词嵌入句子（`schedule a product inspection in China`） |
| 品牌/URL | 少量 | `CNQ`、站点域名 |

**扩池方法**（核心词 × 组合维度）：
- 前缀：`reliable` / `independent` / `third-party` / `professional`
- 行业限定：`textile` / `electronics` / `toy` / `furniture` / `outdoor`
- 动作：`book a factory audit` / `schedule product inspection`
- 地域：`in Guangzhou` / `across China`

## 4.1 主页 `/` 锚文本池（目标词：China Product Inspection）

- 精准：`China product inspection`
- 变体：`product inspection in China`、`professional China product inspection`、`product quality inspection in China`、`Production inspection`、`comprehensive China product inspection`、`comprehensive product inspection`、`inspection in China`、`China product inspection service`、`pre-shipment product inspection in China`、`third-party product inspection in China`、`import product inspection in China`、`independent product inspection in China`
- 品牌：`China Quality Service product inspection`

## 4.2 关于页 `/about` 锚文本池（目标词：China Inspection Company）

- 精准：`China inspection company`
- 变体：`reliable inspection company in China`、`independent China QC company`、`third-party inspection company`、`third-party inspection agency`、`inspection company with 17 years of experience`、`established China inspection company`、`quality control company in China`、`local China inspection company`、`a China-based inspection company`
- 品牌：`China Quality Service`、`our China inspection company`、`trusted third-party inspection company in China`、`experienced China inspection company`

## 4.3 服务页 `/services#inspection` 锚文本池（目标词：China Inspection Service）

- 精准：`China inspection service`
- 变体：`inspection services in China`、`third-party China inspection service`、`quality inspection service`、`inspection services`、`product inspection service`、`third-party inspection service`、`professional inspection service in China`、`independent inspection services in China`、`full-range inspection services in China`、`pre-shipment inspection service in China`、`quality control inspection services in China`
- 品牌：`China Quality Service's inspection solutions`
- 语境融入句（链接统一指向 `/services#inspection`）：
  - "You can customize your quality control plan through our `China inspection service`."
  - "We offer a `full range of inspection services in China` to cover your entire supply chain."

## 4.4 验厂页 `/services/china-factory-audit` 锚文本池（建议建）

- `factory audit in China`、`China factory audit`、`factory audit service`、`independent factory audit`、`third-party factory audit in China`
- 扩池方向：`factory audit company in China`、`supplier factory audit`、`book a factory audit`

## 5. 正文内链最终规则

> 以下只计**正文内链**。logo/导航/面包屑/相关文章/上一篇下一篇/页脚等**结构性内链不计入**（它们已保证全站每页可达全部支柱页）。

| 文章类型 | 正文内链规则 | 上限 |
|---|---|---|
| **工厂分享** | 验厂页 `/services/china-factory-audit` **必选 1 个**；验货语境自然出现 → `/services#inspection`；第三方/团队语境 → `/about` | 3 |
| **验货案例** | `/services#inspection` **必选 1 个**；第二链**优先 `/about`**（它缺正文级入链）；仅当正文自然完整出现 `China product inspection` 等目标短语时才换主页 `/` | 3 |
| **行业动态/工具页** | 相关服务页 | 1-3 |

**执行细则：**
- 每链必须句子自然，不顺不链
- 锚文本从对应目标页的变体池选，避免同目标页连续重复
- **同一目标页一篇文章只链一处**：多链到同一目标页无额外传权（Google 只计首个锚文本），第二处等同浪费；上表"必选 1 个"即"恰好 1 处"
- **DOM 分离**：带内链段落 `data-zh` 只放 `<span>`，`<a>` 独立

## 6. 内容节奏

| 类型 | 频率/月 |
|---|---|
| 验货案例 | 3-5 篇 |
| 工厂分享 | 1-2 篇 |
| 行业动态/工具 | 1 篇 |
| **合计** | **4-8 篇/月**（一致性 > 爆发） |

案例按行业铺簇：玩具、家居/家具、厨具杯壶、户外、纺织服装；工厂按地域+品类：珠三角电子、温州五金、宁波小家电、青岛纺织等。

## 7. 回链维护（长期规则）

- 每发一篇新文章，当天同步加入 **1-2 篇最相关老文章**的相关区
- 相关区 `.related-grid` 硬编码 3 卡，靠主动维护保持闭环

## 8. E-E-A-T 强化

- 案例数据化：AQL 2.5、缺陷率、疵点类型、验货日期
- 标准引用：ISO 2859-1、GB、ANSI
- 第一视角现场见证叙事
- `/about` 统一 17 年履历 + 验货员团队
- Article JSON-LD 全站已含 `author` + `publisher`（Organization 署名，2026-08-27 核查达标）

## 9. 技术清单

- [x] sitemap.xml 同步
- [x] JSON-LD（Article/BreadcrumbList/Organization）
- [x] DOM 分离（2026-08-23 全站排查完成，仅 premium-shirt 两处，已修复）
- [x] 案例页 FAQPage schema（2026-08-27 补齐 11 篇案例的 `@id` + `isPartOf`；新案例页必须带 FAQPage 且含此结构，见下方固化规则）
- [x] robots.txt 核对（2026-08-27：404 处理 = robots `Disallow: /404` + 404 页不进 sitemap + validate-seo.ps1 排除 404）
- [x] 图片懒加载 + 压缩（2026-08-27 审计确认全站达标：alt 齐全、`loading="lazy"` 齐全、图片已压缩）
- [x] 全站锚文本使用跟踪表（ANCHOR-LOG.md 已建立并持续维护）
- [x] 全站 `robots` meta `max-image-preview:large`（2026-08-30）
- [x] sitemap 真实配图 + lastmod 自动同步文件 mtime（2026-08-30，工具 `scripts/seo-enhance.ps1`，48 URL / 214 图片）
- [x] footer 版权年份自动更新（2026-08-30，`js/main.js`）
- [x] skip-link + `<main id="main-content">` 全站齐备（2026-08-30，41 页；`article-template.html` 已含，新页面复制继承；样式在 `css/style.css` `.skip-link`）

**固化规则（2026-08-27）：**
- 每次修改任何页面后必须跑 `scripts/validate-seo.ps1` 确认 **0 issues**
- 新案例页必须带 FAQPage，且含 `"@id": "<canonical>#faq"` + `"isPartOf": {"@id": "#website"}`（格式参照已修复的 11 篇案例）
- 404 页永远不进 sitemap（错误页不索引）

## 9.1 图片命名规范（2026-08-27 用户确认）

- **命名权**：图片文件名由 AI 按 SEO 需要自行决定并写入 HTML；用户按 AI 给出的文件名命名实际图片文件后放入对应目录
- **规则**：全小写 + 连字符；含目标关键词（产品词 + 缺陷/场景词）；描述性、可读、可预测
- **示例**：`oven-tray-dust-contamination.jpg`（而非 `IMG_001.jpg` / `12.jpg` / 中文名）
- **禁止**：数字流水号（`12.jpg`）、空格、下划线、中文文件名、无意义缩写

## 9.2 首页 news-grid 三类型规则（2026-08-27 用户确认）

- 首页 news-grid 固定 3 卡 = **验货案例 + 工厂分享 + 行业动态 各 1 篇**
- 每类取该类型**最新一篇**（按 datePublished 排序）
- 每篇新文章上线时，必须检查首页 grid 是否符合三类型结构，同类型挤占则替换
- 卡片素材与文章页一致：og:image 图片、标题（H1/title）、meta description 双语（`data-zh`）同步

## 10. 执行阶段

| 阶段 | 时间 | 目标 |
|---|---|---|
| 0. 地基 | 第 1-2 周 | 技术补齐、簇架构、关键词地图 |
| 1. 长尾饱和 | 1-3 月 | T3 批量进首页 |
| 2. 二头突破 | 3-6 月 | T2 进首页 |
| 3. 头词包抄 | 6-12 月 | T1 进前 1-2 页 |

## 11. 外部信号

- Google Business Profile
- B2B 目录：Thomasnet / Kompass / Go4WorldBusiness
- Quora / Reddit（r/chinabuyers）以 17 年验货员身份回答

## 12. 新页面/文章上线 SOP（2026-08-27 用户确认）

> 创建任何新页面之前，**必须先读本手册对照执行**，顺序不可颠倒。

1. **定词 → 定 URL → 写内容**：先定目标关键词（参考第 2 节关键词地图），再定 URL slug（2-3 个目标词连字符拼接），最后写内容
2. **内链**：按第 5 节规则放正文内链（1-3 个、同一目标页只链 1 处、锚文本从对应池选、句子不顺不链）
3. **图片与 head 五件套**：按 9.1 命名图片；title / meta description / og:title / twitter:title / canonical 与 H1、Article headline 同步
4. **上线当天同步**：
   - sitemap.xml 增加新 URL + 更新 lastmod
   - 首页 news-grid 按 9.2 三类型规则检查
   - 加入 1-2 篇最相关老文章的相关区（第 7 节回链维护）
   - 更新 ANCHOR-LOG.md 锚文本跟踪表
5. **收尾**：跑 `scripts/validate-seo.ps1` 确认 0 issues

---

*本手册与记忆库同步，修改任何条款需用户确认。*
