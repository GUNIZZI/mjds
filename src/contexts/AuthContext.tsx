'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            // Firebase 오류 메시지를 한국어로 변환
            let errorMessage = '로그인에 실패했습니다.';

            if (error instanceof Error && 'code' in error) {
                const firebaseError = error as { code: string };

                if (firebaseError.code === 'auth/invalid-login-credentials') {
                    errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
                } else if (firebaseError.code === 'auth/user-not-found') {
                    errorMessage = '등록되지 않은 이메일입니다.';
                } else if (firebaseError.code === 'auth/wrong-password') {
                    errorMessage = '비밀번호가 올바르지 않습니다.';
                } else if (firebaseError.code === 'auth/invalid-email') {
                    errorMessage = '유효하지 않은 이메일 형식입니다.';
                } else if (firebaseError.code === 'auth/user-disabled') {
                    errorMessage = '비활성화된 계정입니다.';
                } else if (firebaseError.code === 'auth/too-many-requests') {
                    errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
                }
            }

            throw new Error(errorMessage);
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            // Firebase 오류 메시지를 한국어로 변환
            let errorMessage = '회원가입에 실패했습니다.';

            if (error instanceof Error && 'code' in error) {
                const firebaseError = error as { code: string };

                if (firebaseError.code === 'auth/email-already-in-use') {
                    errorMessage = '이미 사용 중인 이메일입니다.';
                } else if (firebaseError.code === 'auth/weak-password') {
                    errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
                } else if (firebaseError.code === 'auth/invalid-email') {
                    errorMessage = '유효하지 않은 이메일 형식입니다.';
                }
            }

            throw new Error(errorMessage);
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
