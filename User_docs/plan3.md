# 首页排版与「仅重点词汇乱码」方案

## 一、版面文案结构

- **标题**：`Database Developer`
- **自我介绍**：`Hi, I'm XiangyiLi, a database and data developer passionate about building scalable data systems.`
- **技能/工作**：`I work with SQL, Python, and machine learning to turn complex data into useful insights and reliable infrastructure.`
- **项目方向**：`My projects focus on data architecture, analytics platforms, and large-scale data processing.`
- **占位**：`## 后面留给之后处理。。。`（后续再补充）

---

## 二、重点词汇（仅这些参与乱码）

以下词/短语作为**重点词汇**，在电视内**只有这些**会触发乱码字符效果（随机字符、flicker 等）；其余正文保持静态显示。

| 类型     | 重点词汇 |
|----------|----------|
| 标题     | `Database Developer` |
| 人名     | `XiangyiLi` |
| 技术栈   | `SQL`、`Python`、`machine learning` |
| 领域词   | `data architecture`、`analytics platforms`、`large-scale data processing` |

- 实现时：**整段文案**仍可一起排版、换行、滚轮上下移动；但乱码逻辑只作用于上述重点词汇（例如用组件包裹这些词，或按「静态片段 + 可乱码片段」分段渲染）。

---

## 三、排版与呈现约定（供后续改代码用）

- 标题单独一行，字号/字重与正文区分。
- 正文多行，行距适中；支持滚轮上下移动（沿用现有 `contentOffsetYRef`）。
- 全文在 CRT + 扫描线 + Bloom 的「电视」内展示；仅重点词汇有乱码动画，其余为普通静态文字。
- 「后面留给之后处理」仅作占位，不参与当前乱码与排版实现。

---

## 四、实现要点（仅计划，不写代码）

- **数据**：首页维护「完整文案」与「重点词汇列表」；或把文案拆成「静态片段」与「可乱码片段」交替的数组，便于渲染。
- **渲染**：要么整段用 GlitchGL 画、在 shader/纹理阶段只对「重点词位置」做乱码（复杂），要么改为 DOM 排版：段落用普通文本，重点词用现有 `ScrambleText` 组件并传入 `targetText` + `mode="flicker"`（或由调度触发），再整体放进电视视口内并应用 CRT 等效果（需考虑 DOM 与 Canvas 的层级/混合方式）。
- **交互**：滚轮仍驱动整块内容上下移动；乱码触发方式（定时/随机/ hover）可与现有 GlitchRandomizer 调度一致，但仅作用于重点词汇。
