import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth.guard";

const AuthGuardProvider = {
    provide: APP_GUARD,
    useClass: AuthGuard,
};

export default AuthGuardProvider;