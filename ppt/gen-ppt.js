// SmartShift 方案说明 PPT 生成脚本
// 运行：node gen-ppt.js  →  输出 d:\smartshift\智排班SmartShift方案说明.pptx
const pptxgen = require('pptxgenjs');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 13.33 x 7.5 inch
pres.author = 'SmartShift';
pres.title = '智排班 SmartShift 方案说明';

// ---------- 配色 ----------
const C = {
  primary: '1B3A6B',    // 深蓝
  accent: '2E86DE',     // 亮蓝
  teal: '48C9B0',       // 青绿
  dark: '22313F',       // 正文深灰
  gray: '5D6D7E',       // 次要灰
  lightBg: 'F4F6F8',    // 浅底
  white: 'FFFFFF',
  orange: 'F39C12',
  red: 'E74C3C',
};
const FONT = 'Microsoft YaHei';

// ---------- 通用版式 ----------
function baseSlide() {
  const s = pres.addSlide();
  // 底部装饰条
  s.addShape(pres.ShapeType.rect, { x: 0, y: 7.3, w: 13.33, h: 0.2, fill: { color: C.accent } });
  return s;
}

function addHeader(s, title, subtitle) {
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 1.05, fill: { color: C.primary } });
  s.addShape(pres.ShapeType.rect, { x: 0.55, y: 1.05, w: 2.2, h: 0.06, fill: { color: C.teal } });
  s.addText(title, {
    x: 0.55, y: 0.12, w: 10.5, h: 0.8,
    fontSize: 26, bold: true, color: C.white, fontFace: FONT,
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.58, y: 0.68, w: 11, h: 0.35,
      fontSize: 12, color: 'BFD3F2', fontFace: FONT,
    });
  }
  s.addText('智排班 SmartShift', {
    x: 11.2, y: 0.28, w: 1.9, h: 0.5,
    fontSize: 10, color: 'BFD3F2', fontFace: FONT, align: 'right',
  });
}

// bullets: [{t:'一级', sub:['二级', ...], color}]
function addBody(s, bullets, opts = {}) {
  const x = opts.x ?? 0.6, y = opts.y ?? 1.4, w = opts.w ?? 12.1, h = opts.h ?? 5.7;
  const rich = [];
  for (const b of bullets) {
    rich.push({ text: b.t, options: {
      bullet: { code: '25CF' }, color: b.color || C.dark, bold: true,
      fontSize: b.size || 15, breakLine: true, paraSpaceAfter: 6,
    }});
    if (b.sub) for (const sb of b.sub) {
      rich.push({ text: sb, options: {
        bullet: { code: '2013', indent: 14 }, color: C.gray,
        fontSize: 13, breakLine: true, paraSpaceAfter: 4,
      }});
    }
    if (b.gap) rich.push({ text: '', options: { fontSize: 6, breakLine: true } });
  }
  s.addText(rich, { x, y, w, h, valign: 'top', fontFace: FONT });
}

// 截图占位框
function addShotPlaceholder(s, x, y, w, h, label) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, fill: { color: C.lightBg }, line: { color: C.accent, dashType: 'dash', width: 1.5 },
    rectRadius: 0.08,
  });
  s.addText(label || '（此处插入原型截图 / 实际效果图）', {
    x, y: y + h / 2 - 0.25, w, h: 0.5, align: 'center',
    fontSize: 12, color: C.gray, fontFace: FONT, italic: true,
  });
}

function addFooterNote(s, text) {
  s.addText(text, {
    x: 0.6, y: 6.85, w: 12.1, h: 0.35,
    fontSize: 11, color: C.gray, fontFace: FONT, italic: true,
  });
}

