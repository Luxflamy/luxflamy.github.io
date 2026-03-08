# 在「留给后面处理的部分」添加卡片组件 — 计划（可复用、多用途，且位于电视内）

## 一、目标

在首页「后面留给之后处理」的占位区域，增加一个**可复用的卡片**呈现方式，用于多种场景（经历、技能、项目、其它）；且**卡片与现有文字一样，出现在复古电视显示效果之内**——同一块 CRT 电视画面、在文案之后、随滚轮上下滑动，并**最大限度保留与文字一致的复古电视视觉效果**。

先做方案与结构，不写代码。

---

## 二、现状与约束

- 首页主内容在 **GlitchGL** 的 **Canvas 纹理**内绘制，整段文案在同一块 CRT 电视内，由滚轮 `offsetY` 上下滑动。
- 复古电视效果（桶形畸变、色彩偏移/色散、扫描线、磷光、暗角、Bloom 等）由 **WebGL 片元着色器** 对**画布纹理**施加；即：只有**被绘制进该画布（纹理）的内容**才会经历完整的 CRT 管线。
- **约束**：卡片必须像这段文字一样，在电视内、文案之后，且采用**最能保留复古电视效果**的实现方式。

---

## 三、最能保留复古电视效果的原则

### 3.1 效果从何而来

- 当前管线：**Canvas 2D 绘制文案** → 画布作为**唯一纹理**传入 WebGL → **片元着色器**对该纹理做桶形畸变、色散、扫描线、磷光、暗角等 → 最终呈现在屏幕。  
- 因此：**与纹理一体**的内容（即画布上的像素）才会出现弯曲、色边、扫描线等；**纹理之外**的 DOM 层不会经过这套 shader，至多只能被全局扫描线/Bloom 容器覆盖，**无法获得**桶形畸变与色彩偏移，观感会与文案不一致。

### 3.2 结论

- **最能保留复古电视效果**的做法是：让卡片内容与文案**共处同一张画布（同一纹理）**，再一起进入现有 CRT 着色器，这样卡片与文字在畸变、色散、扫描线等方面完全一致。  
- 若把卡片做成**独立 DOM 层**叠在 Canvas 之上，卡片**不会**经过 CRT 畸变与色散，复古感会打折扣，与「像文字一样出现在复古电视效果之后」的预期不符。  
- 故在「最大限度保留复古电视效果」的前提下，**推荐采用 Canvas 内绘制卡片**，不采用 DOM 叠加卡片。

---

## 四、推荐方案：在 GlitchGL 画布内绘制卡片（Canvas 绘制）

### 4.1 思路

- 在现有 **GlitchGL** 的绘制流程中，在文案**下方**用 **Canvas 2D API** 绘制「卡片」：卡片框、背景、标题、描述、标签等；与文案共用**同一张画布**。  
- 该画布整体作为**同一纹理**送入现有 WebGL 管线，因此**文案 + 卡片**一起接受桶形畸变、色彩偏移、扫描线、Bloom 等，视觉效果完全一致，最能保留复古电视效果。

### 4.2 与文案的布局关系

- 文案仍按现有逻辑绘制（含留白、边距、行高）；在文案区域**下方**预留或计算出一块「卡片区域」的 Y 范围。  
- 卡片区域与文案**共用同一套 `offsetY`**：绘制时传入相同的 `offsetY`，卡片与文字一起上下移动，仍由滚轮驱动。  
- 可选：文案末尾保留一行简短引导（如「— 如下 —」）或删除「## 后面留给之后处理。。。」，由卡片区域承接内容。

### 4.3 卡片绘制内容（计划层面）

- 在画布上绘制：  
  - 卡片外框/背景（矩形、圆角可选）；  
  - 标题、副标题（如时间/地点）；  
  - 描述文字（可多行）；  
  - 标签/技术栈（小标签或逗号分隔）；  
  - 若有链接，可绘为文字样式（点击需另做 hit-test 或后续用透明 DOM 层做点击）。  
- 字体、字号、颜色与现有文案风格统一（如白字、深底），以保证整块画面风格一致。

### 4.4 可复用与多用途的保留方式

- **数据层复用**：卡片仍按「一种数据结构、多种用途」设计——经历、技能、项目等共用同一套**数据形状**（标题、副标题、描述、标签、链接等），由配置或常量驱动。  
- **绘制层**：在 GlitchGL 内根据该数据（或由上层传入的「卡片配置数组」）用 2D API 按统一布局规则绘制；不同 variant（经历/技能/项目）仅在**展示字段或排版细节**上区分（如经历突出时间、技能突出标签），绘制逻辑可复用。  
- 即：**复用**体现在**数据结构和绘制逻辑**上；「卡片」在视觉与效果上完全融入电视，在实现上是一套可配置的**画布绘制流程**，而非独立 React DOM 组件。

### 4.5 实现要点（仅计划）

