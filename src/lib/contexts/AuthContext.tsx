
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { Profile } from "@/types";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface AuthContextType {
    user: FirebaseUser | null;
    profile: Profile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signInWithGoogle: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Redirect 127.0.0.1 to localhost to fix Firebase Auth domain issues
        if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1') {
            const newUrl = window.location.href.replace('127.0.0.1', 'localhost');
            window.location.replace(newUrl);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Fetch user profile from Firestore, create if not exists
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data() as Profile;

                    // Check if user should be admin but isn't
                    const ADMIN_EMAILS = ["abubackerraiyan@gmail.com", "dhl.abu@gmail.com"];
                    if (currentUser.email && ADMIN_EMAILS.includes(currentUser.email) && (data.role !== 'admin' || data.status !== 'approved')) {
                        await updateDoc(userRef, {
                            role: 'admin',
                            status: 'approved'
                        });
                        data.role = 'admin';
                        data.status = 'approved';
                        toast.success("Profile upgraded to Admin");
                    }

                    setProfile(data);
                } else {
                    // Create new profile
                    const ADMIN_EMAILS = ["abubackerraiyan@gmail.com", "dhl.abu@gmail.com"];
                    const isAdmin = currentUser.email && ADMIN_EMAILS.includes(currentUser.email);

                    const newProfile: Profile = {
                        id: currentUser.uid,
                        email: currentUser.email || "",
                        full_name: currentUser.displayName || "User",
                        avatar_url: currentUser.photoURL || null,
                        role: isAdmin ? "admin" : "student",
                        status: isAdmin ? "approved" : "pending",
                        bio: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    try {
                        await setDoc(userRef, newProfile);
                        setProfile(newProfile);
                    } catch (error) {
                        console.error("Error creating profile:", error);
                        toast.error("Failed to create user profile");
                    }
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            toast.success("Signed in successfully!");
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Error signing in with Google", error);

            if (error.code === 'auth/popup-blocked') {
                toast.error("Popup blocked! Please allow popups for this site.");
                return;
            }
            if (error.code === 'auth/cancelled-popup-request') {
                // User closed popup, ignore
                return;
            }
            if (error.code === 'auth/unauthorized-domain' || (error.message && error.message.includes('domain is not authorized'))) {
                toast.error("Domain unauthorized! Redirecting to localhost...");
                if (typeof window !== 'undefined') {
                    window.location.href = window.location.href.replace('127.0.0.1', 'localhost');
                }
                return;
            }

            toast.error(error.message || "Failed to sign in");
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            toast.success("Signed out");
            router.push("/login");
        } catch (error: any) {
            console.error("Error signing out", error);
            toast.error("Failed to sign out");
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
