# Cursor page contract

`source/paging.py::page_after` receives a finite sequence of entries with unique integer keys in strictly ascending order, and a positive integer limit. Callers validate those prerequisites. The optional cursor can be any integer; it need not match an existing key.

With no cursor, the page starts at the first entry. With a cursor, it contains only keys strictly greater than that cursor. The page holds at most `limit` entries in source order. `has_more` is true exactly when additional eligible entries remain after the returned page. Empty input and cursors beyond the final key yield an empty page with `has_more` false. Paging must not alter the input sequence or its entries.