- **扩展绘制入口**：在现有 `createTextTexture` 或同等流程中，在文案绘制完成后，根据「卡片区域」的 Y 范围与 `offsetY`，在同一画布上继续绘制卡片（一张或多张，纵向排列）。  
- **布局约定**：与文案共用字号/行高/边距等常数，或由 GlitchGL 与上层约定「文案占高」或「卡片起始 Y」，保证文案与卡片不重叠、留白一致。  
- **多张卡片**：若有多条经历/技能/项目，按配置数组顺序在卡片区域内自上而下绘制多块卡片，整体仍随 `offsetY` 滚动。  
- **交互（可选）**：若需点击卡片或链接，可在后续阶段在卡片区域上叠加透明 DOM 层做 hit-test，或仅作展示；计划阶段不绑定交互实现。

---

## 五、不采用的方案：DOM 叠加卡片

- **做法**：在 Canvas 上叠一层 DOM，内放 React 卡片组件，用 `transform: translateY(offsetY)` 与文案同步滚动。  
- **不采用原因**：DOM 内容不进入 GlitchGL 的纹理，**无法**经过桶形畸变与色彩偏移等 shader，与文案的复古观感不一致，**不能最大限度保留复古电视效果**。  
- 若未来有「电视外」或「弱 CRT」的区块，再考虑使用 DOM 卡片组件；本计划仅针对「电视内、与文字同效果」的卡片。

---

## 六、实现要点汇总（仅计划，不写代码）

1. **原则**  
   - 采用**最能保留复古电视效果**的方式：卡片与文案**共处同一画布**，经同一 CRT 管线输出。

2. **实现方式**  
   - 在 **GlitchGL** 的 Canvas 绘制流程中，在文案下方用 **Canvas 2D** 绘制卡片（框、标题、描述、标签等）；整张画布作为同一纹理进 shader，不做 DOM 叠加卡片。

3. **布局与滚动**  
   - 卡片区域在文案下方，与文案共用 `offsetY`，随滚轮上下移动；布局参数（文案占高、卡片起始 Y）在 GlitchGL 内或与上层约定一致。

4. **数据与复用**  
   - 卡片内容由**统一数据结构/配置**驱动（经历、技能、项目等）；绘制逻辑根据配置与 variant 在画布上输出，实现数据层与展示逻辑的复用。

5. **占位文案**  
   - 从 `HERO_COPY` 中删除或缩短「## 后面留给之后处理。。。」，由画布内的卡片区域承接该部分内容。

6. **不采用**  
   - 不采用「卡片在电视下方独立区块」；不采用「DOM 叠加卡片」作为电视内卡片方案，以保证复古电视效果一致。

---

## 七、卡片悬停时的电子辉光增强（采用计划 A）

### 7.1 目标

- 当**鼠标放置在卡片位置**（悬停在某张卡片区域）时，**电子辉光从卡片的边缘发出**，使卡片轮廓呈现「边框发光」的观感，与复古电视/CRT 风格一致。  
- 仅给出计划，不写代码。

### 7.2 采用方案：计划 A（着色器内按区域增强），且辉光从边缘发出

- **选定**：采用 **计划 A**——在片元着色器内根据「当前悬停的卡片区域」增强电子辉光；且**辉光必须从卡片的边缘发出**（沿卡片边框发光），而非从卡片中心向外扩散。  
- **不采用**：从卡片中心向外径向发光的做法；本阶段不采用计划 B（整体 Bloom 增强）。

### 7.3 现状与约束

- 卡片在 Canvas 内绘制，无 DOM。  
- 当前管线：鼠标与悬停卡片索引、矩形等可在 JS 中计算并传入 shader。  
- **观感要求**：辉光应来自**卡片边缘**（四条边），在边缘附近最亮，随「到边缘的距离」衰减，而不是以卡片中心为圆心的圆形光晕。

### 7.4 方案 A 思路（修正为「边缘发光」）

#### 7.4.1 卡片区域与悬停判定（JS 侧）

- 与前述一致：与 `drawCardsOnCanvas` 共用布局，在 JS 中算每张卡片的包围矩形；鼠标与矩形做 hit-test，得到当前悬停的卡片索引。  
- 无悬停时关闭辉光（见下）。

#### 7.4.2 着色器内「从边缘发出」的辉光

- **思路**：辉光强度由「当前片段到卡片矩形的**最近边缘的距离**」决定——**距离边缘越近越亮**，距离边缘超过一定像素后衰减为 0，从而形成「从卡片边缘发出」的效果。  
- **传入 shader 的 uniform（思路）**：  
  - 悬停卡片的**矩形**（与 `gl_FragCoord`/resolution 坐标系一致）：例如 `u_cardGlowRect` = (left, bottom, right, top)，或 (x, y, width, height)，注意画布 y 向下、shader y 向上，需做 y 翻转后传入；  
  - **边缘发光宽度**（如 `u_cardGlowEdgeWidth`，像素）：在边缘内侧和/或外侧多宽范围内有辉光；  
  - **辉光强度**（如 `u_cardGlowIntensity`）；  
  - 若未悬停，可通过「边缘宽度 = 0」或「强度 = 0」关闭效果。  
