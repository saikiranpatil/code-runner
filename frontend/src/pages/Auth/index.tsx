import AuthForm from "./AuthForm"
import SidePanel from "./SidePanel"

const AuthPage = () => {
    return (
        <div className="h-full grid lg:grid-cols-2">
            <SidePanel />
            <AuthForm />
        </div>
    )
}

export default AuthPage