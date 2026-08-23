# CNQ SEO 战略手册（执行版）

> 用途：每篇新文章上线前，先读本手册对照执行。
> 状态：2026-08-23 定稿，用户已确认核心条款。

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

## 9. 技术清单

- [x] sitemap.xml 同步
- [x] JSON-LD（Article/BreadcrumbList/Organization）
- [x] DOM 分离（2026-08-23 全站排查完成，仅 premium-shirt 两处，已修复）
- [ ] 案例页补 FAQPage schema（每篇 2-3 个真实问答）
- [ ] robots.txt 核对
- [ ] 图片懒加载 + 压缩
- [ ] 全站锚文本使用跟踪表

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

---

*本手册与记忆库同步，修改任何条款需用户确认。*
