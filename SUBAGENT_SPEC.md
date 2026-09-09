# 沃尔玛管理后台 — 子代理开发规范（务必遵守）

## 技术栈（已装好，勿改）
React 18 + TypeScript + Vite + Ant Design 5 + ECharts + react-router-dom v6。

## 项目路径
`/Users/dabai/Desktop/沃尔玛/walmart-admin`

## 你的任务
按《沃尔玛管理后台产品设计文档.md》(`/Users/dabai/Desktop/沃尔玛/沃尔玛管理后台产品设计文档.md`) 的页面规格，实现指定的页面组件（.tsx）。每个页面对应文档里一个「页面N：xxx」小节，严格按其**布局、字段表、组件规格、API**实现为可运行的 mock 界面。

## 必须遵守的约定
1. **不改** `router.tsx`、`menuConfig.ts`、`App.tsx`、`main.tsx`、`theme.ts`、`layouts/`——路由已注册好，你只需在指定路径创建/覆盖页面文件，默认导出组件。
2. 每个页面是 `export default function Xxx() {...}`，用 Ant Design 组件。
3. Mock 数据写在组件文件内（或引用 `src/mock/util.ts` 的 NAMES/COMPANIES/CATEGORIES/MANAGERS/pick/randInt/lastNDates/delay）。
4. 图表用 `import EChart from '../../components/EChart'`（props: `option`, `height?`），传 ECharts option 对象。
5. 主色 `#1A56DB`，成功 `#10B981`，警告 `#F59E0B`，危险 `#EF4444`。
6. 表格页统一：筛选栏(Space) + Table(rowKey, columns, dataSource, pagination)。增删改用 Modal + Form。
7. 代码要能通过 `tsc` 编译：显式类型、无未用变量、`any` 尽量少但可用。列表 render 回调参数按需加类型。
8. 中文界面。日期用 dayjs 或字符串。
9. 不写 `.css` 文件，用内联 style 或 AntD 组件属性。

## 参考已完成页面（照此风格）
- `src/pages/Dashboard.tsx`（统计卡+ECharts+待办）
- `src/pages/register/RegisterList.tsx`（筛选+Tabs+Table+Drawer详情）
- `src/pages/register/FormConfig.tsx`（Tabs+左右布局+Table+Modal表单）
- `src/pages/register/Prescreen.tsx`（统计+脱敏表格+二次鉴权Drawer）

## 完成后
不需要自己跑 dev server。确保每个文件语法正确、import 路径正确（页面在 `src/pages/<module>/`，故 EChart 是 `../../components/EChart`，util 是 `../../mock/util`）。
