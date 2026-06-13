import { SupportedLanguage } from '../execution.types';

/**
 * Describes how to run a specific language inside a Docker container.
 *
 * Each strategy is responsible for:
 * - Specifying the Docker image to use
 * - Writing source code to the temp directory in the correct filename/format
 * - Providing the compile command (null if interpreted)
 * - Providing the run command
 */
export interface LanguageStrategy {
  readonly language: SupportedLanguage;

  /**
   * The Docker image to use for this language.
   * Should be a minimal, trusted, pinned image.
   */
  readonly dockerImage: string;

  /**
   * Filename for the source file inside the container working directory.
   * e.g. "solution.py", "Main.java", "solution.cpp"
   */
  readonly sourceFileName: string;

  /**
   * Returns the shell command to compile the source file.
   * Return null for interpreted languages (Python, JS).
   * The command runs inside the container's /sandbox directory.
   */
  getCompileCommand(): string | null;

  /**
   * Returns the shell command to execute the compiled or interpreted code.
   * stdin will be piped in; stdout/stderr will be captured.
   */
  getRunCommand(): string;
}

/**
 * Token used for the NestJS injection array.
 */
export const LANGUAGE_STRATEGIES = 'LANGUAGE_STRATEGIES';
