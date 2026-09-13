// /lib/platform-settings.js
// Shared helper for headadmin-editable platform-wide config (pricing,
// contact info) backed by the SystemSetting key-value table. Having one
// place to read/write these means the landing page, the admin subscription
// page, and the pricing calculation route can never drift out of sync.
import { prisma } from '@/lib/prisma';

// Platform-wide settings (not tied to any one school) use this fixed
// sentinel instead of a real school's UUID — see the schema comment on
// SystemSetting for why (Postgres NULL-uniqueness gotcha).
export const PLATFORM_SETTINGS_SCHOOL_ID = '00000000-0000-0000-0000-000000000000';

export const PLATFORM_SETTING_DEFAULTS = {
  pricing_landing_monthly: '300',          // ₦/month shown as the headline price on the landing page
  pricing_individual_per_user: '250',      // ₦ per user, standard rate
  pricing_bulk_per_user: '200',            // ₦ per user, bulk-discount rate
  pricing_bulk_threshold: '600',           // user count at which bulk flat pricing kicks in
  pricing_bulk_flat_cost: '200000',        // ₦ flat cost once above the bulk threshold
  platform_contact_phone: '',              // headadmin's WhatsApp/phone number, shown to admins
};

const PRICING_KEYS = new Set([
  'pricing_landing_monthly',
  'pricing_individual_per_user',
  'pricing_bulk_per_user',
  'pricing_bulk_threshold',
  'pricing_bulk_flat_cost',
]);

// Fetch every known platform setting, falling back to defaults for any
// key that hasn't been explicitly set yet.
export async function getPlatformSettings() {
  const rows = await prisma.systemSetting.findMany({
    where: {
      key: { in: Object.keys(PLATFORM_SETTING_DEFAULTS) },
      schoolId: PLATFORM_SETTINGS_SCHOOL_ID,
    }
  });
  const stored = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return { ...PLATFORM_SETTING_DEFAULTS, ...stored };
}

// Only the values safe to expose on a public, unauthenticated page
// (the landing page's pricing section).
export async function getPublicPricing() {
  const all = await getPlatformSettings();
  return {
    landingMonthly: Number(all.pricing_landing_monthly),
  };
}

// Headadmin-only: update one or more settings at once.
export async function setPlatformSettings(updates, updatedByUserId) {
  const keys = Object.keys(updates).filter(k => k in PLATFORM_SETTING_DEFAULTS);
  await Promise.all(keys.map(key =>
    prisma.systemSetting.upsert({
      where: { key_schoolId: { key, schoolId: PLATFORM_SETTINGS_SCHOOL_ID } },
      update: { value: String(updates[key]), updatedBy: updatedByUserId },
      create: {
        key,
        schoolId: PLATFORM_SETTINGS_SCHOOL_ID,
        value: String(updates[key]),
        dataType: PRICING_KEYS.has(key) ? 'number' : 'string',
        category: PRICING_KEYS.has(key) ? 'pricing' : 'contact',
        updatedBy: updatedByUserId,
      },
    })
  ));
  return getPlatformSettings();
}
