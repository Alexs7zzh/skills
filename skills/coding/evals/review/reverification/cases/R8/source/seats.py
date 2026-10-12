def reserve(capacity: int, requested: int) -> dict[str, int]:
    granted = min(capacity, requested)
    return {"granted": granted, "remaining": capacity - granted}
