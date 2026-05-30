import { HiCubeTransparent } from 'react-icons/hi2';

export default function SidePanel() {
    return (
        <div className="relative hidden lg:flex flex-col justify-between h-full bg-zinc-950 p-12 overflow-hidden">
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 75% 75%, #0ea5e9 0%, transparent 50%)`,
                }}
            />

            <div className="absolute z-10 inset-0">
                <div className="h-full w-full flex flex-col justify-center items-center gap-2">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <HiCubeTransparent className="w-4 h-4 text-white" />
                    </div>

                    <span className="text-white/90 font-semibold text-sm tracking-tight">
                        Code Runner
                    </span>
                </div>
            </div>
        </div>
    );
}