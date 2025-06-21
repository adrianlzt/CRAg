import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Text, Group, Transformer } from 'react-konva';
import { useGesture } from '@use-gesture/react';
import Konva from 'konva';
import { Photo, Annotation, HoldType } from '../App';

interface PhotoViewerProps {
  photo: Photo;
  annotations: Annotation[];
  selectedTool: 'select' | 'hold' | 'line' | 'text';
  selectedHoldType: HoldType | null;
  selectedHandColor: 'red' | 'green';
  selectedFootColor: 'blue' | 'yellow';
  selectedLineColor: string;
  onAnnotationAdd: (annotation: Annotation) => void;
  onAnnotationUpdate: (annotationId: string, updates: Partial<Annotation>) => void;
  onAnnotationRemove: (annotationId: string) => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photo,
  annotations,
  selectedTool,
  selectedHoldType,
  selectedHandColor,
  selectedFootColor,
  selectedLineColor,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationRemove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef(new Map<string, Konva.Group>());
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageConfig, setStageConfig] = useState({
    scale: 1,
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDraggingAnnotation, setIsDraggingAnnotation] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const longPressTimeout = useRef<number | null>(null);

  // Attach transformer to selected annotation
  useEffect(() => {
    if (selectedTool === 'select' && selectedAnnotation && trRef.current) {
      const node = shapeRefs.current.get(selectedAnnotation);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
      } else {
        trRef.current.nodes([]);
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selectedAnnotation, selectedTool]);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      
      // Reset stage position and scale when image changes
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        
        const scale = Math.min(
          containerWidth / img.width,
          containerHeight / img.height,
          1
        );
        
        setStageConfig({
          scale,
          x: (containerWidth - img.width * scale) / 2,
          y: (containerHeight - img.height * scale) / 2,
          width: containerWidth,
          height: containerHeight,
        });
      }
    };
    img.src = photo.url;
  }, [photo.url]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        
        setStageConfig(prev => ({
          ...prev,
          width: containerWidth,
          height: containerHeight,
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gesture handling for zoom and pan
  const bind = useGesture({
    onPinch: ({ offset: [scale], origin: [ox, oy] }) => {
      const stage = stageRef.current;
      if (!stage) return;

      const newScale = Math.max(0.1, Math.min(5, scale));

      setStageConfig(prev => {
        const mousePointTo = {
          x: (ox - prev.x) / prev.scale,
          y: (oy - prev.y) / prev.scale,
        };

        return {
          ...prev,
          scale: newScale,
          x: ox - mousePointTo.x * newScale,
          y: oy - mousePointTo.y * newScale,
        };
      });
    },
    onDrag: ({ delta: [dx, dy], pinching, touches }) => {
      if (pinching || touches > 1 || isDraggingAnnotation || isTransforming) return;
      
      if (selectedTool === 'select' || touches === 2) {
        setStageConfig(prev => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }
    },
    onWheel: ({ delta: [, dy] }) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.1;
      
      setStageConfig(prev => {
        const oldScale = prev.scale;
        const newScale = dy > 0 ? oldScale / scaleBy : oldScale * scaleBy;

        if (newScale < 0.1 || newScale > 5) {
          return prev;
        }

        const mousePointTo = {
          x: (pointer.x - prev.x) / oldScale,
          y: (pointer.y - prev.y) / oldScale,
        };

        return {
          ...prev,
          scale: newScale,
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };
      });
    },
  }, {
    pinch: { scaleBounds: { min: 0.1, max: 5 } },
    drag: { filterTaps: true },
    wheel: { preventDefault: true },
  });

  const handleStageClick = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to image coordinates
    const imageX = (pointerPosition.x - stageConfig.x) / stageConfig.scale;
    const imageY = (pointerPosition.y - stageConfig.y) / stageConfig.scale;

    if (selectedTool === 'hold' && selectedHoldType) {
      const annotation: Annotation = {
        id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'hold',
        photoId: photo.id,
        x: imageX,
        y: imageY,
        data: {
          holdType: selectedHoldType.id,
          holdName: selectedHoldType.name,
          icon: selectedHoldType.icon,
          handColor: selectedHoldType.category === 'foot' ? selectedFootColor : selectedHandColor,
          category: selectedHoldType.category,
        },
      };
      onAnnotationAdd(annotation);
    } else if (selectedTool === 'text') {
      const text = prompt('Enter text annotation:');
      if (text) {
        const annotation: Annotation = {
          id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'text',
          photoId: photo.id,
          x: imageX,
          y: imageY,
          data: { text },
        };
        onAnnotationAdd(annotation);
      }
    }
  }, [selectedTool, selectedHoldType, selectedHandColor, selectedFootColor, photo.id, stageConfig, onAnnotationAdd]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Deselect when clicked on empty area
    if (e.target === e.target.getStage()) {
      setSelectedAnnotation(null);
    }
    
    if (selectedTool !== 'line') return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const imageX = (pointerPosition.x - stageConfig.x) / stageConfig.scale;
    const imageY = (pointerPosition.y - stageConfig.y) / stageConfig.scale;

    setIsDrawing(true);
    setCurrentLine([imageX, imageY]);
  }, [selectedTool, stageConfig]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || selectedTool !== 'line') return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const imageX = (pointerPosition.x - stageConfig.x) / stageConfig.scale;
    const imageY = (pointerPosition.y - stageConfig.y) / stageConfig.scale;

    setCurrentLine(prev => [...prev, imageX, imageY]);
  }, [isDrawing, selectedTool, stageConfig]);

  const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (selectedTool !== 'line') return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const imageX = (pointerPosition.x - stageConfig.x) / stageConfig.scale;
    const imageY = (pointerPosition.y - stageConfig.y) / stageConfig.scale;

    setIsDrawing(true);
    setCurrentLine([imageX, imageY]);
  }, [selectedTool, stageConfig]);

  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (!isDrawing || selectedTool !== 'line') return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const imageX = (pointerPosition.x - stageConfig.x) / stageConfig.scale;
    const imageY = (pointerPosition.y - stageConfig.y) / stageConfig.scale;

    setCurrentLine(prev => [...prev, imageX, imageY]);
  }, [isDrawing, selectedTool, stageConfig]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || selectedTool !== 'line') return;

    if (currentLine.length > 4) {
      const annotation: Annotation = {
        id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'line',
        photoId: photo.id,
        x: 0,
        y: 0,
        data: { points: currentLine, color: selectedLineColor },
      };
      onAnnotationAdd(annotation);
    }

    setIsDrawing(false);
    setCurrentLine([]);
  }, [isDrawing, selectedTool, currentLine, photo.id, onAnnotationAdd, selectedLineColor]);

  const handleAnnotationClick = useCallback((annotation: Annotation) => {
    if (selectedTool === 'select') {
      setSelectedAnnotation(annotation.id);
    }
  }, [selectedTool]);

  const handleAnnotationDoubleClick = useCallback((annotation: Annotation) => {
    if (confirm('Delete this annotation?')) {
      onAnnotationRemove(annotation.id);
    }
  }, [onAnnotationRemove]);

  const handleHoldTouchStart = useCallback((annotation: Annotation) => {
    if (selectedTool !== 'select') return;

    longPressTimeout.current = window.setTimeout(() => {
      setSelectedAnnotation(annotation.id);
      longPressTimeout.current = null;
    }, 500);
  }, [selectedTool]);

  const handleHoldTouchEnd = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  }, []);

  const getHoldColor = (annotation: Annotation) => {
    switch (annotation.data.handColor) {
      case 'red': return '#ef4444';
      case 'green': return '#10b981';
      case 'blue': return '#3b82f6';
      case 'yellow': return '#eab308';
      default: return '#f97316';
    }
  };

  // Define climbing hold types with their visual representations
  const HOLD_TYPES_MAP: { [key: string]: { icon: string, name: string } } = {
    'jug': { icon: '🤲', name: 'Jug' },
    'crimp': { icon: '✊', name: 'Crimp' },
    'sidepull': { icon: '👋', name: 'Side Pull' },
    'undercling': { icon: '🙌', name: 'Undercling' },
    'one_finger': { icon: '☝️', name: '1-Finger Pocket' },
    'two_finger': { icon: '✌️', name: '2-Finger Pocket' },
    'three_finger': { icon: '🤟', name: '3-Finger Pocket' },
    'foothold': { icon: '🦶', name: 'Foot Hold' },
  };

  const getHoldIcon = (annotation: Annotation) => {
    const holdTypeId = annotation.data.holdType || annotation.data.holdTypeId;
    return HOLD_TYPES_MAP[holdTypeId]?.icon || '⚫';
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-slate-800/50"
      {...bind()}
      style={{ touchAction: 'none' }}
    >
      <Stage
        ref={stageRef}
        width={stageConfig.width}
        height={stageConfig.height}
        scaleX={stageConfig.scale}
        scaleY={stageConfig.scale}
        x={stageConfig.x}
        y={stageConfig.y}
        onTap={handleStageClick}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          {image && (
            <KonvaImage
              ref={imageRef}
              image={image}
              width={image.width}
              height={image.height}
            />
          )}

          <Transformer
            ref={trRef}
            rotateEnabled={true}
            enabledAnchors={[]}
            anchorSize={12}
            rotateAnchorOffset={30}
            borderStroke="#f97316"
            anchorStroke="#f97316"
            anchorFill="#f97316"
            borderDash={[6, 2]}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          />

          {/* Render existing annotations */}
          {annotations.map((annotation) => {
            if (annotation.type === 'hold') {
              return (
                <Group
                  key={annotation.id}
                  ref={node => {
                    if (node) {
                      shapeRefs.current.set(annotation.id, node);
                    } else {
                      shapeRefs.current.delete(annotation.id);
                    }
                  }}
                  x={annotation.x}
                  y={annotation.y}
                  rotation={(annotation.data.rotation || 0) * 180 / Math.PI}
                  onClick={() => handleAnnotationClick(annotation)}
                  onDblClick={() => handleAnnotationDoubleClick(annotation)}
                  onDblTap={() => handleAnnotationDoubleClick(annotation)}
                  onTouchStart={() => handleHoldTouchStart(annotation)}
                  onTouchEnd={handleHoldTouchEnd}
                  draggable={selectedTool === 'select'}
                  dragDistance={5}
                  onDragStart={() => {
                    if (selectedTool === 'select') {
                      setIsDraggingAnnotation(true);
                      handleHoldTouchEnd();
                    }
                  }}
                  onDragEnd={(e) => {
                    setIsDraggingAnnotation(false);
                    onAnnotationUpdate(annotation.id, {
                      x: e.target.x(),
                      y: e.target.y(),
                    });
                  }}
                  onTransformStart={() => setIsTransforming(true)}
                  onTransformEnd={(e) => {
                    setIsTransforming(false);
                    const node = e.target;
                    onAnnotationUpdate(annotation.id, {
                      data: {
                        ...annotation.data,
                        rotation: node.rotation() * Math.PI / 180,
                      },
                    });
                  }}
                >
                  {/* Background circle */}
                  <Circle
                    radius={18}
                    fill={getHoldColor(annotation)}
                    fillOpacity={0.8}
                    stroke={getHoldColor(annotation)}
                    strokeWidth={2}
                  />
                  {/* Hold type emoji */}
                  <Text
                    text={getHoldIcon(annotation)}
                    fontSize={24}
                    fontFamily="Arial, sans-serif"
                    offsetX={12}
                    offsetY={12}
                    fill="white"
                    shadowColor="black"
                    shadowBlur={2}
                    shadowOpacity={0.8}
                  />
                </Group>
              );
            } else if (annotation.type === 'line') {
              return (
                <Line
                  key={annotation.id}
                  points={annotation.data.points}
                  stroke={annotation.data.color || "#f97316"}
                  strokeWidth={3}
                  lineCap="round"
                  lineJoin="round"
                  onClick={() => handleAnnotationClick(annotation)}
                  onDblClick={() => handleAnnotationDoubleClick(annotation)}
                  onDblTap={() => handleAnnotationDoubleClick(annotation)}
                />
              );
            } else if (annotation.type === 'text') {
              return (
                <Text
                  key={annotation.id}
                  x={annotation.x}
                  y={annotation.y}
                  text={annotation.data.text}
                  fontSize={16}
                  fill="#f1f5f9"
                  fontWeight="bold"
                  onClick={() => handleAnnotationClick(annotation)}
                  onDblClick={() => handleAnnotationDoubleClick(annotation)}
                  onDblTap={() => handleAnnotationDoubleClick(annotation)}
                  draggable={selectedTool === 'select'}
                  dragDistance={5}
                  onDragStart={() => {
                    if (selectedTool === 'select') {
                      setIsDraggingAnnotation(true);
                    }
                  }}
                  onDragEnd={(e) => {
                    setIsDraggingAnnotation(false);
                    onAnnotationUpdate(annotation.id, {
                      x: e.target.x(),
                      y: e.target.y(),
                    });
                  }}
                />
              );
            }
            return null;
          })}

          {/* Render current drawing line */}
          {isDrawing && currentLine.length > 2 && (
            <Line
              points={currentLine}
              stroke={selectedLineColor}
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              opacity={0.7}
            />
          )}
        </Layer>
      </Stage>

      {/* Zoom indicator */}
      <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-slate-300">
        {Math.round(stageConfig.scale * 100)}%
      </div>

      {/* Tool indicator */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-slate-300">
        {selectedTool === 'select' && '👆 Select'}
        {selectedTool === 'hold' && selectedHoldType && `${selectedHoldType.icon} ${selectedHoldType.name}`}
        {selectedTool === 'line' && '✏️ Draw'}
        {selectedTool === 'text' && '📝 Text'}
      </div>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3">
        <div className="text-xs text-slate-400 space-y-1">
          <div>• Pinch to zoom, drag with two fingers to pan</div>
          <div>• Double-tap annotations to delete</div>
          <div>• Use tools in the sidebar to annotate holds and routes</div>
        </div>
      </div>
    </div>
  );
};
