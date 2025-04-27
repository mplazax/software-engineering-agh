from fastapi import FastAPI
from routers import group
from routers import user


app = FastAPI()

app.include_router(group.router)

app.include_router(user.router)
@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI app!"}