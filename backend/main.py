# W pliku ./backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# === ZASTĄP STARY BLOK IMPORTÓW NA TEN ===
from routers.auth import router as auth_router
from routers.change_recommendation import router as change_recommendation_router
from routers.change_request import router as change_request_router
from routers.courses import router as courses_router
from routers.dashboard import router as dashboard_router
from routers.equipment import router as equipment_router
from routers.group import router as group_router
from routers.proposal import router as proposal_router
from routers.room import router as room_router
from routers.room_unavailability import router as room_unavailability_router
from routers.user import router as user_router
# === KONIEC ZMIAN W IMPORCIE ===

app = FastAPI(title="System Rezerwacji Sal AGH", version="1.0.0")

# === ZASTĄP STARY BLOK DOŁĄCZANIA ROUTERÓW NA TEN ===
app.include_router(auth_router)
app.include_router(change_recommendation_router)
app.include_router(change_request_router)
app.include_router(courses_router)
app.include_router(dashboard_router)
app.include_router(equipment_router)
app.include_router(group_router)
app.include_router(proposal_router)
app.include_router(room_router)
app.include_router(room_unavailability_router)
app.include_router(user_router)
# === KONIEC ZMIAN W DOŁĄCZANIU ROUTERÓW ===

origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost"]
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome!"}