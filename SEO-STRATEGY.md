# CNQ SEO 战略手册（执行版）

> 用途：每篇新文章上线前，先读本手册对照执行。
> 状态：2026-08-27 修订（新增 9.2 三类型规则、第 12 节上线 SOP；FAQPage / robots / ANCHOR-LOG 待办落档；E-E-A-T 补充），用户已确认。
> 状态：2026-09-09 增补 12.1 署名核验 SOP；同日决定暂不启用 Person author——试点已回退（tpr-flow-mark / qinteng-3d-print 恢复机构署名），SOP 保留备用，用户已确认。
> 状态：2026-09-11 第 4 节新增「锚文本归属定界规则」（4.0），重整 4.1–4.4 锚文本池并新建 4.5 出货前检验池；用户确认「以后就按这个走」。
> 状态：2026-09-15 第 5 节修订（新增 5.0 内链分配松绑规则：多个目标词已进前 10，聚焦阶段完成，放开"只链核心页"限制，链额转向未排名页；质量纪律不变），用户已确认。

---

## 1. 整站定位

- 纯英文单语站；中文版为独立站点（zh.cn-q.com），站内只保留切换入口，且出站链接加 `rel="nofollow"` 不传权。**只做英文 SEO**
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

- **核心页 = 支柱页**，仅限：`/`（主页）、`/about`、`/services`（含 `#inspection` 等服务锚点）及服务子页（`/services/china-factory-audit`、`/services/pre-shipment-inspection`、`/services/initial-production-check`）、`/industries/`（品类总览支柱页；2026-09-10 加入主导航）
- **非核心页**：工具页（`/tools/aql-calculator` 等）、法律页（`/terms`、`/privacy`）、目录页（`/insights`、`/inspection-cases/`、`/factory-resource/`、`/industry-updates/`）、`/download`、`/contact`
- **裁决规则**：判断"是否核心页"一律以此为准；工具页/法律页的职责是**向外送权重到核心页**，不作为主推内链目标（2026-09-15 修订：工具页**可作语境内链目标**，见 5.0；法律页仍不作目标）

## 3. 支柱页分工

| 页面 | 职责 | 禁则 |
|---|---|---|
| `/` | 只谈验货：服务类型、流程、AQL 标准 | 不掺工厂审核内容 |
| `/about` | 17 年履历、验货员团队、资质背书 | — |
| `/services#inspection` | 服务清单、行业案例入口、FAQ | — |
| `/industries/` | 品类经验总览（家具/玩具/纺织/电子/五金/建材），承接 "what products do you inspect" | 品类子页就绪前，主导航仅单链接、不做下拉 |

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

## 4.0 锚文本归属定界规则（2026-09-11 定，长期执行）

判定顺序从上到下，**命中即停**，一个锚文本只归一个页面：

| 优先 | 锚文本含 | 归属 |
|---|---|---|
| 1 | `company` / `agency` / `agent` / `inspector(s)` | `/about`（公司身份词） |
| 2 | `factory audit` | `/services/china-factory-audit` |
| 3 | `pre-shipment inspection` | `/services/pre-shipment-inspection` |
| 4 | `product inspection`（含省略式 `inspection in China`） | `/` |
| 5 | 其余：`inspection service(s)` / `quality inspection` / `quality control` / `QC` | `/services#inspection` |

**三条仲裁原则（防止内耗）：**

1. **判定看 `product`，不看 `service`。** `product inspection` 是主页独占头词，`service` 是通用后缀词。按后缀分流会把同族锚劈到两页。
2. **近义词族必须同页。** 仅差词序、单复数、`service` 后缀的锚（如 `quality inspection China` / `China quality inspection` / `quality inspection in China`）在 Google 眼里是同一个锚，**必须指向同一页**；分散指向两页等于主动制造主题歧义，比全放一页更糟。
3. **冲突时不按"哪页缺词"分配。** 主页的关键词是 `China Product Inspection`，往它挂 `quality inspection` 之类异族锚不是"补关键词"，是稀释主页主题。一页一个主词。

