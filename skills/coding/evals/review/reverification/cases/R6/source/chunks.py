def chunk_ranges(total: int, width: int) -> list[tuple[int, int]]:
    return [(start, min(start + width, total))
            for start in range(0, total, width)]
