import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '../prisma/generated/client';
import { hash } from 'bcrypt';
import { envConfig } from '../config';
import { RegisterDto } from '../auth/dto/register.dto';

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

    async create(registerDto: RegisterDto): Promise<User> {
        const { name, email, password } = registerDto;
        const passwordHash = await hash(password, envConfig.bcrypt.saltRounds);
        return this.prisma.user.create({ data: { name, email, passwordHash } });
    }

    async update(params: {
        where: Prisma.UserWhereUniqueInput;
        data: Prisma.UserUpdateInput;
    }): Promise<User> {
        const { where, data } = params;

        // exclude password update
        const { passwordHash, ...updateData } = data;

        return this.prisma.user.update({
            data: updateData,
            where,
        });
    }

    async delete(where: Prisma.UserWhereUniqueInput): Promise<User> {
        return this.prisma.user.delete({
            where,
        });
    }
}
