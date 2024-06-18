export interface UserData {
    name: string;
    email: string;
    role: string;
    postsCreated?: number;
}
export interface PostData {
    id: string;
    title: string;
    content: string;
    userId: string;
}
export interface Event {
    id: string;
    title: string;
    description: string;
    createdBy: string;
    status: string;
    campusArea: string;
    foodAvailable: boolean;
    [key: string]: any;
}