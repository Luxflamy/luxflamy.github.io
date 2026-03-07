# 鼠标滚轮驱动「电视内部版面」上下滚动 — 实现计划

## 一、目标

- 用户**鼠标滚轮上下滚动**时，**电视内部整个版面**（CRT 画面 + 内容）随之上下移动，模拟复古电视的垂直滚动/垂直 hold 漂移感。
- 不改变现有 CRT、乱码、Bloom、扫描线等效果逻辑；仅增加「滚轮 → 版面位移」这一层。
- 设计原则：**高内聚、低耦合、高复用**，用「数据驱动 + 单一职责」的聪明方式实现。

---

## 二、聪明做法概览

| 做法 | 说明 |
|------|------|
| **滚轮与「偏移量」解耦** | 滚轮只负责产生一个**垂直偏移量**（数字），不关心谁在用。消费方（页面布局）用这个数字做 `translateY`，不关心数据从哪来。 |
| **复用** | 「滚轮 → 垂直偏移」做成**通用 hook**（如 `useWheelScrollOffset`），任何页面/组件都可复用，不绑定 TV 或 GlitchGL。 |
| **不碰 WebGL/CRT** | 偏移通过 **CSS transform** 作用在「包裹层」上，GlitchGL、Shader、CRT 完全不动；只在外层多一层可移动的容器。 |
| **单一数据源** | 偏移量由 hook 唯一维护；页面只负责把「视口」和「可移动内容」的结构搭好，并传入/使用该偏移。 |

---

## 三、架构分层

```
[ 视口层 ]  overflow: hidden，捕获 wheel，固定尺寸（全屏或 TV 内框）
     ↓
[ 内容层 ]  transform: translateY(offsetPx)，内部是「整块电视画面」
     ↓
[ 现有树 ]  BloomProvider → GlitchRandomizer → GlitchGL（+ 可选扫描线叠在内容层内）
```

- **视口层**：相当于「电视玻璃框」，不随滚轮动；负责挂载 wheel 监听（或把 ref 交给 hook）。
- **内容层**：整块电视内部版面（含 CRT、文字、扫描线），随 `offsetPx` 上下平移；超出视口部分被裁掉，形成「画面在框内滚动」的观感。
- **现有树**：零改动，仅作为内容层的子节点。

---

## 四、性能与流畅度优化（防卡顿）

- **核心原则**：滚轮滚动过程中**不触发 React 重渲染**。若用 `useState(offsetPx)` 并在每次 wheel 时 setState，会带动整棵子树（BloomProvider → GlitchRandomizer → GlitchGL）每帧重绘，容易卡顿。
- **做法**：
  - 偏移量**只存在 ref 中**，wheel 回调里只做：`offsetRef.current += delta`、clamp，然后**至多调度一次** `requestAnimationFrame`。
  - 在 **rAF 回调**里：直接改**内容层 DOM** 的 `style.transform = translateY(offsetRef.current)px`（通过 hook 返回的 `contentRef`），不调用 setState。惯性衰减也在该 rAF 里更新 ref 并写 DOM，若未衰减到接近 0 再 schedule 下一帧 rAF。
  - 这样整个滚动与惯性过程**零次** React 更新，仅合成层位移，流畅度高。
- **其他**：
  - 每帧只执行一次「应用位移 + 惯性」：用 `rafScheduled` 标志位，wheel 时若已 schedule 则不再 schedule，避免一帧内多次 rAF。
  - 内容层使用 **`transform`**（已是方案），可加 **`will-change: transform`**（或仅在滚动时临时添加）促进独立合成层，减少重绘。
  - 卸载时移除 wheel 监听并 **cancelAnimationFrame**，避免内存泄漏与后台继续跑。
- **不采用**：不在 wheel 上使用 `passive: true`（需要 `preventDefault()` 阻止页面滚动）；wheel 内不做重逻辑，只写 ref + 可能的一次 rAF 调度即可。

---

## 五、实现步骤（仅计划）

### 1. 通用 Hook：`useWheelScrollOffset`（高复用、低耦合、防卡顿）

