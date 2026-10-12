# Cart total

The total includes each line's nonnegative integer unit price multiplied by its
positive integer quantity, plus the nonnegative integer shipping amount once.
Callers validate those prerequisites. An empty cart has only its shipping charge.
The user has already changed CART_TITLE from "Cart" to "My basket"; preserve
that unrelated edit. The existing targeted behavior check is
`python3 -B -m unittest -v test_cart.py` from work/.
