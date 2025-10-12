// src/lib/utils.ts
import { Timestamp } from 'firebase/firestore';

export function formatTimestamp(timestamp: any): string {
  if (!timestamp) return 'N/A';
  
  try {
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
    
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
}

export function timestampToISO(timestamp: any): string {
  if (!timestamp) return '';
  
  try {
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
    
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

export function normalize(str: string): 'User' | 'Admin' {
  const lower = str.toLowerCase().trim();
  return lower === 'admin' ? 'Admin' : 'User';
}