import { addDoc, deleteDoc, arrayRemove, arrayUnion, collection, doc, updateDoc } from '@firebase/firestore';
import { Event } from '../types/types';
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

export const onCopy = async (event: Event, userId: string) => {
    try {
        // Remove the id from the event object to create a new event
        const { id, ...eventWithoutId } = event;

        // Add the new event to the database
        const newEventRef = await addDoc(collection(db, 'Events'), eventWithoutId);
        
        // Update the new event with its own id
        await updateDoc(newEventRef, { id: newEventRef.id });

        // Add the new event id to the user
        const userRef = doc(db, 'Users', userId);
        await updateDoc(userRef, { events: arrayUnion(newEventRef.id) });

        alert('Event copied successfully');
        return newEventRef.id;
    } catch (error) {
        console.error('Error copying event: ', error);
        alert('Failed to copy event');
        return "";
    }
}

// Delete event from database and user
export const onDelete = async (event: Event, userId: string) => {
    try {
        // Reference to the event document
        const eventRef = doc(db, 'Events', event.id);

        // Delete the event document
        await deleteDoc(eventRef);

        // Remove the event id from the user's events array
        const userRef = doc(db, 'Users', userId);
        await updateDoc(userRef, { events: arrayRemove(event.id) });

        return event.id;
    } catch (error) {
        console.error('Error deleting event: ', error);
        alert('Failed to delete event');
        return "";
    }
};