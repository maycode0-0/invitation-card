# 小日子 · 男宝百日宴电子请柬

奶油蓝配色、原创小熊插画的响应式电子请柬。当前信息：小橙子宝宝，2026 年 10 月 11 日（星期日）12:00，在水一方，四川省成都市郫都区青石路青杠树村6号点21栋。点击「编辑请柬」修改昵称、邀请人、日期、时间、酒店和地址，也可上传一张成长纪念照片。

## 运行

无需安装依赖，Node.js 18 或以上即可：

```sh
pnpm dev
# 打开 http://localhost:5173
```

也支持 `npm run dev`，或 `node server.mjs --port 3000` 指定端口。

```sh
pnpm build
```

生成的 `dist/` 可部署到任意静态网站托管服务。建议部署到 HTTPS 地址，再在微信中分享。

## Cloudflare 部署

仓库已包含 `wrangler.jsonc`，用于 Cloudflare Workers 的静态网站部署。Wrangler 会先执行 `npm run build`，然后只上传 `dist/` 中的网页、插画和字体。

如果使用 Cloudflare Workers 的 Git 仓库集成，设置如下：

| 设置 | 值 |
| --- | --- |
| 根目录 | 仓库根目录 `/` |
| 构建命令 | `npm run build` |
| 部署命令 | `npx wrangler deploy` |
| 静态资源目录 | 由 `wrangler.jsonc` 指定为 `./dist` |

控制台构建和 Wrangler 自定义构建可能各运行一次，重复构建不会影响结果。项目名称默认为 `invitation-card`，如控制台使用其他名称，请同步修改 `wrangler.jsonc` 中的 `name`。

不要在部署命令中使用 `--assets .` 或 `--assets ./`：命令行参数会覆盖配置文件，导致整个仓库（包括安装产生的 `node_modules`）被作为网站资源上传。若日志出现 `Asset too large`，并指向 `node_modules/workerd/bin/workerd`，请将部署命令改成上表中的命令，使用最新提交重新部署。

如果使用 Cloudflare Pages，则构建命令填 `npm run build`，输出目录填 `dist`。通过控制台直接上传时，只上传 `dist/` 内容。

## Sealos 镜像部署

默认 `nginx` 镜像只包含欢迎页，不包含请柬。仓库中的 `Dockerfile` 会先构建静态文件，再打包为非 root 用户运行的 Nginx 镜像，服务端口为 **8080**。生产镜像不包含 Node.js、源代码仓库或测试文件。

每次相关源码推送到 `main`，GitHub Actions 会构建镜像，使用 64 MB 内存限额验证网页及静态资源，再发布到 GitHub Container Registry：

```text
ghcr.io/maycode0-0/invitation-card:latest
```

同时发布与提交短 SHA 相同的固定标签。正式部署推荐使用构建成功的 SHA 标签，更新时切换至新标签。

首次发布后，在 GitHub 账号的 Packages 中打开 `invitation-card` → Package settings → Change visibility，将镜像设为 **Public**，这样 Sealos 才能匿名拉取。公开源码仓库不会自动保证新建镜像也公开；不需要把 GitHub 密码或令牌填到请柬里。

在 Sealos「应用管理 → 配置表单」中填写：

| 设置 | 值 |
| --- | --- |
| 应用名称 | `invitation-card` |
| 镜像地址 | 上述镜像地址，或构建成功后的 SHA 标签 |
| 实例数 | `1` |
| CPU | `0.1` 核起；可沿用 `0.2` 核 |
| 内存 | `128 MiB` 起；可沿用 `256 MiB` |
| 容器端口 | `8080` |
| 公网访问 | 开启，外部访问使用 `HTTPS` |
| 自定义域名 | 留空，使用平台分配的网址 |
| 运行命令、环境变量、持久化存储 | 留空 |

镜像中的 Nginx 提供容器内 HTTP 服务，外部 HTTPS 由 Sealos 公网入口处理。无需开启额外的 443 容器端口。保持公网访问开启，部署完成后从应用详情中的网络/外网访问处复制平台地址。

