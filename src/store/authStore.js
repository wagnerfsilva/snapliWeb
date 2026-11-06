import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'auth-storage';

// Chaves legadas duplicavam a sessao e podiam divergir do estado da UI
localStorage.removeItem('token');
localStorage.removeItem('user');

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user, token) => {
                set({ user, token, isAuthenticated: true });
            },

            clearAuth: () => {
                set({ user: null, token: null, isAuthenticated: false });
            },

            updateUser: (user) => {
                set({ user });
            },
        }),
        {
            name: STORAGE_KEY,
        }
    )
);

// Outra aba trocou/encerrou a sessao: recarrega para que UI e token nao fiquem de usuarios diferentes
window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;

    let nextUserId = null;
    try {
        nextUserId = JSON.parse(event.newValue)?.state?.user?.id ?? null;
    } catch {
        nextUserId = null;
    }

    const currentUserId = useAuthStore.getState().user?.id ?? null;
    if (nextUserId !== currentUserId) {
        window.location.reload();
    }
});
