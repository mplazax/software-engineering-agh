from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auth,
    change_recommendation,
    change_request,
    courses,
    group,
    proposal,
    room,
    room_unavailability,
    user,
    equipment,
)

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
app.include_router(equipment.router)

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

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
