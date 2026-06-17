import { Difficulty, AttemptStatus, ProblemExample, Visibility } from '../../execution/execution.types';

export class TestCaseEntity {
  id!: string;
  problemId!: string;
  input!: string;
  expectedOutput!: string;
  isHidden!: boolean;
  position!: number;
  createdAt!: string;
  updatedAt!: string;
}

export class ProblemStats {
  status!: AttemptStatus;
  totalSubmissions!: number;
  acceptedSubmissions!: number;
}

export class ProblemEntity extends ProblemStats {
  id!: string;
  title!: string;
  slug!: string;
  description!: string;
  constraints!: string | null;
  inputFormat!: string | null;
  outputFormat!: string | null;
  difficulty!: Difficulty;
  tags!: string[];
  timeLimitMs!: number;
  memoryLimitMb!: number;
  visibility!: Visibility;
  examples!: ProblemExample[];
  testCases!: TestCaseEntity[];
  acceptanceRate!: number;
  createdAt!: string;
  updatedAt!: string;
};

export class PaginatedProblemsEntity {
  problems!: ProblemEntity[];
  total!: number;
}