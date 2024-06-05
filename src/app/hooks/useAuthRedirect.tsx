import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { firebaseApp } from '../../../firebaseConfig';

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

const useAuthRedirect = () => {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRole = localStorage.getItem('userRole');
                if (userRole) {
                    // Save user role to Firestore
                    await setDoc(doc(firestore, 'users', user.uid), {
                        uid: user.uid,
                        email: user.email,
                        role: userRole
                    });
                    localStorage.removeItem('userRole');
                    router.push('/'); //redirect back to homepage
                }
            }
        });

        return () => unsubscribe();
    }, [router]);

    return null;
};

export { useAuthRedirect };
