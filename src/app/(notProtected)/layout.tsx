import { getCurrentUser } from '@/core/action/auth/firebase';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

interface OwnProps {
    children: ReactNode;
}
export default async function NotProtectedLayout({ children }: OwnProps) {
    const user = await getCurrentUser();

    if (user) {
        redirect('/dashboard');
    }

    return <>{children}</>;
}
