# 写作与图片管理

仍然使用 Typora 写 Markdown，Git push 后由现有 GitHub Actions 构建发布。不需要本地 Ruby、Docker，也不需要 npm install。

## 1. 新建文章

在仓库根目录的终端运行（Node 18 或以上）：

```sh
node scripts/new-post.mjs --title "关于 Agent 的一点观察" --id agent-notes --category 技术 --tags "AI,Agent"
```

会生成 `_drafts/agent-notes.md` 和 `assets/images/agent-notes/`，然后用 Typora 打开草稿写作。默认日期按北京时间当天生成，可以用 `--date 2026-05-01` 指定。**不会提交、push 或直接发布。**

`--id` 是固定英文标识，只使用小写字母、数字和连接符；不能重复使用。图片目录和文章 slug 跟它走，修改显示标题不会修改它。目录中 `.gitkeep` 只是为了让 Git 跟踪空目录，加入图片后可保留。

常用分类先用「技术、生活、随想」，每篇选一个主分类。标签建议 1–3 个，可跨分类使用，注意统一大小写与名称；例如 `AI`、`Agent`、`微服务`、`职业成长`。不填 `--category` 默认「随想」，不填 `--tags` 则无标签。

文章顶部信息示例：

```yaml
---
layout: post
title: "关于 Agent 的一点观察"
date: 2026-05-01
categories: ["技术"]
tags: ["AI", "Agent"]
description: "" # 可选；填写后作为首页摘要与文章导语
slug: agent-notes
image_id: agent-notes
typora-root-url: ../..
typora-copy-images-to: ../assets/images/agent-notes
---
```

只需编辑标题、正文和想用的分类标签。摘要留空时，首页从首段自动截取，不会改动原文。正文通常从段落或 `## 二级标题` 开始，网站已经显示文章标题。旧文章也有标题，无需在正文重复添加。

不想使用命令也可以手工复制已有草稿的头部信息，但要更换 `slug/image_id` 和图片目录，不要把 `templates/post.md` 中未替换的占位符直接发布。

## 2. 图片路径约定

每篇新文章使用不随标题变化的标识，例如 `agent-notes`。图片放在 `assets/images/agent-notes/`，正文使用：

```markdown
![调度流程](/mylovelyblog/assets/images/agent-notes/scheduling.png)
```

文章位于 `_posts/` 或 `_drafts/` 的第一层，元数据配置：

```yaml
typora-root-url: ../..
typora-copy-images-to: ../assets/images/agent-notes
```

Typora 将 `/mylovelyblog/...` 映射到仓库父目录下的 `mylovelyblog/...`。因此本地仓库文件夹必须叫 `mylovelyblog`，与 `_config.yml` 的 `baseurl` 一致。不要嵌套存放文章；草稿转正式文章时保持在目录第一层。换电脑不必保持同一个盘符，但需保持仓库文件夹名。若更换站点子路径，应同时重新核对图片路径和 Typora 配置。

在 Typora 偏好设置的「图像」中允许复制本地／剪贴板图片到指定目录，并启用路径转义。确保文档的图片根路径与复制目录生效。不同 Typora 版本选项名称可能不同。

**第一次必须实际试一次**：粘贴一张截图，检查文件进入指定目录、正文路径为 `/mylovelyblog/assets/images/...`、Typora 能显示。如果生成 `C:\...`、`file://...` 或 `../assets/...`，不要直接发布；检查「图像根路径」和路径偏好，再重新插图。必要时通过图像菜单重新选择根目录（仓库的父目录）。本项目已验证文件路径映射，未代替你操作 Typora GUI。

图片不按文章标题改目录。优先使用有意义的英文文件名；旧有中文和空格文件名不必改。为图片填写简短说明（alt 文本），网站会把独立图片的说明显示为图注。Obsidian 绘图先导出 PNG 再插入；白底图在深色模式不反色。可信的自制 SVG 也可以使用，不要放入不明来源的 SVG。

> `_drafts` 仅代表网站不展示，不代表保密。公开仓库里的草稿和图片仍然公开；未发布图片也可能作为静态资源被部署。私密内容请留在仓库外。

## 3. 从草稿到发布

1. 在 Typora 完成文章。不要通过标签或分类文件夹管理 `_posts`，统一使用顶部元数据。
2. 核对 `date`，把草稿移到 `_posts/`，文件名改为 `日期-固定标识.md`。例如 `_posts/2026-05-01-agent-notes.md`。不要只改扩展名或只复制一份后忘记草稿。
3. 草稿与正式文章位于相同目录深度，不移动图片、不改变 `slug/image_id` 和图片配置。
4. 检查 Git diff；提交文章和关联图片，按平常的方式 push。**不要把无关或私密草稿一起提交。**
5. 等现有 Actions 成功，打开网站确认。分类、标签、归档自动更新，不需要改首页 HTML。

文章发布日期在未来时，Jekyll 通常不会立即展示；这不一定是部署失败。若想立即发布，请改为当天或过去的日期，并让文件名日期保持一致。不通过 `future: true` 或 `show_drafts: true` 在生产环境显示草稿。

修改标题或分类不影响新文章的 URL；修改 `date` 或 `slug` 会改变 URL。旧文章 URL 的标题段来自原文件名，不是显示标题。不要随意重命名旧文章文件。

## 4. 首次上线验收

请参考 [验收清单](acceptance.md)，包含模式切换、手机排版、旧文章／图片、分类导航与 Typora 图片粘贴闭环。

## 当前验证边界

本地路径检查不等于 Typora GUI 操作或 Jekyll 构建。实际粘贴行为、工作流结果及线上效果由用户验收；不自动 push。
