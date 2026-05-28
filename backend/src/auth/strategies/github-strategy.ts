import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github';
import { envConfig } from '../../config';
import { STRATEGY_NAME } from '../../common/constants';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, STRATEGY_NAME.GITHUB) {
    constructor() {
        super({
            clientID: envConfig.github.clientId,
            clientSecret: envConfig.github.clientSecret,
            callbackURL: 'http://localhost:3000/auth/github/callback',
            scope: ['user:email'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile) {
        // The profile object contains user info returned by GitHub
        const { username, photos, emails } = profile;
        return {

        };
    }
}