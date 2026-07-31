---
title: "Markdown 完整指南"
nav_title: "Markdown 指南"
nav_order: 5
tags:
    - 使用指南
    - markdown
    - 写作格式
date: "2023-09-05"
thumbnail: "/assets/img/thumbnail/sample.png"
bookmark: true
---

# 标题

在文字前添加井号即可创建标题，井号数量对应标题级别：

```markdown
# 一级标题
## 二级标题
### 三级标题
```

# 强调

使用两侧各两个星号表示**粗体**，使用一对星号表示*斜体*，也可以使用下划线。

```markdown
**粗体文字**
*斜体文字*
```

# 引用

在段落前添加 `>` 可以创建引用：

```markdown
> 这是引用内容。
```

> 这是引用内容。

# 列表

有序列表使用数字和句点，无序列表使用短横线、星号或加号：

```markdown
1. 第一项
2. 第二项

- 第一项
- 第二项
```

缩进一层即可创建嵌套列表。

# 代码

用反引号包住行内代码，用三个反引号包住多行代码：

~~~markdown
请运行 `bundle exec jekyll serve`。

```ruby
puts "你好，世界！"
```
~~~

# 分隔线

单独一行写三个或更多星号、短横线或下划线，可以插入分隔线：

```markdown
---
```

# 链接

将链接文字放在方括号中，紧接着在圆括号中填写网址：

```markdown
[思闫的博客](https://example.com)
```

也可以在网址后添加引号包住的提示文字。

# 图片

图片语法是在链接前加感叹号，方括号中填写替代文字：

```markdown
![示例图片](/assets/img/example.jpg "图片说明")
```

# 转义字符

如果需要显示原本具有格式含义的字符，请在前面加反斜杠，例如 `\*`、`\#` 和 `\[`。

# HTML

Markdown 中可以直接使用 HTML 标签。例如，下面的写法会让文字倾斜：

```html
这是一段 <span style="font-style: italic;">倾斜文字</span>。
```
