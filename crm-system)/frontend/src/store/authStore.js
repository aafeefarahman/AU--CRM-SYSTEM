import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('crm_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('crm_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('crm_token');
    set({ user: null, token: null });
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
