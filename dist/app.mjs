import { jobs, resume, scenarios, simulate, inspect } from './guard.mjs';

const byId = id => document.getElementById(id);
const jobInput = byId('job');
const switches = byId('scenarios');
const steps = byId('steps');
const result = byId('result');
const draftDetails = byId('draft');
const draftContent = byId('draft-content');
const states = {
  review: ['可进入人工复核', '通过检查'],
  verify: ['待核实', '暂停流转'],
  discard: ['旧草稿已隔离', '拒绝流转'],
  manual: ['交给人工接手', '模型未返回'],
};
const stepLabels = ['岗位一致', '原文存在', '原文支持结论'];
const stepStates = { pass: '通过', stop: '拦截', skip: '未执行' };
let scenario = 'normal';

for (const job of Object.values(jobs)) jobInput.add(new Option(job.name, job.id));
switches.innerHTML = scenarios.map(({ id, label, hint }) =>
  `<button type="button" data-case="${id}" aria-pressed="false"><strong>${label}</strong><small>${hint}</small></button>`).join('');

function render() {
  const job = jobs[jobInput.value];
  const draft = simulate(job, scenario);
  const outcome = inspect(job, draft);
  const [title, badge] = states[outcome.state];
  for (const button of switches.children) button.setAttribute('aria-pressed', button.dataset.case === scenario);
  byId('requirement').textContent = job.requirement;
  steps.innerHTML = outcome.steps.map((state, i) =>
    `<li class="${state}"><span class="step-no">0${i + 1}</span><strong>${stepLabels[i]}</strong><small>${stepStates[state]}</small></li>`).join('');
  byId('resume').innerHTML = resume.map(line =>
    `<li class="${outcome.evidence?.id === line.id ? 'cited' : ''}"><span class="line-no">${line.id}</span><span>${line.text}</span>${outcome.evidence?.id === line.id ? '<span class="cite-mark">引用</span>' : ''}</li>`).join('');
  result.innerHTML = `
    <div class="outcome ${outcome.state}">
      <span class="badge">${badge}</span>
      <h3>${title}</h3>
      <p>${outcome.reason}</p>
    </div>
    ${outcome.state === 'review' ? '' : `<div class="handoff"><strong>人工可以这样核实</strong><p>${outcome.question}</p></div>`}`;
  draftDetails.open = scenario === 'overclaim';
  draftContent.innerHTML = draft
    ? `<p><strong>草稿岗位</strong> ${jobs[draft.jobId].name}</p><p><strong>草稿结论</strong> ${draft.claim}</p><blockquote>${draft.quote}</blockquote>`
    : '<p>本次没有返回草稿。</p>';
}

jobInput.addEventListener('change', () => { scenario = 'normal'; render(); });
switches.addEventListener('click', event => {
  const button = event.target.closest('[data-case]');
  if (!button) return;
  scenario = button.dataset.case;
  render();
});
render();
