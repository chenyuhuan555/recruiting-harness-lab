export const resume = [
  { id: '01', tag: 'recruiting-domain', text: '负责招聘需求梳理及候选人跟进流程。' },
  { id: '02', tag: 'product-participation', text: '参与招聘模块上线，负责验收测试。' },
  { id: '03', tag: 'product-owner', text: '独立负责人才库产品从需求定义到上线验收。' },
  { id: '04', tag: 'quality-assist', text: '协助制造团队整理客诉记录，汇总整改进度。' },
  { id: '05', tag: 'quality-owner', text: '负责单厂客诉闭环，牵头原因分析、整改与验证。' },
];

export const jobs = {
  product: {
    id: 'product', name: '招聘产品经理', requirement: '独立主导产品上线',
    tag: 'product-owner', partialTag: 'product-participation',
    claim: '有独立负责产品上线的经历。',
    gap: '第 02 条支持参与上线和负责验收，不能证明独立主导整个上线过程。',
    question: '这个模块从需求到上线，哪些决策由你负责？最终上线由谁拍板？',
  },
  quality: {
    id: 'quality', name: '制造质量负责人', requirement: '牵头完成客诉闭环',
    tag: 'quality-owner', partialTag: 'quality-assist',
    claim: '有牵头完成客诉闭环的经历。',
    gap: '第 04 条支持协助整理与跟踪，不能证明牵头完成客诉闭环。',
    question: '请讲一次你牵头的客诉。哪项整改由你决定，最后如何验证关闭？',
  },
};

export const scenarios = [
  { id: 'normal', label: '正常基线', hint: '原文与判断相符' },
  { id: 'overclaim', label: '夸大经历', hint: '引用真实，结论越界' },
  { id: 'stale', label: '串用岗位', hint: '旧岗位草稿晚到' },
  { id: 'empty', label: '模型无响应', hint: '没有可用草稿' },
];

export function simulate(job, scenario) {
  if (scenario === 'empty') return null;
  const source = scenario === 'stale' ? Object.values(jobs).find(other => other.id !== job.id) : job;
  const tag = scenario === 'overclaim' ? source.partialTag : source.tag;
  return { jobId: source.id, claim: source.claim, quote: resume.find(line => line.tag === tag).text };
}

export function inspect(job, draft) {
  const base = { evidence: null, question: job.question };
  if (!draft || !['jobId', 'claim', 'quote'].every(key => typeof draft[key] === 'string' && draft[key].trim())) {
    return { ...base, state: 'manual', steps: ['skip', 'skip', 'skip'], reason: '没有可核验的草稿。保留当前岗位与简历，交给顾问手动核对。' };
  }
  if (draft.jobId !== job.id) {
    return { ...base, state: 'discard', steps: ['stop', 'skip', 'skip'], reason: '草稿来自另一个岗位。旧结论已隔离，不进入当前岗位的复核结果。' };
  }
  const evidence = resume.find(line => line.text === draft.quote);
  if (!evidence) {
    return { ...base, state: 'verify', steps: ['pass', 'stop', 'skip'], reason: '草稿引用无法在样本原文中逐字定位。' };
  }
  if (evidence.tag !== job.tag || draft.claim !== job.claim) {
    const reason = evidence.tag === job.partialTag ? job.gap : '原文虽存在，但未支持这条草稿结论。';
    return { ...base, evidence, state: 'verify', steps: ['pass', 'pass', 'stop'], reason };
  }
  return { ...base, evidence, state: 'review', steps: ['pass', 'pass', 'pass'], reason: '该条原文支持当前岗位的这一项经历，保留为待顾问复核的草稿。' };
}
