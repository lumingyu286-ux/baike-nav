# 成人百科索引页

一个纯静态的单页索引，所有链接指向 `chengrenbaike.com`。无框架、无构建、无网络字体，整站约 25 KB。

## 文件

| 文件 | 说明 |
|---|---|
| `data.js` | **只需要改这一个文件**：域名、站名、条目、备用入口 |
| `index.html` | 页面骨架 |
| `style.css` | 样式（深色为主，跟随系统自动切浅色） |
| `app.js` | 渲染、连通性探测、年龄确认 |
| `404.html` | 找不到页面时回索引页 |
| `robots.txt` | 收录策略，见下文「主力站还是镜像站」 |
| `.nojekyll` | GitHub Pages 用，跳过 Jekyll 构建 |
| `.gitlab-ci.yml` | GitLab Pages 用 |
| `google-sites.html` | **Google Sites 专用单文件版**，不参与上面几个平台的部署 |

## 先改 data.js

```js
const SITE = {
  base: 'https://chengrenbaike.com',   // 主站域名，不带结尾斜杠
  name: '成人百科',
  subline: '索引页',
  mirrors: [],                          // 备用入口，见下
  deployedOn: '',                       // 每个平台填不一样的，方便自己分辨
};
```

条目格式是 `[名称, 路径, 说明]`：

```js
['两性健康', '/health', '身体变化、日常检查与就医提示'],
```

**中间那一列现在全是空的。** 我这边连不上 `chengrenbaike.com`（你机器上代理的 fake-ip 模式把域名解析成了 `198.18.0.215`，TLS 直接被重置），没法核实主站真实的栏目地址，所以全部留空 —— 留空就落到首页，保证点出去不会 404。等你确认了真实路径，把那一列填上即可。条目名称也是我按「百科」体例拟的，请和主站实际栏目对齐。

## 部署

### Cloudflare Pages

1. 把这个目录推到一个 Git 仓库，Pages 里连接该仓库
2. 构建命令：**留空**　　输出目录：`/`
3. 也可以直接用 `npx wrangler pages deploy . --project-name=<项目名>` 上传，不经过 Git

### GitHub Pages

1. 推到仓库，Settings → Pages → Source 选 `Deploy from a branch`，分支 `main`、目录 `/ (root)`
2. `.nojekyll` 已经放好了，不用额外操作

仓库名不是 `<用户名>.github.io` 时，站点会挂在 `https://<用户名>.github.io/<仓库名>/` 下。`404.html` 里「回索引页」用的是相对路径 `./`，GitHub 项目站和 Cloudflare 根目录两边都对，不用改。404 页上的主按钮用的是绝对网址，不受影响。GitLab Pages 同理。

当前部署：<https://lumingyu286-ux.github.io/baike-nav/> 与 <https://baikenav.pages.dev/>

### GitLab Pages

`.gitlab-ci.yml` 已经写好，推到默认分支就会自动跑。它只做一件事：把静态文件复制进 `public/` 发布。
**新增文件记得同步加到里面的 `cp` 那一行**，否则不会被发布。

### Google Sites

Google Sites 不能上传文件，只能嵌入代码，所以那边用 `google-sites.html`：

1. 编辑页面 → 右侧「插入」→「嵌入」→ 切到「嵌入代码」
2. 把 `google-sites.html` 整份粘进去（约 5900 字符，上限 1 万）
3. 把嵌入块拖到铺满整页宽，高度拉到 1000 px 以上

要改域名，改文件顶部的 `BASE` 一处即可。这一版和主版有三点不同：单文件无外部依赖、**链接一律开新标签页**（iframe 里同标签跳转会把主站塞进那个小框）、去掉了连通性探测。

**预期行为，不是 bug**：Google Sites 把嵌入块放在 `googleusercontent.com` 的跨域沙箱 iframe 里，`localStorage` 经常被存储分区或 Safari ITP 挡掉。挡掉时年龄确认就无法记住，**每次打开都会重新弹一遍**。只有这个平台有这个问题，别为此把门去掉。

## 主力站还是镜像站

这一步决定 `robots.txt` 和 `index.html` 怎么配，**别四个平台都用同一份默认配置**。

把同一个页面原样发到四个平台、全部指向同一个域名，是搜索引擎判定「门页 / 重复内容」最典型的形态。可能的后果是几份拷贝互相稀释，或者整批不被收录。所以要先想清楚这些页面是干什么的：

**当镜像用**（主站被墙、掉线时给访客一条备用路径）——选一个主力（建议 Cloudflare Pages，理由见下），其余三个都按镜像配。**只要改一个地方**：

- 取消 `index.html` 里 `<meta name="robots" content="noindex,follow">` 那一行的注释

这样镜像不进搜索结果，但直接访问照常可用——这正是镜像该有的样子。

两个常见的错误配法，都别用：

- **别再加一行指向主站的 `canonical`。** canonical 会把信号合并到主站，而 `noindex` 可能顺着一起传过去——最坏的结果是把这些镜像本来要引流的主站给打掉了。两者选一个，镜像用 `noindex,follow` 就够。
- **别把 `robots.txt` 改成 `Disallow: /`。** 爬虫被 robots 挡住就根本不会去取 HTML，也就永远看不到那个 `noindex`，而该网址仍可能凭外部链接被只收录网址（标题描述一片空白那种）。要可靠地不被收录，必须是「允许抓取 + 返回 noindex」。所以 `robots.txt` 四个平台都保持原样。

**当引流落地页用**（指望这些页面自己被收录）—— 那就不能是四份一样的拷贝。至少每个平台换一套 `name` / `subline` / 条目说明，让内容真的不同；只改 `deployedOn` 不够。

两种目的用同一批相同的拷贝是达不到的，得挑一个。

## 各平台条款的现实情况

这几家对成人内容的容忍度差别很大，按我的理解（不是法律意见，以各平台当前条款为准）：

| 平台 | 情况 |
|---|---|
| **Cloudflare Pages** | 最宽松。合法且做了年龄提示的成人内容一般可以放。建议作为主力 |
| **GitHub Pages** | 使用条款禁止 sexually obscene content，另外也不允许把 Pages 当商业站的免费主机。成人导向的站属于容易被举报下架的类型 |
| **GitLab Pages** | 同样禁止色情内容 |
| **Google Sites** | 明确禁止色情内容，而且处理起来牵连的是你的整个 Google 账号。风险最高的一个 |

一句实话：后面三家都可能把页面删掉，Google Sites 还可能连账号一起处理。所以别把这四个当成四份等价的保险——真正该留后路的是**域名和主力托管**，也就是 `data.js` 里那个 `mirrors`（填 2 个以上独立域名的备用地址，页面会自动多出一个「备用入口」区块）。

另外，页面里的文案和 meta 我是照实写的（「分类索引页」「各栏目入口」），没有堆砌露骨关键词。这不只是合规考虑——你给我看的那个 `jiaose.pages.dev` 就是反例：标题写「最全成人色情知识库」，正文却是百度、GitHub、淘宝，这种标题与内容不符本身就是搜索引擎的门页信号，反而连正常词都搜不到。往 meta 里塞露骨词，恰恰是让免费平台最快下架你的做法。

## 本地预览

```bash
python -m http.server 8080
```

然后打开 <http://127.0.0.1:8080/>。注意直接双击 `index.html` 用 `file://` 打开时，`localStorage` 可能被浏览器限制，年龄确认会每次都弹。