- **shader 内逻辑**：  
  - 计算当前片段到该矩形的**到最近边的距离** d（即「点到矩形的最短距离」：点在矩形外时为到最近边的距离，点在矩形内时为到最近边的距离）；  
  - 当 d 在 0～`u_cardGlowEdgeWidth` 之间时，用 smoothstep 等得到权重（越靠近边缘权重越大），对最终 color 叠加发光：`color += glowColor * weight * u_cardGlowIntensity`；  
  - 这样辉光只出现在「边缘附近」的带状区域，视觉上即**从卡片边缘发出**。  
- **多张卡**：同一时刻只处理当前悬停的一张，传该张卡片的矩形 + 边缘宽度 + 强度。

### 7.5 实现要点汇总（仅计划，边缘发光）

1. **布局与矩形**  
   - 与绘制一致，得到悬停卡片的 **(x, y, width, height)**（画布坐标系，y 向下）；传入 shader 前转换为与 `gl_FragCoord` 一致（例如 left/right 不变，bottom = height - y - cardHeight, top = height - y）。

2. **鼠标与 hit-test**  
   - 与前述一致：得到 `hoveredCardIndex`，无悬停则关闭辉光。

3. **Uniform 传递**  
   - 将悬停卡片的**矩形**（在 shader 坐标系下的 left, bottom, right, top 或等价）、**边缘发光宽度**、**强度**传入片元着色器；无悬停时边缘宽度或强度置 0。

4. **片元着色器**  
   - 实现「点到矩形的最短距离」d；  
   - 根据 d 与 `u_cardGlowEdgeWidth` 计算权重（d 越小权重越大），在边缘附近叠加辉光，使辉光**从卡片边缘发出**。

5. **与现有 interaction 的配合**  
   - 边缘辉光与现有鼠标 interaction 可同时存在，数值上做平衡。

6. **性能**  
   - 矩形随 offsetY、resize 更新；hit-test 每帧或 mousemove 一次即可。

### 7.6 小结

- **采用计划 A**，且**辉光从卡片边缘发出**：在着色器内用「片段到矩形最近边的距离」驱动辉光权重，使发光集中在卡片轮廓附近，而非从中心扩散。  
- **关键链**：layout → 卡片矩形 → hit-test → 悬停卡片矩形（转 shader 坐标）+ 边缘宽度 + 强度 → 着色器内算「到边缘距离」→ 边缘附近叠加发光。  
- 不写代码，确认后再实现。

---

### 7.7 辉光必须在复古电视效果「内部」——根本原因与解决方向

#### 7.7.1 现象

- 卡片边缘的辉光看起来是**独立的**：清晰、无扫描线、无畸变、无磷光/暗角，像叠在 CRT 画面之上的一层「现代」发光，而不是电视画面的一部分。

#### 7.7.2 根本原因

- 当前管线中，卡片辉光是在片元着色器里**最后**叠加到 `color` 上的（在扫描线、磷光、暗角、亮度/闪烁等**之后**），再直接写入 `gl_FragColor`。  
- 因此，辉光**没有经过**扫描线、磷光、暗角、亮度等后续 CRT 处理，只对「已经做完复古效果」的画面做了一次加法。  
- 结果：辉光在「输出空间」被加在成品画面上，视觉上就像在电视效果**之外**的一层独立发光。

#### 7.7.3 解决方向（从根源上）

- 要让辉光**在复古电视效果内部**，就必须让辉光**和纹理内容一样，一起经过**扫描线、磷光、暗角、亮度等处理。  
- **做法**：在片元着色器里，把「卡片边缘辉光的叠加」从**管线末端**移到**管线中段**——即**在应用扫描线（步骤 9）、磷光（10）、暗角（11）、亮度/闪烁（12）之前**就把辉光加到 `color` 上。  
- 这样，叠加了辉光后的 `color` 会继续参与后续的扫描线、磷光、暗角、亮度计算，辉光就会带上同样的扫描线、磷光、暗角与亮度变化，观感上就变成「电视画面的一部分」，而不是独立覆盖层。

#### 7.7.4 实现要点（仅计划）

1. **调整 shader 中辉光的位置**  
   - 将「卡片边缘辉光」的计算与 `color += glow...` 从当前位置（步骤 13、最后）移到**纹理取色与混合之后、步骤 7（噪声）之后、步骤 9（扫描线）之前**的某一处（例如紧接在步骤 8 之后）。  
   - 保证从该点起，后续步骤 9～12 都作用在「已包含辉光」的 `color` 上。

2. **不改变辉光算法本身**  
   - 边缘距离、权重、发光颜色与强度的计算逻辑可以保持不变，只改变在管线中的**插入时机**。

3. **可选**  
   - 若希望辉光也受色散等更早步骤影响，可把辉光插在更早（例如取色/混合之后、噪声之前）；但至少要在扫描线/磷光/暗角/亮度**之前**，才能消除「独立一层」的观感。

#### 7.7.5 小结

- **根源**：辉光加在管线**末尾**，未经过扫描线等 CRT 效果，所以看起来独立。  
- **解决**：把辉光叠加**前移**到扫描线（及磷光、暗角、亮度）**之前**，使辉光与画面一起经过这些步骤，从根源上让辉光处于复古电视效果内部。

---

## 八、卡片悬停 1 秒乱码后显示详细信息（计划，不写代码）

