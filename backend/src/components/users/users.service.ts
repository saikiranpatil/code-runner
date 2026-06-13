import { Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { RegisterDto } from '../auth/dto/register.dto';
import { randomBytes } from 'crypto';
import { email } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User } from '../../prisma/generated/client';
import { BCRYPT_ROUNDS } from '../../common/constants';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findById(id: number): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
    }

    async create(dto: RegisterDto): Promise<User> {
        const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
        return this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase().trim(),
                name: dto.name,
                passwordHash,
            },
        });
    }

    async update(params: {
        where: Prisma.UserWhereUniqueInput;
        data: Prisma.UserUpdateInput;
    }): Promise<User> {
        return this.prisma.user.update(params);
    }

    async delete(where: Prisma.UserWhereUniqueInput): Promise<User> {
        return this.prisma.user.delete({ where });
    }

    /**
     * Upsert an OAuth user by email. Creates with a random unusable password
     * if the user doesn't exist yet.
     */
    async createOAuthUser(data: {
        email: string;
        name?: string;
        avatarUrl?: string;
    }): Promise<User> {
        const email = data.email.toLowerCase().trim();
        // Random password, OAuth users log in via provider, not password
        const passwordHash = await hash(randomBytes(32).toString('hex'), BCRYPT_ROUNDS);

        return this.prisma.user.upsert({
            where: { email: email },
            update: {
                // Conditionally update avatar only if a new one is provided
                ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
            },
            create: {
                email: email,
                name: data.name ?? null,
                passwordHash,
                emailVerified: true,
                avatarUrl: data.avatarUrl ?? null,
            },
        });
    }
}