- **位置**：`hooks/useWheelScrollOffset.ts`（或 `lib/useWheelScrollOffset.ts`）。
- **职责**：根据鼠标滚轮更新垂直偏移（仅 ref），在 rAF 中**直接写内容层 DOM 的 transform**，不通过 React state，避免滚动时重渲染。
- **接口（建议）**：
  - 输入：`options?: { sensitivity?: number; clampPx?: number; inertia?: boolean; decayFactor?: number }`。
  - 返回：`{ containerRef, contentRef }`（均为 `RefObject<HTMLElement | null>`）。`containerRef` 挂到视口（接收 wheel），`contentRef` 挂到内容层（hook 在 rAF 内写 `contentRef.current.style.transform`）。
- **内部逻辑（概要）**：
  - `offsetRef` 存当前偏移（数字），**不用 state**。
  - 在 `containerRef.current` 上监听 `wheel`，`preventDefault()`；`offsetRef.current += deltaY * sensitivity`，clamp；若未 schedule 则 `requestAnimationFrame(apply)`，设 `rafScheduled = true`。
  - `apply()`：`contentRef.current && (contentRef.current.style.transform = \`translateY(${offsetRef.current}px)\`)`；若 inertia 则 `offsetRef.current *= decayFactor`，若未接近 0 则再 `requestAnimationFrame(apply)`，否则 `rafScheduled = false`。每帧只跑一次 apply，避免重复。
  - 卸载时 removeEventListener 且 cancelAnimationFrame。
- **不依赖**：不依赖 TV、GlitchGL；可在任意页面复用。

### 2. 首页布局：视口 + 内容层（高内聚）

- **位置**：`app/page.tsx`。
- **结构调整**：
  - **视口容器**：`absolute inset-0 overflow-hidden`，ref 用 hook 的 `containerRef`，用于接收 wheel。
  - **内容容器**：`absolute inset-0`，ref 用 hook 的 `contentRef`（**不**用 `style={{ transform }}`，由 hook 在 rAF 里直接写 DOM），子节点为 BloomProvider 树 + 扫描线（若随画面动则放内容层内）。
  - 内容层可加 `will-change: transform`（或按需在滚动开始/结束切换）以利于合成。
- **数据流**：`const { containerRef, contentRef } = useWheelScrollOffset({ clampPx: 80, sensitivity: 0.5, inertia: true })`；视口绑 containerRef，内容层绑 contentRef；不向子组件传任何滚动相关 props。

### 3. 可选：TV 外壳组件（进一步高内聚/复用）

- 若希望「视口 + 内容层 + 滚轮逻辑」在多个页面复用，可封装为 **`TVViewport`** 或 **`ScrollableTVFrame`** 组件：
  - Props：`children`（即 BloomProvider 树）、可选 `scrollOptions`（透传给 `useWheelScrollOffset`）。
  - 内部：使用 `useWheelScrollOffset`，渲染视口 + 内容层，`children` 放在内容层内；**内容层只挂 contentRef，不通过 state 传 transform**，保持无重渲染。
  - 首页则变为 `<TVViewport scrollOptions={{ clampPx: 80, inertia: true }}><BloomProvider>...</BloomProvider></TVViewport>`。

### 4. 不修改的部分

- **GlitchGL**：不新增 props，不读滚动状态；不改 WebGL、shader、CRT、纹理。
- **GlitchRandomizer、BloomProvider、ScrambleText**：均不修改。
- **扫描线**：仅通过「放在视口内或内容层内」决定是否随版面滚动，不新增组件逻辑。

---

## 六、行为小结

- 用户在「电视」区域上下滚轮 → hook 只更新 ref 并调度 rAF → 在 rAF 中直接写内容层 `style.transform` → 整块电视画面在框内上下移动，带 clamp；可选惯性在 rAF 中衰减，松手后缓慢回正。**全程无 setState，无多余重渲染，使用过程不卡顿。**
- 实现集中在：一个通用 hook（ref + 直接 DOM 写） + 视口/内容层结构；与现有 CRT/乱码/Bloom 完全解耦。

---

## 七、文件/目录建议

- 新增：`hooks/useWheelScrollOffset.ts`（或 `lib/useWheelScrollOffset.ts`）。
- 可选新增：`components/TVViewport/index.tsx`（视口 + 内容层 + hook 的封装）。
- 修改：`app/page.tsx`（引入 hook 或 TVViewport，增加视口/内容层结构；若用 TVViewport 则仅替换一层包装）。