**权重认知（决定投入力度）：**

- 内部锚文本**不是独立排名因素**，权重低；它的作用是**澄清页面主题**，不是直接提排名。所以本节能做的是"不给 Google 添乱 + 让主题明确"，**不做关键词池重度轮换**。
- Google 把"以操纵排名为目的构造链接"列为 link spam。内链锚文本过度关键词化，收益极小、名义风险存在 —— **值得做对，不值得做重**。
- 行业参照（Intertek 服务页实测，2026-09-11）：锚文本以**服务名直陈 + 导航型**为主（`Assurance` / `Testing` / `Inspection` / `Certification` / `Our Company` / `Locations & Contacts`），连 `Read more`、`Continue to Page` 这类零描述锚都在正常使用，**全页没有一条 `china xxx services` 式关键词拼装**。大厂靠服务真名和站点结构吃饭，不做锚文本轮换。

## 4.1 主页 `/` 锚文本池（目标词：China Product Inspection）

- 精准：`China product inspection`
- 变体：`product inspection in China`、`professional China product inspection`、`product quality inspection in China`、`Production inspection`、`comprehensive China product inspection`、`comprehensive product inspection`、`inspection in China`、`China product inspection service`、`pre-shipment product inspection in China`、`third-party product inspection in China`、`import product inspection in China`、`independent product inspection in China`
- 变体（2026-09-11 纳入）：`China product inspection services`（复数形）、`product inspection service`（原在 4.3，按 4.0 第 4 条收归主页）
- 品牌：`China Quality Service product inspection`

## 4.2 关于页 `/about` 锚文本池（目标词：China Inspection Company）

- 精准：`China inspection company`
- 变体：`reliable inspection company in China`、`independent China QC company`、`third-party inspection company`、`third-party inspection agency`、`inspection company with 17 years of experience`、`established China inspection company`、`quality control company in China`、`local China inspection company`、`a China-based inspection company`
- 变体（2026-09-11 纳入）：`inspection agency in China`、`third-party inspection in China`、`quality inspection company in China`、`product inspection companies in China`
- 团队/人员（2026-09-11 新增，对应第 3 节"验货员团队"职责）：`inspection agent in China`、`quality control inspectors in China`
- 品牌：`China Quality Service`、`our China inspection company`、`trusted third-party inspection company in China`、`experienced China inspection company`

## 4.3 服务页 `/services#inspection` 锚文本池（目标词：China Inspection Services）

> **复数形**（2026-09-11 更正，原写单数）。依据：`services.html` 的 `<title>`、meta description、og/twitter、H1（`China Inspection Services — Expert Quality Assurance Solutions`）、H2 全部用复数，与第 2 节关键词地图一致。单数写法作废。

- 精准：`China Inspection Services`（与页面 title/H1 逐字一致——锚文本回收目标页自己的 H1，是最强主题信号）
- 变体：`China inspection service`（单数形，原为精准项，2026-09-11 降为变体）、`inspection services in China`、`third-party China inspection service`、`quality inspection service`、`inspection services`、`third-party inspection service`、`professional inspection service in China`、`independent inspection services in China`、`full-range inspection services in China`、`quality control inspection services in China`
- 变体（2026-09-11 纳入）：`China quality control inspection`、`quality inspection in China`、`China quality inspection services`、`third-party inspection services in China`、`QC inspection in China`、`quality control services in China`、`Chinese inspection services`、`China factory inspection services`
- 词义含糊（用则必须配语境）：`factory inspection China` —— 既可指验厂也可指到厂验货，不单独使用；若用，归本页并让上下文明确是验货
- 已移出：`product inspection service` → 4.1（按 4.0 第 4 条）；`pre-shipment inspection service in China` → 4.5（按 4.0 第 3 条）
- 品牌：`China Quality Service's inspection solutions`
- 语境融入句（链接统一指向 `/services#inspection`）：
  - "You can customize your quality control plan through our `China inspection service`."
  - "We offer a `full range of inspection services in China` to cover your entire supply chain."

