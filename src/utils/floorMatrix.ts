import { FloorMapping, InspectionItem } from '../types';

export function calculateFloorMatrix(stopCount: number, floorStart: number): FloorMapping[] {
  const matrix: FloorMapping[] = [];

  for (let i = 1; i <= stopCount; i++) {
    const floorVal = floorStart + (i - 1);
    let label = '';

    if (floorVal < 0) {
      label = `${floorVal}. Kat (Bodrum ${Math.abs(floorVal)})`;
    } else if (floorVal === 0) {
      label = '0 / Zemin Kat';
    } else {
      label = `${floorVal}. Kat`;
    }

    matrix.push({
      stopIndex: i,
      floorValue: floorVal,
      floorLabel: label,
    });
  }

  return matrix;
}

export function generateDoorInspectionItems(stopCount: number, floorStart: number): InspectionItem[] {
  const matrix = calculateFloorMatrix(stopCount, floorStart);
  
  const items: InspectionItem[] = [
    {
      id: 'door_cabin',
      title: 'KABİN KAPISI',
      isNonCompliant: false,
      description: '',
      category: 'Kabin ve Kat Kapısı Montajları',
      floorLabel: 'Kabin',
    }
  ];

  matrix.forEach((floor) => {
    items.push({
      id: `door_stop_${floor.stopIndex}`,
      title: `${floor.stopIndex}. DURAK (${floor.floorLabel})`,
      isNonCompliant: false,
      description: '',
      category: 'Kabin ve Kat Kapısı Montajları',
      floorLabel: floor.floorLabel,
    });
  });

  return items;
}