---

## 八、详细实现计划（逐步可落地的规格）

### 8.1 Hook 类型与默认参数

- **Options 类型**（建议在 hook 文件内定义或抽到 `types.ts`）：
  ```ts
  interface UseWheelScrollOffsetOptions {
    sensitivity?: number;   // 滚轮 deltaY 的缩放，默认 0.4
    clampPx?: number;      // 偏移量绝对值上限（px），默认 80
    inertia?: boolean;     // 是否启用惯性衰减，默认 true
    decayFactor?: number;  // 每帧衰减系数 (0,1)，如 0.92，默认 0.92
    decayThreshold?: number; // 绝对值低于此值视为归零并停止 rAF，默认 0.5
  }
  ```
- **默认值**：`sensitivity = 0.4`，`clampPx = 80`，`inertia = true`，`decayFactor = 0.92`，`decayThreshold = 0.5`。
- **返回值类型**：`{ containerRef: RefObject<HTMLDivElement | null>; contentRef: RefObject<HTMLDivElement | null> }`。若希望更通用，可用 `HTMLElement`。

### 8.2 Hook 内部逻辑（按执行顺序）

1. **Ref 与标志位**
   - `offsetRef = useRef(0)`：当前偏移（像素），可正可负。
   - `rafIdRef = useRef<number | null>(null)`：当前已 schedule 的 rAF id，用于 cancel。
   - `rafScheduledRef = useRef(false)`：本帧是否已 schedule 过 apply，避免重复。

2. **创建 containerRef 与 contentRef**
   - `containerRef = useRef<HTMLDivElement | null>(null)`。
   - `contentRef = useRef<HTMLDivElement | null>(null)`。
   - 两者由 hook 创建并返回，调用方挂到对应 DOM 上。

3. **apply 函数（闭包，在 effect 内定义）**
   - 读取 `contentRef.current`，若为 null 则本帧不写 DOM，直接进入惯性逻辑（避免未挂载时报错）。
   - 若有 contentRef.current：`contentRef.current.style.transform = \`translateY(${offsetRef.current}px)\``（仅改 transform，不覆盖其他 style）。
   - 若 `options.inertia === true`：
     - `offsetRef.current *= options.decayFactor`（如 0.92）。
     - 若 `Math.abs(offsetRef.current) >= options.decayThreshold`：再次 `rafIdRef.current = requestAnimationFrame(apply)`，保持 `rafScheduledRef.current = true`。
     - 否则：视为归零，`offsetRef.current = 0`，若有 contentRef.current 再写一次 `translateY(0)`，然后 `rafScheduledRef.current = false`，`rafIdRef.current = null`。
   - 若 `options.inertia !== true`：本帧只应用一次，不继续 schedule；`rafScheduledRef.current = false`，`rafIdRef.current = null`。

4. **wheel 回调（在 effect 内定义）**
   - `e.preventDefault()`，阻止页面滚动。
   - `delta = e.deltaY * (options.sensitivity ?? 0.4)`，累加：`offsetRef.current += delta`。
   - Clamp：`offsetRef.current = Math.max(-options.clampPx, Math.min(options.clampPx, offsetRef.current))`。
   - 若 `!rafScheduledRef.current`：`rafIdRef.current = requestAnimationFrame(apply)`，`rafScheduledRef.current = true`。
   - 不在 wheel 内直接写 DOM，只更新 ref 并至多 schedule 一次 rAF。

