import { Injectable } from '@nestjs/common';

/**
 * Compares the actual output of a program against the expected output.
 *
 * Normalization strategy (matches most online judges):
 * - Trim leading/trailing whitespace from the full output
 * - Trim each line individually
 * - Normalize CRLF to LF
 * - Collapse multiple consecutive blank lines to a single blank line
 */
@Injectable()
export class OutputEvaluator {
  /**
   * Returns true if the actual output matches the expected output after normalization.
   */
  isCorrect(actual: string, expected: string): boolean {
    return this.normalize(actual) === this.normalize(expected);
  }

  private normalize(output: string): string {
    return output
      .replace(/\r\n/g, '\n') // CRLF → LF
      .split('\n')
      .map((line) => line.trimEnd()) // trim trailing spaces per line
      .join('\n')
      .trim(); // trim overall leading/trailing whitespace
  }
}