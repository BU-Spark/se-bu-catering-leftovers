import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { firebaseApp } from '@/../firebaseConfig';

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

const useAuthRedirect = () => {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRole = localStorage.getItem('userRole');
                const userDocRef = doc(firestore, 'Users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists() && userRole) {
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email,
                        role: userRole
                    });
                    localStorage.removeItem('userRole');
                }

                if (userDoc.exists()) {
                    router.push("/events/explore");
                }
            }
        });

        return () => unsubscribe();
    }, [router]);

    return null;
};

export { useAuthRedirect };
