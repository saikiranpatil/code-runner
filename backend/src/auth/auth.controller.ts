import { Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './auth.decorators';
import { LocalAuthGuard } from './guards/local.guard';
import { GithubAuthGuard } from './guards/github.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google.guard';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    login(@Request() req) {
        return this.authService.login(req.user);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async logout(@Request() req) {
        await this.authService.logout(req.user.id);
        return { message: 'Logged out successfully' };
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtRefreshGuard)
    refresh(@Request() req) {
        return this.authService.refresh(req.user);
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
}
