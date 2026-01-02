// API service for FloorPlan to 3D conversion

// Get API URL from environment variable, fallback to AWS backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://13.221.48.195:8080';

export async function convertFloorPlanTo3D(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error converting floor plan:', error);
    throw error;
  }
}

export function parseFloorPlanData(apiResponse) {
  // apiResponse structure:
  // {
  //   points: [{x1, y1, x2, y2}, ...],
  //   classes: [{name: 'wall'|'door'|'window'}, ...],
  //   Width: number,
  //   Height: number,
  //   averageDoor: number
  // }

  const objects = [];
  
  apiResponse.points.forEach((point, index) => {
    const className = apiResponse.classes[index]?.name || 'unknown';
    
    objects.push({
      type: className,
      bounds: {
        x1: point.x1,
        y1: point.y1,
        x2: point.x2,
        y2: point.y2,
      },
      width: Math.abs(point.x2 - point.x1),
      height: Math.abs(point.y2 - point.y1),
    });
  });

  return {
    objects,
    imageWidth: apiResponse.Width,
    imageHeight: apiResponse.Height,
    averageDoorSize: apiResponse.averageDoor,
  };
}
