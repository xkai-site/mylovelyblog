# My Lovely Blog

小 xu 的成长日志。Jekyll 静态博客，沿用现有 GitHub Pages 构建与发布流程。仓库未包含工作流定义，具体部署入口以仓库的 Pages 设置和实际构建记录为准。

- 瑞士风格排版：无衬线标题、非对称网格、纸白与信号红；支持深色模式，按系统外观进入，一个按钮切换并记住手动选择。
- 首页、年份归档、分类、标签、长文目录和图片说明。
- Markdown 内容与图片随 Git 管理，不需要管理后台。
- 首页与分类页按真实发布日期显示最近 12 个月分类趋势，支持悬停、触屏和键盘查看；随文章重新构建自动更新，无新增依赖。见 [分类趋势说明](docs/category-trends.md)。

## 写一篇文章

在仓库根目录运行（本机已具备 Node，无第三方依赖）：

```sh
node scripts/new-post.mjs --title "新的一篇笔记" --id new-note --category 随想 --tags "生活记录"
```

用 Typora 打开生成的 `_drafts/new-note.md`。写完后核对日期，移到 `_posts/日期-new-note.md`，按原来的方式提交和 push。

**完整说明：[写作与图片管理](docs/writing.md)**

公开仓库中的草稿不保密。图片目录不随文章标题重命名；首次使用 Typora 请验证粘贴图片的路径。

## 发布与维护

按照 [验收清单](docs/acceptance.md) 检查构建、网页与图片。日常写作不要求本地安装 Ruby；真实本地构建仍需要与发布环境兼容的 Ruby／Jekyll。

- [代码维护说明](docs/maintenance.md)：目录职责、稳定约定、检查命令和定期维护。
- [本轮清理记录](docs/maintenance-report.md)：修改依据、验证边界和保留问题。
- `docs/frontend-redesign/` 是历史前端改造档案，不是当前设计或验收规范。

## 主要目录

| 路径 | 内容 |
| --- | --- |
| `_posts/` | 已发布文章 |
| `_drafts/` | 新建工具生成的草稿，默认不进入网站 |
| `assets/images/<文章标识>/` | 文章配图 |
| `_layouts/`、`_includes/` | Jekyll 页面模板 |
| `assets/css/style.scss` | 两套色板与统一排版 |
| `assets/js/` | 主题、归档检索、分类／标签切换、趋势图与正文增强 |
| `pages/` | 首页、归档、分类、标签的 Jekyll 页面源文件；通过 permalink 保持公开路径 |
| `scripts/` | 本地写作工具；`scripts/templates/` 存放新文章模板 |

写作脚本及其模板和说明文件已在 `_config.yml` 中排除，不作为网站资源发布。Jekyll 页面源文件集中在 `pages/`；固定 permalink 保持首页、归档、分类和标签的公开路径不变。维护说明不改变现有远程构建与发布流程。
