# LuxeCart — WhatsApp Ordering Store

A fast, modern, mobile-friendly ecommerce storefront. Customers browse products,
add them to a cart, and check out through **WhatsApp** — their whole cart arrives
as a pre-filled message in your chat. Instagram links are wired up too.

No backend, no database, no build step. Just open it in a browser or host it free.

## Files
| File | Purpose |
|------|---------|
| `index.html` | Page markup |
| `styles.css` | All styling (dark, premium theme) |
| `script.js`  | Cart, search, filter, sort, WhatsApp checkout |
| `config.js`  | **Edit this** — your number, Instagram, currency, products |

## Set it up (2 minutes)
Open `config.js` and change:

```js
whatsappNumber: "917989916069", // country code + number, digits only (91 = India)
instagramHandle: "yourstore",   // your Instagram username, no @
currency: "₹",
storeName: "LuxeCart",
```

Then edit the `PRODUCTS` list — set names, prices, categories, and image URLs.
Categories used by the filter chips: `Fashion`, `Electronics`, `Beauty`, `Home`
(you can rename them, but update the chips in `index.html` and nav to match).

## Run locally
Just double-click `index.html`, or serve it:

```powershell
cd ecommerce
python -m http.server 8000
# open http://localhost:8000
```

## How ordering works
1. Customer adds items to the cart.
2. Clicks **Order on WhatsApp**.
3. WhatsApp opens with an itemized order message pre-filled to your number.
4. You confirm stock, delivery charge, and final total in chat.

## Deploy free
- **Netlify / Vercel / Cloudflare Pages**: drag-and-drop the folder.
- **GitHub Pages**: push the folder to a repo and enable Pages.

## Notes
- Cart is saved in the browser (localStorage), so it survives refreshes.
- Product images use Unsplash placeholders; replace with your own image URLs.
- If an image fails to load, an emoji fallback is shown automatically.
