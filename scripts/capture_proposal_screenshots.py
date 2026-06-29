from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "proposal" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("home", "index.html"),
    ("program", "program.html"),
    ("recipes", "recipes.html"),
    ("recipe-detail", "recipe-detail.html?slug=dijon-salmon-spinach"),
    ("research", "research.html"),
    ("research-detail", "research-detail.html?slug=walking-after-meals"),
    ("booking", "book.html"),
    ("insurance", "insurance.html"),
    ("about", "about.html"),
]

MOBILE_PAGES = [
    ("mobile-home", "index.html"),
    ("mobile-program", "program.html"),
    ("mobile-recipes", "recipes.html"),
    ("mobile-research", "research.html"),
    ("mobile-booking", "book.html"),
]


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 960}, device_scale_factor=1)
        for name, path in PAGES:
            page.goto(f"http://127.0.0.1:5180/{path}", wait_until="networkidle")
            page.screenshot(path=str(OUT / f"{name}.png"), full_page=True)
        mobile = browser.new_page(
            viewport={"width": 390, "height": 844},
            device_scale_factor=1,
            is_mobile=True,
            has_touch=True,
        )
        for name, path in MOBILE_PAGES:
            mobile.goto(f"http://127.0.0.1:5180/{path}", wait_until="networkidle")
            mobile.screenshot(path=str(OUT / f"{name}.png"), full_page=True)
        mobile.close()
        browser.close()


if __name__ == "__main__":
    main()
