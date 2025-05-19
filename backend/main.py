from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import group
from routers import user
from routers import room
from routers import auth
from routers import proposal
from routers import change_request
from routers import courses
from routers import change_recommendation
from routers import room_unavailability
app = FastAPI()

app.include_router(auth.router)
app.include_router(group.router)
app.include_router(user.router)
app.include_router(room.router)
app.include_router(proposal.router)
app.include_router(change_request.router)
app.include_router(courses.router)
app.include_router(change_recommendation.router)
app.include_router(room_unavailability.router)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI app!"}