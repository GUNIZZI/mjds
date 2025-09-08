import { getCurrentUser } from '@/core/action/auth/firebase';
import { redirect } from 'next/navigation';

export default async function Page() {
    const user = await getCurrentUser();
    if (user) {
        redirect('/dashboard');
    } else {
        redirect('/login');
    }
}
