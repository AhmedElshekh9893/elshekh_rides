export interface Coordinates {
  lat: number
  lng: number
}

export interface RouteInfo {
  distanceKm: number
  durationMin: number
  polyline: string
}

export interface MapsProvider {
  geocode(address: string): Promise<Coordinates>
  route(origin: string, destination: string, stops: string[]): Promise<RouteInfo>
  eta(origin: string, destination: string): Promise<number>
}

class GoogleMapsProvider implements MapsProvider {
  async geocode(address: string): Promise<Coordinates> {
    // TODO: Implement Google Maps Geocoding
    return { lat: 0, lng: 0 }
  }

  async route(origin: string, destination: string, stops: string[]): Promise<RouteInfo> {
    // TODO: Implement Google Maps Directions
    return { distanceKm: 0, durationMin: 0, polyline: '' }
  }

  async eta(origin: string, destination: string): Promise<number> {
    // TODO: Implement Google Maps ETA
    return 0
  }
}

export const mapsProvider: MapsProvider = new GoogleMapsProvider()
