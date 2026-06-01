# 顾老师六月快乐

一个零成本、纯静态、可公开访问的薰衣草紫文字粒子祝福网站。

## 已实现

- 薰衣草紫高级配色
- 更小的顶部玻璃质感提示框
- 主体文字由 Canvas 粒子组成
- 纯粒子描边版：小粒子勾勒汉字笔画，大粒子填充字心
- 周围加入半透明大光斑/氛围粒子，减少留白
- 点击文字/页面：粒子散开，然后重组成下一句祝福
- 鼠标滑动/手机触摸：分层粒子被推开，松手后以不同速度回弹
- 移动端已禁止页面跟随滑动，交互时只影响粒子
- 加入 25 条祝福语/语录，加开场共 26 句循环
- 复制祝福链接按钮
- 不依赖后端、数据库、付费服务、外部 CDN

## 线上地址

```text
https://c1ar0.github.io/june-blessing/
```

推荐测试新版：

```text
https://c1ar0.github.io/june-blessing/?v=particle-outline
```

## 本地预览

```bash
cd /home/chennuo/blessing
python3 -m http.server 8087
```

浏览器打开：

```text
http://localhost:8087/
```
