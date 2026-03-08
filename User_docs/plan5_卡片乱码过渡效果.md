# Plan 5: 卡片乱码悬停过渡效果设计

## 1. 目标分析 (Goal Analysis)
目前卡片悬停时的乱码动画略显生硬，分为 `idle` -> `scramble` (0~1s，仅由于 title 乱码) -> `detail` (突变)。
根据您的需求：“乱码显示一开始要根据已卡片上已有的文字...然后逐渐扩散...最后逐渐显露详细信息”，我们将重新设计悬停状态机的动画生命周期。

我们需要实现三个阶段平滑过渡：
1. **起点（基于已有文字）**：鼠标刚放上去时，卡片原来的文字内容（title, description 等）开始原地位乱码（保留原有的排版，但部分字符开始突变）。
2. **扩散（蔓延与混沌）**：随着时间推进，乱码的程度加深，字符开始频繁跳动，长度和结构在原文字和详情文字之间模糊交替或完全成为代码块。
3. **揭示（渐显详细信息）**：临近动画结尾时，乱码逐渐“锁定”并解析为最终的 `details` 文本内容（即类似打字机/解密的效果展现最终详细信息）。

## 2. 核心技术实现路径 (Implementation Plan)

### 2.1 引入带有进度的动画模型 (Progress-based Animation)
在 `components/GlitchGL/index.tsx` 中，不再仅使用 `scramble` / `detail` 的 boolean 或字面量状态，而是将悬停时间映射为一个 `0.0` 到 `1.0` 的**进度值 (progress)**。
- 假设总动画时长为 `1200ms`。
- 当 `now - hoverStartTime < 1200ms` 时，卡片处于**过渡期 (Transition)**。
- 计算 `progress = (now - hoverStartTime) / 1200`。

### 2.2 编写字符串变形算法 (Transition Text Generator)
在 `components/ScrambleText/utils.ts` 中新增一个核心函数，用于计算过渡过程中的文本：
```typescript
function getTransitionText(sourceText: string, targetText: string, progress: number, options: ...): string
```
此方法的设计思路（依据 progress）：
- **`0.0 ~ 0.3`阶段 (蔓延)**：返回 `sourceText`，但随机选取 `(progress / 0.3) * 100%` 的字符替换为乱码。字符仍然维持原架构。
- **`0.3 ~ 0.6`阶段 (混沌)**：这是一个黑盒混沌阶段。乱码剧烈闪烁，可以是一整块难以分辨的随机字符，长度介于 `sourceText` 和 `targetText` 之间。
- **`0.6 ~ 1.0`阶段 (显露)**：基底切换为 `targetText`。这相当于一个典型的“decode 模式”。初始全是乱码字符，随着进度达到 `1.0`，从左到右或随机顺序逐步**锁定**到确切的 `targetText` 字符。

### 2.3 扩充卡片绘制逻辑 (Canvas Rendering)
在 `lib/cardData.ts` 中的 `drawCardsOnCanvas` 函数：
目前的实现中，在 `phase === 'scramble'` 时只简陋地调用 `ctx.fillText` 绘制了一行 `hoveredCardScrambledText`。
**计划修改为**：
- 在过渡期内，我们将完整的、包含换行的 `transitionText` 传入。
- 由于 `transitionText` 可能很长且有多行，我们需要使用与最终 detail 相同的字体规则 (`cardFontSize * 0.75`，带有合适行高)，逐行渲染出正在闪烁的乱码文字阵列。
- 原本分隔好的 title/subtitle/desc/tags 此时都统一看成一个多行大字符串供变形算法处理。

### 2.4 GL 驱动层的逐帧更新 (Frame Update Mechanism)
在 `GlitchGL/index.tsx` 的 WebGL `animate` 循环中：
- 监测每张卡片是否处于 `progress < 1.0` 的悬停过渡期。
- 只要有卡片处于此阶段，就以一定的间隔（例如每 `50ms`，即 `refreshInterval`）调用 `getTransitionText`。
- 将生成的带有换行的过渡乱码文本传递给 `drawCardsOnCanvas`。
- 随即触发 `createTextTexture` 以将携带最新乱码帧的 Canvas 上传至 GPU 纹理。
- 过渡结束后，稳定渲染最终形态，避免不必要的纹理重建开销。

## 3. 具体修改步骤清单 (TODOs)
不需要在这步修改代码，仅列出后续执行的清单：

- [ ] **Step 1**: 在 `ScrambleText/utils.ts` 中实现 `getCardTransitionText` 专有函数，处理从 Source 到 Target 的平滑乱码过渡。
- [ ] **Step 2**: 在 `GlitchGL/index.tsx` 调整状态管理，从简单的 `idle/scramble/detail` 转换为带有 `progress` 的过渡计算流。
- [ ] **Step 3**: 在 `GlitchGL/index.tsx` 创建源文本 (title+subtitle+desc+tags) 和目标文本 (details) 的拼合字符串，用于传入过渡函数。
- [ ] **Step 4**: 在 `lib/cardData.ts` 改进 `drawCardsOnCanvas`，确保悬停状态下的长篇乱码字符能利用整个卡片内部的高度进行多行折叠渲染，而不是单行溢出。
- [ ] **Step 5**: （可选微调）调节发光效果 Bloom 以及 CRT Shader，确保长篇文字乱码时的扫线和闪烁视觉表现不刺眼。
