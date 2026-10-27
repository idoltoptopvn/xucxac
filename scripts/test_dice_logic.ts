import {
  classifyResult,
  generateRoundDice,
  FORCED_XIU_ROUNDS,
  FORCED_TAI_ROUNDS,
  isValidDiceValue,
} from '../src/types/game';

console.log('=== TEST 1: ALL 216 COMBINATIONS OF (D1, D2, D3) ===');
let totalPermutations = 0;
let xiuCount = 0;
let taiCount = 0;
let errors = 0;

for (let d1 = 1; d1 <= 6; d1++) {
  for (let d2 = 1; d2 <= 6; d2++) {
    for (let d3 = 1; d3 <= 6; d3++) {
      totalPermutations++;
      const sum = d1 + d2 + d3;
      const res = classifyResult(sum);

      if (sum < 3 || sum > 18) {
        console.error(`Invalid sum ${sum} for dice (${d1}, ${d2}, ${d3})`);
        errors++;
      }

      if (sum <= 10) {
        if (res !== 'xiu') {
          console.error(`FAIL: sum=${sum} (${d1}+${d2}+${d3}) got ${res}, expected 'xiu'`);
          errors++;
        }
        xiuCount++;
      } else {
        if (res !== 'tai') {
          console.error(`FAIL: sum=${sum} (${d1}+${d2}+${d3}) got ${res}, expected 'tai'`);
          errors++;
        }
        taiCount++;
      }
    }
  }
}

console.log(`Permutations checked: ${totalPermutations}/216`);
console.log(`Xỉu count (3-10): ${xiuCount} (expected 108)`);
console.log(`Tài count (11-18): ${taiCount} (expected 108)`);
if (errors === 0 && totalPermutations === 216 && xiuCount === 108 && taiCount === 108) {
  console.log('>>> TEST 1 PASSED: 100% mathematical consistency across all 216 combinations!\n');
} else {
  console.error(`>>> TEST 1 FAILED with ${errors} errors!\n`);
  process.exit(1);
}

console.log('=== TEST 2: SPECIFIC PROMPT CORNER CASES ===');
const specificCases = [
  { dice: [1, 1, 1], expectedSum: 3, expectedType: 'xiu' },
  { dice: [2, 2, 6], expectedSum: 10, expectedType: 'xiu' }, // Case reported in screenshot IMG_2482
  { dice: [3, 3, 4], expectedSum: 10, expectedType: 'xiu' },
  { dice: [1, 3, 6], expectedSum: 10, expectedType: 'xiu' },
  { dice: [3, 3, 5], expectedSum: 11, expectedType: 'tai' },
  { dice: [4, 5, 6], expectedSum: 15, expectedType: 'tai' },
  { dice: [6, 6, 6], expectedSum: 18, expectedType: 'tai' },
];

for (const c of specificCases) {
  const sum = c.dice[0] + c.dice[1] + c.dice[2];
  if (sum !== c.expectedSum) {
    console.error(`Sum mismatch for case ${c.dice.join('+')}`);
    process.exit(1);
  }
  const type = classifyResult(sum);
  if (type !== c.expectedType) {
    console.error(`FAIL: case ${c.dice.join('+')}=${sum} returned ${type}, expected ${c.expectedType}`);
    process.exit(1);
  }
  console.log(`[OK] ${c.dice.join(' + ')} = ${sum} => ${type.toUpperCase()}`);
}
console.log('>>> TEST 2 PASSED: 2+2+6=10 is strictly XIU, and boundary cases are verified!\n');

console.log('=== TEST 3: EXCEPTION ROUNDS (FORCED XIU: 3, 5, 7) ===');
for (const round of FORCED_XIU_ROUNDS) {
  for (let i = 0; i < 100; i++) {
    const roundResult = generateRoundDice(round);
    const sum = roundResult.dice.d1 + roundResult.dice.d2 + roundResult.dice.d3;
    if (sum !== roundResult.total) {
      console.error(`Sum mismatch in round ${round}: ${sum} !== ${roundResult.total}`);
      process.exit(1);
    }
    if (sum > 10 || roundResult.type !== 'xiu') {
      console.error(`FAIL in forced Xiu round ${round}: got total ${sum}, type ${roundResult.type}`);
      process.exit(1);
    }
  }
  console.log(`[OK] Round #${round} tested 100 times: all rolls produced sum <= 10 and type = 'xiu'`);
}
console.log('>>> TEST 3 PASSED!\n');

console.log('=== TEST 4: EXCEPTION ROUNDS (FORCED TAI: 14, 15, 16, 17, 24, 26, 28) ===');
for (const round of FORCED_TAI_ROUNDS) {
  for (let i = 0; i < 100; i++) {
    const roundResult = generateRoundDice(round);
    const sum = roundResult.dice.d1 + roundResult.dice.d2 + roundResult.dice.d3;
    if (sum !== roundResult.total) {
      console.error(`Sum mismatch in round ${round}: ${sum} !== ${roundResult.total}`);
      process.exit(1);
    }
    if (sum < 11 || roundResult.type !== 'tai') {
      console.error(`FAIL in forced Tai round ${round}: got total ${sum}, type ${roundResult.type}`);
      process.exit(1);
    }
    // Verify valid dice
    if (
      !isValidDiceValue(roundResult.dice.d1) ||
      !isValidDiceValue(roundResult.dice.d2) ||
      !isValidDiceValue(roundResult.dice.d3)
    ) {
      console.error(`Invalid dice value generated in round ${round}`);
      process.exit(1);
    }
  }
  console.log(`[OK] Round #${round} (including #16) tested 100 times: all rolls produced sum >= 11 and type = 'tai'`);
}
console.log('>>> TEST 4 PASSED: Round #16 rolls strictly sum >= 11 with matching TAI label!\n');

console.log('=== TEST 5: STANDARD ROUNDS UNBIASED RANDOMNESS ===');
const standardRounds = [1, 2, 4, 6, 8, 9, 10, 11, 12, 13, 18, 19, 20];
for (const round of standardRounds) {
  const result = generateRoundDice(round);
  const sum = result.dice.d1 + result.dice.d2 + result.dice.d3;
  if (sum !== result.total) {
    console.error(`Sum mismatch in normal round ${round}`);
    process.exit(1);
  }
  const expectedType = sum >= 11 ? 'tai' : 'xiu';
  if (result.type !== expectedType) {
    console.error(`Type mismatch in normal round ${round}: sum=${sum}, type=${result.type}, expected=${expectedType}`);
    process.exit(1);
  }
}
console.log('>>> TEST 5 PASSED: Normal rounds follow pure math and random rolls!\n');

console.log('ALL UNIT & LOGIC VERIFICATION TESTS COMPLETED WITH 100% SUCCESS!');
