# barangay-request-system
A barangay document request system to lessen the hassle on getting barangay documents such as indigency

## Community recommendations

Run `php artisan migrate` to create the recommendations catalog. Admins can add
official programs, government assistance, services, announcements, and
activities from **Programs & Recommendations** in the admin portal. The catalog
starts empty; there are no seeded sample entries.

The authenticated `GET /api/recommendations` feed filters by date, age range,
gender, civil status, and verification requirements, then prioritizes government
assistance. Residents with a missing or under-13 age receive general entries
only. Eligibility notes are informational; supported profile filters are
enforced automatically.
