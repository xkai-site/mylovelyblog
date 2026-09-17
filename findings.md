# 实施发现与基线

## 内容整理

全文阅读 10 篇文章后，首版采用 3 个互斥大类，标签允许跨类。正文、原有标题和日期保持不变。

| 文件（省略 .md） | 分类 | 标签 |
| --- | --- | --- |
| 2026-03-29-当AI回归软件工程 | 技术 | AI, Agent, 操作系统 |
| 2026-03-30-ByemylovelyALI | 生活 | 职业成长, 求职 |
| 2026-04-06-TradeOff | 随想 | 自我管理, 职业成长 |
| 2026-04-07-第一性原理推导微服务组件 | 技术 | 微服务, 系统设计 |
| 2026-04-08-微服务项目快速入门 | 技术 | 微服务, Spring Cloud |
| 2026-04-09-Agent调度策略选型 | 技术 | Agent, 操作系统, 系统设计 |
| 2026-04-11-AI Native初体验 | 技术 | AI, Agent, Git |
| 2026-04-12-IDE to CLI | 技术 | AI, 开发工具 |
| 2026-04-21-寻找 | 随想 | AI, 职业成长 |
| 2026-04-24-Deepseek来了 | 生活 | AI, 生活记录 |

## 链接与图片基线

- 原配置未指定 permalink，文章也未指定分类／permalink。采用 Jekyll 默认日期形式的显式规则 `/:year/:month/:day/:title:output_ext`，去掉分类段；不为旧 Minimal 布局做兼容。
- 预计旧链接为 `/mylovelyblog/2026/03/29/当AI回归软件工程.html` 等日期 URL。文件名中的空格由 Jekyll slug 处理，不能用显示标题生成 URL（Agent 文章标题与文件名不同）。未运行旧版 Jekyll，旧链接最终以线上核对为准。
- 现有图片引用集中于 3 篇技术文，目录保留：`第一性原理推导微服务组件`、`微服务项目快速入门`、`Agent调度策略选型`。不得删除目录内暂未引用的图片。
- 正文 SHA-256（包含原行尾，用于元数据变更后比对）：

```text
2026-03-29-当AI回归软件工程.md fbe8f6243dafc2a12b28be51f1cbf160a2fccdc1b94a1890eeed1fe55f348cf1
2026-03-30-ByemylovelyALI.md 28a791f5b2be75a9cf605c712bd905eba75699c373d1d731e1ab795211f7537d
2026-04-06-TradeOff.md 4c5951639b9fa318e363fedafb148c5eff4a450f4d21a20d647fbaabc335c46f
2026-04-07-第一性原理推导微服务组件.md b0d6546092789c82c1d91369289cbd03b02082bb082d34fba04029770992f04b
2026-04-08-微服务项目快速入门.md c82049cb1f2760050a223816462ecddb45d09119eff135db5ce8697ff6cf4182
2026-04-09-Agent调度策略选型.md 9fc7c19519825fdd13f7e3f04d1fc35e7619e0c6a3f186b459e6ad7f1b3b9b92
2026-04-11-AI Native初体验.md 20562ca9ecd60cf9a2dd3e6548ae907a2b73ae4d767686535b27237e1d318472
2026-04-12-IDE to CLI.md 3fa0a2eacf4dbe5a0438dec44df7393fe7833ca0800269941c0a9134d137c67f
2026-04-21-寻找.md 10f90a2b535c869acd280b5de59cb809607057a5a1bfefb4a66431e64f002721
2026-04-24-Deepseek来了.md e261199816b0efb800d54cb8db439cfc728f06aa7729ff1ec19861e86334231b
```

## 验证边界

用户已确认使用现有 Actions 构建并亲自线上验收。不安装 Ruby、不启动 Docker，不修改远端设置，不 commit/push。静态检查与 Node 测试不能替代 Jekyll 构建、Typora GUI 或浏览器视觉验收。
