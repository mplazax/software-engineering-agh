from fastapi import FastAPI
from routers import group
from routers import user
from routers import room
from routers import auth
from routers import proposal

app = FastAPI()

app.include_router(auth.router)
app.include_router(group.router)
app.include_router(user.router)
app.include_router(room.router)
app.include_router(proposal.router)


@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI app!"}