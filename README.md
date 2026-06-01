# 顾老师六月快乐

一个零成本、纯静态、可公开访问的淡紫色动态粒子祝福网站。

## 已实现

- 默认大标题：`顾老师六月快乐`
- 淡紫色主题背景与玻璃质感卡片
- Canvas 动态粒子背景
- 鼠标移动/手机触摸时粒子会被推开互动
- 点击任意位置会出现粒子绽放效果
- 打字机祝福文字
- 复制祝福链接按钮
- 不依赖后端、数据库、付费服务
- 不依赖外部 CDN，部署后所有人都能直接打开

## 本地预览

```bash
cd /home/chennuo/blessing
python3 -m http.server 8087
```

浏览器打开：

```text
http://localhost:8087/
```

## 免费公开部署：GitHub Pages

1. 新建 GitHub 仓库，比如 `june-blessing`。
2. 上传以下文件到仓库根目录：

```text
index.html
style.css
script.js
README.md
```

3. 进入仓库 `Settings`。
4. 找到 `Pages`。
5. Source 选择 `Deploy from a branch`。
6. Branch 选择 `main`，目录选择 `/root`。
7. 保存后等待 1 分钟左右。
8. 得到公开链接，任何人都能打开，例如：

```text
https://你的用户名.github.io/june-blessing/
```

## 文件说明

```text
index.html  页面结构
style.css   淡紫色视觉样式与移动端适配
script.js   Canvas 粒子动画、点击交互、打字机、复制链接
```