// ============================================================
// Slide 1 封面
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.primary };
  // 装饰
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.35, fill: { color: C.teal } });
  s.addShape(pres.ShapeType.rect, { x: 0, y: 7.15, w: 13.33, h: 0.35, fill: { color: C.accent } });
  s.addShape(pres.ShapeType.ellipse, { x: 10.4, y: -1.2, w: 4.5, h: 4.5, fill: { color: '234A87' } });
  s.addShape(pres.ShapeType.ellipse, { x: -1.4, y: 5.4, w: 3.6, h: 3.6, fill: { color: '234A87' } });

  s.addText('智排班 SmartShift', {
    x: 0.8, y: 2.1, w: 11.7, h: 1.1, align: 'center',
    fontSize: 52, bold: true, color: C.white, fontFace: FONT,
  });
  s.addText('自主研发应用 · 参赛作品说明', {
    x: 0.8, y: 3.3, w: 11.7, h: 0.6, align: 'center',
    fontSize: 24, color: C.teal, fontFace: FONT,
  });
  s.addText('基于贪心算法与可解释评分的团队值班排班系统', {
    x: 0.8, y: 4.15, w: 11.7, h: 0.45, align: 'center',
    fontSize: 15, color: 'BFD3F2', fontFace: FONT,
  });
  s.addText('需求分析 · 应用功能 · 技术特点 · 使用说明 · 运营模式 · 创意方案', {
    x: 0.8, y: 5.6, w: 11.7, h: 0.4, align: 'center',
    fontSize: 13, color: '8FA8CC', fontFace: FONT,
  });
}

// ============================================================
// Slide 2 目录
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '目录', 'CONTENTS');
  const items = [
    ['01', '研发及上线时间', '调研 → 设计 → 开发 → 上线时间线'],
    ['02', '需求分析', '背景痛点 / 目标用户 / 核心需求'],
    ['03', '应用功能', '成员端 / 管理端 / 排班算法 / 积分信用'],
    ['04', '技术特点', '架构 / 可解释算法 / 零依赖部署'],
    ['05', '编程语言', '技术栈与选型理由'],
    ['06', '运行软硬件环境', '软硬件要求 / 网络要求'],
    ['07', '使用说明', '应用入口 / 测试账号 / 操作流程'],
    ['08', '运营模式', '目标场景 / 部署模式 / 演进路线'],
    ['09', '实际效果', '闭环验证 / 运行数据 / 稳定性'],
  ];
  // 三列
  items.forEach(([no, t, d], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 4.35, y = 1.6 + row * 1.75;
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: 4.0, h: 1.5, fill: { color: C.lightBg }, line: { color: 'D5DBE1', width: 0.75 }, rectRadius: 0.06,
    });
    s.addText(no, { x: x + 0.15, y: y + 0.18, w: 0.85, h: 0.85, fontSize: 26, bold: true, color: C.accent, fontFace: FONT });
    s.addText(t, { x: x + 0.95, y: y + 0.14, w: 3.0, h: 0.5, fontSize: 14.5, bold: true, color: C.dark, fontFace: FONT });
    s.addText(d, { x: x + 0.95, y: y + 0.68, w: 3.0, h: 0.7, fontSize: 10.5, color: C.gray, fontFace: FONT });
  });
}

// ============================================================
// Slide 3 研发及上线时间（时间线）
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '01 研发及上线时间', 'R&D & RELEASE TIMELINE');
  s.addText('从需求调研到上线运行：4 周独立完成 MVP 闭环（2026.09 – 2026.10，符合 2025-2026 参赛时间要求）', {
    x: 0.6, y: 1.3, w: 12.1, h: 0.45, fontSize: 15, bold: true, color: C.accent, fontFace: FONT,
  });
  // 时间轴主线
  s.addShape(pres.ShapeType.rect, { x: 0.9, y: 3.3, w: 11.5, h: 0.05, fill: { color: 'C7D3E0' } });
  const nodes = [
    ['2026.09 下旬', '选题与调研', '面向社团负责人 /\n值班成员访谈痛点\n明确 4 大核心需求'],
    ['2026.10.14', '方案设计', '完成设计方案：\n7 表数据模型 /\n排班算法 / 积分体系'],
    ['2026.10.15-20', '集中开发', '后端 21 个源文件 +\n前端 33 个源文件\n约 4500 行代码'],
    ['2026.10.21', '联调测试', '端到端 8 步闭环验证\n全部通过\n（排班→签到→积分）'],
    ['2026.10.22', 'v1.0 上线', 'MVP 正式发布\n含演示种子数据\n与一键启动脚本'],
  ];
  nodes.forEach(([date, t, d], i) => {
    const cx = 1.45 + i * 2.5;
    const isLast = i === 4;
    s.addShape(pres.ShapeType.ellipse, { x: cx - 0.13, y: 3.17, w: 0.3, h: 0.3, fill: { color: isLast ? C.teal : C.accent } });
    s.addText(date, { x: cx - 1.05, y: 2.5, w: 2.2, h: 0.35, align: 'center', fontSize: 12, bold: true, color: isLast ? '1E8C7A' : C.accent, fontFace: FONT });
    s.addText(t, { x: cx - 1.05, y: 3.68, w: 2.2, h: 0.4, align: 'center', fontSize: 15, bold: true, color: C.dark, fontFace: FONT });
    s.addText(d, { x: cx - 1.15, y: 4.12, w: 2.4, h: 1.45, align: 'center', fontSize: 10.5, color: C.gray, fontFace: FONT, valign: 'top' });
  });
  s.addShape(pres.ShapeType.roundRect, { x: 0.9, y: 5.75, w: 11.5, h: 0.95, fill: { color: 'E9F7F3' }, line: { color: C.teal, width: 1 }, rectRadius: 0.08 });
  s.addText('后续版本规划（v1.1+）：请假与顶替广场 → 排班提醒推送 → 积分商城 → 小程序端，持续迭代', {
    x: 1.15, y: 5.92, w: 11, h: 0.6, fontSize: 13, bold: true, color: '1E8C7A', fontFace: FONT,
  });
}

