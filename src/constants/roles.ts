export enum UserRole {
    ADMIN = 'Admin',
    CUSTOMER = 'Customer',
    SUPER_ADMIN = 'Super Admin',
    STAFF = 'Staff'
}

export const SYSTEM_ROLES = [UserRole.ADMIN, UserRole.CUSTOMER, UserRole.SUPER_ADMIN];
