明白了！您需要的是**文字乱码组件**（随机字符、动态乱码效果），而不是故障视觉效果。让我重新制定计划。

---

## 动态乱码文字组件 — 实现计划

### 一、现状简述

- **HELLO WORLD**：在 `GlitchGL` 中通过 `text` 传入，用 Canvas 2D 画成静态纹理，再被 WebGL 全屏渲染。
- **CRT 效果**：在 fragment shader 里对整幅画面做后处理。计划中**不修改** GlitchGL 的 WebGL/CRT 相关代码。

---

### 二、目标

1. **可复用**：同一套乱码逻辑能用于「转场」「hover」「自动随机」等场景。
2. **三种使用方式**：
   - **转场**：进入/离开时文字从乱码逐渐解码成正确文字（或反向）。
   - **Hover**：鼠标悬停时文字开始乱码闪烁、离开后恢复正常。
   - **自动随机**：无交互时按间隔随机让部分字符乱码，再恢复。
3. **应用到显示屏中的 HELLO WORLD**：让当前文字有「黑客风格」的乱码动态效果，且**不改变现有 CRT 效果**。

---

### 三、核心概念

**乱码效果**：每个字符位置在特定时刻显示的可能是：
- 目标字符（如 `"H"`、`"E"`、`"L"` 等）
- 随机字符（如 `"@"`、`"#"`、`"8"`、`"X"`、`"ф"`、`"█"` 等）
- 空白或特殊符号

**动画流程**（以转场为例）：
1. 初始状态：所有位置都是随机乱码字符，高速刷新。
2. 逐字解码：从左到右（或随机顺序）逐个字符从乱码"锁定"为目标字符。
3. 最终状态：完整显示 `"HELLO WORLD"`，乱码停止。

---

### 四、组件设计

#### 4.1 组件名称与职责

| 项目 | 说明 |
|------|------|
| **组件名** | `ScrambleText` 或 `GlitchScramble`，放在 `components/ScrambleText/`。 |
| **职责** | 根据「目标文本」和「当前解码进度/乱码状态」，输出「当前帧应显示的字符串」。 |
| **输出形式** | **纯字符串**（用于 GlitchGL 的 `createTextTexture`）或 **Canvas**（如需更复杂的逐字符样式）。 |
| **输入** | 目标文本（如 `"HELLO WORLD"`）、乱码模式、解码进度、字符集等。 |

---

#### 4.2 乱码模式（Mode）

| Mode | 说明 | 用途 |
|------|------|------|
| **idle** | 完整显示目标文本，无乱码。 | 正常状态。 |
| **scramble** | 全部或部分字符显示为随机字符，高速刷新。 | 转场开始、hover 触发。 |
| **decode** | 从乱码逐渐解码为目标文本（进度 0→1）。 | 转场进入动画。 |
| **encode** | 从目标文本逐渐编码为乱码（进度 1→0）。 | 转场离开动画。 |
| **flicker** | 随机位置的字符间歇性乱码（部分字符闪烁乱码）。 | 自动随机展示、hover 持续效果。 |

---

#### 4.3 核心参数

```typescript
interface ScrambleTextProps {
  // 目标文本
  targetText: string;
  
  // 乱码模式
  mode: 'idle' | 'scramble' | 'decode' | 'encode' | 'flicker';
  
  // 解码/编码进度（0-1），仅 decode/encode 模式使用
  progress?: number;
  
  // 乱码字符集（默认包含 ASCII 特殊符号、数字、字母、Unicode 符号等）
  scrambleChars?: string;
  
  // 刷新频率（ms），控制乱码字符变化速度
  refreshInterval?: number;
  
  // 闪烁概率（flicker 模式下每个字符每帧乱码的概率）
  flickerProbability?: number;
  
  // 解码顺序（'sequential' 从左到右 | 'random' 随机顺序 | 'center-out' 中心向外）
  decodeOrder?: 'sequential' | 'random' | 'center-out';
  
  // 回调：当前显示的字符串改变时触发
  onTextChange?: (displayText: string) => void;
}
```

---

### 五、实现步骤（分阶段）

#### **Phase 1：核心乱码逻辑组件**

