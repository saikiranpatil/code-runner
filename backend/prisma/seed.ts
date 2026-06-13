import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Visibility } from "../src/prisma/generated/client";
import { Difficulty } from '../src/modules/execution/execution.types';
import { InputJsonValue } from '@prisma/client/runtime/client';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);

// initialize Prisma Client
const prisma = new PrismaClient({ adapter });

async function loadDefaultUsers() {
    // create two dummy users
    const user1 = await prisma.user.upsert({
        where: { email: 'sabin@adams.com' },
        update: {},
        create: {
            email: 'sabin@adams.com',
            name: 'Sabin Adams',
            passwordHash: 'password-sabin',
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'alex@ruheni.com' },
        update: {},
        create: {
            email: 'alex@ruheni.com',
            name: 'Alex Ruheni',
            passwordHash: 'password-alex',
        },
    });

    console.log({ user1, user2 });
}


const problems: ProblemSeed[] = [
  // ── 1. Two Sum ─────────────────────────────────────────────────────────────
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: Difficulty.EASY,
    tags: ['array', 'hash-table'],
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers that add up to \`target\`.

You may assume that each input has **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: `- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- Only one valid answer exists.`,
    inputFormat: `Line 1: space-separated integers representing \`nums\`
Line 2: integer \`target\``,
    outputFormat: `Two space-separated integers representing the 0-based indices.`,
    examples: [
      {
        input: '2 7 11 15\n9',
        output: '0 1',
        explanation: 'nums[0] + nums[1] = 2 + 7 = 9, so we return [0, 1].',
      },
      {
        input: '3 2 4\n6',
        output: '1 2',
        explanation: 'nums[1] + nums[2] = 2 + 4 = 6.',
      },
    ],
    testCases: [
      // visible (sample)
      { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false, position: 0 },
      { input: '3 2 4\n6', expectedOutput: '1 2', isHidden: false, position: 1 },
      { input: '3 3\n6', expectedOutput: '0 1', isHidden: false, position: 2 },
      // hidden
      { input: '1 2 3 4 5 6 7 8 9 10\n19', expectedOutput: '8 9', isHidden: true, position: 3 },
      { input: '-3 4 3 90\n0', expectedOutput: '0 2', isHidden: true, position: 4 },
      { input: '0 4 3 0\n0', expectedOutput: '0 3', isHidden: true, position: 5 },
      { input: '1000000000 -1000000000 1 -1\n0', expectedOutput: '0 1', isHidden: true, position: 6 },
      { input: '5 1 3 2 7 4 6\n11', expectedOutput: '0 4', isHidden: true, position: 7 },
    ],
  },

  // ── 2. Reverse a Linked List (array-based I/O) ─────────────────────────────
  {
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    difficulty: Difficulty.EASY,
    tags: ['linked-list', 'recursion'],
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    description: `Given the \`head\` of a singly linked list, reverse the list and return the reversed list.

For this problem, the linked list is represented as a space-separated sequence of integers. Output the reversed sequence.`,
    constraints: `- \`0 <= number of nodes <= 5000\`
- \`-5000 <= Node.val <= 5000\``,
    inputFormat: `A single line of space-separated integers representing the linked list values from head to tail. An empty line represents an empty list.`,
    outputFormat: `A single line of space-separated integers representing the reversed list. Print an empty line for an empty list.`,
    examples: [
      { input: '1 2 3 4 5', output: '5 4 3 2 1', explanation: 'Standard reversal.' },
      { input: '1 2', output: '2 1' },
      { input: '1', output: '1', explanation: 'Single node — already reversed.' },
    ],
    testCases: [
      { input: '1 2 3 4 5', expectedOutput: '5 4 3 2 1', isHidden: false, position: 0 },
      { input: '1 2', expectedOutput: '2 1', isHidden: false, position: 1 },
      { input: '1', expectedOutput: '1', isHidden: false, position: 2 },
      { input: '', expectedOutput: '', isHidden: false, position: 3 },
      { input: '10 20 30 40 50 60 70 80 90 100', expectedOutput: '100 90 80 70 60 50 40 30 20 10', isHidden: true, position: 4 },
      { input: '-5 -4 -3 -2 -1', expectedOutput: '-1 -2 -3 -4 -5', isHidden: true, position: 5 },
      { input: '0', expectedOutput: '0', isHidden: true, position: 6 },
    ],
  },

  // ── 3. Valid Parentheses ────────────────────────────────────────────────────
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: Difficulty.EASY,
    tags: ['string', 'stack'],
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: `- \`1 <= s.length <= 10^4\`
- \`s\` consists of parentheses only \`'()[]{}'.\``,
    inputFormat: `A single line containing the string \`s\`.`,
    outputFormat: `Print \`true\` if the string is valid, \`false\` otherwise.`,
    examples: [
      { input: '()', output: 'true' },
      { input: '()[]{}'  , output: 'true' },
      { input: '(]', output: 'false' },
    ],
    testCases: [
      { input: '()', expectedOutput: 'true', isHidden: false, position: 0 },
      { input: '()[]{}', expectedOutput: 'true', isHidden: false, position: 1 },
      { input: '(]', expectedOutput: 'false', isHidden: false, position: 2 },
      { input: '([)]', expectedOutput: 'false', isHidden: false, position: 3 },
      { input: '{[]}', expectedOutput: 'true', isHidden: false, position: 4 },
      // hidden
      { input: '', expectedOutput: 'true', isHidden: true, position: 5 },
      { input: '[', expectedOutput: 'false', isHidden: true, position: 6 },
      { input: '((((((((', expectedOutput: 'false', isHidden: true, position: 7 },
      { input: '(){}[](){}[]', expectedOutput: 'true', isHidden: true, position: 8 },
      { input: '{[()]}', expectedOutput: 'true', isHidden: true, position: 9 },
      { input: '([{[({([])})]}){}]', expectedOutput: 'false', isHidden: true, position: 10 },
    ],
  },

  // ── 4. Binary Search ───────────────────────────────────────────────────────
  {
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: Difficulty.EASY,
    tags: ['array', 'binary-search'],
    timeLimitMs: 500,
    memoryLimitMb: 128,
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`.

If \`target\` exists, return its index. Otherwise, return \`-1\`.

You must write an algorithm with **O(log n)** runtime complexity.`,
    constraints: `- \`1 <= nums.length <= 10^4\`
- \`-10^4 <= nums[i], target <= 10^4\`
- All the integers in \`nums\` are unique.
- \`nums\` is sorted in ascending order.`,
    inputFormat: `Line 1: space-separated sorted integers \`nums\`
Line 2: integer \`target\``,
    outputFormat: `A single integer — the index of target, or \`-1\` if not found.`,
    examples: [
      { input: '-1 0 3 5 9 12\n9', output: '4', explanation: '9 exists in nums at index 4.' },
      { input: '-1 0 3 5 9 12\n2', output: '-1', explanation: '2 does not exist in nums.' },
    ],
    testCases: [
      { input: '-1 0 3 5 9 12\n9', expectedOutput: '4', isHidden: false, position: 0 },
      { input: '-1 0 3 5 9 12\n2', expectedOutput: '-1', isHidden: false, position: 1 },
      { input: '5\n5', expectedOutput: '0', isHidden: false, position: 2 },
      // hidden
      { input: '1 2 3 4 5 6 7 8 9 10\n1', expectedOutput: '0', isHidden: true, position: 3 },
      { input: '1 2 3 4 5 6 7 8 9 10\n10', expectedOutput: '9', isHidden: true, position: 4 },
      { input: '1 2 3 4 5 6 7 8 9 10\n5', expectedOutput: '4', isHidden: true, position: 5 },
      { input: '1 2 3 4 5 6 7 8 9 10\n11', expectedOutput: '-1', isHidden: true, position: 6 },
      { input: '-10000 -5000 0 5000 10000\n-10000', expectedOutput: '0', isHidden: true, position: 7 },
      { input: '-10000 -5000 0 5000 10000\n10000', expectedOutput: '4', isHidden: true, position: 8 },
    ],
  },

  // ── 5. Merge Sort ──────────────────────────────────────────────────────────
  {
    title: 'Sort an Array',
    slug: 'sort-an-array',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'divide-and-conquer', 'sorting', 'merge-sort'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    description: `Given an array of integers \`nums\`, sort the array in ascending order and return it.

You must solve the problem **without using any built-in sort functions** in a language-defined standard library, using only a comparison-based sorting algorithm with worst-case **O(n log n)** time complexity.`,
    constraints: `- \`1 <= nums.length <= 5 * 10^4\`
- \`-5 * 10^4 <= nums[i] <= 5 * 10^4\``,
    inputFormat: `A single line of space-separated integers.`,
    outputFormat: `A single line of space-separated integers sorted in ascending order.`,
    examples: [
      { input: '5 2 3 1', output: '1 2 3 5' },
      { input: '5 1 1 2 0 0', output: '0 0 1 1 2 5' },
    ],
    testCases: [
      { input: '5 2 3 1', expectedOutput: '1 2 3 5', isHidden: false, position: 0 },
      { input: '5 1 1 2 0 0', expectedOutput: '0 0 1 1 2 5', isHidden: false, position: 1 },
      { input: '1', expectedOutput: '1', isHidden: false, position: 2 },
      // hidden
      { input: '3 1 2', expectedOutput: '1 2 3', isHidden: true, position: 3 },
      { input: '-5 -1 -3 -2 -4', expectedOutput: '-5 -4 -3 -2 -1', isHidden: true, position: 4 },
      { input: '10 9 8 7 6 5 4 3 2 1', expectedOutput: '1 2 3 4 5 6 7 8 9 10', isHidden: true, position: 5 },
      { input: '1 2 3 4 5 6 7 8 9 10', expectedOutput: '1 2 3 4 5 6 7 8 9 10', isHidden: true, position: 6 },
      { input: '0 0 0 0 0', expectedOutput: '0 0 0 0 0', isHidden: true, position: 7 },
      { input: '-50000 50000 -25000 25000 0', expectedOutput: '-50000 -25000 0 25000 50000', isHidden: true, position: 8 },
    ],
  },

  // ── 6. Longest Common Subsequence ─────────────────────────────────────────
  {
    title: 'Longest Common Subsequence',
    slug: 'longest-common-subsequence',
    difficulty: Difficulty.MEDIUM,
    tags: ['string', 'dynamic-programming'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    description: `Given two strings \`text1\` and \`text2\`, return the **length** of their longest common subsequence. If there is no common subsequence, return \`0\`.

A **subsequence** of a string is a new string generated from the original string by deleting some (or no) characters without changing the relative order of the remaining characters.

For example, \`"ace"\` is a subsequence of \`"abcde"\`.

A **common subsequence** of two strings is a subsequence that is common to both strings.`,
    constraints: `- \`1 <= text1.length, text2.length <= 1000\`
- \`text1\` and \`text2\` consist of only lowercase English characters.`,
    inputFormat: `Line 1: string \`text1\`
Line 2: string \`text2\``,
    outputFormat: `A single integer — the length of the longest common subsequence.`,
    examples: [
      { input: 'abcde\nace', output: '3', explanation: 'The longest common subsequence is "ace" with length 3.' },
      { input: 'abc\nabc', output: '3', explanation: 'The longest common subsequence is "abc" with length 3.' },
      { input: 'abc\ndef', output: '0', explanation: 'There is no common subsequence.' },
    ],
    testCases: [
      { input: 'abcde\nace', expectedOutput: '3', isHidden: false, position: 0 },
      { input: 'abc\nabc', expectedOutput: '3', isHidden: false, position: 1 },
      { input: 'abc\ndef', expectedOutput: '0', isHidden: false, position: 2 },
      // hidden
      { input: 'a\na', expectedOutput: '1', isHidden: true, position: 3 },
      { input: 'a\nb', expectedOutput: '0', isHidden: true, position: 4 },
      { input: 'bl\nyby', expectedOutput: '1', isHidden: true, position: 5 },
      { input: 'oxcpqrsvwf\nshmtulqrypy', expectedOutput: '2', isHidden: true, position: 6 },
      { input: 'ezupkr\nubmrapg', expectedOutput: '2', isHidden: true, position: 7 },
      { input: 'abcba\nabcbca', expectedOutput: '4', isHidden: true, position: 8 },
      { input: 'hofubmnylkra\nzjnmdgklqafr', expectedOutput: '5', isHidden: true, position: 9 },
    ],
  },

  // ── 7. Number of Islands ───────────────────────────────────────────────────
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'depth-first-search', 'breadth-first-search', 'graph', 'union-find'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    constraints: `- \`1 <= m, n <= 300\`
- \`grid[i][j]\` is \`'0'\` or \`'1'\``,
    inputFormat: `Line 1: two integers \`m\` and \`n\` (rows and columns)
Next \`m\` lines: each containing \`n\` characters (\`0\` or \`1\`) with no separators.`,
    outputFormat: `A single integer — the number of islands.`,
    examples: [
      {
        input: '4 5\n11110\n11010\n11000\n00000',
        output: '1',
        explanation: 'All connected 1s form one island.',
      },
      {
        input: '4 5\n11000\n11000\n00100\n00011',
        output: '3',
        explanation: 'Three separate islands.',
      },
    ],
    testCases: [
      { input: '4 5\n11110\n11010\n11000\n00000', expectedOutput: '1', isHidden: false, position: 0 },
      { input: '4 5\n11000\n11000\n00100\n00011', expectedOutput: '3', isHidden: false, position: 1 },
      { input: '1 1\n1', expectedOutput: '1', isHidden: false, position: 2 },
      { input: '1 1\n0', expectedOutput: '0', isHidden: false, position: 3 },
      // hidden
      { input: '3 3\n111\n010\n111', expectedOutput: '1', isHidden: true, position: 4 },
      { input: '3 3\n101\n010\n101', expectedOutput: '5', isHidden: true, position: 5 },
      { input: '1 5\n10101', expectedOutput: '3', isHidden: true, position: 6 },
      { input: '5 1\n1\n0\n1\n0\n1', expectedOutput: '3', isHidden: true, position: 7 },
      { input: '3 5\n00000\n00000\n00000', expectedOutput: '0', isHidden: true, position: 8 },
      { input: '3 5\n11111\n11111\n11111', expectedOutput: '1', isHidden: true, position: 9 },
      { input: '5 5\n10000\n01000\n00100\n00010\n00001', expectedOutput: '5', isHidden: true, position: 10 },
    ],
  },

  // ── 8. Trapping Rain Water ─────────────────────────────────────────────────
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: Difficulty.HARD,
    tags: ['array', 'two-pointers', 'dynamic-programming', 'stack', 'monotonic-stack'],
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    constraints: `- \`n == height.length\`
- \`1 <= n <= 2 * 10^4\`
- \`0 <= height[i] <= 10^5\``,
    inputFormat: `A single line of space-separated non-negative integers representing heights.`,
    outputFormat: `A single integer — the total units of water trapped.`,
    examples: [
      {
        input: '0 1 0 2 1 0 1 3 2 1 2 1',
        output: '6',
        explanation: 'The above elevation map traps 6 units of rain water.',
      },
      { input: '4 2 0 3 2 5', output: '9' },
    ],
    testCases: [
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isHidden: false, position: 0 },
      { input: '4 2 0 3 2 5', expectedOutput: '9', isHidden: false, position: 1 },
      { input: '1 0 1', expectedOutput: '1', isHidden: false, position: 2 },
      { input: '3 0 0 2 0 4', expectedOutput: '10', isHidden: false, position: 3 },
      // hidden
      { input: '0', expectedOutput: '0', isHidden: true, position: 4 },
      { input: '1 2 3 4 5', expectedOutput: '0', isHidden: true, position: 5 },
      { input: '5 4 3 2 1', expectedOutput: '0', isHidden: true, position: 6 },
      { input: '5 0 5', expectedOutput: '5', isHidden: true, position: 7 },
      { input: '0 0 0 0 0', expectedOutput: '0', isHidden: true, position: 8 },
      { input: '100000 0 100000', expectedOutput: '100000', isHidden: true, position: 9 },
      { input: '1 2 3 2 1 0 1 2 3 2 1', expectedOutput: '8', isHidden: true, position: 10 },
      { input: '2 0 2', expectedOutput: '2', isHidden: true, position: 11 },
    ],
  },
];

