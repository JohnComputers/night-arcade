import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {io} from 'socket.io-client';

const address = new URL(process.argv[2] || 'http://localhost:3001');
assert.ok(address.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(address.hostname), 'Use HTTPS for a public deployment.');
assert.ok(!address.username && !address.password, 'Do not put credentials in the URL.');
const origin = address.origin, sockets = [], states = [];
const ask = (socket, event, payload = {}) => new Promise((resolve, reject) => {
  socket.timeout(10000).emit(event, payload, (error, reply) => {
    if (error) reject(error);
    else if (!reply?.ok) reject(Error(`${event}: ${reply?.message || reply?.error || 'no acknowledgement'}`));
    else resolve(reply);
  });
});
async function waitFor(predicate, label, limit = 12000) {
  const deadline = Date.now() + limit;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw Error(`Timed out waiting for ${label}`);
}
async function connect(index) {
  const socket = io(origin, {transports: ['websocket'], forceNew: true, reconnection: false, timeout: 15000, extraHeaders: {Origin: origin}});
  sockets.push(socket);
  socket.on('room:state', state => { states[index] = state; });
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  assert.equal(socket.io.engine.transport.name, 'websocket');
  return socket;
}
try {
  const health = await fetch(`${origin}/api/health`, {signal: AbortSignal.timeout(120000)});
  assert.ok(health.ok, 'Health endpoint must return success');
  const status = await health.json(); assert.equal(status.ok, true); assert.equal(status.games, 50);
  const page = await fetch(origin, {signal: AbortSignal.timeout(15000)});
  assert.ok(page.ok); assert.match(await page.text(), /Night Arcade/);
  const host = await connect(0), guest = await connect(1);
  const created = await ask(host, 'room:create', {name: 'Deployment QA A', token: randomUUID()});
  const joined = await ask(guest, 'room:join', {name: 'Deployment QA B', token: randomUUID(), code: created.code});
  const refreshed = await fetch(`${origin}/room/${created.code}`, {signal: AbortSignal.timeout(15000)});
  assert.ok(refreshed.ok); assert.match(await refreshed.text(), /Night Arcade/);
  await ask(host, 'game:select', {gameId: 'connect_four'});
  await ask(host, 'game:start');
  await waitFor(() => states.every(state => state?.phase === 'PLAYING') && states.length === 2, 'shared game start');
  let hostSequence = 0, guestSequence = 0;
  for (let turn = 0; turn < 4; turn++) {
    await ask(host, 'game:input', {seq: hostSequence++, action: {type: 'drop', column: 0}});
    if (turn < 3) await ask(guest, 'game:input', {seq: guestSequence++, action: {type: 'drop', column: 1}});
  }
  await waitFor(() => states.every(state => state?.phase === 'RESULTS'), 'matching final results');
  assert.deepEqual(states[0].results, states[1].results);
  assert.equal(states[0].results[0].playerId, created.playerId);
  assert.equal(states[0].results[0].sessionPoints, 5);
  assert.equal(states[0].results.find(result => result.playerId === joined.playerId).sessionPoints, 3);
  await ask(host, 'game:lobby');
  await waitFor(() => states.every(state => state?.phase === 'LOBBY'), 'return to lobby');
  console.log(`Deployment verified at ${origin}: 50-game API, frontend, room refresh, two WebSocket players, complete Connect Four win, matching 5/3 results and lobby return.`);
} finally {
  for (const socket of sockets.reverse()) {
    if (socket.connected) { try { await ask(socket, 'room:leave'); } catch {} }
    socket.disconnect();
  }
}
