import { Event } from './types';

// Format the date of an event as Month, day
export const formatEventDate = (time: any) => {
    return time.toDate().toLocaleDateString(undefined, {
        month: 'long',
        day: '2-digit'
    });
}

// Format the time of an event as HH:MM
export const formatEventTime = (time: any) => {
    return time.toDate().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

export const formatEventDateTime = (time: any) => {
    return time.toDate().toLocaleString(undefined, {
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(' at ', ', ');
}

export const formatEndTime = (event: Event) => {
    const durationMinutes = parseInt(event.duration);
    const endTime = new Date(event.foodAvailable.toDate().getTime() + durationMinutes * 60000); // 60000 ms = 1 minute

    return endTime.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Format the dates and times related to an event
export const formatEventTimes = (event: Event) => {
    // Format date and time
    const foodAvailableDate = formatEventDate(event.foodAvailable);
    const foodAvailableTime = formatEventTime(event.foodAvailable);
    const endTimeFormatted = formatEndTime(event);

    return { foodAvailableDate, foodAvailableTime, endTimeFormatted };
};

// Calculate the remaining time of an event
export const calculateRemainingTime = (event: Event): string => {
    if (!event.duration || !event.foodAvailable) return "N/A";

    const foodAvailable = event.foodAvailable.toDate();
    const durationInMillis = parseInt(event.duration) * 60 * 1000;
    const endTime = foodAvailable.getTime() + durationInMillis;
    const currentTime = Date.now();
    const timeLeft = endTime - currentTime;

    if (timeLeft <= 0) return "00:00:00";

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};