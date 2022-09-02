import {Injectable, ForbiddenException} from '@nestjs/common';
import {PrismaClientKnownRequestError} from "@prisma/client/runtime";
import {ConfigService} from "@nestjs/config";
import {JwtService} from "@nestjs/jwt";
import * as bcrypto from "bcrypt";
import {PrismaService} from "../prisma/prisma.service";
import {AuthDto} from "./DTO/auth.dto";
import {Msg, Jwt} from './interfaces/auth.interface'
import {Passport} from "passport";

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService
    ) {
    }

    async signUp(dto: AuthDto): Promise<Msg> {
        const hashed = await bcrypto.hash(dto.password, 12)

        try {
            await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hashedPassword: hashed,
                },
            })
            return {
                message: 'ok',
            }
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('This email is already taken');
                }
            }
            throw error;
        }
    }

    async login(dto: AuthDto): Promise<Jwt> {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });
        if (!user) throw new ForbiddenException('Email or password incorrect');
        const isValid = await bcrypto.compare(dto.password, user.hashedPassword);
        if (!isValid) throw new ForbiddenException('Email or password incorrect');
        return this.generateJwt(user.id, user.email)
    }

    async generateJwt(userId: number, email: string): Promise<Jwt> {
        const payload = {
            sub: userId,
            email,
        }
        const secret = this.config.get('JWT_SECRET')
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '5m',
            secret: secret,
        })
        return {
            accessToken: token
        }
    }
}
