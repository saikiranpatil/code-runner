import { motion } from 'framer-motion';
import { HiCubeTransparent } from 'react-icons/hi2';

type Snippet = {
    id: number;
    top: string;
    left?: string;
    right?: string;
    delay: number;
    code: string;
    dim: boolean;
};

// Floating code snippet data
const snippets: Snippet[] = [
    { id: 1, top: '18%', left: '8%', delay: 0.6, code: 'const run = async () => {', dim: false },
    { id: 2, top: '28%', left: '14%', delay: 0.75, code: '  await execute(code);', dim: true },
    { id: 3, top: '38%', left: '10%', delay: 0.9, code: '};', dim: true },
    { id: 4, top: '58%', right: '8%', delay: 1.0, code: 'fn solve(n: u32) -> u64 {', dim: false },
    { id: 5, top: '68%', right: '5%', delay: 1.15, code: '  n.checked_mul(n)?', dim: true },
    { id: 6, top: '78%', right: '10%', delay: 1.3, code: '}', dim: true },
];

// Feature pills
const features = [
    { label: '5+ Languages' },
    { label: 'Real-time Output' },
    { label: 'Test Cases' },
];

const panelVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeOut' as const },
    },
};

const logoVariants = {
    hidden: { opacity: 0, y: -12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: 0.2 },
    },
};

const centerVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: 0.35 },
    },
};

const featureVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' as const, delay: 0.5 + i * 0.1 },
    }),
};

const snippetVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: (delay: number) => ({
        opacity: 1,
        x: 0,
        transition: { duration: 0.45, ease: 'easeOut' as const, delay },
    }),
};

const orb1Variants = {
    animate: {
        scale: [1, 1.12, 1],
        opacity: [0.18, 0.28, 0.18],
        transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' as const },
    },
};

const orb2Variants = {
    animate: {
        scale: [1, 1.08, 1],
        opacity: [0.15, 0.22, 0.15],
        transition: { duration: 9, repeat: Infinity, ease: 'easeInOut' as const, delay: 2 },
    },
};

export default function SidePanel() {
    return (
        <motion.div
            className="relative hidden lg:flex flex-col justify-between h-full bg-zinc-950 overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Animated gradient orbs */}
            <motion.div
                className="absolute top-[-10%] left-[-10%] w-[55%] aspect-square rounded-full"
                style={{
                    background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
                }}
                variants={orb1Variants}
                animate="animate"
            />
            <motion.div
                className="absolute bottom-[-10%] right-[-10%] w-[60%] aspect-square rounded-full"
                style={{
                    background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)',
                }}
                variants={orb2Variants}
                animate="animate"
            />

            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Floating code snippets — left side */}
            {snippets.slice(0, 3).map((s) => (
                <motion.div
                    key={s.id}
                    className="absolute z-10 font-mono text-[11px] leading-relaxed select-none pointer-events-none"
                    style={{ top: s.top, left: s.left }}
                    custom={s.delay}
                    variants={snippetVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <span className={s.dim ? 'text-white/20' : 'text-white/40'}>
                        {s.code}
                    </span>
                </motion.div>
            ))}

            {/* Floating code snippets — right side */}
            {snippets.slice(3).map((s) => (
                <motion.div
                    key={s.id}
                    className="absolute z-10 font-mono text-[11px] leading-relaxed select-none pointer-events-none"
                    style={{ top: s.top, right: (s as any).right }}
                    custom={s.delay}
                    variants={snippetVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <span className={s.dim ? 'text-white/20' : 'text-white/40'}>
                        {s.code}
                    </span>
                </motion.div>
            ))}

            {/* Top-left logo */}
            <motion.div
                className="relative z-20 flex items-center gap-2.5 p-10"
                variants={logoVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/8 shadow-lg shadow-black/20">
                    <HiCubeTransparent className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/90 font-semibold text-sm tracking-tight">
                    Code Runner
                </span>
            </motion.div>

            {/* Center content */}
            <motion.div
                className="relative z-20 flex flex-col items-center justify-center flex-1 px-12 text-center gap-6"
                variants={centerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Icon badge */}
                <div className="relative">
                    <div className="w-16 h-16 bg-white/6 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl shadow-black/40 backdrop-blur-sm">
                        <HiCubeTransparent className="w-8 h-8 text-white/80" />
                    </div>
                    {/* Glow ring */}
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                </div>

                <div className="space-y-3 max-w-65">
                    <h2 className="text-white text-2xl font-bold tracking-tight leading-snug">
                        Write. Run. Solve.
                    </h2>
                    <p className="text-white/40 text-sm leading-relaxed">
                        A focused environment for competitive programming and code execution — right in your browser.
                    </p>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {features.map((f, i) => (
                        <motion.span
                            key={f.label}
                            custom={i}
                            variants={featureVariants}
                            initial="hidden"
                            animate="visible"
                            className="px-3 py-1 rounded-full text-[11px] font-medium text-white/50 bg-white/6 border border-white/8 tracking-wide"
                        >
                            {f.label}
                        </motion.span>
                    ))}
                </div>
            </motion.div>

            {/* Bottom tagline */}
            <motion.div
                className="relative z-20 p-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.6 }}
            >
                <p className="text-white/20 text-xs text-center tracking-wide">
                    Built for developers who think in code.
                </p>
            </motion.div>
        </motion.div>
    );
}