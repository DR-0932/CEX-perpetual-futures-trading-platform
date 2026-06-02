export const STREAM = {
    USER_REGISTRATION:'stream:user_registration',
}as const;

export interface UserRegistrationPayload {
    userId:string,
    email:string,
    timestamp:string;
}