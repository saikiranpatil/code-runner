import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./auth.guard";

const AuthGuardProvider = {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
};

export default AuthGuardProvider;