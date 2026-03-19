
import { getAppMode } from '@/utils/env';

export type AppMode = 'local' | 'cloud';

export abstract class BaseRepository {
  protected mode: AppMode;

  constructor() {
    this.mode = getAppMode();
  }

  /**
   * Helper to execute the correct logic based on the current mode.
   */
  protected async execute<T>(localFn: () => Promise<T>, cloudFn: () => Promise<T>): Promise<T> {
    if (this.mode === 'local') {
      return localFn();
    }
    return cloudFn();
  }
}
