import test from 'node:test';
import assert from 'node:assert/strict';
import * as bank from '../server/content/party.js';

test('expanded offline content meets every new bank minimum with unique entries',()=>{
  const checks:[string,unknown[],number][]=[['drawing',bank.drawingWords,150],['impostor',bank.impostorPairs,100],['odd drawing',bank.oddDrawingPairs,75],['trivia',bank.trivia,150],['typing',bank.typingPhrases,75],['liar',bank.liarPrompts,75],['fake',bank.fakePrompts,75],['password',bank.passwordWords,100],['emoji',bank.emoji,100],['rather',bank.wouldRather,100],['majority',bank.majorityPrompts,75],['minority',bank.minorityPrompts,75],['numeric',bank.numeric,100],['scramble',bank.scrambleWords,250],['hangman',bank.hangmanWords,200]];
  for(const [label,items,min] of checks){assert.ok(items.length>=min,`${label}: ${items.length} / ${min}`);assert.equal(new Set(items.map(item=>JSON.stringify(item))).size,items.length,`${label}: duplicate entry`);}
  assert.ok(new Set(Object.values(bank.categories).flat()).size>=1000,'at least 1000 different accepted category words');
});
test('content answers, choice counts, lengths and word-chain coverage are consistent',()=>{
  for(const item of bank.trivia){assert.equal(item.options.length,4);assert.equal(new Set(item.options).size,4);assert.ok(item.options.includes(item.answer));assert.ok(item.category);assert.ok(item.difficulty!>=1);}
  assert.equal(new Set(bank.trivia.map(q=>q.question)).size,bank.trivia.length);
  assert.equal(new Set(bank.numeric.map(q=>q.question)).size,bank.numeric.length);
  assert.equal(new Set(bank.fakePrompts.map(q=>q.question)).size,bank.fakePrompts.length);
  for(const item of bank.numeric)assert.ok(Number.isFinite(item.answer));
  for(const phrase of bank.typingPhrases)assert.ok(phrase.length>=40&&phrase.length<=180,`typing length ${phrase.length}: ${phrase}`);
  for(const word of bank.scrambleWords)assert.match(word,/^[a-z]{4,12}$/);
  for(const pair of bank.oddDrawingPairs)assert.notEqual(pair.normal,pair.odd);
  for(const prompt of [...bank.majorityPrompts,...bank.minorityPrompts]){assert.ok(prompt.options.length>=2&&prompt.options.length<=6);assert.equal(new Set(prompt.options).size,prompt.options.length);}
  const initials=new Set(bank.commonWords.map(word=>word[0]));for(const word of bank.commonWords){assert.match(word,/^[a-z]{2,}$/);assert.ok(initials.has(word.at(-1)!));}
});
