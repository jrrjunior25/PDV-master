
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_login_page(page: Page):
    # Wait for the server to start
    time.sleep(5)

    try:
        page.goto("http://localhost:3000")
    except Exception as e:
        print(f"Error loading page: {e}")
        return

    # The app redirects to /login if not authenticated
    # Expect the login page to load
    # We can check for "MercadoMaster" or "Bem-vindo de volta"

    # Wait for the app to initialize (it shows "Carregando Sistema...")
    # Then it should show the login screen

    # Increase timeout as the app might be slow to load initially
    page.wait_for_selector("text=MercadoMaster", timeout=10000)

    expect(page.get_by_text("Bem-vindo de volta")).to_be_visible()

    page.screenshot(path="verification/login_page.png")
    print("Screenshot saved to verification/login_page.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_login_page(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
