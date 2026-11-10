import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jobs, simulate, inspect } from './dist/guard.mjs';

test('两个岗位的正常草稿均保留有效证据并进入人工复核', () => {
  for (const job of Object.values(jobs)) {
    const result = inspect(job, simulate(job, 'normal'));
    assert.equal(result.state, 'review');
    assert.deepEqual(result.steps, ['pass', 'pass', 'pass']);
    assert.ok(result.evidence);
  }
});

test('引用逐字真实，但参与或协作不能充当负责人证据', () => {
  for (const job of Object.values(jobs)) {
    const draft = simulate(job, 'overclaim');
    const result = inspect(job, draft);
    assert.equal(result.state, 'verify');
    assert.deepEqual(result.steps, ['pass', 'pass', 'stop']);
    assert.equal(result.evidence.text, draft.quote);
    assert.match(result.question, /哪|什么/);
  }
});

test('旧岗位草稿在读取其证据之前就被隔离', () => {
  const result = inspect(jobs.quality, simulate(jobs.product, 'normal'));
  assert.equal(result.state, 'discard');
  assert.deepEqual(result.steps, ['stop', 'skip', 'skip']);
  assert.equal(result.evidence, null);
});

test('无响应或字段缺失进入人工接手，不显示虚构结论', () => {
  for (const draft of [null, { jobId: 'product', claim: '缺少引用' }]) {
    const result = inspect(jobs.product, draft);
    assert.equal(result.state, 'manual');
    assert.deepEqual(result.steps, ['skip', 'skip', 'skip']);
    assert.equal(result.evidence, null);
  }
});

test('正面标签不能让改写后的引文或不一致的模型判断通过', () => {
  const draft = simulate(jobs.product, 'normal');
  assert.equal(inspect(jobs.product, { ...draft, quote: '改写的句子' }).state, 'verify');
  assert.deepEqual(inspect(jobs.product, { ...draft, quote: '改写的句子' }).steps, ['pass', 'stop', 'skip']);
  assert.equal(inspect(jobs.product, { ...draft, claim: '独立主导所有上线项目。' }).state, 'verify');
});
