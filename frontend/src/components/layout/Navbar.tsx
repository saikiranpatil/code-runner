import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/module/auth/auth.store";
import { Code2, LogOutIcon, Moon, Sun, User } from "lucide-react";

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
    const logout = useAuthStore((state) => state.handleLogout);
    const user = useAuthStore((state) => state.user);

    return (
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Code2 className="h-4 w-4" />
                    </div>

                    <div>
                        <h1 className="font-heading text-sm font-semibold">
                            Code Runner
                        </h1>

                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Coding Platform
                        </p>
                    </div>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="hidden items-center gap-2 md:flex">
                    <Button variant="ghost" size="sm">Problems</Button>
                    <Button variant="ghost" size="sm">Contests</Button>
                    <Button variant="ghost" size="sm">Discuss</Button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {user && (
                    <div className="hidden md:flex items-center gap-3 rounded-lg border px-3 py-1.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4" />
                        </div>

                        <div className="flex flex-col leading-none">
                            <span className="text-sm font-medium">
                                {user.name}
                            </span>

                            <span className="text-xs text-muted-foreground">
                                {user.email}
                            </span>
                        </div>
                    </div>
                )}

                <ThemeToggle />

                <Button variant="secondary" onClick={logout}>
                    <LogOutIcon className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
};

export default Navbar;