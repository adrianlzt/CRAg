import json
import logging
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator, Dict, List, Optional

import uvicorn
from fastapi import Depends, FastAPI, Form, HTTPException, Request
from starlette.datastructures import UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, String, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.sql import func

# --- Configuration ---
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "sqlite+aiosqlite:///projects.db")
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Database Setup ---
engine = create_async_engine(DATABASE_URL, connect_args={
                             "check_same_thread": False})
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


# --- Database Models ---
class ProjectDB(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, index=True)
    projectName = Column(String, index=True)
    projectDescription = Column(String, nullable=True)
    updatedAt = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    photos = relationship(
        "PhotoDB",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    annotations = relationship(
        "AnnotationDB",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class PhotoDB(Base):
    __tablename__ = "photos"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    url = Column(String)
    description = Column(String, nullable=True)
    project_id = Column(String, ForeignKey("projects.id"))

    project = relationship("ProjectDB", back_populates="photos")


class AnnotationDB(Base):
    __tablename__ = "annotations"
    id = Column(String, primary_key=True, index=True)
    type = Column(String)
    photoId = Column(String)
    x = Column(Float)
    y = Column(Float)
    data = Column(JSON)
    project_id = Column(String, ForeignKey("projects.id"))

    project = relationship("ProjectDB", back_populates="annotations")


# --- Pydantic Models (from openapi.yaml) ---


class Photo(BaseModel):
    id: str
    name: str
    url: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class Annotation(BaseModel):
    id: str
    type: str
    photoId: str
    x: float
    y: float
    data: Dict

    class Config:
        from_attributes = True


class Project(BaseModel):
    id: str
    projectName: str
    projectDescription: Optional[str] = None
    photos: List[Photo]
    annotations: List[Annotation]
    updatedAt: datetime

    class Config:
        from_attributes = True


class ProjectSummary(BaseModel):
    id: str
    name: str
    updatedAt: datetime


# --- FastAPI App ---
app = FastAPI(
    title="Climbing Route Editor API",
    version="1.0.0",
)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# --- Database Dependency ---
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


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
async def list_projects(db: AsyncSession = Depends(get_db)):
    """List all projects."""
    result = await db.execute(select(ProjectDB).order_by(ProjectDB.updatedAt.desc()))
    projects = result.scalars().all()
    return [
        ProjectSummary(id=p.id, name=p.projectName, updatedAt=p.updatedAt)
        for p in projects
    ]


@app.post("/api/projects", response_model=Project, status_code=201)
async def create_project(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Create a new project."""
    logger.info("--- create_project endpoint called ---")
    form = await request.form()
    logger.info(f"Form fields received: {list(form.keys())}")

    project_json = form.get("project")
    if not project_json or not isinstance(project_json, str):
        raise HTTPException(
            status_code=400, detail="Missing or invalid 'project' form field."
        )

    try:
        project_data = json.loads(project_json)
        logger.info(
            f"Project JSON parsed successfully. Project name: {
                project_data.get('projectName')
            }"
        )
    except json.JSONDecodeError:
        logger.error(f"Failed to parse project JSON: {project_json}")
        raise HTTPException(status_code=400, detail="Invalid project JSON.")

    project_id = f"proj_{uuid.uuid4()}"
    base_url = get_base_url(request)

    new_project_db = ProjectDB(
        id=project_id,
        projectName=project_data["projectName"],
        projectDescription=project_data.get("projectDescription"),
    )

    photo_meta_map = {p["id"]: p for p in project_data.get("photos", [])}
    logger.info(f"Photo metadata from JSON: {list(photo_meta_map.keys())}")
    temp_to_new_photo_id = {}

    file_upload_count = 0
    for key, value in form.items():
        print(f"Form items Key: {key}, Value: {
              value}, type value: {type(value)}")
        if isinstance(value, UploadFile):
            file_upload_count += 1
            file = value
            temp_id = key
            logger.info(
                f"Processing uploaded file. Form key (temp_id): {temp_id}, Filename: {
                    file.filename
                }"
            )

            photo_id = f"photo_{uuid.uuid4()}"
            temp_to_new_photo_id[temp_id] = photo_id

            original_filename = photo_meta_map.get(temp_id, {}).get(
                "name", file.filename or ""
            )
            file_extension = Path(original_filename).suffix
            file_path = UPLOAD_DIR / f"{photo_id}{file_extension}"
            logger.info(f"Saving file to: {file_path}")

            try:
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                logger.info(
                    f"Successfully saved {file_path}, size: {
                        len(content)} bytes."
                )
            except Exception as e:
                logger.error(f"Error saving file {file_path}: {e}")
                raise HTTPException(
                    status_code=500, detail=f"Could not save file {original_filename}."
                )

            photo_meta = photo_meta_map.get(temp_id, {})
            new_photo_db = PhotoDB(
                id=photo_id,
                name=original_filename,
                url=f"{base_url}/uploads/{file_path.name}",
                description=photo_meta.get("description"),
                project_id=project_id,
            )
            new_project_db.photos.append(new_photo_db)

    photo_meta_map = {p["id"]: p for p in project_data.get("photos", [])}
    logger.info(f"Photo metadata from JSON: {list(photo_meta_map.keys())}")
    temp_to_new_photo_id = {}

    file_upload_count = 0
    for key, value in form.items():
        if isinstance(value, UploadFile):
            file_upload_count += 1
            file = value
            temp_id = key
            logger.info(
                f"Processing uploaded file. Form key (temp_id): {temp_id}, Filename: {
                    file.filename
                }"
            )

            photo_id = f"photo_{uuid.uuid4()}"
            temp_to_new_photo_id[temp_id] = photo_id

            original_filename = photo_meta_map.get(temp_id, {}).get(
                "name", file.filename or ""
            )
            file_extension = Path(original_filename).suffix
            file_path = UPLOAD_DIR / f"{photo_id}{file_extension}"
            logger.info(f"Saving file to: {file_path}")

            try:
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                logger.info(
                    f"Successfully saved {file_path}, size: {
                        len(content)} bytes."
                )
            except Exception as e:
                logger.error(f"Error saving file {file_path}: {e}")
                raise HTTPException(
                    status_code=500, detail=f"Could not save file {original_filename}."
                )

            photo_meta = photo_meta_map.get(temp_id, {})
            new_photo_db = PhotoDB(
                id=photo_id,
                name=original_filename,
                url=f"{base_url}/uploads/{file_path.name}",
                description=photo_meta.get("description"),
                project_id=project_id,
            )
            new_project_db.photos.append(new_photo_db)

        temp_to_new_photo_id = {}

    file_upload_count = 0
    # Add new photos
    for key, value in form.items():
        if isinstance(value, UploadFile):
            file_upload_count += 1
            file = value
            temp_id = key
            logger.info(
                f"Processing uploaded file. Form key (temp_id): {temp_id}, Filename: {
                    file.filename
                }"
            )

            photo_id = f"photo_{uuid.uuid4()}"
            temp_to_new_photo_id[temp_id] = photo_id

            original_filename = client_photo_map.get(temp_id, {}).get(
                "name", file.filename or ""
            )
            file_extension = Path(original_filename).suffix
            file_path = UPLOAD_DIR / f"{photo_id}{file_extension}"
            logger.info(f"Saving file to: {file_path}")

            try:
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                logger.info(
                    f"Successfully saved {file_path}, size: {
                        len(content)} bytes."
                )
            except Exception as e:
                logger.error(f"Error saving file {file_path}: {e}")
                raise HTTPException(
                    status_code=500, detail=f"Could not save file {original_filename}."
                )

            photo_meta = client_photo_map.get(temp_id, {})
            new_photo_db = PhotoDB(
                id=photo_id,
                name=original_filename,
                url=f"{base_url}/uploads/{file_path.name}",
                description=photo_meta.get("description"),
                project_id=project_id,
            )
            project_db.photos.append(new_photo_db)

    if file_upload_count == 0:
        logger.warning("No new files were found in the form to upload.")

    for annotation_data in project_data.get("annotations", []):
        temp_photo_id = annotation_data.get("photoId")
        if temp_photo_id in temp_to_new_photo_id:
            annotation_data["photoId"] = temp_to_new_photo_id[temp_photo_id]

        new_annotation_db = AnnotationDB(
            project_id=project_id, **annotation_data)
        new_project_db.annotations.append(new_annotation_db)

    db.add(new_project_db)
    await db.commit()
    await db.refresh(new_project_db)

    logger.info(
        f"--- create_project finished successfully for project {
            project_id} ---"
    )
    return Project.from_orm(new_project_db)


@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project_by_id(project_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single project by ID."""
    result = await db.execute(select(ProjectDB).where(ProjectDB.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return Project.from_orm(project)


@app.put("/api/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing project."""
    logger.info(
        f"--- update_project endpoint called for project_id: {project_id} ---")
    result = await db.execute(select(ProjectDB).where(ProjectDB.id == project_id))
    project_db = result.scalar_one_or_none()
    if not project_db:
        logger.error(f"Project with id {project_id} not found.")
        raise HTTPException(status_code=404, detail="Project not found.")

    form = await request.form()
    logger.info(f"Form fields received: {list(form.keys())}")

    project_json = form.get("project")
    if not project_json or not isinstance(project_json, str):
        raise HTTPException(
            status_code=400, detail="Missing or invalid 'project' form field."
        )

    try:
        project_data = json.loads(project_json)
        logger.info(
            f"Project JSON parsed successfully. Project name: {
                project_data.get('projectName')
            }"
        )
    except json.JSONDecodeError:
        logger.error(f"Failed to parse project JSON: {project_json}")
        raise HTTPException(status_code=400, detail="Invalid project JSON.")

    base_url = get_base_url(request)

    # Update project fields
    project_db.projectName = project_data["projectName"]
    project_db.projectDescription = project_data.get("projectDescription")
    project_db.updatedAt = datetime.now()

    # Sync photos
    client_photo_map = {p["id"]: p for p in project_data.get("photos", [])}
    db_photo_map = {p.id: p for p in project_db.photos}
    logger.info(f"Client photo IDs: {list(client_photo_map.keys())}")
    logger.info(f"DB photo IDs: {list(db_photo_map.keys())}")

    # Delete photos not in client data
    photos_to_remove = [
        p for p_id, p in db_photo_map.items() if p_id not in client_photo_map
    ]
    for photo_db in photos_to_remove:
        logger.info(f"Removing photo {photo_db.id} ({photo_db.url})")
        project_db.photos.remove(photo_db)
        try:
            file_to_delete = UPLOAD_DIR / Path(photo_db.url).name
            logger.info(f"Deleting file from disk: {file_to_delete}")
            file_to_delete.unlink(missing_ok=True)
        except Exception as e:
            logger.error(f"Error deleting file {photo_db.url}: {e}")
            print(f"Error deleting file {photo_db.url}: {e}")

    temp_to_new_photo_id = {}

    file_upload_count = 0
    # Add new photos
    for key, value in form.items():
        if isinstance(value, UploadFile):
            file_upload_count += 1
            file = value
            temp_id = key
            logger.info(
                f"Processing uploaded file. Form key (temp_id): {temp_id}, Filename: {
                    file.filename
                }"
            )

            photo_id = f"photo_{uuid.uuid4()}"
            temp_to_new_photo_id[temp_id] = photo_id

            original_filename = client_photo_map.get(temp_id, {}).get(
                "name", file.filename or ""
            )
            file_extension = Path(original_filename).suffix
            file_path = UPLOAD_DIR / f"{photo_id}{file_extension}"
            logger.info(f"Saving file to: {file_path}")

            try:
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                logger.info(
                    f"Successfully saved {file_path}, size: {
                        len(content)} bytes."
                )
            except Exception as e:
                logger.error(f"Error saving file {file_path}: {e}")
                raise HTTPException(
                    status_code=500, detail=f"Could not save file {original_filename}."
                )

            photo_meta = client_photo_map.get(temp_id, {})
            new_photo_db = PhotoDB(
                id=photo_id,
                name=original_filename,
                url=f"{base_url}/uploads/{file_path.name}",
                description=photo_meta.get("description"),
                project_id=project_id,
            )
            project_db.photos.append(new_photo_db)

    if file_upload_count == 0:
        logger.warning("No new files were found in the form to upload.")

    # Sync annotations (delete all and re-add)
    project_db.annotations.clear()
    for annotation_data in project_data.get("annotations", []):
        temp_photo_id = annotation_data.get("photoId")
        if temp_photo_id in temp_to_new_photo_id:
            annotation_data["photoId"] = temp_to_new_photo_id[temp_photo_id]

        new_annotation_db = AnnotationDB(
            project_id=project_id, **annotation_data)
        project_db.annotations.append(new_annotation_db)

    await db.commit()
    await db.refresh(project_db)

    logger.info(
        f"--- update_project finished successfully for project {
            project_id} ---"
    )
    return Project.from_orm(project_db)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