1. **新建** `components/ScrambleText/index.tsx`：
   - 核心函数 `getScrambledText(targetText, mode, progress, options)`：
     - 输入：目标文本、当前模式、进度、配置。
     - 输出：当前帧应显示的字符串（每个位置是目标字符或随机字符）。
   - 内部维护：
     - **乱码字符池**：默认包含 `!@#$%^&*()_+-=[]{}|;:,.<>?/~` + 数字 + 大小写字母 + 部分 Unicode 符号（如 `█▓▒░`、`ф`、`Ж` 等）。
     - **解码顺序数组**（decode 模式）：根据 `decodeOrder` 生成字符解码的顺序索引。
     - **定时器/RAF**：按 `refreshInterval` 定期更新随机字符。

2. **算法细节**：
   - **idle**：直接返回 `targetText`。
   - **scramble**：所有位置都返回随机字符，每帧刷新。
   - **decode**（进度 0→1）：
     - 根据 `progress`，计算已解码字符数 = `Math.floor(progress * targetText.length)`。
     - 按 `decodeOrder` 决定哪些位置已"锁定"为目标字符，其余位置仍显示随机字符。
   - **encode**（进度 1→0）：反向逻辑，已编码字符数 = `Math.floor((1 - progress) * targetText.length)`。
   - **flicker**：每帧对每个字符按 `flickerProbability` 概率决定是否乱码，乱码字符则随机替换。

3. **React 组件封装**：
   - 用 `useState` 维护当前显示文本。
   - 用 `useEffect` + `setInterval` 或 `requestAnimationFrame` 驱动刷新。
   - 当 `mode` / `progress` 改变时，重新计算并调用 `onTextChange`。

---

#### **Phase 2：与 GlitchGL 集成（只动文字来源，不动 CRT）**

4. **修改 `GlitchGL/index.tsx`**：
   - 当 `text` prop 存在时，不再直接用 `text` 画纹理；
   - 改为接收 `displayText`（由 ScrambleText 提供的当前帧字符串），或在内部集成 ScrambleText 的逻辑：
     ```typescript
     // 方案 A：外部传入
     <GlitchGL text="HELLO WORLD" displayText={currentScrambledText} />
     
     // 方案 B：内部集成（推荐）
     <GlitchGL 
       text="HELLO WORLD" 
       scrambleMode="auto" 
       scrambleOptions={{ mode: 'flicker', ... }} 
     />
     ```
   - 在 `createTextTexture` 中，使用 `displayText`（而非原始 `text`）绘制到 canvas。
   - **不修改**：任何 CRT 相关 uniform、shader、GlitchRandomizer 的 `crt.*` 配置。

5. **纹理更新频率**：
   - 由于乱码需要高频刷新（如 30-60 FPS），需确保 `createTextTexture` 在每帧或高频定时器中被调用。
   - 可在 `animate` 循环中每帧检查 `displayText` 是否变化，变化则重新绘制纹理并上传到 WebGL。

---

#### **Phase 3：在首页应用「自动随机乱码」**

6. **修改 `app/page.tsx`**：
   - 保留现有结构（`GlitchRandomizer` + `BloomProvider` + `GlitchGL`）。
   - 为 `GlitchGL` 添加 `scrambleMode="flicker"` 或 `scrambleMode="auto"`：
     ```tsx
     <GlitchGL
       text="HELLO WORLD"
       scrambleMode="auto"  // 启用自动随机乱码
       scrambleOptions={{
         mode: 'flicker',
         flickerProbability: 0.1,  // 每帧每个字符 10% 概率乱码
         refreshInterval: 50,       // 50ms 刷新一次
       }}
       className="w-full h-full opacity-80"
     />
     ```
   - 乱码效果仅作用于文字纹理，CRT 仍对整块画布做后处理，效果不变。

---

#### **Phase 4：复用到转场与 Hover**

7. **转场复用**（用于页面切换、内容进入/离开）：
   - **DOM 文字转场**（如标题、段落）：
     - 封装 `<ScrambleText as="dom">` 组件，渲染为 `<span>` 或 `<div>`，内容为当前乱码文本。
     - 转场开始：`mode: 'decode'`，`progress` 从 0 到 1（配合 Framer Motion / CSS transition）。
     - 转场结束：`mode: 'idle'`。
   - **全屏转场**（如页面切换时整屏文字乱码）：
     - 使用 `GlitchGL` + `ScrambleText`，在路由切换时触发 `mode: 'encode'`（离开）或 `mode: 'decode'`（进入）。

