import { Controller, Get, HttpCode, HttpStatus, Post, Req, Request, Res, Response, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './auth.decorators';
import { LocalAuthGuard } from './guards/local.guard';
import { GithubAuthGuard } from './guards/github.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { envConfig } from '../config';
import { NODE_ENVS } from '../common/constants';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    async login(@Req() req, @Res({ passthrough: true }) res) {
        const user = req.user;
        const { accessToken, refreshToken, expiresIn } = await this.authService.login(user);

        this.setRefreshCookie(res, refreshToken);

        return { user, accessToken, expiresIn };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async logout(@Request() req, @Res({ passthrough: true }) res) {
        await this.authService.logout(req.user.id);
        res.clearCookie('refresh_token', {
            path: '/auth/refresh',
        });

        return { message: 'Logged out successfully' };
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtRefreshGuard)
    async refresh(@Request() req) {
        return await this.authService.refresh(req.user);
    }

    // @HttpCode(HttpStatus.OK)
    // @Post('register')
    // @Public()
    // register(@Body() registerDto: RegisterDto) {
    //     return this.authService.register(registerDto);
    // }

    @Public()
    @Get('github')
    @UseGuards(GithubAuthGuard)
    async loginWithGithub() { }

    @Public()
    @Get('github/callback')
    @UseGuards(GithubAuthGuard)
    async githubCallback(@Request() req) {
        return this.authService.login(req.user);
    }

    @Public()
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async loginWithGoogle() { }

    @Public()
    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleCallback(@Request() req) {
        return this.authService.login(req.user);
    }

    private setRefreshCookie(res: any, refreshToken: string) {
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: envConfig.app.nodeEnv === NODE_ENVS.PRODUCTION,
            sameSite: 'strict',
            path: '/auth/refresh',
            maxAge: envConfig.jwtRefresh.expiryMs,
        });
    }
}
