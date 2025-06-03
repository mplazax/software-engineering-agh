from model import Base
from sqlalchemy import create_engine, text

from .populate_mock_data import populate_mock_data


def main():
    DATABASE_URL = "postgresql+psycopg2://admin:admin@localhost:5433/database"

    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS availability_proposals CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS change_recommendations CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS change_requests CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS course_events CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS courses CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS room_unavailability CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS rooms CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS groups CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS time_slots CASCADE"))
        conn.execute(text("DROP TYPE IF EXISTS userrole CASCADE"))
        conn.commit()
        Base.metadata.create_all(bind=engine)
        populate_mock_data(DATABASE_URL)


if __name__ == "__main__":
    decision = input(
        "Executing this script will erase all current data, Y to proceed: "
    )
    if decision in ["y", "Y"]:
        print("Proceeding...")
        main()
    else:
        print("Execution stopped")