### 8.1 目标

- 鼠标放置在卡片上时：**先进行 1 秒的乱码效果**（复用现有乱码工具/逻辑），**之后**卡片内容切换为该条目的「详细信息」。
- 鼠标移出卡片后：立即恢复为普通卡片展示（标题、副标题、描述、标签）。
- 组件保持**可复用**（经历/技能/项目等通用）、**高聚合、低耦合、高复用**。

### 8.2 数据层扩展（CardData，保持复用）

- 在 `CardData` 中增加**可选**字段，用于悬停 1s 后展示的「详细信息」内容，例如：
  - `details?: string`（支持多行，如 `"Line1\nLine2\n..."`）。
- 若某条卡片未提供 `details`，悬停满 1s 后可选策略：
  - **方案 A**：仍保持「详情阶段」但用现有 `description` 或标题等作为替代展示；
  - **方案 B**：不切换阶段，仅做 1s 乱码后恢复为普通展示。
- 推荐**方案 A**，保证所有卡片行为一致；`details` 为空时用 `description` 或 `title + subtitle` 作为 fallback。
- 不改变现有 `title / subtitle / description / tags / href / variant` 的语义，仅**扩展**可选字段，兼容现有用法。

### 8.3 状态与时序（单一职责：由 GlitchGL 驱动）

- **已有**：`hoveredCardIndex`（当前悬停的卡片索引，-1 表示无）。
- **新增**（建议用 ref，避免触发 React 重渲染）：
  - `cardHoverStartedAtRef`：记录「当前悬停的这张卡」开始悬停的时间戳（毫秒）；当 `hoveredCardIndex` 从无到有或从 A 切到 B 时更新为 `Date.now()`；当 `hoveredCardIndex === -1` 时清空或置 0。
- **阶段判定**（以 1000ms 为界）：
  - **普通 (idle)**：未悬停该卡。
  - **乱码 (scramble)**：悬停该卡且 `elapsed = now - cardHoverStartedAt < 1000`。
  - **详情 (detail)**：悬停该卡且 `elapsed >= 1000`。
- 移出卡片：下一帧 `hoveredCardIndex === -1`，所有卡恢复 idle，无需额外清理。

### 8.4 乱码复用（高复用）

- **复用**现有 `getScrambledText`（来自 `@/components/ScrambleText/utils`），不新增乱码实现。
- 在**乱码阶段**内：
  - 以当前悬停卡片的 `title`（或固定占位如 `"Loading..."`）作为目标文本，调用 `getScrambledText(text, 'scramble', 0, options)` 得到当帧的乱码字符串。
  - 按固定或随机间隔（如 **80～120ms**）重新生成一次乱码并触发纹理重绘，使 1s 内有多帧乱码变化。
- 不在卡片内再接入 `ScrambleText` React 组件；仅在 **GlitchGL 的 canvas 绘制流程**中按「当前是否为该卡的乱码阶段」决定是否用上述乱码字符串参与 `fillText` 等绘制，保证逻辑集中在 GlitchGL + cardData，**低耦合**。

### 8.5 绘制逻辑（drawCardsOnCanvas + getCardRects）

- **入参扩展**（`DrawCardsOptions`）：
  - `cardPhases?: ('idle' | 'scramble' | 'detail')[]`：每张卡当前阶段，与 `cards` 一一对应；由 GlitchGL 根据 8.3 计算后传入。
  - `hoveredCardScrambledText?: string`：仅当存在某卡处于 `scramble` 时传入该卡本帧的乱码字符串，用于该卡内容区绘制。
- **绘制分支**（与现有「边框加亮」逻辑并列）：
  - **idle**：与当前一致，绘制 title、subtitle、description、tags。
  - **scramble**：该卡内容区（标题/副标题位置或整块）用 `hoveredCardScrambledText` 绘制 1～2 行乱码，边框仍可用现有「悬停加亮」逻辑。
  - **detail**：该卡内容区绘制 `details`（多行）；若 `details` 为空则用 `description` 或 `title + subtitle` 作为 fallback；字体/行高可与现有描述区一致或略小，保证不溢出卡片框（可约定最大行数或固定详情区高度）。
- **布局与 getCardRects**：
  - 若「详情阶段」使用与 idle 相同的卡片高度（详情内容在框内换行/截断），则 `getCardRects` 无需随 phase 变化，**低耦合**。
  - 若希望详情阶段卡片**略高**（例如固定多 4～6 行），则 `getCardRects` 的入参中需包含 `cardPhases`，对 `phase === 'detail'` 的卡使用统一「详情高度」计算矩形，以保证 hit-test 与视觉一致；推荐采用**固定详情高度**，避免布局抖动。

### 8.6 GlitchGL 职责（高聚合）

