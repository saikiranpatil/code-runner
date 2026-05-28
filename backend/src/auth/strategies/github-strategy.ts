import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { envConfig } from '../../config';
import { STRATEGY_NAME } from '../../common/constants';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, STRATEGY_NAME.GITHUB) {
    constructor(readonly usersService: UsersService) {
        super({
            clientID: envConfig.github.clientId,
            clientSecret: envConfig.github.clientSecret,
            callbackURL: envConfig.github.callbackUrl,
            scope: ['user:email'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile) {
        const primaryEmail = profile.emails?.[0]?.value ?? `${profile.id}@github.noemail`;
        let user = await this.usersService.findByEmail(primaryEmail);
        if (!user) {
            // Create with a random passwordHash since they'll only use OAuth
            user = await this.usersService.createOAuthUser({
                email: primaryEmail,
                name: profile.displayName || profile.username || 'GitHub User',
            });
        }
        return user;
    }
}