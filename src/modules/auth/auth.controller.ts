import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResgisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { IsPublic } from 'src/common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @IsPublic()
    @Post('register')
    register(@Body() dto: ResgisterDto) {
        return this.authService.register(dto);
    }

    @IsPublic()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('me')
    getProfile(@CurrentUser() user: any) {
        return this.authService.profile(user.userId);
    }
}
