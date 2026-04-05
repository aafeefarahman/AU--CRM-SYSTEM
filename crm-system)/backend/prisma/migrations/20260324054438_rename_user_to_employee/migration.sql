-- Rename enum value USER -> EMPLOYEE safely in PostgreSQL
ALTER TYPE "Role" RENAME VALUE 'USER' TO 'EMPLOYEE';
