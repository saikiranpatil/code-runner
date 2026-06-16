import { Injectable } from '@nestjs/common';
import { SupportedLanguage } from '../execution.types';
import { LanguageStrategy } from './language-strategy.interface';

@Injectable()
export class JavaScriptStrategy implements LanguageStrategy {
  readonly language = SupportedLanguage.JAVASCRIPT;
  readonly dockerImage = 'node:20-alpine';
  readonly sourceFileName = 'solution.js';

  getCompileCommand(): null {
    return null;
  }

  getRunCommand(): string {
    return 'node solution.js';
  }
}

/**
 * TypeScript runner.
 * Compiles with ts-node so no separate compile step is needed.
 * ts-node is available in the image via global install.
 */
@Injectable()
export class TypeScriptStrategy implements LanguageStrategy {
  readonly language = SupportedLanguage.TYPESCRIPT;
  readonly dockerImage = 'node:20-alpine';
  readonly sourceFileName = 'solution.ts';

  getCompileCommand(): null {
    // ts-node handles compilation + execution in one step
    return null;
  }

  getRunCommand(): string {
    return 'npx --yes ts-node --skipProject solution.ts';
  }
}

/**
 * Python 3 runner.
 * python:3.12-alpine — minimal footprint.
 */
@Injectable()
export class PythonStrategy implements LanguageStrategy {
  readonly language = SupportedLanguage.PYTHON;
  readonly dockerImage = 'python:3.12-alpine';
  readonly sourceFileName = 'solution.py';

  getCompileCommand(): null {
    return null;
  }

  getRunCommand(): string {
    return 'python3 solution.py';
  }
}

/**
 * C++ runner.
 * Compile with g++ -O2 first, then run the binary.
 */
@Injectable()
export class CppStrategy implements LanguageStrategy {
  readonly language = SupportedLanguage.CPP;
  readonly dockerImage = 'gcc:13-bookworm';
  readonly sourceFileName = 'solution.cpp';

  getCompileCommand(): string {
    return 'g++ -O2 -o solution solution.cpp -lm';
  }

  getRunCommand(): string {
    return './solution';
  }
}

/**
 * Java runner.
 * Compile with javac, then run the class named "Solution".
 *
 * Tradeoff: JVM startup adds ~200–400 ms to execution time.
 * This is expected and should be subtracted from the user-facing time display
 * or accounted for in the time limit configuration per-problem.
 */
@Injectable()
export class JavaStrategy implements LanguageStrategy {
  readonly language = SupportedLanguage.JAVA;
  readonly dockerImage = 'eclipse-temurin:21-jdk';
  readonly sourceFileName = 'Solution.java';

  getCompileCommand(): string {
    return 'javac Solution.java';
  }

  getRunCommand(): string {
    // -Xmx is set separately per container memory limit
    return 'java -Xss64m Solution';
  }
}
