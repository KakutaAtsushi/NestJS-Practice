import {
    Controller,
    Post,
    Body,
    HttpCode,
    Res,
    Req,
    Get, HttpStatus
} from '@nestjs/common';

import {Request, Response} from 'express';
import {AuthService} from "./auth.service";
import {AuthDto} from "./DTO/auth.dto";
import {Csrf, Msg} from "./interfaces/auth.interface";


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @Get('/csrf')
    getCsrfToken(@Req() req: Request): Csrf {
        return {csrfToken: req.csrfToken()};
    }


    @Post('/signUp')
    signUp(@Body() dto: AuthDto): Promise<Msg> {
        return this.authService.signUp(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(
        @Body() dto: AuthDto,
        @Res({passthrough: true}) res: Response
    ): Promise<Msg> {
        const jwt = await this.authService.login(dto)
        res.cookie('access_token', jwt.accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
        })
        return {
            message: 'login',
        }
    }

    @HttpCode(HttpStatus.OK)
    @Post('/logout')
    logout(@Req() req: Request, @Res({passthrough: true}) res: Response): Msg {
        res.cookie('access_token', '', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
        })
        return {
            message: 'logout',
        };
    }
}
