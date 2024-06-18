import { addDoc, arrayUnion, collection, doc, updateDoc } from '@firebase/firestore';
import { Event } from './types';
import { firestore as db } from '../../firebaseConfig';


export const onPublish = async (event: Event, userId: string) => {
    let eventID;
        try {
            // add event to database
            const eventRef = await addDoc(collection(db, 'Events'), event);
            // add id to event
            await updateDoc(eventRef, { id: eventRef.id });

            // add event id to user
            const userRef = doc(db, 'Users', userId);
            await updateDoc(userRef, { events: arrayUnion(eventRef.id) });
            eventID = eventRef.id;
            alert('Event published successfully');
            return eventID;
        } catch (error) {
            console.error('Error publishing event: ', error);
            alert('Failed to publish event');
            return "";
          }
  }

 export const onUpdate = async (event: Event, userId: string) => {
    try {
        const eventRef = doc(db, 'Events', event.id);
        // add event to database
        const updatePayload: { [key: string]: any } = { ...event };

        await updateDoc(eventRef, updatePayload);

        alert('Event updated successfully');
        return event.id;
    } catch (error) {
        console.error('Error updating event: ', error);
        alert('Failed to update event');
        return "";
      }
    }
  
    
export const onOpen = async (event: Event) => {
    try {
        const eventRef = doc(db, 'Events', event.id);

        await updateDoc(eventRef, {status: "open"});

        return event.id;
    } catch (error) {
        console.error('Error updating event: ', error);
        alert('Failed to open event');
        return "";
        }
    }

export const onEnd = async (event: Event) => {
    try {
        const eventRef = doc(db, 'Events', event.id);

        await updateDoc(eventRef, {status: "closed"});

        return event.id;
    } catch (error) {
        console.error('Error updating event: ', error);
        alert('Failed to close event');
        return "";
        }
    }