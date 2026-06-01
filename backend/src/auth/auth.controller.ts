import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Request, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './auth.decorators';
import { LocalAuthGuard } from './guards/local.guard';
import { GithubAuthGuard } from './guards/github.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { envConfig } from '../config';
import { COOKIE_NAME, NODE_ENVS } from '../common/constants';
import { User } from '../prisma/generated/client';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    async localLogin(@Req() req, @Res({ passthrough: true }) res) {
        const user = req.user;
        return await this.login(res, user);
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

    @HttpCode(HttpStatus.OK)
    @Post('register')
    @Public()
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Public()
    @Get('github')
    @UseGuards(GithubAuthGuard)
    async loginWithGithub() { }

    @Public()
    @Get('github/callback')
    @UseGuards(GithubAuthGuard)
    async githubCallback(@Request() req, @Res({ passthrough: true }) res) {
        const user = req.user;
        return await this.OAuthLogin(res, user);
    }

    @Public()
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async loginWithGoogle() { }

    @Public()
    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleCallback(@Req() req, @Res({ passthrough: true }) res) {
        const user = req.user;
        return await this.OAuthLogin(res, user);
    }

    private async OAuthLogin(res, user: User) {
        const authData = await this.login(res, user);

        // Render an immediate raw script response back into the popup frame
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
        <script>
            const payload = {
                type: 'OAUTH_SUCCESS',
                payload: ${JSON.stringify({
            accessToken: authData.accessToken,
            expiresIn: authData.expiresIn,
            user: authData.user
        })
            }
            };
            
            // Send the token payload securely directly to your frontend window origin
            window.opener.postMessage(payload, "${envConfig.app.frontendUrl}");
        </script>
    `);
    }

    private async login(res: Response, user: User) {
        const { accessToken, refreshToken, expiresIn } = await this.authService.login(user);

        this.setRefreshCookie(res, refreshToken);
        return { user, accessToken, expiresIn };
    }

    private setRefreshCookie(res: any, refreshToken: string) {
        res.cookie(COOKIE_NAME.REFRESH_TOKEN, refreshToken, {
            httpOnly: true,
            secure: envConfig.app.nodeEnv === NODE_ENVS.PRODUCTION,
            sameSite: 'strict',
            path: '/auth/refresh',
            maxAge: envConfig.jwtRefresh.expiry,
        });
    }
}