// ============================================================
// Slide 4 需求分析 — 背景与痛点
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '02 需求分析 · 背景与痛点', 'WHY SMARTSHIFT');
  addBody(s, [
    { t: '背景：小型团队（门店 / 社团 / 实验室 / 客服中心）值班排班普遍依赖人工 + Excel', size: 16 },
    { t: '痛点一：手工排班耗时且易冲突', sub: ['时间重叠、休息不足、超时值班难以逐人核对'] },
    { t: '痛点二：公平性无法保证', sub: ['工作量分配不均，成员质疑"为什么总是我"，缺乏数据依据'] },
    { t: '痛点三：缺乏激励与约束', sub: ['值班完成情况与个人收益脱钩，缺席、迟到无人管理'] },
    { t: '痛点四：难追溯、难调整', sub: ['排班依据不透明，临时改动牵一发动全身，历史无沉淀'] },
    { t: '结论：需要一套"自动生成 + 公平可解释 + 激励闭环"的轻量排班系统', color: C.accent, size: 15 },
  ]);
  addShotPlaceholder(s, 8.7, 1.5, 4.0, 3.2, '（此处可插入：传统 Excel 排班痛点截图）');
}

// ============================================================
// Slide 4 需求分析 — 目标用户与核心需求
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '02 需求分析 · 目标用户与核心需求', 'USERS & REQUIREMENTS');
  addBody(s, [
    { t: '目标用户', color: C.accent },
    { t: '排班管理员：团队负责人、店长、社团部长', sub: ['快速建班次、一键生成、可手动微调、结果可解释'] },
    { t: '普通成员：值班员工、社团成员、志愿者', sub: ['自主申报不可用时间与偏好、查看日历、一键签到、赚积分'] },
    { t: '核心功能需求（MVP 范围）', color: C.accent, gap: true },
    { t: '成员管理：邀请成员、角色与信用维护' },
    { t: '可用时间：成员勾选不可用时段 + 偏好班次类型' },
    { t: '班次管理：日期 / 时段 / 时长 / 地点 / 所需人数 / 特殊标记' },
    { t: '智能排班：一键生成草案、显示冲突与排班理由、手动调整后发布' },
    { t: '签到与积分：按钮签到、完成得分（+10，特殊班 +5）、缺席扣信用（−5）' },
    { t: '统计报表：个人时长 / 积分；团队完成率 / 排行榜' },
  ], { w: 7.9 });
  addShotPlaceholder(s, 8.8, 1.5, 3.9, 4.6, '（此处可插入：功能结构图 / 原型总览截图）');
}

