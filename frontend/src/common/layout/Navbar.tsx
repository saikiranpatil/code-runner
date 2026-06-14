import { useTheme } from "@/common/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth.store";
import type { LogoutResponse } from "@/api/auth/auth";
import authApi from "@/api/auth/authApi";
import mutate from "@/utils/request/mutate";
import { useMutation } from "@tanstack/react-query";
import { Code2, LogOutIcon, Moon, Sun, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import queryClient from "@/utils/request/queryClient";

function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl"
        >
            {theme === "dark" ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
        </Button>
    );
}

const Navbar = () => {
    const handleLogout = useAuthStore((state) => state.handleLogout);
    const user = useAuthStore((state) => state.user);

    // Helper to extract clean initials from the user's name
    const getUserInitials = () => {
        if (!user?.name) return "U";
        return user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const { mutate: logout, isPending } = useMutation({
        mutationKey: ["UserLogout"],
        mutationFn: mutate(authApi.logout),
        onSuccess: (data: LogoutResponse) => {
            queryClient.invalidateQueries({ queryKey: ["UserLogout"] });
            toast.success(data.message);
            handleLogout();
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    return (
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
            {/* Left side: Branding */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Code2 className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm hidden sm:inline-block">
                        DevPlatform
                    </span>
                </div>
            </div>

            {/* Right side: Actions & User Info */}
            <div className="flex items-center gap-4">
                <ThemeToggle />

                {user ? (
                    <div className="flex items-center gap-4 border-l pl-4 border-border">
                        {/* Avatar & Profile Information */}
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback className="text-xs font-medium bg-muted">
                                    {getUserInitials()}
                                </AvatarFallback>
                            </Avatar>

                            {/* Name & Email Layout */}
                            <div className="hidden md:flex flex-col text-left">
                                <span className="text-sm font-medium leading-none text-foreground">
                                    {user.name}
                                </span>
                                <span className="text-xs text-muted-foreground mt-0.5 max-w-37.5 truncate">
                                    {user.email}
                                </span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => logout({})}
                            disabled={isPending}
                            className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Log out"
                        >
                            <LogOutIcon className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <Button variant="outline" size="sm" className="rounded-xl gap-2">
                        <UserIcon className="h-4 w-4" /> Login
                    </Button>
                )}
            </div>
        </header>
    );
};

export default Navbar;