# 🧗‍♂️ Climbing Route Annotator

A comprehensive mobile-first web application for climbers to annotate climbing routes with advanced interactive features.

**[Open the App](https://crag-one.vercel.app/)**

<br/>

[<img src="https://github.com/user-attachments/assets/5ea00e3e-3144-4588-9a4d-055e35b1916c" width="150" />](screenshot1)
[<img src="https://github.com/user-attachments/assets/18742552-fb9d-4a87-948c-8cd75c059929" width="150" />](screenshot2)
[<img src="https://github.com/user-attachments/assets/f32f5158-304b-4c56-aa8f-ab4be1360907" width="150" />](screenshot3)


https://github.com/user-attachments/assets/8230c702-89f7-4492-a03b-5327a462e97f


## 📱 Features

### Photo Management
- **Multiple Photo Upload**: Drag & drop + file picker support
- **Vertical Photo Stacking**: Organize photos vertically in sidebar
- **Photo Reordering**: Drag to reorder photo sequence
- **Mobile-Optimized Display**: Responsive photo gallery

### Touch & Gesture Controls
- **Two-Finger Pinch Zoom**: Smooth pinch-to-zoom functionality
- **Pan/Move Gestures**: Two-finger pan for photo navigation
- **Touch-Optimized Interface**: Mobile-first design with touch targets
- **Responsive Controls**: Works seamlessly on desktop and mobile

### Hold Annotation System
- **9 Hold Types**: 
  - 🤲 Jugs
  - ✊ Crimps
  - 🙌 Undercling
  - 🤏 Pinch
  - 🖐️ Sloper
  - ☝️ One-finger pocket
  - ✌️ Two-finger pocket
  - 🤟 Three-finger pocket
  - 🦶 Foot holds
- **Color Coding**: Red (right hand), Green (left hand), Blue/Yellow (feet)
- **Interactive Placement**: Click/tap to place holds on photos
- **Icon Manipulation**: Move, select, and remove holds

### Drawing & Annotation
- **Free Drawing Tool**: Draw route lines for path marking
- **Text Annotations**: Add text notes
- **Route description**: Long text explainin the route
- **Undo/Redo Functionality**: Full history management
- **Visual Route Mapping**: Clear route visualization

### Export/Import Features
- **Project Export**: Export the entire project (photos, annotations, metadata) as a `.zip` file.
- **Image Export**: Export the current view (photo with annotations) as an image.
- **Project Import**: Import a `.zip` project file to continue working.
- **URL-based Import**: Share projects via a URL. Just append `?load=<URL_to_your_zip_file>` to the app's URL.
- **Annotation Preservation**: All data is preserved during export/import.

### Cloud Storage
- **Save to Cloud**: Save your entire project (photos, annotations, metadata) to a cloud backend.
- **Load from Cloud**: Load projects from the cloud to continue your work on any device.

### Works offline
- **PWA**: Install the app locally and use it offline (Progressive Web App)

## 📖 How to Use

1. **Upload Photos**: 
   - Drag & drop climbing photos or click to select

2. **Select Tools**:
   - Choose hold types from the climbing holds panel
   - Select hand color (red/green) for hand holds
   - Use drawing tool for route lines

3. **Annotate Routes**:
   - Tap/click to place holds on climbing features
   - Draw lines to mark climbing paths
   - Add text annotations for beta notes

4. **Navigate Photos**:
   - Pinch to zoom in/out
   - Two-finger drag to pan
   - Use photo list to switch between images

5. **Export & Share**:
   - Export the current photo with annotations as an image.
   - Export the entire project as a `.zip` file for backup or sharing.
   - Import a project `.zip` file to continue your work.
   - Share a project by uploading the `.zip` file to a public host and creating a shareable link like `https://crag-one.vercel.app/?load=URL_TO_ZIP`.

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### API Configuration

The application can be connected to a cloud backend for saving and loading projects. The API for this backend is specified in the `openapi.yaml` file.

To configure the frontend to communicate with your backend, create a `.env.local` file in the root of the project and set the `VITE_API_URL` variable:

```
VITE_API_URL=https://your-api-endpoint.com/api
```

If `VITE_API_URL` is not set, it will default to `/api`, expecting a relative path for the API calls.