## 4.4 验厂页 `/services/china-factory-audit` 锚文本池（目标词：factory audit in China）

页面已上线（`services/china-factory-audit.html`）。

- 精准：`factory audit in China`
- 变体：`China factory audit`、`factory audit service`、`independent factory audit`、`third-party factory audit in China`
- 扩池方向：`factory audit company in China`、`supplier factory audit`、`book a factory audit`
- 2026-09-11 核验：本池已完整覆盖 `china factory audit` / `factory audit china` / `factory audit services in china` 三条，**无需新增**。

## 4.5 出货前检验页 `/services/pre-shipment-inspection` 锚文本池（2026-09-11 新建）

页面已上线（`services/pre-shipment-inspection.html`）。目标词：`pre-shipment inspection in China`。

- 精准：`pre-shipment inspection in China`
- 变体：`pre-shipment inspection services in China`、`pre-shipment inspection companies in China`、`pre-shipment inspection service in China`（原在 4.3，按 4.0 第 3 条移入）
- 扩池方向：`pre-shipment inspection process`、`book a pre-shipment inspection`、`China pre-shipment inspection company`
- **拼写归一**：站内统一 `pre-shipment`（带连字符），**禁止** `pre shipment`（空格写法）。外采词条入库前先归一。

> 同族服务页 `/services/during-production-inspection`、`/services/initial-production-check` **暂共用 4.3 服务页池**；待各自内容体量够（各 ≥5 篇关联内容）再按本节格式单独立池。

**待整改项（2026-09-11 记录，非本轮执行）：**

**先更正一个误读（本手册初稿曾写"`Home` 锚占 52%、白占轮换额度"，作废）**：`ANCHOR-LOG.md` 中指向 `/` 的 22 条 `Home` 锚**不是正文内链，是面包屑**。面包屑容器 `<div class="breadcrumb">` 位于 `<main>` 内部（示例：`inspection-cases/tpr-flow-mark.html:83`），而 ANCHOR-LOG 的提取范围是"各页 `<main>` 正文区"，于是连面包屑一起捞了进来——该表表头声明"不含面包屑/导航/页脚"，实际做不到。按第 5 节，面包屑属结构性内链，**不计入轮换额度**，故这 22 条不占额度、**无需整改**。

> 由此得一条读表纪律：**ANCHOR-LOG 不可当"正文锚"全量真相用。** 它混入了位于 `<main>` 内的面包屑，且收录还不一致（同页 `Home` 有收有不收，如 `about.html` 的面包屑 `Home` 未收、`tpr-flow-mark.html` 的收了）。引用其数据前先回原文核对。

**真正的正文级事项（1 项）**：`product inspection in China` 作为**正文锚**指向 `/`，站内出现约 8 处（`inspection-cases/tpr-flow-mark.html:236`、`inspection-cases/kd-fence-drop-test.html:122`、`inspection-cases/index.html:93`、`insights.html:224`、`industry-updates/eu-toy-safety-regulation-2025.html:110` 等）。它是主页自己的目标词，用没错；但 8 处**逐字相同**偏重复，而 4.1 池里现成有同类变体。整改方向：按第 7 节回链维护时，把其中一部分轮换为 `third-party product inspection in China`、`independent product inspection in China`、`China product inspection`、`product quality inspection in China`。

此项**优先级低**（内部锚文本权重低，见 4.0），不单独排期。

## 5. 正文内链最终规则

> 以下只计**正文内链**。logo/导航/面包屑/相关文章/上一篇下一篇/页脚等**结构性内链不计入**（它们已保证全站每页可达全部支柱页）。
>
> **2026-09-15 修订**：原"只链核心页、每篇 ≤3"的聚焦式限制作废（多个目标词已进前 10，聚焦阶段完成），改为 5.0 分配规则 + 原质量纪律不变。修订依据：主页面继续叠加内链边际收益≈0（4.0：内部锚非独立排名因素）；新页缺正文入链才是当前瓶颈。