- **每帧/每次 animate**：
  1. 根据 `hoveredCardIndex` 与 `cardHoverStartedAtRef` 计算每张卡的 `cardPhases`。
  2. 若当前存在 `phase === 'scramble'` 的卡：
     - 若本帧距离上次乱码更新已超过间隔（如 80～120ms）：调用 `getScrambledText` 得到新字符串，写入 ref（如 `cardScrambledTextRef`），并标记需要重绘纹理。
  3. 重绘条件（在现有「文案/offset/悬停变化重绘」基础上）增加：**卡片阶段变化**（idle → scramble、scramble → detail、或任意 phase 变化）或**乱码阶段内定时刷新**。
  4. 调用 `createTextTexture` 时传入上述 `cardPhases`、`hoveredCardScrambledText`，由 `createTextTexture` 再传给 `drawCardsOnCanvas`。
- **鼠标移入某卡**：更新 `hoveredCardIndex` 与 `cardHoverStartedAtRef = Date.now()`。
- **鼠标移出**：`hoveredCardIndex = -1`，`cardHoverStartedAtRef` 清空；下一帧所有卡为 idle，一次重绘即可恢复。

### 8.7 文件与职责划分（低耦合）

| 位置 | 职责 |
|------|------|
| `lib/cardData.ts` | 扩展 `CardData.details`；扩展 `DrawCardsOptions`（`cardPhases`、`hoveredCardScrambledText`）；`drawCardsOnCanvas` 内按 phase 分支绘制（idle / scramble / detail）；若采用「详情高度」则 `getCardRects` 接受 `cardPhases` 并计算对应矩形。 |
| `components/GlitchGL/index.tsx` | 维护 `cardHoverStartedAtRef`、乱码刷新间隔与 `cardScrambledTextRef`；计算 `cardPhases`；在 scramble 阶段定时调用 `getScrambledText` 并触发重绘；将 phase 与乱码字符串传入 `createTextTexture` → `drawCardsOnCanvas`。 |
| `components/ScrambleText/utils.ts` | **不修改**，仅被调用；`getScrambledText(..., 'scramble', 0, options)`。 |
| `app/page.tsx` | 为需要「详细信息」的卡片在 `CARD_ITEMS` 中补充 `details` 字段；不参与阶段或乱码逻辑。 |

### 8.8 小结

- **交互**：悬停 → 1s 乱码（复用 `getScrambledText`）→ 切换为详细信息（`details` 或 fallback）；移出即恢复。
- **复用**：乱码逻辑复用现有工具；卡片数据与绘制仍为一套通用结构，经历/技能/项目共用。
- **高聚合**：阶段与定时由 GlitchGL 统一计算；绘制细节收敛在 `drawCardsOnCanvas`。
- **低耦合**：ScrambleText 仅被调用、不感知卡片；cardData 只接收 phase 与乱码字符串；页面层只提供 `details` 数据。
- 先不写代码，确认后再实现。

---

### 8.9 乱码三阶段表现（修订：基于已有文字 → 扩散 → 显露详情）

#### 8.9.1 目标

- 乱码**一开始**要基于**卡片上已有的文字**（即 idle 时展示的 title、subtitle、description、tags）进行乱码显示，而不是仅对 title 或占位符乱码。
- **然后**乱码逐渐**扩散**到后面的文字上（从前面字符/行扩散到更多字符/行）。
- **最后**乱码逐渐**显露出**详细信息（details）的明文，形成从「卡片原文乱码」过渡到「details 明文」的完整过程。

整体 1s 内分为三个子阶段，逻辑上连续、视觉上连贯。

---

#### 8.9.2 阶段一：乱码基于卡片已有文字（0 ~ 约 0.35s）

- **内容来源**：乱码的「目标文本」= 卡片在 idle 状态下会显示的那段文字，即与 `drawCardsOnCanvas` 在 idle 时绘制顺序一致的一段字符串。
  - 建议拼接方式：`cardTitle + "\n" + (card.subtitle ?? "") + "\n" + (card.description ?? "") + (tags 行可选)`，或按「标题 + 副标题 + 描述」顺序拼成一段多行字符串，与当前卡片「已有文字」完全一致。
- **显示方式**：对该段文字调用 `getScrambledText(cardExistingText, 'scramble', 0, options)` 得到全段乱码，在卡片内容区按**多行**绘制（与 idle 时行数/换行一致），保证一开始用户看到的是「这张卡上本来那几行字，但变成了乱码」。
- **可选增强**：本阶段内可做「乱码从少到多扩散」——例如用 `elapsed` 在本阶段内的比例控制「参与乱码的字符范围」：先只对前 N% 字符做 scramble（后面保持原文），再逐渐扩大 N%，直到整段都乱码。实现上可对「前 spreadProgress * length」个字符做 scramble，其余保持原样，或复用 flicker 的「从多到少」思路反用为「从少到多」的扩散。

---

#### 8.9.3 阶段二：乱码逐渐扩散到后面的文字（约 0.35s ~ 0.65s）

- **扩散含义**：若阶段一未做「从少到多」，则本阶段实现「乱码范围扩散」；若阶段一已做，则本阶段可视为扩散完成后的持续乱码或过渡。
- **实现思路（任选或组合）**：
  - **字符维度**：用 `spreadProgress = (elapsed - T1) / (T2 - T1)` 控制「参与乱码的字符数」从 0 到 100%（例如从左到右或按行从前到后），未参与部分显示为卡片原文或上一帧乱码。可通过对「前 spreadProgress * len」个字符做 scramble、后段保持原文或上一帧，实现「乱码逐渐扩散到后面的文字」。
  - **行维度**：先对第一行做乱码，再第二行，再第三行… 用 `spreadProgress` 决定「已扩散到的行数」，行内可整行 scramble 或同样用字符比例。
