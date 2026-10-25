-- 002: additive migration. Select and verify the intended database first.
-- Existing quotes receive the current default of 50 percent.
-- MySQL DDL commits implicitly; run once and stop on any unexpected schema state.
ALTER TABLE `quotes`
  ADD COLUMN `down_payment_percent` TINYINT UNSIGNED NOT NULL DEFAULT 50,
  ADD CONSTRAINT `chk_quotes_down_payment_percent`
    CHECK (`down_payment_percent` BETWEEN 0 AND 100);
