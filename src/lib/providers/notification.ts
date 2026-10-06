export interface NotificationProvider {
  send(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void>
}

class FCMNotificationProvider implements NotificationProvider {
  async send(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    // TODO: Implement FCM integration
    console.log(`[Notification] ${userId}: ${title} - ${body}`)
  }
}

export const notificationProvider: NotificationProvider = new FCMNotificationProvider()
