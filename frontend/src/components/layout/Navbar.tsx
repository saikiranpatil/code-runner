import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Code2, Moon, Sun } from "lucide-react"

function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
            }
            className="rounded-xl"
        >
            {theme === "dark" ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
        </Button>
    )
}

const Navbar = () => {
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

            <div className="flex items-center gap-2">
                <ThemeToggle />
            </div>
        </header>
    )
}

export default Navbar