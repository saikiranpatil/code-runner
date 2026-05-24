import { Injectable, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
    private readonly cleanups: (() => Promise<void>)[] = [];

    register(cleanup: () => Promise<void>) {
        this.cleanups.push(cleanup);
    }

    async onApplicationShutdown(signal?: string) {
        console.log(`Shutdown triggered: ${signal}`);

        // run all cleanup tasks in parallel
        await Promise.allSettled(
            this.cleanups.map((fn) => fn()),
        );

        console.log('All resources closed');
    }
}