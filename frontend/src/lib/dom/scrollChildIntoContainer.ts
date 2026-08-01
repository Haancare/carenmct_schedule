/** 스크롤 컨테이너 안에서만 자식이 보이도록 이동 (페이지 전체 스크롤 방지) */
export function isFullyVisibleInContainer(
  container: HTMLElement,
  child: HTMLElement,
): boolean {
  const cRect = container.getBoundingClientRect();
  const sRect = child.getBoundingClientRect();
  return sRect.top >= cRect.top && sRect.bottom <= cRect.bottom;
}

export function scrollChildIntoContainer(
  container: HTMLElement,
  child: HTMLElement,
  behavior: ScrollBehavior = "smooth",
): void {
  if (isFullyVisibleInContainer(container, child)) return;

  const cRect = container.getBoundingClientRect();
  const sRect = child.getBoundingClientRect();
  const offsetTop = sRect.top - cRect.top + container.scrollTop;
  const top = Math.max(
    0,
    offsetTop - container.clientHeight / 2 + child.clientHeight / 2,
  );
  container.scrollTo({ top, behavior });
}
