---
title: "使用 Giscus 管理博客评论"
nav_title: "评论系统"
nav_order: 4
tags:
    - 使用指南
    - 实用工具
    - giscus
date: "2024-02-03"
thumbnail: "https://i.ibb.co/V9j2Qsg/giscus-Wl0-X3byd-az-U68-1.webp"
bookmark: true
---

[![Giscus](https://opengraph.githubassets.com/4f866d5b634e7cd5422af77f8dbfb6d48dd288b7c5c18326544c1973210320ed/giscus/giscus){:class="img-lg"}](https://giscus.app/zh-CN)

**Giscus** 是一套免费的评论系统，无需自行维护数据库。它使用 GitHub Discussions，根据页面网址、路径或标题等规则存储和加载对应评论。

访客评论时需要通过 GitHub OAuth 授权 Giscus，也可以直接前往对应的 GitHub Discussion 回复。站长可在 GitHub 中统一管理评论。

# 准备工作

## 创建 GitHub 仓库

首先准备一个 GitHub 仓库。如果网站托管在 GitHub Pages，可以直接使用对应的 `[用户名].github.io` 仓库。

仓库必须设为**公开**，否则访客无法查看 Discussions 中的内容。

## 开启 Discussions

进入仓库的 `Settings`，确认 `General` > `Features` > `Discussions` 已启用。

![开启 Discussions](https://i.ibb.co/P1FV02D/giscus-00.png)

# 配置 Giscus

按照 [Giscus 配置页面](https://giscus.app/zh-CN) 的步骤操作，并确认仓库验证成功。

![验证仓库](https://i.ibb.co/y87w8rB/giscus-02.png)

向下找到 `Discussion 分类`，选择用于保存评论的分类，其余选项可按需设置。

![选择 Discussion 分类](https://i.ibb.co/0hqLWX0/giscus-03.png)

## 更新 `_config.yml`

从生成的 Giscus 脚本中找到下图标出的四项配置：

![](https://i.ibb.co/Z154x8P/giscus-04.png)

将它们填入站点根目录的 `_config.yml`：

```yaml
# 外部服务
giscus_repo: "[填写仓库名]"
giscus_repoId: "[填写仓库 ID]"
giscus_category: "[填写分类名]"
giscus_categoryId: "[填写分类 ID]"
```
