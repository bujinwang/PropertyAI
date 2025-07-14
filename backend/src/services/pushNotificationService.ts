export const sendPushNotification = async (to: string, subject: string, message: string) => {
  console.log(`Sending push notification to ${to} with subject "${subject}" and message "${message}"`);
  // In a real application, this would integrate with a push notification service like Firebase Cloud Messaging, etc.
  return Promise.resolve();
};
