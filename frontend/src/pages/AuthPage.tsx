import SidePanel from '@/module/auth/components/SidePanel';
import { Outlet } from 'react-router-dom';

export default function AuthPage() {
    return (
        <div className="h-full grid lg:grid-cols-2">
            <SidePanel />
            <Outlet />
        </div>
    );
}