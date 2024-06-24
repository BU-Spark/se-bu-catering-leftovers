import { addDoc, arrayUnion, collection, doc, updateDoc } from '@firebase/firestore';
import { firestore as db } from '../../firebaseConfig';
import { Review } from '../types/types';

export const onSubmit = async (review: Review, eventId: string, userId: string) => {
    try {
        // add review to database
        const reviewRef = await addDoc(collection(db, `Reviews/${eventId}/Reviews`), review);
        // add id to review
        await updateDoc(reviewRef, { id: reviewRef.id });

        // add reviewed event id to user
        const userRef = doc(db, 'Users', userId);
        await updateDoc(userRef, { reviews: arrayUnion(eventId) });

        // add user id to reviewedBy array in event
        const eventRef = doc(db, 'Events', eventId);
        await updateDoc(eventRef, { reviewedBy: arrayUnion(userId) })

        alert('Feedback submitted successfully');
    } catch (error) {
        console.error('Error submitting feedback: ', error);
        alert('Failed to submit feedback');
        return "";
    }
}

