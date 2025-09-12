# 🧗‍♂️ Crag - The Ultimate Climbing Route Annotator

Crag is a modern, mobile-first web application designed for climbers to create, annotate, and share climbing routes with ease. Whether you're mapping out a new problem at your local gym or documenting a classic outdoor route, Crag provides an intuitive and powerful set of tools for the job.

**[🚀 Launch the App](https://crag-one.vercel.app/)**

<br/>

[<img src="https://github.com/user-attachments/assets/5ea00e3e-3144-4588-9a4d-055e35b1916c" width="150" />](screenshot1)
[<img src="https://github.com/user-attachments/assets/18742552-fb9d-4a87-948c-8cd75c059929" width="150" />](screenshot2)
[<img src="https://github.com/user-attachments/assets/f32f5158-304b-4c56-aa8f-ab4be1360907" width="150" />](screenshot3)


https://github.com/user-attachments/assets/8230c702-89f7-4492-a03b-5327a462e97f


## ✨ Key Features

-   **📸 Multi-Photo Management**: Upload multiple photos via drag & drop or file picker. Easily reorder them to create a sequence.
-   **✍️ Powerful Annotation Tools**:
    -   **Holds**: Place various types of holds (Jugs, Crimps, Slopers, etc.) with color-coding for hands and feet.
    -   **Lines**: Draw lines to illustrate the route's path.
    -   **Text**: Add notes and beta directly onto the photo.
    -   **Route Description**: Write detailed descriptions for the entire route.
-   **📱 Mobile-First & Touch-Friendly**:
    -   **Responsive Design**: A seamless experience on both mobile and desktop.
    -   **Gesture Controls**: Use two-finger pinch-to-zoom and pan for easy navigation.
-   **💾 Project Portability**:
    -   **Export**: Save your entire project (photos, annotations, metadata) as a single `.zip` file.
    -   **Import**: Load a project from a `.zip` file to continue your work.
    -   **Share via URL**: Host your project file and share it with a simple URL parameter (`?load=<URL_to_zip>`).
-   **☁️ Cloud Sync**:
    -   Save projects to the cloud and access them from any device.
    -   Load projects directly from your cloud account.
-   **🌐 Offline Support**:
    -   Works as a Progressive Web App (PWA), allowing you to use it even without an internet connection.

## 🛠️ Tech Stack

-   **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI
-   **Backend**: Python, FastAPI, SQLAlchemy
-   **Database**: SQLite (default), compatible with PostgreSQL, etc.

## 🚀 Getting Started

1.  **Upload Photos**: Drag and drop your climbing wall photos or use the file picker.
2.  **Select a Tool**: Choose from holds, lines, or text tools in the sidebar.
3.  **Annotate**: Click or tap on the photo to place holds, draw paths, or add notes.
4.  **Navigate**: Use pinch-to-zoom and two-finger pan on mobile, or your mouse/trackpad on desktop.
5.  **Save & Share**:
    -   Export the current view as an image.
    -   Export the whole project as a `.zip` file.
    -   Save your project to the cloud to access it later.

## 💻 Development Setup

To run this project locally, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/crag.git
    cd crag
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Run the development server**:
    ```bash
    pnpm run dev
    ```

4.  **Build for production**:
    ```bash
    pnpm run build
    ```

5.  **Preview the production build**:
    ```bash
    pnpm run preview
    ```

### Backend Configuration

The frontend connects to a backend API to save and load projects from the cloud.

To configure the API endpoint, create a `.env.local` file in the root of the project and set the `VITE_API_URL` variable:

```
VITE_API_URL=https://your-api-endpoint.com/api
```

If `VITE_API_URL` is not set, it defaults to `/api`, which is suitable for running the frontend and backend on the same server.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## 📄 License

This project is licensed under the MIT License.
