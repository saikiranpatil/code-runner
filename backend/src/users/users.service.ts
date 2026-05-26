
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '../prisma/generated/client';
import { hash } from 'bcrypt';
import { envConfig } from '../config';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findUnique(
        userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    ): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: userWhereUniqueInput,
        });
    }

    async findByEmail(
        email: string
    ): Promise<User | null> {
        return this.prisma.user.findFirst({ where: { email: email } });
    }

    async findMany(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserWhereUniqueInput;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }): Promise<User[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.user.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        const hashedPassword = await hash(data.passwordHash, envConfig.bcrypt.saltRounds);

        const userData = {
            ...data,
            passwordHash: hashedPassword,
        };

        return this.prisma.user.create({
            data: userData,
        });
    }

    async update(params: {
        where: Prisma.UserWhereUniqueInput;
        data: Prisma.UserUpdateInput;
    }): Promise<User> {
        const { where, data } = params;
        return this.prisma.user.update({
            data,
            where,
        });
    }

    async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
        return this.prisma.user.delete({
            where,
        });
    }
}
