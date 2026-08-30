---
title: "发布你的博客文章"
nav_title: "文章发布指南"
nav_order: 6
tags:
    - 使用指南
    - 写作格式
date: "2024-02-04"
thumbnail: "/assets/img/thumbnail/sample.png"
bookmark: true
---

下面介绍如何在站点中编写、组织和发布文章。

# 创建 `_pages` 目录

如果项目根目录中还没有 `_pages`，请先创建它：

```bash
mkdir _pages
cd _pages
```

# 组织目录结构

本主题支持多级分类。你可以在 `_pages` 下创建分类目录，放入其中的文章会自动归入相应分类。

```text
_pages
├── 技术备忘
├── 踩坑记录
└── 个人随笔
```

## 每个目录都要包含 `index.md`

请在 `_pages` 及其各级子目录中放置 `index.md`。最简单的内容如下：

```yaml
---
---
```

如需自定义导航标题与顺序，可以加入：

```yaml
---
nav_title: "技术备忘"
nav_order: 1
---
```

# 编写博客文章

创建扩展名为 `.md` 的文件。每篇文章都必须以 Front Matter 开头，其中 `title` 和 `date` 不能为空。

```markdown
---
title: "示例文章"
date: "2026-07-31"
---

# 欢迎

这是我的第一篇 Jekyll 博客文章。
```

## 设置缩略图

加入 `thumbnail` 属性，即可为文章设置列表缩略图和头部封面：

```yaml
---
title: "带缩略图的示例文章"
date: "2026-07-31"
thumbnail: "/assets/img/thumbnail/bricks.webp"
---
```

## 添加标签

通过 `tags` 对文章主题进行分组，便于搜索和生成相关推荐。标签不会改变侧栏导航结构。

```yaml
tags:
    - 读书
    - 经典小说
    - 爱情
```

## 固定到导航

设置 `bookmark: true` 后，对应文章会直接显示在侧栏导航中：

```yaml
---
title: "Markdown 完整指南"
date: "2026-07-31"
bookmark: true
nav_title: "Markdown 指南"
nav_order: 5
---
```

# 目录示例

```text
_pages
├── index.md
├── markdown-guide.md
├── 技术备忘
│   ├── index.md
│   └── 示例文章.md
├── 踩坑记录
│   ├── index.md
│   └── 问题记录.md
└── 个人随笔
    ├── index.md
    └── 随笔.md
```
