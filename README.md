# Florida birds — CSSDM × eBird · Family-background 20261004

这是可直接部署到 GitHub Pages 的静态网站。无服务器、无数据库、无 npm 构建，使用者不需要安装任何软件。沿用已有 OpenLayers 地图库。

## 网页内容

- 259 种鸟类；按普通名、学名或 speciesKey 搜索。
- 左栏：CSSDM 五模型均值，经每种鸟最佳 F1 阈值转为 presence / absence。
- 右栏：eBird abundance > 0 的 presence，只显示 Florida 州内。
- 两栏平移、缩放同步；切换物种时一起更新；支持当前物种和视角的分享链接。
- 顶部显示 F1、最终 threshold、precision、recall；展开阈值说明可看搜索范围、0.01 步长、并列规则、F1–threshold 曲线和基线。
- 点击地图可同时查看两个模型在对应像元的标签。绿色为 presence，白色为 absence，灰色为 NoData。
- 默认不加载在线底图；需要街道和地名时可勾选 Street basemap。

## 发布前：确认 eBird 授权

网页包已在本地准备，但不代表获得公开发布授权。eBird S&T 条款第 3(d) 节要求：将原始或派生数据用于网站及网络可视化，需要事先取得相应书面许可。请确认你的许可覆盖这 259 种鸟类的公开网页展示，再将文件上传到公开 GitHub 仓库。仅写引用不能代替许可。详见 [CITATION.md](CITATION.md) 及 [官方条款](https://science.ebird.org/en/status-and-trends/products-access-terms-of-use)。

## 最简单的 GitHub 上线方法（网页操作）

1. 下载并解压 `cssdm-ebird-comparison-repo.zip`，打开其中的 `cssdm-ebird-comparison` 文件夹。能看到 `index.html`、`app.js`、`style.css`、`data`、`vendor` 等内容。
2. 登录 GitHub，右上角 **+ → New repository**。仓库名可用 `cssdm-ebird-comparison`，选择 **Public**，勾选 **Add a README file**，点击 **Create repository**。GitHub Free 使用公开仓库部署 Pages。
3. 进入新仓库，点击 **Add file → Upload files**。把第 1 步文件夹**里面的全部内容**拖进去，包括 `data` 和 `vendor` 两个文件夹；不要上传 ZIP 本身，也不要把最外层文件夹整体套在仓库根目录外面。目录结构见下方。
4. 上传完成后点击 **Commit changes**。本包不足 100 个文件，且每个文件小于 25 MiB，适合 GitHub 网页一次上传；如果浏览器不支持拖入文件夹，换用当前 Chrome / Edge。
5. 进入仓库 **Settings → Pages**。在 **Build and deployment** 中选择 **Source: Deploy from a branch**；分支选 **main**，目录选 **/ (root)**，点击 **Save**。
6. 等待部署完成。可到 **Actions** 查看 Pages 构建是否显示绿色成功状态，再回到 **Settings → Pages** 查看网址：`https://你的用户名.github.io/cssdm-ebird-comparison/`。
7. 把这个网址发给别人即可；切换物种、调整视角后点 **Copy link** 可以分享当前视图。

仓库根目录应直接包含：

```text
index.html
app.js
style.css
README.md
CITATION.md
.nojekyll
data/
vendor/
```

`.nojekyll` 是隐藏文件，建议一起上传。若操作系统隐藏它，可在 GitHub 的 **Add file → Create new file** 新建名为 `.nojekyll` 的空文件。本网站没有下划线开头的数据目录，缺少它通常也不妨碍部署。

### 常见问题

- **不要直接双击 index.html 测试。** 浏览器会拦截本地文件的数据读取；发布后通过 `https://...github.io/.../` 访问即可。
- **出现 404**：检查 `index.html` 是否在仓库根目录，Pages 是否设为 `main / (root)`，Actions 是否构建完成。
- **网页能打开但地图报错**：检查 `data` 和 `vendor` 是否完整上传，文件名大小写是否保持原样。不要重命名 `.bin`、`.gz` 文件，也不要手动解压网页数据。
- **街道底图空白**：关闭 Street basemap；研究地图不依赖该外部服务。
- **更新文件后仍看到旧网页**：等待 Pages 部署成功后强制刷新（Ctrl+Shift+R / Cmd+Shift+R）。

如果已有 Python 且希望先在自己电脑预览，可在包含 `index.html` 的文件夹运行 `python -m http.server 8000`，再打开 `http://localhost:8000`；这不是部署所必需的步骤。

GitHub 官方说明：[上传文件](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)、[Pages 配置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 筛选和指标解释

原有 262 种鸟中，剔除整个 Florida 内 eBird abundance 全为 0 或 NoData 的 3 种：

| speciesKey | 学名 | eBird common name |
| --- | --- | --- |
| 2473341 | Numida meleagris | Helmeted Guineafowl |
| 2498036 | Anser anser | Graylag Goose |
| 2498343 | Cygnus olor | Mute Swan |

筛选使用 **全部 67 个县**的原始州界，以及与州界相交的原生 3 km eBird 像元，不仅检查 CSSDM 已覆盖的 66 个县。只要存在一个正 abundance 像元就保留。

特别保留 **Gallus gallus / Red Junglefowl / 9326020**：全州有 37 个相交的原生 eBird presence 像元，但 CSSDM 的 66 县校准覆盖范围内没有正例。它的所有候选阈值 F1 都为 0；沿用原实验“并列选择最高阈值”的规则，CSSDM 输出全部 absence。网页会显示醒目说明，不能把这个阈值当作有鉴别力的生态阈值。

- CSSDM 的 579,752 个有效像元约为 504 m，Monroe 因原始输入缺失而无预测。
- 全州网页显示网格有 592,000 个像元，eBird 补充覆盖 Monroe。州外透明；边界按 504 m 像元中心裁剪，显示县界经过简化。
- 每个 504 m 像元继承包含其中心的 3 km eBird 像元标签，不对标签做双线性插值；这不是把 eBird 的真实分辨率提高到 504 m。
- 阈值和指标沿用原实验，不因筛掉 3 种鸟而重算或改变。阈值从该物种分数最小值起每次加 0.01，并额外测试精确最大值；presence 严格取 `score > threshold`，F1 并列选择最高阈值。
- F1 / precision / recall 在原来 66 个县的 CSSDM 支持范围上计算；阈值校准时按原实验要求把 eBird NoData 当作 absence。为避免混淆，网页仍将 NoData 显示为灰色，而不是声称缺失值是真正 absence。
- 这些是**用同一 eBird 数据选阈值并计算的拟合一致性指标，不是独立验证准确率**；一个 eBird 像元下的多个 CSSDM 像元并不独立。

## 文件和技术说明

- `data/species_metrics_summary.csv`：筛选后指标、原始 band 和新 band 对应关系。
- `data/excluded_species.csv`：剔除名单。
- `data/florida_distribution_audit.csv`：262 种鸟全州 eBird 正值 / 零值 / 缺失值数量。
- `data/species.json`：物种、阈值、F1 曲线、数据定位和校验和。
- `data/grid.u32.gz`：全州有效像元位置；`cssdm-valid.bits.gz`：CSSDM 覆盖；`county.u8.gz`：县索引。
- `data/maps-*.bin`：分组保存的无损压缩位图。每种鸟三个图层：CSSDM presence、eBird presence、eBird 有效值掩膜。不是量化后的概率近似。
- OpenLayers 和 proj4js 已随包附带；没有安装步骤和在线脚本依赖。现代浏览器使用自带 gzip 解压能力。
- Multi-band GeoTIFF 保存在 HPC 的实验 `filtered/` 目录，不放进网页仓库，减少上传大小；网页的二值标签已逐物种、逐像元核验与相应栅格一致。

原始 262 物种实验和之前的网站均未覆盖修改。

