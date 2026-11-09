"""Seeded synthetic resident and document-request data generation."""

import csv
import random
from datetime import date, timedelta
from pathlib import Path


DOCUMENTS = (
    "Barangay Clearance",
    "Certificate of Residency",
    "Certificate of Indigency",
    "Business Clearance",
    "Barangay ID",
    "Certificate of Good Moral Character",
)
EMPLOYMENT_STATUSES = (
    "student",
    "employed",
    "self-employed",
    "unemployed",
    "retired",
)
RESIDENT_FIELDS = (
    "resident_id",
    "age",
    "civil_status",
    "employment_status",
    "purok",
    "years_of_residency",
    "owns_business",
)
REQUEST_FIELDS = ("request_id", "resident_id", "document", "requested_at", "status")
SEED = 42


def _choose_document(
    rng: random.Random,
    resident: dict[str, object],
    month: int,
    year: int,
    previous_document: str | None,
    is_first: bool,
    business_clearance_years: set[int],
) -> str:
    """Choose a patterned document in O(1) time and space (seeded weighted sampling)."""
    if is_first and float(resident["years_of_residency"]) <= 1:
        return "Certificate of Residency"

    if resident["owns_business"] and year not in business_clearance_years:
        business_clearance_years.add(year)
        return "Business Clearance"

    if previous_document == "Barangay Clearance" and rng.random() < 0.72:
        return "Barangay ID"

    if resident["employment_status"] == "student" and month in (5, 6):
        if rng.random() < 0.76:
            return rng.choice(
                ("Barangay Clearance", "Certificate of Good Moral Character")
            )

    if resident["owns_business"] and rng.random() < 0.30:
        return "Business Clearance"

    if int(resident["age"]) >= 60 and rng.random() < 0.68:
        return rng.choice(("Certificate of Indigency", "Barangay ID"))

    weights = (0.32, 0.16, 0.13, 0.10, 0.17, 0.12)
    return rng.choices(DOCUMENTS, weights=weights, k=1)[0]


def generate_data(
    output_dir: str | Path | None = None,
) -> tuple[list[dict[str, object]], list[dict[str, str]]]:
    """Generate CSVs in O(R + Q log Q) time and O(R + Q) space (seeded synthetic data).

    R is the resident count and Q is the generated request count. Every random
    choice uses a fresh generator seeded with 42.
    """
    rng = random.Random(SEED)
    residents: list[dict[str, object]] = []
    requests: list[dict[str, str]] = []
    start_date = date(2024, 1, 1)
    date_span = (date(2025, 12, 31) - start_date).days

    for resident_number in range(1, 301):
        age = rng.randint(18, 85)
        if age <= 24:
            employment = rng.choices(
                EMPLOYMENT_STATUSES, weights=(0.62, 0.12, 0.05, 0.16, 0.05), k=1
            )[0]
        elif age >= 60:
            employment = rng.choices(
                EMPLOYMENT_STATUSES, weights=(0.01, 0.12, 0.12, 0.20, 0.55), k=1
            )[0]
        else:
            employment = rng.choices(
                EMPLOYMENT_STATUSES, weights=(0.08, 0.50, 0.19, 0.16, 0.07), k=1
            )[0]

        owns_business = employment == "self-employed" and rng.random() < 0.62
        if employment != "self-employed":
            owns_business = rng.random() < 0.07

        resident: dict[str, object] = {
            "resident_id": f"R{resident_number:03d}",
            "age": age,
            "civil_status": rng.choices(
                ("single", "married", "widowed", "separated"),
                weights=(0.48, 0.40, 0.08, 0.04),
                k=1,
            )[0],
            "employment_status": employment,
            "purok": f"Purok {rng.randint(1, 8)}",
            "years_of_residency": round(rng.choices(
                (rng.uniform(0.1, 1.0), rng.uniform(1.1, 30.0)),
                weights=(0.13, 0.87),
                k=1,
            )[0], 1),
            "owns_business": owns_business,
        }
        residents.append(resident)

        request_count = rng.randint(1, 6)
        if resident["owns_business"]:
            request_count = max(2, request_count)
            if float(resident["years_of_residency"]) <= 1:
                request_count = max(3, request_count)

        offsets = sorted(rng.sample(range(date_span + 1), request_count))
        if resident["owns_business"]:
            year_boundary = (date(2025, 1, 1) - start_date).days
            if float(resident["years_of_residency"]) <= 1:
                guaranteed_offsets = {
                    rng.randint(0, year_boundary - 1),
                    rng.randint(0, year_boundary - 1),
                    rng.randint(year_boundary, date_span),
                }
                while len(guaranteed_offsets) < 3:
                    guaranteed_offsets.add(rng.randint(0, year_boundary - 1))
            else:
                guaranteed_offsets = {
                    rng.randint(0, year_boundary - 1),
                    rng.randint(year_boundary, date_span),
                }
            offset_set = set(guaranteed_offsets)
            while len(offset_set) < request_count:
                offset_set.add(rng.randint(0, date_span))
            offsets = sorted(offset_set)
        previous_document: str | None = None
        business_clearance_years: set[int] = set()
        for offset in offsets:
            requested_date = start_date + timedelta(days=offset)
            document = _choose_document(
                rng,
                resident,
                requested_date.month,
                requested_date.year,
                previous_document,
                is_first=previous_document is None,
                business_clearance_years=business_clearance_years,
            )
            request_id = f"Q{len(requests) + 1:05d}"
            requests.append(
                {
                    "request_id": request_id,
                    "resident_id": str(resident["resident_id"]),
                    "document": document,
                    "requested_at": requested_date.isoformat(),
                    "status": "released" if rng.random() < 0.88 else "pending",
                }
            )
            previous_document = document

    requests.sort(key=lambda request: (request["requested_at"], request["request_id"]))
    if output_dir is None:
        output_path = Path(__file__).resolve().parent.parent / "data"
    else:
        output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    _write_csv(output_path / "residents.csv", RESIDENT_FIELDS, residents)
    _write_csv(output_path / "requests.csv", REQUEST_FIELDS, requests)
    return residents, requests


def _write_csv(
    path: Path,
    fieldnames: tuple[str, ...],
    rows: list[dict[str, object]] | list[dict[str, str]],
) -> None:
    """Write rows in O(N) time and O(1) extra space (CSV serialization)."""
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    """Write CSVs in O(R + Q log Q) time and O(R + Q) space (seeded generation)."""
    residents, requests = generate_data()
    print(f"Wrote {len(residents)} residents and {len(requests)} requests.")


if __name__ == "__main__":
    main()
