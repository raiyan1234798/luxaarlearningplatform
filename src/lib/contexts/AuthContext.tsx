
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Fetch user profile from Firestore, create if not exists
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setProfile(userSnap.data() as Profile);
                } else {
                    // Create new profile
                    const newProfile: Profile = {
                        id: currentUser.uid,
                        email: currentUser.email || "",
                        full_name: currentUser.displayName || "User",
                        avatar_url: currentUser.photoURL || null,
                        role: "student", // Default role
                        status: "pending", // Default status - require approval?
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
