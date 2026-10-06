import { notificationProvider } from './providers/notification'

export async function notifyTripAssigned(driverId: string, tripId: string, routeName: string) {
  await notificationProvider.send(
    driverId,
    'New Trip Assigned',
    `You have been assigned to ${routeName}`,
    { tripId, type: 'trip_assigned' }
  )
}

export async function notifyTripStarted(driverId: string, tripId: string, routeName: string) {
  await notificationProvider.send(
    driverId,
    'Trip Started',
    `${routeName} has started`,
    { tripId, type: 'trip_started' }
  )
}

export async function notifyTripDelayed(driverId: string, tripId: string, routeName: string, delayMinutes: number) {
  await notificationProvider.send(
    driverId,
    'Trip Delayed',
    `${routeName} is delayed by ${delayMinutes} minutes`,
    { tripId, type: 'trip_delayed', delayMinutes: String(delayMinutes) }
  )
}

export async function notifyTripCompleted(driverId: string, tripId: string, routeName: string) {
  await notificationProvider.send(
    driverId,
    'Trip Completed',
    `${routeName} has been completed`,
    { tripId, type: 'trip_completed' }
  )
}

export async function notifyCustomerTripUpdate(customerId: string, tripId: string, status: string) {
  await notificationProvider.send(
    customerId,
    'Trip Update',
    `Your trip status: ${status}`,
    { tripId, type: 'trip_update', status }
  )
}
