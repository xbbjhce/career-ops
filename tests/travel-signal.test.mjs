import assert from 'node:assert/strict';
import { annotateTravel, classifyTravel } from '../lib/travel-signal.mjs';

const cases = [
  ['30% travel', 'This role requires 30% travel.', 'Moderate'],
  ['50 percent travel', 'Travel up to 50 percent may be required.', 'High'],
  ['75% business travel', '75% business travel expected.', 'High'],
  ['frequent travel', 'Frequent international travel is required.', 'High'],
  ['extensive travel', 'This position involves extensive travel.', 'High'],
  ['customer site deployment without stated travel frequency', 'Regular customer-site deployment is part of the role.', 'Unknown'],
  ['occasional travel', 'Occasional travel may be required.', 'Low'],
  ['occasional on-site visits', 'The role includes occasional on-site visits to customers.', 'Low'],
  ['negated travel', 'Travel is not required for this role.', 'Low'],
  ['negated frequent travel', 'Frequent travel is not required for this role.', 'Unknown'],
  ['willingness without frequency', 'Willingness to travel is required.', 'Unknown'],
  ['international travel without frequency', 'International travel may be required.', 'Unknown'],
  ['client-site work without frequency', 'Work at customer sites is part of the role.', 'Unknown'],
  ['no travel', 'No business travel is expected.', 'Low'],
  ['absent information', 'The role is based in London and supports customers remotely.', 'Unknown'],
  ['missing description', undefined, 'Unknown'],
];

for (const [name, text, expected] of cases) {
  const result = classifyTravel(text);
  assert.equal(result.level, expected, name);
  if (['High', 'Moderate', 'Low'].includes(expected)) assert.ok(result.evidence.length, `${name}: source evidence`);
  else assert.deepEqual(result.evidence, [], name);
}

const duplicate = classifyTravel('Frequent travel. Frequent travel.');
assert.deepEqual(duplicate.evidence, ['Frequent travel.'], 'duplicate source sentences are collapsed');
const primaryDiscovery = annotateTravel([
  { id: 'valuable-unknown', score: 4.5, description: 'Customer support and implementation.' },
  { id: 'high-travel', score: 3.5, description: 'Extensive travel required.' },
  { id: 'valuable-low-travel', score: 4, description: 'Occasional travel may be required.' },
]);
assert.deepEqual(primaryDiscovery.map((job) => job.id), ['valuable-unknown', 'high-travel', 'valuable-low-travel'], 'travel annotations preserve primary discovery order');
assert.deepEqual(primaryDiscovery.map((job) => job.travel.level), ['Unknown', 'High', 'Low'], 'Unknown remains visible and distinct');
assert.deepEqual(primaryDiscovery.map((job) => job.score), [4.5, 3.5, 4], 'travel annotations never change suitability scores');
assert.equal(primaryDiscovery.length, 3, 'travel annotations never hide otherwise valuable jobs');
console.log('travel-signal: all assertions passed');
