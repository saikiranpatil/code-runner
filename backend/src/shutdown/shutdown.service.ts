import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
    private readonly cleanups: (() => Promise<void>)[] = [];
    constructor(private readonly logger: Logger) { }

    register(cleanup: () => Promise<void>) {
        this.cleanups.push(cleanup);
    }

    async onApplicationShutdown(signal?: string) {
        this.logger.log(`Shutdown triggered: ${signal}`);

        const results = await Promise.allSettled(
            this.cleanups.map((fn) => fn()),
        );

        results.forEach((r, i) => {
            if (r.status === 'rejected') {
                this.logger.error(`Cleanup task ${i} failed`, r.reason);
            }
        });

        this.logger.log('All resources closed');
    }
}