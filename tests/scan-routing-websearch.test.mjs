import assert from 'node:assert/strict';
import { test } from 'node:test';
import taleo from '../providers/taleo.mjs';
import { resolveScanRoute } from '../providers/_registry.mjs';

test('explicit WebSearch routing bypasses automatic Taleo detection and preserves its query', () => {
  let detectCalls = 0;
  const provider = {
    ...taleo,
    detect(entry) {
      detectCalls++;
      return taleo.detect(entry);
    },
  };
  const nato = {
    name: 'NATO',
    careers_url: 'https://nato.taleo.net/careersection/2/jobsearch.ftl?lang=en',
    scan_method: 'websearch',
    scan_query: 'site:nato.taleo.net/careersection/ "technical support"',
  };

  assert.deepEqual(resolveScanRoute(nato, new Map([['taleo', provider]])), {
    method: 'websearch',
    query: nato.scan_query,
  });
  assert.equal(detectCalls, 0, 'WebSearch route must not invoke automatic provider detection');
});

test('entries without explicit WebSearch routing retain normal provider auto-detection', () => {
  const entry = {
    name: 'Taleo tenant',
    careers_url: 'https://example.taleo.net/careersection/1/jobsearch.ftl?lang=en',
  };
  const route = resolveScanRoute(entry, new Map([['taleo', taleo]]));
  assert.equal(route.method, 'provider');
  assert.equal(route.provider, taleo);
});

test('explicit provider selection retains precedence over WebSearch routing metadata', () => {
  const explicit = { id: 'custom', fetch: async () => [], detect: () => null };
  const entry = { name: 'Explicit', provider: 'custom', scan_method: 'websearch', scan_query: 'unused' };
  const route = resolveScanRoute(entry, new Map([['custom', explicit]]));
  assert.equal(route.method, 'provider');
  assert.equal(route.provider, explicit);
});
