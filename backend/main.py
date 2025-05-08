from fastapi import FastAPI
from routers import group
from routers import user
from routers import room
from routers import auth
from routers import proposal
from routers import change_request
from routers import courses
from routers import change_recommendation
app = FastAPI()

app.include_router(auth.router)
app.include_router(group.router)
app.include_router(user.router)
app.include_router(room.router)
app.include_router(proposal.router)
app.include_router(change_request.router)
app.include_router(courses.router)
app.include_router(change_recommendation.router)


@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI app!"}