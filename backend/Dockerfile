# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# It's recommended to use a requirements.txt file for production.
# For now, we install dependencies directly.
RUN pip install --no-cache-dir fastapi uvicorn[standard] SQLAlchemy aiosqlite python-multipart

# Copy the backend application code into the container.
# This assumes the Docker build context is the project root.
COPY backend/main.py .

# Expose the port the app runs on
EXPOSE 8000

# Use volumes for persistent data (database and uploads).
# This allows data to persist even if the container is removed.
VOLUME /data
VOLUME /uploads

# Define environment variables. These can be overridden at runtime.
# The database will be stored in the /data volume.
ENV DATABASE_URL="sqlite+aiosqlite:///data/projects.db"
# Uploads will be stored in the /uploads volume.
ENV UPLOAD_DIR="/uploads"

# Command to run the application using uvicorn.
# The --host 0.0.0.0 flag is important to make the server accessible from outside the container.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
