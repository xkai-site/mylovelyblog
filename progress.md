# 执行记录

## 已完成

1. 已按用户最新指示确定远端验收方式，不再准备本地 Ruby/Docker。
2. 已全文读取 10 篇文章；分类和标签清单、正文散列及 URL 策略记录于 findings.md。
3. 已验证 12 处现有图片的文件系统映射，以及 `_posts/` 与 `_drafts/` 的根路径／复制目录一致性。模板和图片使用规则已建立。Typora 实际粘贴与网站渲染明确交用户验收。
4. 已完成本地布局、双模式样式、响应式排版及主题脚本；移除 Minimal 主题依赖。
5. 已完成首页、文章增强（目录／图注／表格滚动）、分类、标签与年份归档。标签锚点使用编码 ID，避免中文、空格、C++ 等名称碰撞或跳转失败。
6. 已补充旧文元数据，新增无依赖草稿生成工具及构建产物检查工具；15 项 Node 测试全部通过。与 Git HEAD 对比确认 10 篇原文章的正文、标题、日期不变（忽略 CRLF/LF 差异）。指南已说明图片、草稿、隐私、日期和发布规则。

## 最终本地检查

- `node --test scripts/new-post.test.mjs scripts/check-site.test.mjs scripts/theme.test.mjs`：22/22 通过，无跳过。
- `node scripts/check-source.mjs`：10 篇文章、12 处本地 Markdown 图片、8 个 Liquid 模板约定检查通过。
- `node --check assets/js/theme.js` 与 `node --check assets/js/post.js`：通过。
- `git diff --check`：通过；仅提示 Git autocrlf 的正常行尾转换提醒。
- 使用 findings.md 中修改前的 SHA-256 逐字节验证：10 篇正文完全一致。旧图片无 diff；标题和日期的 Git 基线检查通过。
- 主题测试在 Node VM 中使用模拟 DOM／存储验证模式选择、系统跟随、刷新恢复、禁用存储与跨标签页同步；不是浏览器测试。
- 两套色板的正文、次级文字、链接、代码颜色在页面和表面背景上均满足 4.5:1 计算对比度。
- 构建产物检查器用临时 HTML 样例测试，不代表真实 `_site` 已构建或已通过。
- 已核对 Jekyll 3.10 源码中的 `output_ext` URL 占位符、`cgi_escape` 和 `normalize_whitespace` 过滤器存在；这不替代远端版本确认和实际构建。
- 交付入口：README.md、docs/writing.md、docs/acceptance.md。未安装任何依赖、未启动 Docker、未 commit/push、未更改工作流。

## 环境限制

- Node v22.23.1 可用，写作工具将使用内建模块和测试运行器，无需 npm install。
- 未运行 Jekyll；不将静态检查宣称为构建通过。
- Typora 实际粘贴、工作流构建、网页排版与交互待用户验收。
