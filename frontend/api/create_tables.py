import sys
from config import get_settings
from database import Base, engine
from sqlalchemy import text

# Importuj wszystkie modele, aby SQLAlchemy je "zobaczyło"
from model import * 

def main():
    if '--force' not in sys.argv:
        print("This will ERASE ALL DATA in the database.")
        print("To proceed, run this script with the --force flag:")
        print("python create_tables.py --force")
        sys.exit(1)

    print("Connecting to the database...")
    with engine.connect() as conn:
        print("Connection successful.")
        print("Dropping all existing tables...")
        with conn.begin():
            conn.execute(text("DROP TABLE IF EXISTS room_equipment_association CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS change_recommendations CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS availability_proposals CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS change_requests CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS course_events CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS room_unavailability CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS courses CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS rooms CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS equipment CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS groups CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS time_slots CASCADE;"))
            conn.execute(text("DROP TYPE IF EXISTS userrole;"))
            conn.execute(text("DROP TYPE IF EXISTS roomtype;"))
            conn.execute(text("DROP TYPE IF EXISTS changerequeststatus;"))
        print("All tables dropped.")

    print("Creating all tables from metadata...")
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully.")

if __name__ == "__main__":
    main()