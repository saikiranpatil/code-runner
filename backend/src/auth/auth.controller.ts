import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './auth.decorators';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local.guard';
import { GithubAuthGuard } from './guards/github.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @Public()
    login(@Request() req) {
        return this.authService.login(req.user);
    }

    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtRefreshGuard)
    @Public()
    @Post('refresh')
    refresh(@Request() req) {
        return this.authService.refresh(req.user);
    }

    // @HttpCode(HttpStatus.OK)
    // @Post('register')
    // @Public()
    // register(@Body() registerDto: RegisterDto) {
    //     return this.authService.register(registerDto);
    // }

    @Get('profile')
    getProfile(@Request() req: { user: string }) {
        return req.user;
    }

    @Get('github')
    @UseGuards(GithubAuthGuard)
    async loginWithGithub() {
        // This triggers the redirect to GitHub
    }

    @Get('github/callback')
    @UseGuards(GithubAuthGuard)
    async githubCallback(@Request() req) {
        // req.user contains the data returned from the validate method
        return req.user;
    }
}
