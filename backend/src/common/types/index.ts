export interface JwtPayload {
    sub: number;
    email: string;
    type: 'access';
};

export interface JwtRefreshPayload {
    sub: number;
    type: 'refresh';
}