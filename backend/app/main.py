from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.database import engine, Base
from app.routes.subject import router as subject_router
from app.routes.topic import router as topic_router
from app.routes.scheduler import router as scheduler_router
from app.routes.progress import router as progress_router

app = FastAPI(title="Smart Study Scheduler")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# Routers (ONLY ONCE EACH)
app.include_router(subject_router)
app.include_router(topic_router)
app.include_router(scheduler_router)
app.include_router(progress_router)


@app.get("/")
def root():
    return {"message": "Smart Study Scheduler backend is running"}