8. **Hover 复用**（用于按钮、链接、卡片等）：
   - 为任意文字元素添加 hover 乱码效果：
     ```tsx
     <ScrambleText 
       targetText="Click Me"
       mode={isHovered ? 'scramble' : 'idle'}
       refreshInterval={30}
     />
     ```
   - `onMouseEnter` → `mode: 'scramble'` 或 `mode: 'flicker'`。
   - `onMouseLeave` → `mode: 'decode'`（从乱码恢复）→ `mode: 'idle'`。

9. **全局风格统一**：
   - 将乱码参数（字符集、刷新频率、概率）提取到 `lib/scramblePresets.ts` 或 Context，确保全站「乱码风格」一致（如都用相同的随机字符集、解码速度等）。

---

#### **Phase 5：可选优化**

10. **性能优化**：
    - 对于长文本，仅在可视区域或关键字符位置做乱码刷新。
    - 使用 `useMemo` 缓存解码顺序数组、字符池等。

11. **多语言支持**：
    - 为中文、日文等提供对应的乱码字符集（如随机汉字、假名）。

12. **音效联动**（可选）：
    - 乱码刷新时播放「打字机」或「数据流」音效，增强沉浸感。

13. **高级解码动画**：
    - 支持「逐字符延迟」（如第一个字符解码完再开始第二个）。
    - 支持「波浪式解码」（从中心或鼠标位置向外扩散）。

---

### 六、约束与注意事项

#### ✅ 可以修改：
- `GlitchGL/index.tsx` 中 `createTextTexture` 使用的文本来源（从 `text` 改为 `displayText`）。
- `app/page.tsx` 中 `GlitchGL` 的 props（添加 `scrambleMode` / `scrambleOptions`）。
- 新增 `ScrambleText` 组件及其类型定义。

#### ❌ 不可修改：
- `lib/glitch-shaders.ts`（vertex / fragment shader）。
- `GlitchGL` 中所有 CRT 相关 uniform（`crtEnabled`、`scanlineIntensity`、`curvature` 等）。
- `GlitchRandomizer` 的 `ranges` / `baseEffects` 里 `crt.*` 配置。
- `BloomProvider`、全屏扫描线 overlay、页面整体布局。

#### 🎯 核心原则：
- 乱码效果发生在**文字生成阶段**（字符串 → canvas 纹理），而非 WebGL shader。
- CRT 效果仍作用在**整块画布**上，对 CRT 来说只是「纹理内容变了」，但 CRT 处理逻辑完全不变。

---

### 七、文件/目录规划

```
components/
├── ScrambleText/
│   ├── index.tsx          # 主组件（React + 乱码逻辑）
│   ├── types.ts           # Mode、Props、Options 类型定义
│   └── utils.ts           # 乱码算法工具函数
├── GlitchGL/
│   ├── index.tsx          # 修改：集成 ScrambleText 或接收 displayText
│   └── types.ts           # 保持不变
lib/
├── scramblePresets.ts     # 乱码字符集、预设配置
app/
└── page.tsx               # 修改：为 GlitchGL 添加 scrambleMode
```

---

### 八、效果预览（文字说明）

- **首页 HELLO WORLD**：
  - 初始加载时：文字从全乱码逐字解码为 `"HELLO WORLD"`（2 秒）。
  - 正常状态：每 3-5 秒随机 1-2 个字符闪烁乱码 0.1 秒。
  - 鼠标悬停在屏幕上时：部分字符持续低频乱码（如 20% 字符每帧 5% 概率乱码）。

- **其他页面按钮**：
  - 默认：静态文字。
  - Hover：文字瞬间变为全乱码，0.3 秒内逐字解码回正确文字。
  - 离开：文字在 0.2 秒内逐字编码为乱码后消失（可选）。

- **页面转场**：
  - 离开当前页：屏幕上所有文字同时开始乱码（0.5 秒）。
  - 进入新页面：新内容从乱码逐渐解码为正确文字（1 秒）。

---

### 九、总结

此计划通过 **ScrambleText** 组件提供「随机字符、动态乱码」的核心逻辑，并以**纯文本字符串**形式输出，使其能够：
1. **被 GlitchGL 复用**：将乱码文本绘制到纹理，经过现有 CRT 管线渲染。
2. **被 DOM 复用**：直接渲染为 HTML 元素，用于转场、hover、按钮等场景。
3. **自动随机展示**：通过 `flicker` 模式在无交互时自动随机乱码部分字符。

全程 **不修改 CRT 效果**，仅改变「文字内容是什么」，确保现有视觉质感不受影响。

需要我进一步细化某个阶段（如 Phase 1 的具体算法实现、或 Phase 2 的集成接口）吗？