# 部署到 https://luxflamy.github.io/

项目已配置为静态导出（`output: 'export'`）并带有 GitHub Actions 工作流，按下面步骤即可在 GitHub Pages 上发布。

## 一、前置条件

1. **仓库名**：若希望站点根地址为 `https://luxflamy.github.io/`，仓库需命名为 **`luxflamy.github.io`**（用户名.github.io）。
2. **本地已安装 Git**，并已登录 GitHub（SSH 或 HTTPS）。

## 二、在 GitHub 上启用 Pages（仅第一次需要）

1. 打开仓库：`https://github.com/luxflamy/luxflamy.github.io`
2. 进入 **Settings** → **Pages**
3. 在 **Build and deployment** 中：
   - **Source** 选择 **GitHub Actions**（不要选 “Deploy from a branch”）
4. 保存后无需再改，之后每次推送到 `main` 都会由 Actions 自动构建并部署。

## 三、推送代码触发部署

在项目根目录（含 `package.json` 的目录）执行：

```bash
git add .
git commit -m "feat: add GitHub Pages deployment"
git push origin main
```

推送后：

1. 打开仓库 **Actions** 页：`https://github.com/luxflamy/luxflamy.github.io/actions`
2. 会看到 **Deploy to GitHub Pages** 工作流在跑
3. 约 1–2 分钟后变为绿色即部署完成
4. 访问 **https://luxflamy.github.io/** 查看站点

## 四、若仓库名不是 `luxflamy.github.io`

若仓库名是别的（例如 `rbi`），站点地址会是：

`https://luxflamy.github.io/rbi/`

此时需要在 `next.config.mjs` 中增加 `basePath`：

```js
const nextConfig = {
  output: 'export',
  basePath: '/rbi',  // 改成你的仓库名
};
```

然后重新推送，Actions 会按新配置构建并部署。

## 五、本地先验证构建（可选）

部署前可在本地确认静态导出是否正常：

```bash
npm run build
```

构建完成后会生成 `out/` 目录，用任意静态服务器打开 `out` 目录即可预览（例如 `npx serve out`）。

## 六、故障排查

- **404 或空白页**：确认 Settings → Pages 里 Source 为 **GitHub Actions**，且最近一次 workflow 已成功（绿色）。
- **样式/资源错位**：若用了子路径，务必在 `next.config.mjs` 里设置正确的 `basePath` 并重新构建、推送。
- **Actions 失败**：在 Actions 里点进失败的那次运行，查看具体报错（常见为依赖安装或构建错误，可在本地用 `npm ci && npm run build` 复现）。

---

参考：[GitHub Pages 文档](https://docs.github.com/en/pages)、[Next.js 静态导出](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)。
