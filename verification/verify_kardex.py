
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_kardex_translation(page: Page):
    # 1. Login as Admin
    page.goto("http://localhost:3000/#/login")
    page.wait_for_selector("text=Administrador")
    page.click("text=Administrador")
    page.fill("input[type='password']", "1234")
    page.click("button:has-text('Acessar Sistema')")

    # Wait for dashboard
    page.wait_for_url("**/#/")

    # 2. Navigate to Products
    page.click("a[href='#/products']")

    # 3. Wait for products table
    page.wait_for_selector("table")

    # 4. Open Kardex (History) for the first product
    # The button has a title "Histórico de Estoque" or just look for the History icon
    # We use the first button in the last column
    page.locator("button[title='Histórico de Estoque']").first.click()

    # 5. Wait for modal
    page.wait_for_selector("text=Histórico de Movimentação (Kardex)")

    # 6. Take screenshot
    time.sleep(1) # Animation
    page.screenshot(path="verification/kardex_modal.png")
    print("Screenshot saved to verification/kardex_modal.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_kardex_translation(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error_kardex.png")
        finally:
            browser.close()
