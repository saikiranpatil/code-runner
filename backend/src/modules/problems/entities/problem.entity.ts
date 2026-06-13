import { Difficulty, ProblemExample, Visibility } from '../../execution/execution.types';

export class TestCaseEntity {
  id!: string;
  problemId!: string;
  input!: string;
  expectedOutput!: string;
  isHidden!: boolean;
  createdAt!: Date;
}

export class ProblemEntity {
  id!: string;
  title!: string;
  slug!: string;
  description!: string;
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  difficulty!: Difficulty;
  tags!: string[];
  timeLimitMs!: number;
  memoryLimitMb!: number;
  visibility!: Visibility;
  examples!: ProblemExample[];
  testCases?: TestCaseEntity[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class PaginatedProblemsEntity {
  data!: Omit<ProblemEntity, 'testCases'>[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}
