# 代码维护说明

这是个人 Jekyll 博客，不需要前端框架、打包器或通用工具层。以小范围、可回退、行为不变的修改为主；不要把历史设计记录当作当前规范。

## 目录与职责

| 路径 | 职责 |
| --- | --- |
| `_config.yml` | 站点地址、文章 URL、Markdown／高亮／Sass 与构建排除项 |
| `pages/` | 首页、归档、分类、标签入口；Front Matter 的 `permalink` 固定公开路径 |
| `_layouts/default.html` | 全站外壳、元信息、导航、资源加载与首屏主题初始化 |
| `_layouts/post.html` | 正文容器、元数据、目录占位与相邻文章 |
| `_includes/` | 共享文章列表、分类趋势数据、保留的 head 扩展入口 |
| `_posts/`、`_drafts/` | 正式文章与写作工具生成的草稿；不嵌套分类目录 |
| `assets/css/style.scss` | 色板、基础规则、各页面组件、响应式、动画、打印；保留级联顺序 |
| `assets/js/` | `theme.js` 全站主题；`archive.js` 检索；`collection.js` 分类／标签面板；`category-trends.js` 趋势；`post.js` 正文增强 |
| `assets/images/` | 文章配图；已发布路径视为稳定公开接口 |
| `scripts/` | 本地新建草稿和显式发布工具，只有 Node 内置模块依赖 |
| `docs/` | 当前写作、验收、维护说明；`frontend-redesign/` 仅为历史档案 |
| `.agents/skills/` | 按用户请求使用的文章导入指导，不是站点运行代码 |

`docs/`、`scripts/`、README 已被 Jekyll 配置排除。没有 `_drafts/` 不代表缺文件，新建工具会按需创建它。

## 必须保留的约定

- 不随意修改 `baseurl`、`url`、文章 `permalink`、旧文件名、日期或 `slug`。不要为清理改文章正文、分类或标签名称。
- 四个页面的 `nav` 同时控制导航选中与脚本加载。修改页面元数据时，必须检查 `_layouts/default.html` 中的对应条件。
- 分类／标签分组 ID 使用一次 `cgi_escape`，链接片段使用两次；`aria-controls` 指向原 ID，`collection.js` 兼容解码。不要单独简化任何一处。
- 保留 `post-list.html` 的 `data-search`、正文与目录 ID、`data-category-trend` 数据，以及 JS 动态生成的 class。Markdown／Rouge 生成的样式不能仅凭源码 class 搜索结果删除。
- 主题的内联初始化与 `theme.js` 分别负责首屏和交互；保持存储键 `lovely-blog-theme`。正文目录的 `1000px` 断点需与样式一致。
- 新文章按 [写作指南](writing.md) 使用稳定标识及专用图片目录。旧中文／空格文件名、图片 URL 和 Typora 路径保持不变。
- 草稿和未引用图片并不保密；公开仓库及静态资源可能暴露它们。保密资料放在仓库外。

## 每次修改的最小检查

1. 先运行 `git status --short --branch`、`git rev-parse HEAD`，检查已有未提交修改；有需要时在独立分支操作，不覆盖用户工作。
2. 修改前后均检查 `git diff --check`、`git diff --stat`、`git diff` 和新增文件。涉及文章／图片之外的清理时，核对这些内容没有变化。
3. 在 Git Bash 等支持 shell 循环的终端运行以下只读语法检查，不需要 `npm install`：

   ```sh
   for file in assets/js/*.js scripts/*.mjs; do
     node --check "$file" || exit 1
   done
   ```

4. 需要真实本地构建时，先确认 `ruby --version`、`jekyll --version` 和发布环境版本，再在仓库根目录运行 `jekyll build`；可用 `jekyll serve` 本地预览。它们是 Jekyll 常规本地命令，**不是对线上实际命令的声明**。本地构建会生成 `_site/` 等忽略文件，不加 `--future`／`--drafts` 改变生产语义。
5. 仓库没有 Gemfile、锁文件或 `.github/workflows/` 定义。具体 GitHub Pages 发布入口、Jekyll 版本及实际命令须从现有 Pages 设置和构建记录人工确认；不要因此新建／替换工作流或随意添加依赖。环境缺失时明确记录“真实构建未验证”，不得用 Sass 或替代渲染器的成功冒充 Jekyll 成功。
6. 按 [验收清单](acceptance.md) 检查首页、归档、分类、标签、长文与短文，以及中文／含空格锚点、前进后退、深浅色、窄屏、无脚本与打印。视觉整理须对同一构建日期下的前后产物比较。

`new-post.mjs` 会创建文件，`publish-articles.mjs` 会执行 Git 暂存、提交和推送，均不是只读检查命令。只在明确要求写作／发布时使用；维护验收不要运行发布工具。清理不自动提交或推送。

## 疑似无用资源的处理

1. 查 Markdown（含引用式图片）、HTML、Liquid、Front Matter、配置、CSS `url()`、JS 及生成路径；同时考虑 URL 编码、空格和 `baseurl`，不能只搜文件名。
2. 用哈希识别字节重复，再逐项核对各路径的实际使用者。相同字节但有两个公开 URL，不代表可删除其中一个。
3. “仓库内未发现引用”只进入候选清单。先确认历史用途、外部直链和兼容要求；无法证明可删就保留。当前候选见 [清理记录](maintenance-report.md)。
4. 只删除逐项确认的内部临时文件；删除前后检查引用和构建。禁止批量删除疑似未用图片，不因分类调整移动旧图片。

## 定期维护

- **每月**：检查最近发布结果与图片、分类／标签锚点；复查文档中的路径和工具命令；记录新增候选资源，不自动删除。
- **每季度**：复查脚本加载与 DOM 契约、CSS 动态状态和断点、配置排除项及真实构建环境；复核历史档案标识和保留问题。没有维护收益就不拆文件、不建抽象、不升级依赖。
- 一次只做一种整理，记录依据、验证与未验证项。发现既有功能缺陷时单独列项，不混入“行为不变”的清理。
