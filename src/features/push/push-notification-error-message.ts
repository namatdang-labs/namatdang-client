import { PushNotificationSetupError } from "./push-notifications"

export function getPushNotificationErrorMessage(error: unknown) {
  if (error instanceof PushNotificationSetupError) {
    switch (error.code) {
      case "CONFIG_MISSING":
        return "Firebase 웹 설정이 없어 푸시 알림을 연결하지 못했어요."
      case "PERMISSION_DENIED":
        return "브라우저 설정에서 남았당 알림을 허용한 뒤 다시 시도해 주세요."
      case "TOKEN_UNAVAILABLE":
        return "FCM 토큰을 발급받지 못했어요. 잠시 후 다시 시도해 주세요."
      case "UNSUPPORTED":
        return "이 브라우저에서는 웹 푸시 알림을 사용할 수 없어요."
    }
  }

  return "푸시 알림을 연결하지 못했어요. 연결 상태를 확인해 주세요."
}
