import { Injectable, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
    private readonly cleanups: (() => Promise<void>)[] = [];

    register(cleanup: () => Promise<void>) {
        this.cleanups.push(cleanup);
    }

    async onApplicationShutdown(signal?: string) {
        console.log(`Shutdown triggered: ${signal}`);

        const results = await Promise.allSettled(
            this.cleanups.map((fn) => fn()),
        );

        results.forEach((r, i) => {
            if (r.status === 'rejected') {
                console.error(`Cleanup task ${i} failed`, r.reason);
            }
        });

        console.log('All resources closed');
    }
}