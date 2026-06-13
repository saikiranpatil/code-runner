import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { STRATEGY_NAME } from "../../../common/constants";

@Injectable()
export class JwtRefreshGuard extends AuthGuard(STRATEGY_NAME.JWT_REFRESH) { }