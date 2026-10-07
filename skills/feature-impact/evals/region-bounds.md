# Region bounds source bundle

This is a small source fixture. Paths identify separate files. Only the shown behavior is available.

A map application now determines visible regions by their polygon bounds instead of distance to the label anchor. The visibility implementation is complete. A region may have a label anchor far from the polygon's nearest edge. Label anchors remain the authored positions for text placement and bookmarked views. Every consumer below runs for both offline and shared maps.

## map/visibility.py

```python
def visible_regions(regions, viewport):
    return [r for r in regions if r.bounds.intersects(viewport)]
```

## map/load_queue.py

```python
def order_visible_regions(regions, camera):
    return sorted(regions, key=lambda r: distance(r.label_anchor, camera))
```

## map/labels.py

```python
def place_label(region):
    return Text(region.name, position=region.label_anchor)
```

## map/bookmarks.py

```python
def save_bookmark(region):
    return {"region_id": region.id, "camera": region.label_anchor}
```

## map/edit.py

```python
def edit_vertex(region, index, point):
    region.vertices[index] = point
    region.bounds = bounding_box(region.vertices)
    publish("region_changed", region.id)
```

## sync/publish.py

```python
def publish_region(region):
    return {"id": region.id, "vertices": region.vertices,
            "label_anchor": region.label_anchor}
```

## sync/receive.py

```python
def receive_region(message):
    region = regions.get_or_create(message["id"])
    region.vertices = message["vertices"]
    region.label_anchor = message["label_anchor"]
    region.bounds = bounding_box(region.vertices)
    publish("region_changed", region.id)
```

## map/hover.py

```python
def hover_candidates(regions, pointer):
    return [r for r in regions if distance(r.label_anchor, pointer) < 20]
```

The interaction contract says hovering any point within a region offers that region for inspection.

## tools/overlay.py

```python
def draw_visibility_debug(region, radius):
    return draw_circle(region.label_anchor, radius)
```
