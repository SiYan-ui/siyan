---
title: "使用 GoatCounter 统计博客访问量"
nav_title: "访客统计"
nav_order: 7
tags:
    - 使用指南
    - 实用工具
    - goatcounter
date: "2024-02-02"
thumbnail: "https://i.ibb.co/xj20N3N/card.webp"
bookmark: true
---

[![GoatCounter](https://cdn.icon-icons.com/icons2/2699/PNG/512/goatcounter_logo_icon_170078.png){:class="img-md"}](https://www.goatcounter.com/)

GoatCounter 是一款开源的**网站统计工具**，既提供由捐赠支持的免费托管服务，也支持自行部署。它强调简单、实用和隐私友好，可作为 Google Analytics 或 Matomo 的轻量替代方案。

# 开始使用

## 注册并获取访问代码

前往 [GoatCounter 注册页面](https://www.goatcounter.com/signup) 创建账户。注册后，可通过 `https://[你的代码].goatcounter.com` 查看博客统计信息。

## 更新 `_config.yml`

```yaml
goatcounter_code: [你的代码]
```

如果没有看到浏览量，请检查浏览器的广告拦截扩展是否阻止了 GoatCounter。

## 允许在站点显示访问量

登录 GoatCounter，进入 [设置页面](https://[你的代码].goatcounter.com/settings/main)，确认已勾选 `Allow adding visitor counts on your website`（允许在网站上显示访问次数）。

![](https://i.ibb.co/R7TKCmy/2024-01-13-043651.png){:class="img-md"}