// ============================================================
// Slide 5 应用功能总览
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '03 应用功能 · 总览', 'FEATURES OVERVIEW');
  // 左：成员端
  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 1.45, w: 5.9, h: 5.3, fill: { color: 'EAF4FD' }, line: { color: C.accent, width: 1 }, rectRadius: 0.08 });
  s.addText('成员端（7 个页面）', { x: 0.85, y: 1.6, w: 5.4, h: 0.5, fontSize: 17, bold: true, color: C.accent, fontFace: FONT });
  s.addText([
    { text: '首页：今日值班卡片 + 快速签到 + 积分/信用速览', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
    { text: '排班日历：月视图，按日期查看班次安排', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
    { text: '可用时间：9 个时段勾选不可用 + 偏好班次（早/晚/夜）', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
    { text: '签到：我的班次列表，按钮签到', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
    { text: '积分中心：余额 + 流水明细（正负着色）', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
    { text: '我的：个人信息 + 个人统计（班次/时长/完成率）', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
  ], { x: 0.85, y: 2.15, w: 5.45, h: 4.4, valign: 'top', fontFace: FONT });
  // 右：管理端
  s.addShape(pres.ShapeType.roundRect, { x: 6.85, y: 1.45, w: 5.9, h: 5.3, fill: { color: 'E9F7F3' }, line: { color: C.teal, width: 1 }, rectRadius: 0.08 });
  s.addText('管理端（6 大模块）', { x: 7.1, y: 1.6, w: 5.4, h: 0.5, fontSize: 17, bold: true, color: '1E8C7A', fontFace: FONT });
  s.addText([
    { text: '仪表盘：班次/排班/完成率/成员数 + 积分排行榜', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
    { text: '成员管理：角色 / 信用分 / 手动加权（±20）/ 邀请入团', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
    { text: '班次管理：班次 CRUD、特殊班开关、优先级加权', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
    { text: '智能排班：一键生成 → 冲突提示 → 换人微调 → 确认发布（核心页）', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
    { text: '积分规则：规则展示 + 管理员手动调整（delta + 理由）', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
    { text: '统计报表：按日完成率趋势、个人统计查询、排行榜', options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 8, fontSize: 13, color: C.dark } },
  ], { x: 7.1, y: 2.15, w: 5.45, h: 4.4, valign: 'top', fontFace: FONT });
  addFooterNote(s, '提示：本页右侧/各功能页均可补充原型截图与实际运行效果图');
}

// ============================================================
// Slide 6 核心功能 — 智能排班算法
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '03 应用功能 · 核心：智能排班算法', 'SCHEDULING ALGORITHM');
  // 三步流程
  const steps = [
    ['① 硬约束过滤', '不满足直接排除', '· 时段可用（避开不可用时段）\n· 与已排班次不重叠\n· 距上次班次休息 ≥ 8h\n· 当日累计 ≤ 8h\n· 本周累计 ≤ 40h', C.red],
    ['② 加权评分', '候选人打分排序', '偏好匹配 0~20\n+ 公平性 0~30\n+ 休息间隔 0~20\n+ 信用分 0~20\n+ 时长匹配 0~10\n− 连续值班惩罚 0~30\n+ 管理员加权 ±20', C.accent],
    ['③ 贪心匹配', '按班次优先级分配', '班次优先级 =\n时间紧迫度 + 节假日\n+ 特殊班次 + 人数缺口\n+ 管理员加权\n\n高分优先入选，\n不足人数记为空缺冲突', C.teal],
  ];
  steps.forEach(([t, d, body, color], i) => {
    const x = 0.6 + i * 4.3;
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.5, w: 3.95, h: 4.35, fill: { color: C.lightBg }, line: { color, width: 1.5 }, rectRadius: 0.08 });
    s.addText(t, { x: x + 0.2, y: 1.65, w: 3.55, h: 0.45, fontSize: 17, bold: true, color, fontFace: FONT });
    s.addText(d, { x: x + 0.2, y: 2.1, w: 3.55, h: 0.35, fontSize: 12, color: C.gray, fontFace: FONT });
    s.addText(body, { x: x + 0.2, y: 2.5, w: 3.6, h: 3.2, fontSize: 12.5, color: C.dark, fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.15 });
  });
  s.addText('可解释性：每个分配附带 6 因子评分理由（如"公平性 25/30：历史值班 1 次"），前端彩色标签 + 悬浮明细展示', {
    x: 0.6, y: 6.05, w: 12.1, h: 0.6, fontSize: 14, bold: true, color: C.primary, fontFace: FONT,
    fill: { color: 'EAF4FD' },
  });
  addFooterNote(s, '算法实现：server/src/services/scoring.js（约束与评分）+ scheduler.js（贪心主流程）');
}

// ============================================================
// Slide 7 应用功能 — 积分与信用体系
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '03 应用功能 · 积分与信用体系', 'POINTS & CREDIT');
  addBody(s, [
    { t: '积分规则（完成才得分，未完成不得分）', color: C.accent },
    { t: '准时完成值班：+10 分', sub: ['节假日 / 特殊班次：额外 +5'] },
    { t: '顶替他人值班：+8 分（预留，后续版本开放）' },
    { t: '缺席（管理员标记）：0 分，信用 −5' },
    { t: '临时请假（<24h）：0 分，信用 −2（预留）' },
    { t: '信用体系', color: C.accent, gap: true },
    { t: '信用分 0~100（默认 100），缺席扣减、表现恢复' },
    { t: '信用分直接参与排班评分（0~20 权重）：信用越高越优先获得合适班次' },
    { t: '积分流水全程落库，支持管理员手动调整（delta + 理由），可审计可追溯', color: C.dark },
  ], { w: 7.6 });
  addShotPlaceholder(s, 8.5, 1.5, 4.2, 3.4, '（此处插入：积分中心 / 流水页面截图）');
  addShotPlaceholder(s, 8.5, 5.05, 4.2, 1.6, '（此处插入：积分规则页截图）');
}

// ============================================================
// Slide 8 应用功能 — 签到与统计
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '03 应用功能 · 签到与统计', 'CHECK-IN & STATISTICS');
  addBody(s, [
    { t: '签到闭环（MVP 简化实现）', color: C.accent },
    { t: '成员端：我的班次 → 点击"签到"按钮（status → 已签到）' },
    { t: '管理员端：查看签到列表 → "确认完成" → 积分自动到账（+10，特殊班 +15）' },
    { t: '异常处理：管理员可标记"缺席"，信用分自动 −5', color: C.red },
    { t: '团队统计', color: C.accent, gap: true },
    { t: '概览：班次总数 / 已发布 / 排班记录 / 完成率 / 成员数' },
    { t: '趋势：按日完成率（已排 / 已完成 / 缺席）' },
    { t: '排行榜：积分 + 完成班次数双维度排序' },
    { t: '个人统计：总班次、完成数、总时长、完成率、缺席次数', color: C.dark },
  ], { w: 7.6 });
  addShotPlaceholder(s, 8.5, 1.5, 4.2, 2.6, '（此处插入：签到页截图）');
  addShotPlaceholder(s, 8.5, 4.25, 4.2, 2.4, '（此处插入：仪表盘 / 统计报表截图）');
}

// ============================================================
// Slide 9 技术特点
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '04 技术特点', 'TECHNICAL HIGHLIGHTS');
  const feats = [
    ['前后端分离', 'Vue3 SPA + RESTful API，前端 5173 / 后端 3001，Vite 代理转发，职责清晰易扩展'],
    ['零原生编译依赖', '数据库采用 Node.js 内置 node:sqlite，npm install 即用，无 better-sqlite3 等编译坑，Windows/macOS/Linux 通吃'],
    ['算法可解释', '评分 6 因子逐项落库（assignments.reason JSON），前端彩色标签 + tooltip 展示依据，排班不再黑箱'],
    ['草案 / 发布分离', '一键生成仅产出内存草案，不写库；管理员可视化微调（换人 / 加权）后再事务发布，避免中间态污染'],
    ['安全与权限', 'JWT(HS256) + bcrypt 密码哈希；三级角色（超管/排班管理员/成员）前后端双重校验'],
    ['轻量部署', '单文件 SQLite（WAL 模式）+ 自研事务包装器，无需外部数据库服务，一键脚本启动'],
  ];
  feats.forEach(([t, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.25, y = 1.5 + row * 1.75;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: 5.95, h: 1.55, fill: { color: C.lightBg }, line: { color: 'D5DBE1', width: 0.75 }, rectRadius: 0.06 });
    s.addText(t, { x: x + 0.22, y: y + 0.1, w: 5.5, h: 0.42, fontSize: 15, bold: true, color: C.accent, fontFace: FONT });
    s.addText(d, { x: x + 0.22, y: y + 0.52, w: 5.55, h: 0.95, fontSize: 11.5, color: C.dark, fontFace: FONT, valign: 'top' });
  });
}

