from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from database import engine, Base
from routers import settings, tasks

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Homework Tracker")

# Ensure static directory exists
os.makedirs("static", exist_ok=True)

# Include API routers
app.include_router(settings.router)
app.include_router(tasks.router)

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse("static/index.html")
