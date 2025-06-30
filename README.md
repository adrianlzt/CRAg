# 🧗‍♂️ Climbing Route Annotator

A comprehensive mobile-first web application for climbers to annotate climbing routes with advanced interactive features. Built with React, TypeScript, and TailwindCSS.

## 🚀 Live Demo

**[Try the App](https://crag-one.vercel.app/)**

<br/>

<video src="demo.mp4" controls="controls" style="max-width: 720px;">
</video>

## 📱 Features

### Photo Management
- ✅ **Multiple Photo Upload**: Drag & drop + file picker support
- ✅ **Vertical Photo Stacking**: Organize photos vertically in sidebar
- ✅ **Photo Reordering**: Drag to reorder photo sequence
- ✅ **Mobile-Optimized Display**: Responsive photo gallery

### Touch & Gesture Controls
- ✅ **Two-Finger Pinch Zoom**: Smooth pinch-to-zoom functionality
- ✅ **Pan/Move Gestures**: Two-finger pan for photo navigation
- ✅ **Touch-Optimized Interface**: Mobile-first design with touch targets
- ✅ **Responsive Controls**: Works seamlessly on desktop and mobile

### Hold Annotation System
- ✅ **8 Hold Types**: 
  - 🤲 Jugs
  - ✊ Crimps
  - 👋 Side Pull
  - 🙌 Undercling
  - ☝️ One-finger pocket
  - ✌️ Two-finger pocket
  - 🤟 Three-finger pocket
  - 🦶 Foot holds
- ✅ **Color Coding**: Red (right hand), Green (left hand), Blue/Yellow (feet)
- ✅ **Interactive Placement**: Click/tap to place holds on photos
- ✅ **Icon Manipulation**: Move, select, and remove holds

### Drawing & Annotation
- ✅ **Free Drawing Tool**: Draw route lines for path marking
- ✅ **Text Annotations**: Add text notes (stored separately)
- ✅ **Undo/Redo Functionality**: Full history management
- ✅ **Visual Route Mapping**: Clear route visualization

### Export/Import Features
- ✅ **Project Export**: Export the entire project (photos, annotations, metadata) as a `.zip` file.
- ✅ **Image Export**: Export the current view (photo with annotations) as an image.
- ✅ **Project Import**: Import a `.zip` project file to continue working.
- ✅ **Annotation Preservation**: All data is preserved during export/import.

## 🛠️ Technical Stack

- **Framework**: React 18.3 with TypeScript
- **Styling**: TailwindCSS for responsive design
- **Canvas**: React Konva for annotation layers
- **Gestures**: @use-gesture/react for touch interactions
- **Icons**: Lucide React
- **Export**: File-saver for downloads
- **Build Tool**: Vite
- **Package Manager**: pnpm

## 🎨 Design Philosophy

### Climbing-Themed Visual Design
- **Dark Gradient Background**: Professional slate gradient theme
- **Mountain Branding**: Climbing-specific iconography
- **Orange Accent Colors**: High contrast for outdoor visibility
- **Color-Coded System**: Intuitive hand/foot color coding
- **Mobile-First**: Optimized for field use

### User Experience
- **Intuitive Workflow**: Upload → Annotate → Export
- **Clear Visual Hierarchy**: Organized tool panels
- **Responsive Design**: Works on all screen sizes
- **Touch-Friendly**: Large touch targets for outdoor use

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

## 🎯 Mobile-First Features

- **Touch Gestures**: Optimized for mobile climbing use
- **Responsive Layout**: Adapts to phone/tablet/desktop
- **Large Touch Targets**: Easy to use with climbing gloves
- **Dark Theme**: Better visibility in outdoor conditions
- **PWA Support**: Installable as a Progressive Web App for an app-like experience and offline access.

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

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Header.tsx           # App header with branding
│   ├── PhotoUpload.tsx      # Photo upload and management
│   ├── PhotoViewer.tsx      # Main annotation canvas
│   ├── HoldSelector.tsx     # Climbing hold type selector
│   ├── DrawingTools.tsx     # Annotation tools panel
│   └── ExportImport.tsx     # SVG/JSON export/import
├── App.tsx                  # Main application component
└── main.tsx                 # Application entry point
```

## 🎉 Success Criteria

- [x] **Fully functional photo upload and arrangement**
- [x] **Smooth pinch-zoom and pan gestures on mobile**
- [x] **Complete hold annotation system with all specified types**
- [x] **Working icon manipulation (move, select)**
- [x] **Functional drawing tools**
- [x] **Project export/import working correctly**
- [x] **Text annotation system implemented**
- [x] **Mobile-first responsive design**
- [x] **Deployed and accessible web application**

## 🌟 Target Users

**Rock climbers** who need to document and share route information through photo annotations, including:
- Route setters documenting new climbs
- Climbers sharing beta with community
- Climbing coaches teaching techniques
- Outdoor enthusiasts mapping routes

## 📱 Browser Support

- Modern mobile browsers (iOS Safari, Chrome Mobile)
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Touch and mouse input support
- Responsive design for all screen sizes

---

**Built with ❤️ for the climbing community**
