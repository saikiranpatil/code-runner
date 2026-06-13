import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupportedLanguage } from '../execution.types';
import {
  LANGUAGE_STRATEGIES,
  LanguageStrategy,
} from './language-strategy.interface';

@Injectable()
export class LanguageRegistry {
  private readonly logger = new Logger(LanguageRegistry.name);
  private readonly registry = new Map<SupportedLanguage, LanguageStrategy>();

  constructor(
    @Inject(LANGUAGE_STRATEGIES)
    strategies: LanguageStrategy[],
  ) {
    for (const strategy of strategies) {
      this.registry.set(strategy.language, strategy);
      this.logger.log(`Registered language strategy: ${strategy.language}`);
    }
  }

  resolve(language: SupportedLanguage): LanguageStrategy {
    const strategy = this.registry.get(language);
    if (!strategy) {
      throw new Error(`No strategy registered for language: ${language}`);
    }
    return strategy;
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return [...this.registry.keys()];
  }
}
