全局闪烁

纵向扫描亮度带以及显示偏移带

轻微电子故障（频率极低 1min~3min一次）

桶状畸变与物理蒙版

圆角蒙版 & 暗角

细节质感增强 (Quality of Life)RGB 荧光粉掩模：添加了 3px 宽的三色条纹，模拟真实的 CRT 像素结构。动态扫描线：将扫描线改为缓慢垂直滚动，增加动态真实感。全局辉光 (Bloom)：通过 CSS drop-shadow 为内容添加了淡淡的散发出的荧光感。

色偏脉冲：随机随缓慢且明显的色差（Chromatic Aberration）扩大并且缩小回原来的样子。

---

## 架构升级计划：CRT Glass Overlay（夹心层架构）

**目标**：在不破坏现有超高质感 CRT 滤镜的前提下，允许网页内容（如简历信息、多媒体展示等）在底层进行普通的纵向/横向滚动，并且内容能够动态展示，交互完全不受影响。

### 1. 核心设计理念 (The Sandwich Model)
将页面拆分为三层（通过 `z-index` 和 `pointer-events` 控制）：
- **底层 (DOM Layer)**：普通的 React + Tailwind 组件，支持原生滚动（`overflow-y-auto`）、选中文本、点击按钮以及复杂的排版（Grid/Flex）。
- **特效层 (Effect Layer / BloomProvider)**：位于 DOM 层之上的辉光收集层。负责处理 DOM 层的亮点并产生外发光。
- **顶层 (CRT Glass Layer / GlitchGL)**：铺满全屏、绝对定位（`absolute inset-0`）且**鼠标事件穿透**（`pointer-events-none`）的 WebGL 画布。它作为一块“虚拟玻璃”，为其下方的所有画面施加屏幕弯曲、扫描线、RGB 色散和随机故障效果。

### 2. 详细执行步骤 (Execution Steps)

#### Phase 1: 改造 WebGL Shader (`glitch-shaders.ts`) 材质
**目的**：让原本不透明或带有固有底色的 Shader 变成“带有半透明暗角与扭曲噪点的玻璃”。
- **修改片段着色器 (Fragment Shader)**：
  - 取消强制的 `u_bgColor` （纯色背景）完全不透明填充。
  - 将边缘因为“桶状畸变 (Barrel Distortion)”产生的黑色区域变为带有柔和渐变的 Alpha 透明区域，或者直接保留中心区域透明以透出下方的 HTML 内容。
  - 调整混合模式，使得 RGB 荧光粉点阵、扫描线等仅作为“覆盖层（Overlay）”或“乘法（Multiply）”叠加在屏幕上。

#### Phase 2: 重构 `GlitchGL` 组件逻辑 (`components/GlitchGL/index.tsx`)
**目的**：不再仅仅处理文字（`props.text`），而是将当前屏幕的 DOM 内容（或透明底色）作为基础纹理，或者仅仅作为上层透明滤镜层。
- **取消文字独占模式**：目前的 `GlitchGL` 是把传入的 `text` 画到离屏 Canvas 再交给 WebGL。我们将改成“屏幕特效蒙版”模式，使得 WebGL 画布本身是透明背景的特效贴图。
  - *注：如果要让底层 DOM 发生物理弯曲，需要用到 `html2canvas` 或类似技术截屏传给 WebGL，但由于要求底层动态交互，我们会采用纯 Overlay（特效层在顶部）的方式，让 WebGL 制造扭曲的扫描线和噪点，底部 DOM 维持正常布局，通过视差和边缘暗角“欺骗”视觉。*

#### Phase 3: 构建高聚合容器组件 `<CRTScreen>`
**目的**：封装凌乱的特效代码，打造开箱即用的高复用组件。
- 创建新组件封装 `BloomProvider`、`GlitchRandomizer` 和 `GlitchGL`。
- API 设计示例：
  ```tsx
  <CRTScreen intensity={0.5} glow={4.0}>
    {/* 任何普通的业务页面组件 */}
    <ResumeContent />
  </CRTScreen>
  ```

#### Phase 4: 页面级组装与滚动测试 (`app/page.tsx`)
**目的**：替换现有实现，验证滚动与交互体验。
- 重构页面布局，使得内部容器（比如简历内容区）获得固定的高宽和滚动条（`h-screen overflow-y-scroll`），外部容器固定。
- 确保鼠标的滚轮事件、Hover 效果以及点击事件能穿过前方的 `GlitchGL` 滤镜，完美作用于底下的实际内容。

### 3. 注意事项与难点
- **性能开销**：全屏 WebGL 滤镜加上底部的复杂层可能加重 GPU 负担，需要注意 `requestAnimationFrame` 的资源调度。
- **视觉错觉欺骗**：因为底层 DOM 实际上未受 WebGL 的几何变换（如桶形畸变），为了让人以为 DOM 也在显示器“里面”，需要配合内部容器的 Padding 留白，并在 WebGL 边缘加深黑色晕影（Vignette）掩盖边缘的生硬笔直感。
