import pg from 'pg';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ShutdownService } from '../shutdown/shutdown.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor(private readonly shutdownService: ShutdownService,) {
        const pool = new pg.Pool({
            connectionString: process.env.DATABASE_URL
        });
        const adapter = new PrismaPg(pool);

        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        this.shutdownService.register(async () => {
            await this.$disconnect();
        });
    }
}