如果 YAML 中只有 `Service` 和 `Deployment` 而没有公网入口，请回到配置表单确认公网访问已开启。如果出现 `ImagePullBackOff`，先确认 GitHub Actions 已构建成功、镜像标签存在且镜像已设为 Public，再检查该区域能否访问 `ghcr.io`。

本地有 Docker 时，也可以运行：

```sh
docker build -t invitation-card .
docker run --rm -p 8080:8080 invitation-card
```

## 功能

- 适配手机、平板和桌面；尊重系统减少动画设置。
- 成长纪念卡依次展示 `assets/photos/01.webp`、`02.webp`、`03.webp`，来自提供的三张照片；已压缩并去除原图元数据，随站点部署供亲友查看。编辑器临时上传的照片仍只保存在当前浏览器，仅替换第一张卡片。
- 生成 1080 × 1560 PNG 邀请海报，支持下载和微信内长按保存。海报采用小熊封面，上传的照片展示在网页成长纪念卡中。
- 「复制 H5 请柬链接」始终可见，并与「复制邀请文案」「保存邀请海报」分开。本地链接会明确提示仅供本机预览；上线后复制的公网链接可直接发给亲友。链接通过 URL 片段携带文字信息，不包含宝宝照片。
- 支持的手机浏览器可调用系统分享面板；微信内提示使用右上角菜单分享 H5。打开分享弹窗时同步最新请柬到网页地址，避免微信转发丢失编辑内容。
- 高德地图搜索导航；生成含中国时区对应时间的 ICS 日历文件。
- 点击音符播放程序合成的轻音乐，再次点击或切到后台暂停。
- 内容用 `textContent` 渲染，分享参数经过长度与日期检查。

## 微信分享说明

H5 可以直接通过链接分享。先执行 `pnpm build`，将 `dist/` 内全部文件发布到可公开访问的 HTTPS 静态网站地址（域名根目录或子目录均可）。进入已发布的页面，编辑宴会信息，再点击「分享这份欢喜」→「复制 H5 请柬链接」，将链接粘贴到微信，亲友点开即可查看完整页面。无需后台即可分享宴会文字信息；页面自带的三张照片随网站部署，编辑器临时上传的照片仅保留在本机，不会随链接上传。

微信内也可在打开分享弹窗后，通过右上角「···」→「发送给朋友」分享当前 H5。其他支持系统分享的手机浏览器会显示「通过系统分享 H5」。本地开发地址仅供本机预览，复制后不能让远程亲友打开；页面会明确显示此限制。海报和邀请文案仍可单独分享。

分享封面位于 `assets/share-cover.png`，为 400 × 400 的小熊 PNG。HTML 提供 `og:image`、图片尺寸、类型和 `image_src`，首屏插画提供 PNG 回退。静态分享图片的绝对地址目前使用 `https://trkbnoxrndgo.sealoshzh.site/`；更换主站域名时，需要同步修改 `index.html` 中两处图片地址。复制的分享链接携带版本参数，便于用新地址重新分享；已经发出的聊天卡片不会随部署自动更新。

微信链接卡片的自定义缩略图、标题与描述需要具有相应接口权限的公众号、微信 JS-SDK 和服务端签名；此静态版本不包含这项服务。以上标准网页 metadata 只是供客户端读取，不能保证微信显示封面或清除微信已有缓存。该版本没有在线 RSVP、名单收集或后台上传服务。

## 文件

- `index.html`：语义化页面、编辑与分享弹窗。
- `styles.css`：响应式样式和减少动画适配。
- `app.js`：编辑、存储、海报、分享、地图、日历与音乐。
- `assets/`：本地原创 SVG 插画，不依赖远程图片。
- `server.mjs`：仅提供公开网页资源的本地预览服务器。
- `wrangler.jsonc`：Cloudflare Workers 构建及静态资源上传配置。
- `Dockerfile`、`deploy/nginx.conf`：Sealos 等容器平台使用的静态网站镜像。
- `.github/workflows/container.yml`：构建、检查并发布镜像。

中文衬线字体使用项目内置的 Noto Serif SC 字体子集，覆盖请柬文案，开源许可证位于 `assets/fonts/OFL.txt`。自定义姓名中的其他汉字使用本机宋体回退。页面无需访问外部字体或图片服务。
