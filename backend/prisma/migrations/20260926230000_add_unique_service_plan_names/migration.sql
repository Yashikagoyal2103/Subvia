-- Prevent duplicate service names within the same business, ignoring case and surrounding whitespace.
CREATE UNIQUE INDEX "Service_businessId_normalized_name_key"
ON "Service" ("businessId", LOWER(BTRIM("name")));

-- Prevent duplicate plan names within the same service, ignoring case and surrounding whitespace.
CREATE UNIQUE INDEX "Plan_serviceId_normalized_name_key"
ON "Plan" ("serviceId", LOWER(BTRIM("name")));
