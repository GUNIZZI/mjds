import { getCurrentUser, signOut } from '@/core/action/auth/firebase';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

interface OwnProps {
    children: ReactNode;
}
export default async function Layout({ children }: OwnProps) {
    const user = await getCurrentUser();
    const { email } = user;

    const hndlSignOut = async () => {
        'use server';
        await signOut();
        redirect('/login');
    };

    return (
        <>
            <header className={'sticky top-0 w-full h-16 px-5 bg-white/10 backdrop-blur-sm shadow-lg/5 flex justify-between items-center'}>
                <h1>MinJi Design System</h1>
                <div className="flex gap-2 text-sm">
                    <span>{email}님</span>
                    <button type="button" onClick={hndlSignOut}>
                        로그아웃
                    </button>
                </div>
            </header>
            <div className="h-500">{children}</div>
        </>
    );
}
