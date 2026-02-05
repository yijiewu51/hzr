# 我们的重要日子

一个小网站：记录重要日期 + 她来伦敦的倒计时。

## 本地预览

用浏览器直接打开 `index.html`，或用本地服务器：

```bash
# 若已安装 Python 3
python3 -m http.server 8080
# 然后打开 http://localhost:8080
```

## 部署到网上（手机随时打开）

### 方式一：Vercel（推荐，免费）

1. 把本项目推送到 GitHub。
2. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录。
3. 点击 **Add New → Project**，选择这个仓库，直接 **Deploy**。
4. 部署完成后会得到一个网址，例如 `https://xxx.vercel.app`，用手机浏览器打开即可。

### 方式二：Netlify

1. 把项目推到 GitHub。
2. 打开 [netlify.com](https://netlify.com)，**Add new site → Import from Git**，选仓库并部署。
3. 会得到 `https://xxx.netlify.app` 这样的网址。

### 方式三：GitHub Pages

1. 仓库里只保留 `index.html`、`styles.css`、`script.js`。
2. 仓库 **Settings → Pages**，Source 选 **main** 分支、根目录，保存。
3. 几分钟后访问 `https://你的用户名.github.io/仓库名/`。

## 修改日期

在 `script.js` 顶部的 `DATES` 里改即可：

- `london`: 来伦敦的日期
- `together`: 在一起的日期
- `known`: 认识的日期
- `birthdayMonth` / `birthdayDay`: 生日（月、日）

改完保存，重新部署或刷新页面即可。
