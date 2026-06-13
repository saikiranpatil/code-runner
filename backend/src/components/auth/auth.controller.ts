import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Request,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './auth.decorators';
import { LocalAuthGuard } from './guards/local.guard';
import { GithubAuthGuard } from './guards/github.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google.guard';
import { RegisterDto } from './dto/register.dto';
import { User } from '../../prisma/generated/client';
import { COOKIE_NAME, NODE_ENVS } from '../../common/constants';
import { envConfig } from '../../config';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // Local login
    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async localLogin(@Req() req: any, @Res({ passthrough: true }) res) {
        const result = await this.authService.login(req.user as User);
        this.setRefreshCookie(res, result.refreshToken);
        // Strip the raw token — only the httpOnly cookie carries it
        const { refreshToken, ...payload } = result;
        return payload;
    }

    // Register
    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(
        @Body() registerDto: RegisterDto,
        @Res({ passthrough: true }) res,
    ) {
        const result = await this.authService.register(registerDto);
        this.setRefreshCookie(res, result.refreshToken);
        const { refreshToken, ...payload } = result;
        return payload;
    }

    // Logout
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @Request() req: any,
        @Res({ passthrough: true }) res,
    ) {
        await this.authService.logout(req.user.id);
        res.clearCookie(COOKIE_NAME.REFRESH_TOKEN);
        return { message: 'Logged out successfully.' };
    }

    // Refresh
    @Public()
    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Request() req: any,
        @Res({ passthrough: true }) res,
    ) {
        const result = await this.authService.refresh(req.user as User);
        this.setRefreshCookie(res, result.refreshToken);
        const { refreshToken, ...payload } = result;
        return payload;
    }

    // GitHub OAuth
    @Public()
    @UseGuards(GithubAuthGuard)
    @Get('github')
    async loginWithGithub() {
        // Passport redirects — nothing to do here
    }

    @Public()
    @UseGuards(GithubAuthGuard)
    @Get('github/callback')
    async githubCallback(@Request() req: any, @Res() res) {
        await this.oAuthLogin(res, req.user as User);
    }

    // Google OAuth
    @Public()
    @UseGuards(GoogleAuthGuard)
    @Get('google')
    async loginWithGoogle() {
        // Passport redirects — nothing to do here
    }

    @Public()
    @UseGuards(GoogleAuthGuard)
    @Get('google/callback')
    async googleCallback(@Req() req: any, @Res() res) {
        await this.oAuthLogin(res, req.user as User);
    }

    private async oAuthLogin(res: Response, user: User) {
        const result = await this.authService.login(user);
        this.setRefreshCookie(res, result.refreshToken);

        // Send token to the popup window and close it
        const { refreshToken, ...payload } = result;
        const encoded = encodeURIComponent(JSON.stringify(payload));
        res.redirect(
            `${envConfig.app.frontendUrl}/oauth/callback?data=${encoded}`,
        );
    }

    private setRefreshCookie(res: Response, refreshToken: string) {
        res.cookie(COOKIE_NAME.REFRESH_TOKEN, refreshToken, {
            httpOnly: true,
            secure: envConfig.app.nodeEnv === NODE_ENVS.PRODUCTION,
            sameSite: 'lax',
            maxAge: envConfig.jwtRefresh.expiry,
            path: '/auth/refresh',
        });
    }
}