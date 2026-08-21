import { fireEvent, render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { RepresentativeImage } from "./representative-image"

test("가게 사진이 없으면 남았당 기본 이미지를 보여준다", () => {
  const { container } = render(<RepresentativeImage kind="store" />)

  expect(screen.getByText("가게 기본 이미지")).toBeInTheDocument()
  expect(
    container.querySelector('img[src="/brand/namatdang-icon.png"]'),
  ).toHaveAttribute("alt", "")
})

test("대표 이미지가 있으면 사진을 보여준다", () => {
  render(
    <RepresentativeImage
      kind="store"
      src="https://images.example.com/store.jpg"
      alt="성수 테스트 빵집 대표 이미지"
    />,
  )

  expect(
    screen.getByRole("img", { name: "성수 테스트 빵집 대표 이미지" }),
  ).toHaveAttribute("src", "https://images.example.com/store.jpg")
})

test("대표 이미지를 로드하지 못하면 기본 이미지로 바꾼다", () => {
  render(
    <RepresentativeImage
      kind="deal"
      src="https://images.example.com/missing.jpg"
      alt="오늘의 소금빵 대표 이미지"
    />,
  )

  fireEvent.error(
    screen.getByRole("img", { name: "오늘의 소금빵 대표 이미지" }),
  )

  expect(screen.getByText("상품 기본 이미지")).toBeInTheDocument()
})