- **内容仍为「卡片已有文字」**：本阶段显示的内容源仍是同一段卡片已有文字，只是乱码从局部扩散到整段，为下一阶段「切换到 details 并解码」做铺垫。

---

#### 8.9.4 阶段三：乱码逐渐显露出详细信息（约 0.65s ~ 1.0s）

- **目标**：从「卡片已有文字的乱码」或「details 的乱码」过渡到 **details 的明文**，形成「解码显露」的效果。
- **实现思路**：
  - **方案 A（推荐）**：本阶段「目标文本」切换为 `details`（或 fallback：`description` / `title + subtitle`）。对 details 使用 **decode** 模式：`getScrambledText(detailsText, 'decode', revealProgress, options)`，其中 `revealProgress = (elapsed - T2) / (1.0 - T2)` 从 0 到 1。这样 details 从全乱码逐渐解码为明文，直到 1s 时完全显示 details。
  - **方案 B**：先在一小段时间内把「显示内容」从卡片原文乱码切换为 details 的乱码（同一帧内用 details 做 scramble），再用 decode 把 details 从乱码解成明文。
- **绘制**：本阶段内卡片内容区按**多行**绘制 decode 结果（与 8.5 detail 阶段一致），行数、换行与 details 一致，最多 `detailMaxLines` 行；到 1s 时与当前 detail 阶段完全一致，显示完整 details 明文。

---

#### 8.9.5 时间线小结（建议比例）

| 时间段 | 内容源 | 效果 |
|--------|--------|------|
| 0 ~ 0.35s | 卡片已有文字（title + subtitle + description） | 对该段做 scramble 显示；可选：乱码从前面字符/行逐渐扩散到整段。 |
| 0.35 ~ 0.65s | 同上 | 乱码扩散到整段（或持续乱码），视觉上「整卡都在乱码」。 |
| 0.65 ~ 1.0s | details | 对 details 做 decode（progress 0→1），从乱码逐渐显露为 details 明文。 |
| ≥ 1.0s | details | 进入现有 detail 阶段，直接显示 details 明文。 |

时间边界（0.35、0.65）可为常量或可配置，保证三阶段在 1s 内平滑衔接。

---

#### 8.9.6 数据与接口（计划层面）

- **卡片已有文字**：在 GlitchGL 或 `lib/cardData.ts` 中提供工具函数，例如 `getCardIdleText(card: CardData): string`，返回与 idle 绘制顺序一致的拼接字符串（title + "\n" + subtitle + "\n" + description，tags 可选），供乱码阶段作为「阶段一、二」的目标文本。
- **子阶段进度**：在 GlitchGL 的 animate 内，由 `elapsed = now - cardHoverStartedAtRef` 计算 `elapsedMs`，再得到：
  - `stage1Progress`、`stage2Progress`、`stage3Progress`（或统一的 `scramblePhase: 'based' | 'spread' | 'reveal'` + 0~1 的 progress）。
- **传给绘制**：当前仅传 `hoveredCardScrambledText` 可能不足；若按多行绘制，可传「多行字符串」或「多行乱码数组」；若仍为单段字符串（含 `\n`），则 `drawCardsOnCanvas` 内按 `\n` 分行绘制，与现有 detail 多行一致。无需改 `CardData` 结构，仅扩展 GlitchGL 侧传给 `drawCardsOnCanvas` 的乱码内容形态（多行字符串即可）。

---

#### 8.9.7 文件职责（仅计划）

| 位置 | 变更要点 |
|------|----------|
| `lib/cardData.ts` | 可选：新增 `getCardIdleText(card)`，返回卡片 idle 时的拼接文案；`drawCardsOnCanvas` 在 scramble 阶段支持接收「多行乱码字符串」并按行绘制，与 idle 行数/布局一致。 |
| `components/GlitchGL/index.tsx` | 根据 `elapsed` 划分三阶段；阶段一/二用卡片已有文字做 scramble（可选+扩散）；阶段三用 details 做 decode；每帧或定时刷新时计算对应目标文本与 progress，调用 `getScrambledText`，将结果（多行字符串）传入 `drawCardsOnCanvas`。 |
| `components/ScrambleText/utils.ts` | 不修改；复用 `getScrambledText` 的 `scramble`、`decode` 模式；若需「扩散」可传不同 progress 或对子串分别调用。 |

---

#### 8.9.8 小结

- **一开始**：乱码基于**卡片上已有的文字**（title + subtitle + description）做 scramble，并可选择从前面字符/行扩散。
- **然后**：乱码逐渐**扩散**到后面的文字，直至整段卡片原文都在乱码。
- **最后**：以 **details** 为目标做 **decode**，乱码逐渐显露出详细信息的明文，到 1s 进入现有 detail 阶段。
- 高聚合、低耦合、高复用不变：时间与阶段在 GlitchGL 内计算，文案来源与拼接可在 cardData 或 GlitchGL，绘制仍由 `drawCardsOnCanvas` 统一按多行输出。
- 仅列计划，不修改代码，确认后再实现。

