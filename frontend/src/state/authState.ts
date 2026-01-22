import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type BankDetails = {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
};

export type PaymentMethod = 'upi' | 'bank' | 'none';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedAt: string;
  eventsHosted: number;
  eventsAttended: number;
  // Payment receiving details
  paymentMethod?: PaymentMethod;
  upiId?: string;
  bankDetails?: BankDetails;
};

// Platform fee configuration
export const PLATFORM_FEE_PERCENT = 10;
export const PLATFORM_UPI_ID = '8287413412@ptsbi';

// Persist user to localStorage
const userAtom = atomWithStorage<User | null>('lets_hang_user', null);
const showLoginModalAtom = atom(false);

export function useUser() {
  return useAtomValue(userAtom);
}

export function useIsLoggedIn() {
  const user = useAtomValue(userAtom);
  return user !== null;
}

export function useShowLoginModal() {
  return useAtomValue(showLoginModalAtom);
}

export function useAuthActions() {
  const setUser = useSetAtom(userAtom);
  const setShowLoginModal = useSetAtom(showLoginModalAtom);

  return {
    // Login with minimal data (demo login)
    login: (userData: Omit<User, 'joinedAt' | 'eventsHosted' | 'eventsAttended'>) => {
      const user: User = {
        ...userData,
        joinedAt: new Date().toISOString(),
        eventsHosted: 0,
        eventsAttended: 0,
      };
      setUser(user);
      setShowLoginModal(false);
    },
    
    // Login with full user data from API
    loginWithUser: (userData: Partial<User> & { id: string; name: string; email: string }) => {
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        bio: userData.bio,
        location: userData.location,
        website: userData.website,
        joinedAt: userData.joinedAt || new Date().toISOString(),
        eventsHosted: userData.eventsHosted || 0,
        eventsAttended: userData.eventsAttended || 0,
        paymentMethod: userData.paymentMethod,
        upiId: userData.upiId,
        bankDetails: userData.bankDetails,
      };
      setUser(user);
      setShowLoginModal(false);
    },
    
    logout: () => {
      // Clear JWT token
      localStorage.removeItem('lets_hang_token');
      setUser(null);
    },
    
    updateProfile: (updates: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, ...updates };
      });
    },
    
    incrementEventsHosted: () => {
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, eventsHosted: prev.eventsHosted + 1 };
      });
    },
    
    openLoginModal: () => {
      setShowLoginModal(true);
    },
    
    closeLoginModal: () => {
      setShowLoginModal(false);
    },
  };
}
