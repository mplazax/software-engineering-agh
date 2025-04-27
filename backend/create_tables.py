from model import Base
from sqlalchemy import create_engine

DATABASE_URL = "postgresql+psycopg2://admin:admin@localhost:5433/database"

engine = create_engine(DATABASE_URL)

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
