
from playwright.sync_api import Page, expect, sync_playwright
import time
import random

def verify_pos_quick_register(page: Page):
    # 1. Login
    page.goto("http://localhost:3000/#/login")
    page.wait_for_selector("text=Administrador")
    page.click("text=Administrador")
    page.fill("input[type='password']", "1234")
    page.click("button:has-text('Acessar Sistema')")
    page.wait_for_url("**/#/")

    # 2. Go to POS
    page.goto("http://localhost:3000/#/pdv")
    page.wait_for_selector("text=PDV MERCADOMASTER")

    # 3. Open Identification
    page.keyboard.press("F11")
    page.wait_for_selector("h2:has-text('CPF na Nota?')")

    # 4. Enter new CPF
    modal = page.locator("div.bg-white:has(h2:text-is('CPF na Nota?'))")
    input_loc = modal.locator("input").first

    # Generate random CPF to avoid conflicts
    cpf_num = "".join([str(random.randint(0, 9)) for _ in range(11)])
    new_cpf = f"{cpf_num[:3]}.{cpf_num[3:6]}.{cpf_num[6:9]}-{cpf_num[9:]}"

    input_loc.fill(new_cpf)

    # Press Enter to submit
    page.keyboard.press("Enter")

    # 5. Verify Quick Register Modal appears
    page.wait_for_selector("text=Cadastrar Cliente Rápido")

    # 6. Fill Name and Register
    page.fill("input[placeholder='NOME COMPLETO']", "TESTE AUTOMATIZADO")

    # Click CADASTRAR
    page.click("button:has-text('CADASTRAR')")

    # 7. Verify Modal is GONE
    time.sleep(2)
    expect(page.locator("text=Cadastrar Cliente Rápido")).not_to_be_visible()

    # Verify user name appears
    expect(page.locator("text=TESTE AUTOMATIZADO")).to_be_visible()

    page.screenshot(path="verification/pos_modal_fixed.png")
    print("Screenshot saved to verification/pos_modal_fixed.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_pos_quick_register(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error_pos_modal_6.png")
        finally:
            browser.close()