// ============================================================
// Slide 10 编程语言
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '05 编程语言与技术栈', 'LANGUAGES & STACK');
  addBody(s, [
    { t: '编程语言：JavaScript（ES Modules）为主，辅以 HTML / CSS（Vue SFC 单文件组件）', color: C.accent, size: 16 },
    { t: '前端', gap: true },
    { t: 'Vue 3.5（Composition API + <script setup>）+ Vite 5 构建' },
    { t: 'Element Plus 2.8（中文语言包）+ Pinia 2 状态管理 + Vue Router 4' },
    { t: 'Axios 统一拦截（token 注入 / 401 跳转 / 错误提示）' },
    { t: '后端', gap: true },
    { t: 'Node.js 24 + Express 4（RESTful API，10 个路由模块）' },
    { t: 'node:sqlite（Node 内置 SQLite 驱动）+ jsonwebtoken + bcryptjs' },
    { t: '未使用低代码工具的原因', color: C.red, gap: true },
    { t: '排班算法（硬约束 + 加权评分 + 贪心匹配）需深度定制业务逻辑，低代码平台难以表达且不可控', sub: ['纯代码实现保证算法透明、可调参、可扩展（权重全部集中在 config.js）'] },
  ]);
  addFooterNote(s, '代码规模：后端 21 个源文件 + 前端 33 个源文件，合计约 4500 行');
}