---

## 8.10 企业级方案：鼠标快速移出时消除生硬切回（仅计划，不写代码）

### 8.10.1 问题描述

- **现象**：鼠标移入卡片后，在过渡过程（如 progress 0→1 的 1200ms 内）中**快速移开**，卡片内容会**生硬地**从「过渡中的中间态」直接切回 **idle** 的完整展示。
- **原因**：当前状态机在「鼠标离开」的下一帧即将该卡片的 phase 置为 idle（因为 `hoveredIndex === -1`），并直接用 idle 内容重绘，没有对「离开时的 progress」做任何平滑处理，导致视觉上从「半过渡态」瞬间跳到「完全 idle」。

---

### 8.10.2 根因归纳

- **状态切换过于即时**：`hoveredIndex` 从「某卡索引」变为 -1 时，该卡立即被视为非悬停，phase 被算成 idle，绘制立刻使用 idle 分支。
- **缺少「离开中」的中间状态**：没有「正在回滚到 idle」的状态，因此无法在鼠标离开后继续用**同一套过渡算法**、仅把 progress **从当前值反向插值回 0**，从而平滑回到 idle。

---

### 8.10.3 企业级方案：回滚态 + 反向 progress 驱动

#### 核心思路

- 引入显式的 **「回滚」状态（rollback / exiting）**：当鼠标在过渡过程中移出卡片时，**不立刻切到 idle**，而是进入「回滚」态，用**当前 progress 作为起点**，在固定时长内将 progress **从当前值线性或缓动回 0**，继续用现有的 `getTransitionText(sourceText, targetText, progress)`（或等价过渡算法）驱动绘制；当 progress 回 0 后，再切到 idle。
- 这样：**离开瞬间**不跳变，**回滚过程**与进入过渡使用同一套过渡逻辑，仅 progress 方向相反，视觉连续、逻辑统一，且易于配置时长与缓动。

#### 状态机扩展

- **原状态**：idle（未悬停）、hovering（悬停且 progress 0→1）、detail（悬停且 progress≥1，展示详情）。
- **新增状态**：**rollback**（鼠标已离开该卡片，但该卡正在从「离开时的 progress」回滚到 0）。
- **状态归属**：rollback 需**按卡片维度**记录（哪张卡在回滚），因为同一时刻只有一张卡可能处于「刚被移出」的过渡中；若有多卡，仅「最后离开的那张」进入 rollback，其余按现有逻辑（未悬停即 idle）。

#### 状态迁移规则

| 当前状态 | 事件 | 下一状态 | 说明 |
|----------|------|----------|------|
| idle | 鼠标进入卡片 i | hovering（卡片 i） | 记录 hoverStartAt，progress 从 0 开始。 |
| hovering（卡片 i） | 鼠标离开卡片 i（progress < 1） | rollback（卡片 i） | 记录 rollbackStartProgress、rollbackStartAt、rollbackDurationMs；该卡后续用 progress 回退。 |
| hovering（卡片 i） | progress ≥ 1 | detail（卡片 i） | 进入详情态。 |
| detail（卡片 i） | 鼠标离开卡片 i | idle（卡片 i） | 可直接切 idle（或也可做短时回滚，见 8.10.6）。 |
| rollback（卡片 i） | progress 回退到 0 | idle（卡片 i） | 清除该卡的 rollback 状态，重绘为 idle。 |
| rollback（卡片 i） | 鼠标再次进入卡片 i | hovering（卡片 i） | 取消回滚，从当前 progress 继续正向过渡（或从 0 重启，见 8.10.5）。 |

---

### 8.10.4 数据与接口（计划层面）

- **GlitchGL 侧需新增/维护**（建议 ref，避免触发 React 重渲染）：
  - **rollbackCardIndex**：当前处于回滚的卡片索引（-1 表示无）。
  - **rollbackStartProgress**：进入回滚时的 progress 值（0～1）。
  - **rollbackStartAt**：进入回滚时的时间戳（ms）。
  - **rollbackDurationMs**：回滚总时长（如 300～400ms），可配置常量。
- **每帧逻辑**：
  - 若 `hoveredIndex >= 0`：当前悬停在某卡；若该卡正在 rollback，则**取消 rollback**（清除 rollbackCardIndex 等），按 hovering 继续（见 8.10.5）；否则按现有逻辑计算该卡的 progress 与 phase。
  - 若 `hoveredIndex === -1` 且存在某卡在 rollback（rollbackCardIndex >= 0）：
    - 该卡本帧的 **progress = rollbackStartProgress × (1 - easeOut(min(1, (now - rollbackStartAt) / rollbackDurationMs)))**，使 progress 从 rollbackStartProgress 平滑降为 0。
    - 仍用 **getTransitionText(sourceText, targetText, progress)** 得到该卡本帧的过渡文案，并传给 `drawCardsOnCanvas`（该卡在 rollback 期间仍走「过渡态」绘制分支，只是 progress 递减）。
    - 当 progress ≤ 0（或经过 rollbackDurationMs）：将 rollbackCardIndex 置为 -1，该卡 phase 置为 idle，触发一次最终重绘。
  - 若 `hoveredIndex === -1` 且**无** rollback，但**上一帧**该卡是 hovering（progress > 0）：则**进入 rollback**，设置 rollbackCardIndex = 上一帧悬停的卡片索引，rollbackStartProgress = 上一帧的 progress，rollbackStartAt = now。
