---
layout: default
title: 我的博客
---

# 欢迎

这是我的技术博客，主要分享编程和开发经验。

## 最新文章

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%Y-%m-%d" }}</span>
    </li>
  {% endfor %}
</ul>