// ============================================================
// Slide 11 运行软硬件环境
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '06 运行软硬件环境', 'ENVIRONMENT');
  addBody(s, [
    { t: '硬件环境（极低要求）', color: C.accent },
    { t: 'CPU：双核及以上（x64 / ARM 均可）' },
    { t: '内存：≥ 2GB 可用' },
    { t: '磁盘：< 200MB（含依赖）' },
    { t: '无需专用服务器，普通办公电脑 / 笔记本即可运行', color: C.teal },
    { t: '软件环境', color: C.accent, gap: true },
    { t: '操作系统：Windows 10/11、macOS、主流 Linux 发行版' },
    { t: 'Node.js ≥ 22.5（推荐 24.x，需内置 node:sqlite 模块）+ npm ≥ 10' },
    { t: '浏览器：Chrome / Edge / Firefox 等现代浏览器' },
    { t: '网络环境', color: C.accent, gap: true },
    { t: '本机运行：无需外网，localhost 即可' },
    { t: '团队联机：后端所在主机局域网可达（3001 端口），前端可一并局域网分发' },
  ], { w: 7.6 });
  addShotPlaceholder(s, 8.5, 1.6, 4.2, 3.0, '（此处插入：运行环境 / 启动终端截图）');
  s.addShape(pres.ShapeType.roundRect, { x: 8.5, y: 4.8, w: 4.2, h: 1.8, fill: { color: 'E9F7F3' }, line: { color: C.teal, width: 1 }, rectRadius: 0.08 });
  s.addText('一键启动脚本\nstart.bat（总）\nserver.bat / web.bat（分端）\n双击即可运行', {
    x: 8.7, y: 4.95, w: 3.8, h: 1.5, fontSize: 12, color: '1E8C7A', fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.2,
  });
}

// ============================================================
// Slide 12 使用说明 — 启动与账号
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '07 使用说明 · 应用入口与测试账号', 'QUICK START');
  addBody(s, [
    { t: '首次运行（二选一）', color: C.accent },
    { t: '方式一：双击 d:\\smartshift\\start.bat（自动安装依赖 + 初始化 + 启动前后端）' },
    { t: '方式二：手动命令', sub: [
      'cd server && npm install && npm run seed && npm run dev   （后端 :3001）',
      'cd web && npm install && npm run dev                      （前端 :5173）',
    ]},
    { t: '应用入口：http://localhost:5173（Vite 自动代理 /api → 后端，可部署至公网提供在线入口）' },
    { t: '测试账号（密码统一 123456）', color: C.accent, gap: true },
    { t: 'admin —— 超级管理员：全部权限，团队创建者' },
    { t: 'manager —— 排班管理员：班次 / 排班 / 积分管理' },
    { t: 'alice / bob / carol / dave —— 普通成员：可用时间 / 签到 / 积分' },
    { t: '数据重置：npm run seed（幂等，随时恢复演示初始状态）', color: C.teal },
  ]);
  addShotPlaceholder(s, 9.0, 1.6, 3.7, 3.2, '（此处插入：登录页 / 快捷登录截图）');
}

