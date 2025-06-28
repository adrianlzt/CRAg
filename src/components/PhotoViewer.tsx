import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Text, Group, Transformer, Label, Tag } from 'react-konva';
import { useGesture } from '@use-gesture/react';
import Konva from 'konva';
import { Photo, Annotation, HoldType } from '../App';
import { HOLD_TYPES } from './HoldSelector';

interface PhotoViewerProps {
  photo: Photo;
  annotations: Annotation[];
  selectedTool: 'select' | 'hold' | 'line' | 'text';
  selectedHoldType: HoldType | null;
  selectedHandColor: 'red' | 'green';
  selectedFootColor: 'blue' | 'yellow';
  selectedLineColor: string;
  selectedLineWidth: number;
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
  selectedLineWidth,
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
  const [editingText, setEditingText] = useState<{ x: number; y: number; value: string } | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [holdIcons, setHoldIcons] = useState<Record<string, HTMLImageElement>>({});

  // Load hold icons
  useEffect(() => {
    const icons: Record<string, HTMLImageElement> = {};
    let loadedCount = 0;
    const totalIcons = HOLD_TYPES.length;

    if (totalIcons === 0) {
      setHoldIcons({});
      return;
    }

    HOLD_TYPES.forEach(holdType => {
      const img = new window.Image();
      img.src = holdType.icon;
      img.onload = () => {
        icons[holdType.icon] = img;
        loadedCount++;
        if (loadedCount === totalIcons) {
          setHoldIcons(icons);
        }
      };
    });
  }, []);

  // Focus textarea when it appears
  useEffect(() => {
    if (editingText) {
      textAreaRef.current?.focus();
    }
  }, [editingText]);

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
    if (!stage || !image) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to image coordinates
    const imageX = (pointerPosition.x - stageConfig.x) / stageConfig.scale;
    const imageY = (pointerPosition.y - stageConfig.y) / stageConfig.scale;

    if (selectedTool === 'hold' && selectedHoldType) {
      const imageScale = image.width / 1000; // Base width of 1000px
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
          scale: imageScale,
        },
      };
      onAnnotationAdd(annotation);
    } else if (selectedTool === 'text') {
      if (isDraggingAnnotation) return;
      setEditingText({ x: imageX, y: imageY, value: '' });
    }
  }, [selectedTool, selectedHoldType, photo.id, stageConfig, onAnnotationAdd, isDraggingAnnotation, selectedHandColor, selectedFootColor, image]);

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
        data: { points: currentLine, color: selectedLineColor, width: selectedLineWidth },
      };
      onAnnotationAdd(annotation);
    }

    setIsDrawing(false);
    setCurrentLine([]);
  }, [isDrawing, selectedTool, currentLine, photo.id, onAnnotationAdd, selectedLineColor, selectedLineWidth]);

  const handleTextEditEnd = (value: string) => {
    if (editingText) {
      if (value.trim()) {
        const annotation: Annotation = {
          id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'text',
          photoId: photo.id,
          x: editingText.x,
          y: editingText.y,
          data: { text: value, color: '#000000', fontSize: 16, rotation: 0 },
        };
        onAnnotationAdd(annotation);
      }
      setEditingText(null);
    }
  };

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
                  scaleX={annotation.data.scale || 1}
                  scaleY={annotation.data.scale || 1}
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
                    const scale = node.scaleX();
                    onAnnotationUpdate(annotation.id, {
                      x: node.x(),
                      y: node.y(),
                      data: {
                        ...annotation.data,
                        rotation: node.rotation() * Math.PI / 180,
                        scale: scale,
                      },
                    });
                  }}
                >
                  {/* Background circle */}
                  <Circle
                    radius={18}
                    fill="transparent"
                    stroke={getHoldColor(annotation)}
                    strokeWidth={2}
                  />
                  {/* Hold type icon */}
                  {holdIcons[annotation.data.icon] && (
                    <KonvaImage
                      image={holdIcons[annotation.data.icon]}
                      width={24}
                      height={24}
                      offsetX={12}
                      offsetY={12}
                      scaleX={annotation.data.category === 'foot' && annotation.data.handColor === 'yellow' ? -1 : 1}
                    />
                  )}
                </Group>
              );
            } else if (annotation.type === 'line') {
              return (
                <Line
                  key={annotation.id}
                  points={annotation.data.points}
                  stroke={annotation.data.color || "#f97316"}
                  strokeWidth={annotation.data.width || 3}
                  lineCap="round"
                  lineJoin="round"
                  onClick={() => handleAnnotationClick(annotation)}
                  onDblClick={() => handleAnnotationDoubleClick(annotation)}
                  onDblTap={() => handleAnnotationDoubleClick(annotation)}
                />
              );
            } else if (annotation.type === 'text') {
              return (
                <Label
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
                    const scale = node.scaleX();
                    // reset scale
                    node.scaleX(1);
                    node.scaleY(1);
                    onAnnotationUpdate(annotation.id, {
                      x: node.x(),
                      y: node.y(),
                      data: {
                        ...annotation.data,
                        rotation: node.rotation() * Math.PI / 180,
                        fontSize: (annotation.data.fontSize || 16) * scale,
                      },
                    });
                  }}
                >
                  <Tag
                    fill="white"
                    opacity={1}
                    cornerRadius={5}
                  />
                  <Text
                    text={annotation.data.text}
                    fontSize={annotation.data.fontSize || 16}
                    fill="#000000"
                    fontWeight="bold"
                    padding={5}
                  />
                </Label>
              );
            }
            return null;
          })}

          {/* Render current drawing line */}
          {isDrawing && currentLine.length > 2 && (
            <Line
              points={currentLine}
              stroke={selectedLineColor}
              strokeWidth={selectedLineWidth}
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
        {selectedTool === 'select' && '🔧 Select'}
        {selectedTool === 'hold' && '✋ Hold'}
        {selectedTool === 'line' && '✏️ Draw'}
        {selectedTool === 'text' && '📝 Text'}
      </div>

      {editingText && (
        <textarea
          ref={textAreaRef}
          style={{
            position: 'absolute',
            top: `${editingText.y * stageConfig.scale + stageConfig.y}px`,
            left: `${editingText.x * stageConfig.scale + stageConfig.x}px`,
            background: 'white',
            border: '2px solid #f97316',
            borderRadius: '4px',
            color: 'black',
            fontSize: '16px',
            padding: '5px',
            minWidth: '150px',
            minHeight: '50px',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          defaultValue={editingText.value}
          onBlur={(e) => handleTextEditEnd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditingText(null);
            }
            // `metaKey` for Command on Mac, `ctrlKey` for Ctrl on Windows/Linux
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleTextEditEnd(e.currentTarget.value);
            }
          }}
        />
      )}
    </div>
  );
};