### 5.0 内链分配规则（2026-09-15 定）

**给谁链（放开）：**
- 正文"确实该链就链"，**不再限于核心页**。T3 文章互链（同行业/同缺陷类型/同标准）、工具页、`/download` 对应资源均可作目标
- 判断标准唯一：**用户读到这句会不会真的想点**。不顺不链（原细则保留）
- 新增内链**优先给尚未有排名的页面**（新 T3 文章、新工具页、服务子页）；已进前 10 的页面只保留必选链，**不再加链**

**质量纪律（不变，放开数量后反而更重要）：**
- **同一目标页一篇文章只链一处**（Google 只计首个锚文本，多链白链）
- 锚文本自然直陈，按 4.0 定界，不做关键词拼装
- 每篇总量 **≤5**（原 3 上调）

**必选链（保留，角色从"冲排名"转为"维持主题确认"）：**
- 工厂分享：验厂页恰好 1 条；验货案例：`/services#inspection` 恰好 1 条

**老文章：** 不回头大改，仅在 §7 回链维护时顺势补链。

### 5.1 分类型规则表

| 文章类型 | 必选链（恰好 1 条） | 开放语境链 | 上限 |
|---|---|---|---|
| **工厂分享** | 验厂页 `/services/china-factory-audit` | 验货语境 → `/services#inspection`；第三方/团队语境 → `/about`；同地域/同品类 T3 互链 | 5 |
| **验货案例** | `/services#inspection` | 第二链优先 `/about`（它缺正文级入链）；同行业/同缺陷 T3 互链；工具页（AQL 计算器等） | 5 |
| **行业动态/工具页** | 相关服务页 | 相关 T3 案例、`/download` 对应资源、相关工具页 | 5 |

**执行细则：**
- 每链必须句子自然，不顺不链
- 锚文本从对应目标页的变体池选，避免同目标页连续重复
- **同一目标页一篇文章只链一处**：多链到同一目标页无额外传权（Google 只计首个锚文本），第二处等同浪费；上表"必选 1 个"即"恰好 1 处"

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
  - 2026-09-11 补注：该表**混有 `<main>` 内的面包屑等结构性链接，非纯正文锚**（21 条 `Home` → `/` 即面包屑），且无脚本可一键重生成、收录口径有批次差异。引用前回原文核对，详见 4.5 末尾「读表纪律」。
- [x] 全站 `robots` meta `max-image-preview:large`（2026-08-30）
- [x] sitemap 真实配图 + lastmod 自动同步文件 mtime（2026-08-30，工具 `scripts/seo-enhance.ps1`，48 URL / 214 图片）
- [x] footer 版权年份自动更新（2026-08-30，`js/main.js`）
- [x] skip-link + `<main id="main-content">` 全站齐备（2026-08-30，41 页；`article-template.html` 已含，新页面复制继承；样式在 `css/style.css` `.skip-link`）
- [x] `<main>` 闭合位置全站正确（2026-09-10：发现并修复 `index.html` 的 `<footer>` 被嵌套在 `<main>` 内；同日加 `validate-seo.ps1` 第 10 节守卫。注：2026-08-30 那次只验了 `<main>` 是否存在，未验闭合位置，是这次漏检的根因）

**固化规则（2026-08-27）：**
- 每次修改任何页面后必须跑 `scripts/validate-seo.ps1` 确认 **0 issues**
- 新案例页必须带 FAQPage，且含 `"@id": "<canonical>#faq"` + `"isPartOf": {"@id": "#website"}`（格式参照已修复的 11 篇案例）
- 404 页永远不进 sitemap（错误页不索引）

