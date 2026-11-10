# Barangay Request System (Python)

Flask + SQLAlchemy REST API with Flask-JWT-Extended and a React/Vite frontend.

## Backend

```powershell
pip install -r requirements.txt
flask --app run.py db upgrade
flask --app run.py run
```

### Existing Laravel database

Back up the database first. If it already contains the schema changes from the
converted Laravel migrations, mark the Flask baseline as applied and then
upgrade:

```powershell
flask --app run.py db stamp 76450ebff7ae
flask --app run.py db upgrade
```

Only stamp the baseline after verifying that the existing schema is compatible.
The converted revisions check for existing columns, tables, indexes, and
constraints so already-applied changes are not duplicated.

The analytics test-data seeder is opt-in. Run it from a Flask shell after
seeding a resident and at least one active document type:

```python
from app.extensions import db
from app.seeders.analytics_test_data_seeder import seed_analytics_test_data

added, already_present = seed_analytics_test_data()
db.session.commit()
```

Resident ID images are served through authenticated request endpoints. By
default, Flask looks for files under `storage/app/public`, using the relative
paths stored in `users.valid_id_front` and `users.valid_id_back`. Copy existing
Laravel public-storage files into that directory, preserving their relative
paths, or set `PUBLIC_STORAGE_ROOT` to the directory containing those files.
Do not expose the ID image directory as an unauthenticated static folder.

## Frontend

cd frontend
pm install
pm run dev
