-- Feature 004: employee profile / contact self-service columns.

ALTER TABLE "employees" ADD COLUMN "preferred_name" TEXT;
ALTER TABLE "employees" ADD COLUMN "personal_email" TEXT;
ALTER TABLE "employees" ADD COLUMN "phone" TEXT;
ALTER TABLE "employees" ADD COLUMN "mailing_address_line1" TEXT;
ALTER TABLE "employees" ADD COLUMN "mailing_address_line2" TEXT;
ALTER TABLE "employees" ADD COLUMN "mailing_city" TEXT;
ALTER TABLE "employees" ADD COLUMN "mailing_region" TEXT;
ALTER TABLE "employees" ADD COLUMN "mailing_postal_code" TEXT;
ALTER TABLE "employees" ADD COLUMN "mailing_country" TEXT;
ALTER TABLE "employees" ADD COLUMN "emergency_contact_name" TEXT;
ALTER TABLE "employees" ADD COLUMN "emergency_contact_phone" TEXT;
ALTER TABLE "employees" ADD COLUMN "emergency_contact_relationship" TEXT;
