import { Difficulty, ProblemExample, Visibility } from '../../execution/execution.types';

export class TestCaseEntity {
  id!:  string;
  problemId!:  string;
  input!:  string;
  expectedOutput!:  string;
  isHidden!:  boolean;
  position!:  number;
  createdAt!:  string;
  updatedAt!:  string;
}

export class ProblemEntity {
  id!:  string;
  title!:  string;
  slug!:  string;
  description!:  string;
  constraints!:  string | null;
  inputFormat!:  string | null;
  outputFormat!:  string | null;
  difficulty!:  Difficulty;
  tags!:  string[];
  timeLimitMs!:  number;
  memoryLimitMb!:  number;
  visibility!:  Visibility;
  examples!:  ProblemExample[];
  testCases!:  TestCaseEntity[];
  totalSubmissions!:  number;
  acceptedSubmissions!:  number;
  acceptanceRate!:  number;
  createdAt!:  string;
  updatedAt!:  string;
}

export class PaginatedProblemsEntity {
  problems!:  ProblemEntity[];
  total!:  number;
}