interface TestCaseSeed {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  position: number;
}

interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

interface ProblemSeed {
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  description: string;
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  examples: InputJsonValue[];
  testCases: TestCaseSeed[];
}

async function loadDefaultProblems() {
    console.log('🌱  Starting seed...\n');

    for (const p of problems) {
        // Upsert the problem (idempotent — safe to run multiple times)
        const problem = await prisma.problem.upsert({
            where: { slug: p.slug },
            update: {
                title: p.title,
                description: p.description,
                constraints: p.constraints,
                inputFormat: p.inputFormat,
                outputFormat: p.outputFormat,
                difficulty: p.difficulty,
                tags: p.tags,
                timeLimitMs: p.timeLimitMs,
                memoryLimitMb: p.memoryLimitMb,
                visibility: Visibility.PUBLIC,
                examples: p.examples,
            },
            create: {
                title: p.title,
                slug: p.slug,
                description: p.description,
                constraints: p.constraints,
                inputFormat: p.inputFormat,
                outputFormat: p.outputFormat,
                difficulty: p.difficulty,
                tags: p.tags,
                timeLimitMs: p.timeLimitMs,
                memoryLimitMb: p.memoryLimitMb,
                visibility: Visibility.PUBLIC,
                examples: p.examples,
            },
        });

        // Delete existing test cases so we can re-seed cleanly
        await prisma.testCase.deleteMany({ where: { problemId: problem.id } });

        // Recreate all test cases
        await prisma.testCase.createMany({
            data: p.testCases.map((tc) => ({
                problemId: problem.id,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: tc.isHidden,
                position: tc.position,
            })),
        });

        const visible = p.testCases.filter((tc) => !tc.isHidden).length;
        const hidden = p.testCases.filter((tc) => tc.isHidden).length;

        console.log(
            `  ✅  [${p.difficulty.padEnd(6)}]  ${p.title.padEnd(35)}` +
            `${p.testCases.length} test cases (${visible} visible, ${hidden} hidden)`,
        );
    }

    console.log(`\n✨  Seeded ${problems.length} problems successfully.`);
}

async function main() {
    // load default users
    await loadDefaultUsers();

    // load default problems
    await loadDefaultProblems();
}

// execute the main function
main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        // close Prisma Client at the end
        await prisma.$disconnect();
    });