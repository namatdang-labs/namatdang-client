const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Seoul",
})

const shortDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Seoul",
})

export const formatPrice = (price: number) =>
  `${price.toLocaleString("ko-KR")}원`

export const formatManagementDateTime = (value: string) =>
  dateTimeFormatter.format(new Date(value))

export const formatShortManagementDateTime = (value: string) =>
  shortDateTimeFormatter.format(new Date(value))