- **绘制层**：`drawCardsOnCanvas` 需能识别「该卡处于 rollback」：可通过传入该卡的 **phase 为 'scramble'（或新增 'rollback'）且传入该卡的过渡文案** 实现；即 rollback 期间复用与「过渡中」相同的绘制分支，仅数据源为「回退的 progress」产生的文案。

---

### 8.10.5 边界与策略

- **回滚期间再次悬停同一张卡**：建议**取消回滚、从当前 progress 继续正向过渡**，这样用户「误触移出又马上回来」时不会从头开始，体验更连贯。实现：若 hoveredIndex === rollbackCardIndex，清除 rollback 状态，该卡 progress 沿用当前回退到的值（或当前帧的 progress），继续 0→1 的计时（需保留或重算 hoverStartAt，使 elapsed 与当前 progress 对应，或直接用「当前 progress × 总时长」反推 hoverStartAt）。
- **回滚期间悬停另一张卡**：当前悬停卡按正常 hovering 处理；原 rollback 卡继续独立回滚直至 progress 0，再置 idle。多卡时 rollback 仅保留一张（最后离开的那张）。
- **detail 态下鼠标离开**：可选（A）直接切 idle，或（B）也做短时回滚（从 progress=1 回退到 0，展示从详情回到 idle 的过渡）。企业级建议：**detail 离开可直接 idle**，避免过长动画；若需一致体验，可采用（B）且 rollbackDurationMs 较短（如 200ms）。

---

### 8.10.6 缓动与可配置

- **easeOut**：回滚时建议使用 easeOut（如 `t => 1 - (1 - t)^2`），使 progress 在接近 0 时变化变慢，结束更自然。
- **rollbackDurationMs**：建议 300～400ms，可与「进入过渡总时长」解耦，便于产品调参；过短仍显生硬，过长会显得拖沓。
- **常量集中**：与 1200ms 总过渡时长一样，rollbackDurationMs、easeOut 曲线可放在 GlitchGL 内常量或配置对象中，便于后续扩展（如按卡片 variant 使用不同回滚时长）。

---

### 8.10.7 实现要点汇总（仅计划）

1. **状态**：在 GlitchGL 的 animate 中，根据 hoveredIndex 与「上一帧是否在过渡」判断何时**进入 rollback**（鼠标离开且当前 progress ∈ (0, 1)），何时**退出 rollback**（progress 回 0 或用户再次悬停该卡）。
2. **progress 回退**：rollback 期间每帧用 `rollbackStartProgress * (1 - easeOut(...))` 得到当前 progress，调用 getTransitionText(source, target, progress) 得到该卡文案，并标记该卡需要「过渡态」绘制。
3. **绘制**：该卡在 rollback 期间仍使用「过渡态」的绘制路径（与 hovering 时一致），传入由回退 progress 生成的过渡文案；无需在 drawCardsOnCanvas 新增分支，仅 phase/数据来源由 GlitchGL 根据 rollback 状态传入。
4. **getCardRects / hit-test**：rollback 期间该卡仍按「过渡态」或 idle 的高度计算矩形即可（不影响其他卡悬停检测）；若过渡态与 idle 高度一致，无需改动 getCardRects。
5. **清理**：rollback 结束时将 rollbackCardIndex 等置空，并触发一次纹理重绘，确保该卡显示为 idle。

---

### 8.10.8 小结

- **问题**：鼠标在过渡过程中移出导致内容从中间态瞬间切回 idle，生硬。
- **方案**：引入 **rollback 态**，鼠标离开时用**当前 progress 作为起点**，在固定时长内**反向插值 progress 回 0**，继续用同一套 getTransitionText 驱动绘制，progress 归零后再切 idle。
- **效果**：离开后内容平滑回到 idle，无跳变；再次悬停可取消回滚并继续正向过渡，体验一致。
- **企业级要点**：显式状态机、单一 progress 驱动、可配置时长与缓动、边界情况（重入、多卡、detail 离开）均有定义。
- 仅列计划，不修改代码，确认后再实现。

---

以上为「在留给后面处理的部分添加可复用、多用途卡片，且使用最能够保留复古电视效果的方法」的完善计划；**第七章** 补充「鼠标放置于卡片位置时的电子辉光增强」及**辉光须在复古电视效果内部**的根因与方案；**第八章** 为「卡片悬停 1 秒乱码后显示详细信息」的实施方案；**8.9** 为乱码三阶段表现（基于已有文字 → 扩散 → 显露详情）的修订计划；**8.10** 为鼠标快速移出时消除生硬切回的企业级方案（回滚态 + 反向 progress），不写代码，确认后再实现。
