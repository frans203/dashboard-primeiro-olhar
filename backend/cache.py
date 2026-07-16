"""In-memory cache for aggregates.

The dataset is static and every aggregate is deterministic for a given combination of
filters, so results can be cached for the whole process lifetime.

Two strategies:

* :func:`cached_no_params` — decorator wrapping :func:`functools.lru_cache` for
  aggregates that take no parameters (e.g. the therapies filter list).
* :class:`AggregateCache` — a dict indexed by a hashable key built from the route name
  and its filter values, for the parametrized aggregates.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any, Callable, Hashable, Optional

# Re-export lru_cache for no-parameter aggregates.
cached_no_params: Callable = lru_cache(maxsize=None)


def make_key(route: str, params: dict[str, Any]) -> Hashable:
    """Build a stable, hashable cache key from a route name + its filter params.

    ``None`` values are dropped so that equivalent requests collapse to the same key.
    """
    items = tuple(sorted((k, v) for k, v in params.items() if v is not None))
    return (route, items)


class AggregateCache:
    """Simple process-wide dict cache keyed by ``make_key`` output."""

    def __init__(self) -> None:
        self._store: dict[Hashable, Any] = {}

    def get(self, key: Hashable) -> Optional[Any]:
        return self._store.get(key)

    def set(self, key: Hashable, value: Any) -> Any:
        self._store[key] = value
        return value

    def get_or_compute(self, key: Hashable, compute: Callable[[], Any]) -> Any:
        if key in self._store:
            return self._store[key]
        return self.set(key, compute())

    def clear(self) -> None:
        self._store.clear()


#: Shared instance used by the routes.
aggregate_cache = AggregateCache()