**固化规则（2026-09-10）：**
- `<footer>` 必须在 `</main>` 之后，禁止嵌套在 `<main>` 内。原因：第 7 节内链校验用 `(?s)<main.*?</main>` 截取正文，footer 一旦被包含进来，其自带的 `/services#inspection`、`/about` 链接会被算作正文内链，使「正文缺内链」被误判为通过（假阴性）。已由第 10 节自动拦截。

## 9.1 图片命名规范（2026-08-27 用户确认）

- **命名权**：图片文件名由 AI 按 SEO 需要自行决定并写入 HTML；用户按 AI 给出的文件名命名实际图片文件后放入对应目录
- **规则**：全小写 + 连字符；含目标关键词（产品词 + 缺陷/场景词）；描述性、可读、可预测
- **示例**：`oven-tray-dust-contamination.jpg`（而非 `IMG_001.jpg` / `12.jpg` / 中文名）
- **禁止**：数字流水号（`12.jpg`）、空格、下划线、中文文件名、无意义缩写

## 9.2 首页 news-grid 三类型规则（2026-08-27 用户确认）

- 首页 news-grid 固定 3 卡 = **验货案例 + 工厂分享 + 行业动态 各 1 篇**
- 每类取该类型**最新一篇**（按 datePublished 排序）
- 每篇新文章上线时，必须检查首页 grid 是否符合三类型结构，同类型挤占则替换
- 卡片素材与文章页一致：og:image 图片、标题（H1/title）、meta description 与文章页保持同步

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

### 12.1 署名文章核验 SOP（2026-09-09 用户确认，备用）

> 适用：将来若启用真实个人署名（`author` = Person）的文章。**当前未启用**——全站文章一律机构署名（China Quality Service）；本文仅存档核验纪律，若某日决定启用 Person（如质控负责人公开背书），按本文执行。

- **署名 = 背书**：文章由编辑执笔，作者对内容真实性负总责、终审后放行署名。**挂名未核 = 禁止**。
- 发布/更新署名文章前，编辑须填写**事实核验清单**并交作者逐项核对，全部一致才可放行：
  - 现场验货日期（区别于页面 Published 发布时间）
  - 城市 / 产业带
  - 工厂描述：**案例文只到城市/产业带级，绝不出现厂名**；factory-resource 文以工厂书面授权为准（工厂资源文公开具体信息是工厂同意的引流，不在此限）
  - AQL / 抽样数 / 判定结论
- 案例文正文建议带出一次"日期 + 城市"现场锚点句（第一视角叙事，给 Google 与读者可核验的时空）。
- 放行后页面更新 → 跑 `scripts/validate-seo.ps1` 确认 0 issues。
- 若启用：先用 1-2 篇最有代表性案例小范围试，评估后再决定铺开；启用即意味着作者愿意接受客户问询核验。

### 12.2 站点结构维护（导航 / 页脚）

- **单一源**：`article-template.html` 同时是 **header** 与 **footer** 的源（页脚机制早已建立；header 机制 2026-09-10 建立）。
- **改导航**（增删项 / 改文案）：编辑模板 header → `node scripts/sync-header.js --sync` 铺开全站 → `node scripts/sync-header.js` 确认 `45/45 identical`。
- **改页脚**：`node scripts/sync-footer.js --sync` → `node scripts/sync-footer.js` 确认 `45/45 identical`。
- 两个脚本都**保留每页当前页高亮**（`class="active"`）：比对时忽略、写回时按原 href 还原，无需手工处理。
- **禁止**用 JS/CSS 注入导航或页脚：Googlebot 首次抓取的原始 HTML 必须已含这些内链（`validate-seo.ps1` 等静态审计依赖）。
- 变更留痕：2026-09-10 导航在 Services 之后新增 `/industries/` 单链接，同批建立 `sync-header.js`，并把 `/industries/` 列入核心页（见 2.1、3）。

---

*本手册与记忆库同步，修改任何条款需用户确认。*
