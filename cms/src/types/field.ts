export type FieldType = 'field' | 'greenhouse'

export interface FieldPolygon {
  id: string
  name: string
  type?: FieldType
  cropName: string
  areaDecares: number // dönüm
  coordinates: [number, number][]
  color: string
  regionId?: string | number
  regionName?: string
  createdAt?: string
}
