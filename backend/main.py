import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import uvicorn
from fastapi import FastAPI, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# --- Configuration ---
UPLOAD_DIR = Path("backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# --- Pydantic Models (from openapi.yaml) ---

class Photo(BaseModel):
    id: str
    name: str
    url: str
    description: Optional[str] = None

class Annotation(BaseModel):
    id: str
    type: str
    photoId: str
    x: float
    y: float
    data: Dict

class Project(BaseModel):
    id: str
    projectName: str
    projectDescription: Optional[str] = None
    photos: List[Photo]
    annotations: List[Annotation]
    updatedAt: datetime

class ProjectSummary(BaseModel):
    id: str
    name: str
    updatedAt: datetime

# --- In-memory Database ---
db: Dict[str, Project] = {}

# --- FastAPI App ---
app = FastAPI(
    title="Climbing Route Editor API",
    version="1.0.0",
)

# --- CORS Middleware ---
# Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Static File Serving ---
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# --- Helper Functions ---
def get_base_url(request: Request) -> str:
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("host", request.url.netloc)
    return f"{scheme}://{host}"

# --- API Endpoints ---

@app.get("/api/projects", response_model=List[ProjectSummary])
async def list_projects():
    """List all projects."""
    summaries = [
        ProjectSummary(id=p.id, name=p.projectName, updatedAt=p.updatedAt)
        for p in db.values()
    ]
    return sorted(summaries, key=lambda p: p.updatedAt, reverse=True)


@app.post("/api/projects", response_model=Project, status_code=201)
async def create_project(request: Request):
    """Create a new project."""
    form = await request.form()
    project_json = form.get("project")
    if not project_json or not isinstance(project_json, str):
        raise HTTPException(status_code=400, detail="Invalid 'project' field.")

    try:
        project_data = json.loads(project_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid project JSON.")

    project_id = f"proj_{uuid.uuid4()}"
    base_url = get_base_url(request)
    new_photos = []
    photo_meta_map = {p["id"]: p for p in project_data.get("photos", [])}

    for temp_id, value in form.items():
        if temp_id == "project" or not isinstance(value, UploadFile):
            continue

        file = value
        photo_id = f"photo_{uuid.uuid4()}"
        
        original_filename = photo_meta_map.get(temp_id, {}).get("name", file.filename or "")
        file_extension = Path(original_filename).suffix
        file_path = UPLOAD_DIR / f"{photo_id}{file_extension}"
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        photo_meta = photo_meta_map.get(temp_id, {})
        new_photos.append(
            Photo(
                id=photo_id,
                name=original_filename,
                url=f"{base_url}/uploads/{file_path.name}",
                description=photo_meta.get("description"),
            )
        )
        for annotation in project_data.get("annotations", []):
            if annotation.get("photoId") == temp_id:
                annotation["photoId"] = photo_id

    new_project = Project(
        id=project_id,
        projectName=project_data["projectName"],
        projectDescription=project_data.get("projectDescription"),
        photos=new_photos,
        annotations=project_data.get("annotations", []),
        updatedAt=datetime.now(),
    )

    db[project_id] = new_project
    return new_project


@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project_by_id(project_id: str):
    """Get a single project by ID."""
    if project_id not in db:
        raise HTTPException(status_code=404, detail="Project not found.")
    return db[project_id]


@app.put("/api/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, request: Request):
    """Update an existing project."""
    if project_id not in db:
        raise HTTPException(status_code=404, detail="Project not found.")

    form = await request.form()
    project_json = form.get("project")
    if not project_json or not isinstance(project_json, str):
        raise HTTPException(status_code=400, detail="Invalid 'project' field.")

    try:
        project_data = json.loads(project_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid project JSON.")

    base_url = get_base_url(request)
    
    existing_project = db[project_id]
    client_photo_ids = {p["id"] for p in project_data.get("photos", [])}
    for old_photo in existing_project.photos:
        if old_photo.id not in client_photo_ids:
            try:
                (UPLOAD_DIR / Path(old_photo.url).name).unlink(missing_ok=True)
            except Exception as e:
                print(f"Error deleting file {old_photo.url}: {e}")

    updated_photos = []
    photo_meta_map = {p["id"]: p for p in project_data.get("photos", [])}
    
    for photo_meta in project_data.get("photos", []):
        if "url" in photo_meta and photo_meta["url"]:
            updated_photos.append(Photo(**photo_meta))

    for temp_id, value in form.items():
        if temp_id == "project" or not isinstance(value, UploadFile):
            continue

        file = value
        photo_id = f"photo_{uuid.uuid4()}"
        
        original_filename = photo_meta_map.get(temp_id, {}).get("name", file.filename or "")
        file_extension = Path(original_filename).suffix
        file_path = UPLOAD_DIR / f"{photo_id}{file_extension}"

        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        photo_meta = photo_meta_map.get(temp_id, {})
        updated_photos.append(
            Photo(
                id=photo_id,
                name=original_filename,
                url=f"{base_url}/uploads/{file_path.name}",
                description=photo_meta.get("description"),
            )
        )
        for annotation in project_data.get("annotations", []):
            if annotation.get("photoId") == temp_id:
                annotation["photoId"] = photo_id

    updated_project = Project(
        id=project_id,
        projectName=project_data["projectName"],
        projectDescription=project_data.get("projectDescription"),
        photos=updated_photos,
        annotations=project_data.get("annotations", []),
        updatedAt=datetime.now(),
    )

    db[project_id] = updated_project
    return updated_project


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
