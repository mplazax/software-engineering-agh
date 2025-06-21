import sys
from datetime import date
from example_data import populate_db

def main():
    if '--force' not in sys.argv:
        print("This will populate the database with example data.")
        print("This might create duplicates if run multiple times.")
        print("To proceed, run this script with the --force flag:")
        print("python populate.py --force")
        sys.exit(1)
        
    print("Populating database with example data...")
    populate_db()
    print("Done.")

if __name__ == "__main__":
    main()