// ============================================================
// Slide 13 使用说明 — 核心操作流程
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '07 使用说明 · 核心操作流程', 'WORKFLOW');
  const flow = [
    ['管理员', '添加班次', '班次管理：日期 / 时段 /\n人数 / 特殊标记'],
    ['成员', '申报可用时间', '勾选不可用时段\n+ 偏好班次类型'],
    ['管理员', '一键生成排班', '选日期范围 → 生成草案\n查看评分理由与冲突'],
    ['管理员', '微调并发布', '手动换人 → 确认发布\n班次状态 → 已发布'],
    ['成员', '值班签到', '我的班次 →\n点击签到按钮'],
    ['管理员', '确认发积分', '确认完成 → 积分到账\n（+10 / 特殊 +15）'],
  ];
  flow.forEach(([role, t, d], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 4.3, y = 1.55 + row * 2.5;
    const color = role === '管理员' ? C.accent : C.teal;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: 3.9, h: 2.1, fill: { color: row === 0 ? 'EAF4FD' : 'E9F7F3' }, line: { color, width: 1.25 }, rectRadius: 0.08 });
    s.addText(`${role} · 第 ${i + 1} 步`, { x: x + 0.2, y: y + 0.12, w: 3.5, h: 0.35, fontSize: 11, color: C.gray, fontFace: FONT });
    s.addText(t, { x: x + 0.2, y: y + 0.45, w: 3.5, h: 0.5, fontSize: 17, bold: true, color, fontFace: FONT });
    s.addText(d, { x: x + 0.2, y: y + 1.0, w: 3.55, h: 1.0, fontSize: 12, color: C.dark, fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.15 });
  });
  addFooterNote(s, '完整闭环：建班次 → 申报时间 → 生成 → 微调发布 → 签到 → 确认发分 → 统计/排行榜查看');
}

// ============================================================
// Slide 14 运营模式
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '08 运营模式', 'OPERATION MODEL');
  addBody(s, [
    { t: '目标场景', color: C.accent },
    { t: '首选：高校学生组织 / 社团值班 / 实验室值守（劳动教育与组织自治数字化）' },
    { t: '延伸：连锁门店排班、客服中心、志愿活动调度', color: C.gray },
    { t: '部署模式', color: C.accent, gap: true },
    { t: '当前 MVP：单团队自用，本地运行零成本（一台电脑即可）' },
    { t: '演进方向：云端 SaaS 多租户，按团队订阅（免费基础版 + 高级功能付费）' },
    { t: '激励生态', color: C.accent, gap: true },
    { t: '积分对接兑换：福利、调休、实物奖励，形成"多值班多回报"正向循环' },
    { t: '信用数据沉淀：成员可靠性画像，辅助管理员用人决策' },
    { t: '版本演进路线', color: C.accent, gap: true },
    { t: 'MVP（当前）→ 请假 / 顶替广场 → 提醒推送（排班前自动通知）→ 积分商城 → 小程序端' },
  ], { w: 7.7 });
  addShotPlaceholder(s, 8.6, 1.5, 4.1, 3.4, '（此处插入：运营场景 / 路线图配图）');
  s.addShape(pres.ShapeType.roundRect, { x: 8.6, y: 5.1, w: 4.1, h: 1.5, fill: { color: 'FDF2E9' }, line: { color: C.orange, width: 1 }, rectRadius: 0.08 });
  s.addText('核心价值主张：\n把"排班"从管理负担\n变成"激励引擎"', {
    x: 8.8, y: 5.25, w: 3.7, h: 1.2, fontSize: 13, bold: true, color: 'B9770E', fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.2,
  });
}

// ============================================================
// Slide 15 实际效果
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '09 实际效果', 'REAL RESULTS');
  addBody(s, [
    { t: '端到端闭环验证（8 步全部通过）', color: C.accent },
    { t: '登录 → 一键生成排班 → 查看评分理由与冲突 → 手动微调 → 确认发布 → 成员签到 → 管理员确认 → 积分自动到账' },
    { t: '演示运行数据', color: C.accent, gap: true },
    { t: '6 名成员 / 14 天 28 个班次的完整演示环境' },
    { t: '一次"一键生成"产出 14 个班次草案、15+ 项人员分配，每项附 6 因子评分理由' },
    { t: '周末特殊班优先排班；空缺班次显式提示缺口人数；积分自动结算（+10，特殊班 +15）' },
    { t: '稳定性表现', color: C.accent, gap: true },
    { t: '草案 / 发布分离 + 全链路事务，测试期零脏数据、零崩溃' },
    { t: '一键脚本启动 + 幂等种子数据，评审可随时复现完整演示', color: C.teal },
  ], { w: 7.6 });
  addShotPlaceholder(s, 8.5, 1.5, 4.2, 2.6, '（此处插入：一键生成排班实际运行截图）');
  addShotPlaceholder(s, 8.5, 4.25, 4.2, 2.4, '（此处插入：统计仪表盘 / 积分到账截图）');
}

