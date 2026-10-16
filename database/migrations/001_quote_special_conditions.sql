-- 001: additive migration. Select and verify the intended database first.
-- Run once; a duplicate-column error means stop and inspect the existing definition.
-- No data updates: existing quotes receive NULL. MySQL DDL commits implicitly.
ALTER TABLE `quotes`
  ADD COLUMN `special_conditions` TEXT
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL;