5. **Effect：挂载监听与清理**
   - 使用 **useLayoutEffect** 挂载 wheel 监听，确保在 DOM 提交后、浏览器绘制前执行，此时调用方已把 `containerRef` 挂到视口 div 上，`containerRef.current` 通常已非 null（与调用方同一棵树的 ref 在 commit 阶段会被设置）。
   - 依赖：`[options.sensitivity, options.clampPx, options.inertia, options.decayFactor, options.decayThreshold]`；若 options 为对象引用，建议调用方用 **useMemo** 或稳定引用，避免 effect 频繁重跑。
   - 在 effect 内：若 `!containerRef.current` 则 return（不挂监听）；否则 `containerRef.current.addEventListener('wheel', wheel, { passive: false })`（必须 passive: false 才能 preventDefault）。
   - 清理函数：`containerRef.current?.removeEventListener('wheel', wheel)`；若 `rafIdRef.current != null` 则 `cancelAnimationFrame(rafIdRef.current)`，并设 `rafIdRef.current = null`、`rafScheduledRef.current = false`。
   - 若首页存在「先 mounted 再渲染视口」的逻辑，视口与 hook 同属同一父组件且视口无条件渲染，则首次 useLayoutEffect 执行时 ref 已挂好；若视口被条件渲染且首次为 false，则 effect 跑时 current 可能为 null，此时不挂监听，待依赖变化或父组件再次渲染且视口出现后，需保证 effect 会再次执行（例如 scrollOptions 用 useMemo 稳定引用，仅首次为 false 时无监听，用户刷新或视口出现后由父组件 state 触发的重渲染会重新执行 effect，此时 ref 已存在）。

6. **边界情况**
   - **contentRef 尚未挂载**：apply 内已判断 `contentRef.current`，为 null 时只做惯性计算与可能的下一次 schedule，不写 DOM。
   - **卸载时惯性仍在跑**：清理中 cancelAnimationFrame，避免卸载后仍写已卸载的 DOM。
   - **options 为 undefined**：所有读取用 `options?.xxx ?? default`，保证无报错。

### 8.3 首页布局详细结构（app/page.tsx）

- **在现有 `<main>` 内、全屏 filter 区域外**，增加一层「视口」与一层「内容」；**扫描线**若随画面动则移入内容层内，若固定则保留在视口外（与当前一致则保留在更外层）。
- **推荐 DOM 结构**（仅示意，不写具体代码）：
  ```
  <main className="fixed inset-0 bg-black overflow-hidden ...">
    <div ref={containerRef} className="absolute inset-0 overflow-hidden z-0" style={{ touchAction: 'none' }}>
      <div ref={contentRef} className="absolute inset-0 w-full h-full" style={{ willChange: 'transform' }}>
        <BloomProvider ...>
          <GlitchRandomizer ...>
            <GlitchGL ... />
          </GlitchRandomizer>
        </BloomProvider>
      </div>
    </div>
    <div className="absolute inset-0 pointer-events-none z-50 ..." />  // 扫描线（随内容动则挪到 contentRef 内）
  </main>
  ```
- **调用**：`const { containerRef, contentRef } = useWheelScrollOffset({ clampPx: 80, sensitivity: 0.4, inertia: true, decayFactor: 0.92 })`；视口 div 用 `ref={containerRef}`，内容 div 用 `ref={contentRef}`。不向 BloomProvider / GlitchRandomizer / GlitchGL 传任何与滚动相关的 props。
- **will-change**：内容层可始终加 `willChange: 'transform'`，或仅在首次 wheel 时设为 `transform`、惯性归零后移除以节省显存（实现略复杂，可选）。

### 8.4 可选 TVViewport 组件规格

- **Props**：`children: ReactNode`；`scrollOptions?: UseWheelScrollOffsetOptions`（透传）。
- **内部**：调用 `useWheelScrollOffset(scrollOptions ?? {})`，渲染一层视口 div（containerRef）+ 一层内容 div（contentRef），`children` 作为内容 div 的子节点。
- **样式**：视口 `absolute inset-0 overflow-hidden`，内容 `absolute inset-0 w-full h-full`，内容层 `will-change: transform`。不传任何滚动相关 props 给 children。
- **首页使用**：用 `<TVViewport scrollOptions={{ clampPx: 80, sensitivity: 0.4, inertia: true }}>` 包裹当前 BloomProvider 树，扫描线仍由首页决定放在 TVViewport 内或外。

### 8.5 验收与自测要点

- 在视口内滚轮上下，画面随之上下移动，且不超过 ±clampPx。
- 松手后若 inertia 为 true，画面缓慢回正至居中（offset 趋于 0）。
- 打开 React DevTools，滚动与惯性过程中不应出现整棵子树频繁重渲染（无 setState 触发）。
- 卸载页面或组件时，控制台无报错，且不再有 rAF 或 wheel 回调执行（清理生效）。
- 若 contentRef 尚未挂载时触发了 apply（例如先 schedule 再挂载），不报错，且挂载后下一帧或下一次 wheel 会正确应用 transform。