// ============================================================
// Slide 16 创意方案介绍（附加亮点）
// ============================================================
{
  const s = baseSlide();
  addHeader(s, '创意亮点 · 附加说明', 'BONUS INNOVATIONS');
  const ideas = [
    ['① 可解释排班（核心创意）', '每个分配附带 6 因子得分与理由："公平性 25/30：历史值班 1 次，团队最高 5 次"。彩色标签 + 悬浮明细，让成员看得懂、信得过，大幅减少排班争议'],
    ['② 公平性量化', '历史值班数反向评分（最高 30 分权重）+ 连续值班递增惩罚，从算法层面杜绝"鞭打快牛"，工作量自动趋向均衡'],
    ['③ 成员保护内置', '8h 最小休息间隔 + 每日 8h / 每周 40h 上限作为硬约束，不满足直接排除，健康管理写进算法'],
    ['④ 人机协同决策', '算法只出草案，管理员可视化微调：手动换人、成员 ±20 加权、班次优先级加权——最终决策权始终在人'],
    ['⑤ 草案-发布分离', '生成不落库、发布才事务写入，杜绝中间态污染数据；空缺班次显式提示缺口人数'],
    ['⑥ 零依赖交付', 'Node 内置 SQLite + 一键 bat 脚本，一次 npm install 到处运行，演示与交付成本趋近于零'],
  ];
  ideas.forEach(([t, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.25, y = 1.45 + row * 1.78;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: 5.95, h: 1.62, fill: { color: i === 0 ? 'EAF4FD' : C.lightBg }, line: { color: i === 0 ? C.accent : 'D5DBE1', width: i === 0 ? 1.5 : 0.75 }, rectRadius: 0.06 });
    s.addText(t, { x: x + 0.22, y: y + 0.08, w: 5.5, h: 0.42, fontSize: 14.5, bold: true, color: i === 0 ? C.accent : C.dark, fontFace: FONT });
    s.addText(d, { x: x + 0.22, y: y + 0.5, w: 5.55, h: 1.05, fontSize: 11, color: C.dark, fontFace: FONT, valign: 'top' });
  });
}

// ============================================================
// Slide 16 结束页
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.primary };
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.35, fill: { color: C.teal } });
  s.addShape(pres.ShapeType.rect, { x: 0, y: 7.15, w: 13.33, h: 0.35, fill: { color: C.accent } });
  s.addText('谢谢观看', {
    x: 0.8, y: 2.6, w: 11.7, h: 1.0, align: 'center',
    fontSize: 48, bold: true, color: C.white, fontFace: FONT,
  });
  s.addText('智排班 SmartShift —— 让每一班都公平、透明、有回报', {
    x: 0.8, y: 3.75, w: 11.7, h: 0.5, align: 'center',
    fontSize: 16, color: C.teal, fontFace: FONT,
  });
  s.addText('应用入口：http://localhost:5173    测试账号：admin / manager / alice（密码 123456）', {
    x: 0.8, y: 5.3, w: 11.7, h: 0.4, align: 'center',
    fontSize: 13, color: '8FA8CC', fontFace: FONT,
  });
  s.addText('（本模板已预留原型截图 / 实际效果占位框，可在 PowerPoint / WPS 中直接替换）', {
    x: 0.8, y: 5.85, w: 11.7, h: 0.4, align: 'center',
    fontSize: 11, italic: true, color: '6A85AC', fontFace: FONT,
  });
}

// ---------- 输出 ----------
pres.writeFile({ fileName: 'D:/smartshift/智排班SmartShift参赛作品-自主研发应用赛道.pptx' })
  .then(() => console.log('PPT 生成成功: D:/smartshift/智排班SmartShift参赛作品-自主研发应用赛道.pptx'))
  .catch((e) => { console.error('生成失败:', e); process.exit(1); });
