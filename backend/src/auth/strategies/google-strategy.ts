import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { envConfig } from '../../config';
import { STRATEGY_NAME } from '../../common/constants';
import { UsersService } from '../../users/users.service';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, STRATEGY_NAME.GOOGLE) {
    constructor(readonly usersService: UsersService) {
        super({
            clientID: envConfig.google.clientId,
            clientSecret: envConfig.google.clientSecret,
            callbackURL: envConfig.google.callbackUrl,
            scope: ['email', 'profile'],
        });
    }

    async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
        const emailObj = profile.emails?.[0];
        
        if (!emailObj || !emailObj.value) {
            throw new UnauthorizedException('Google account must have an email.');
        }
        
        if (emailObj.verified === false) {
            throw new UnauthorizedException('Google email is not verified.');
        }
        
        const primaryEmail = emailObj.value;
        let user = await this.usersService.findByEmail(primaryEmail);
        
        const avatarUrl = profile.photos?.[0]?.value;
        if (!user) {
            user = await this.usersService.createOAuthUser({
                email: primaryEmail,
                name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`,
                avatarUrl
            });
        }

        return user;
    }
}