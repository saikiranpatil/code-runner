import { Injectable, OnModuleInit } from '@nestjs/common';
import { ShutdownService } from '../shutdown/shutdown.service';
import { PrismaClient } from '@prisma/client/extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor(private readonly shutdownService: ShutdownService) {
        super({
            datasources: {
                db: { url: process.env.DATABASE_URL },
            },
            log: ['error', 'warn'],
        });
    }

    async onModuleInit() {
        await this.$connect();
        this.shutdownService.register(() => this.$disconnect());
    }
}