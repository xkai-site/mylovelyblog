# My Lovely Blog

小 xu 的成长日志。Jekyll 静态博客，继续通过现有 GitHub Actions 构建发布。

- 白底书刊式阅读／深色模式，支持系统偏好与手动选择。
- 首页、年份归档、分类、标签、长文目录和图片说明。
- Markdown 内容与图片随 Git 管理，不需要管理后台。

## 写一篇文章

在仓库根目录运行（本机已具备 Node，无第三方依赖）：

```sh
node scripts/new-post.mjs --title "新的一篇笔记" --id new-note --category 随想 --tags "生活记录"
```

用 Typora 打开生成的 `_drafts/new-note.md`。写完后核对日期，移到 `_posts/日期-new-note.md`，按原来的方式提交和 push。

**完整说明：[写作与图片管理](docs/writing.md)**

公开仓库中的草稿不保密。图片目录不随文章标题重命名；首次使用 Typora 请验证粘贴图片的路径。

## 改造后首次上线

按照 [验收清单](docs/acceptance.md) 检查 Actions、网页与图片。不需要安装 Ruby 或启动 Docker。

## 本地检查

```sh
node --test scripts/new-post.test.mjs scripts/check-site.test.mjs scripts/theme.test.mjs
node scripts/check-source.mjs
```

静态检查不等于 Jekyll 构建或浏览器测试。如果已有真实构建产物，可以另外运行：

```sh
node scripts/check-site.mjs --site _site
```

## 主要目录

| 路径 | 内容 |
| --- | --- |
| `_posts/` | 已发布文章 |
| `_drafts/` | 新建工具生成的草稿，默认不进入网站 |
| `assets/images/<文章标识>/` | 文章配图 |
| `_layouts/`、`_includes/` | Jekyll 页面模板 |
| `assets/css/style.scss` | 两套色板与统一排版 |
| `assets/js/` | 配色切换、目录、图片与表格增强 |
| `scripts/`、`templates/` | 可选的本地写作辅助工具 |

模板、脚本、说明和计划文件已在 `_config.yml` 中排除，不作为网站资源发布。未改变远程工作流。
