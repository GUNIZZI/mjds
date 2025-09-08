import { getCurrentUser } from '@/core/action/auth/firebase';
import { cookies } from 'next/headers';
import { ReactNode } from 'react';

interface OwnProps {
    children: ReactNode;
}
export default async function NotProtectedLayout({ children }: OwnProps) {
    const cookieStore = await cookies();
    const token = cookieStore.get('firebase-token');

    console.log('=== NotProtectedLayout Debug ===');
    console.log('쿠키 토큰 존재:', !!token);
    console.log('토큰 값:', token?.value ? '토큰 있음' : '토큰 없음');

    const user = await getCurrentUser();
    console.log('getCurrentUser 결과:', user);
    console.log('==============================');

    return <>{children}</>;
}
