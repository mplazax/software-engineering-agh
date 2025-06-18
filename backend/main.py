from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    auth, change_recommendation, change_request, courses, equipment,
    group, proposal, room, room_unavailability, user
)

app = FastAPI(title="System Rezerwacji Sal AGH", version="1.0.0")

# Używamy podwójnych dekoratorów w routerach, więc nie potrzebujemy tu specjalnej konfiguracji.
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(group.router)
app.include_router(equipment.router)
app.include_router(room.router)
app.include_router(room_unavailability.router)
app.include_router(courses.router)
app.include_router(change_request.router)
app.include_router(proposal.router)
app.include_router(change_recommendation.router)

origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost"]
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome!"}