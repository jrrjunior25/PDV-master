
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_accounting_module(page: Page):
    # 1. Navigate to the app (assuming localhost:5173 based on Vite default)
    page.goto("http://localhost:5173")

    # Wait for loading
    page.wait_for_timeout(2000)

    # 2. Login as ADMIN
    # Assuming there's a login screen first based on App.tsx
    if page.url.endswith("/login"):
        page.get_by_placeholder("ID do Usuário").fill("1") # Admin ID from db.ts
        page.get_by_placeholder("PIN").fill("1234") # Admin PIN
        page.get_by_role("button", name="Entrar").click()
        page.wait_for_url("**/")

    # 3. Navigate to Accounting Module
    # Click on sidebar link
    page.get_by_role("link", name="Contabilidade").click()

    # 4. Verify Dashboard
    expect(page.get_by_text("Módulo Contábil")).to_be_visible()
    expect(page.get_by_text("Ativo Total")).to_be_visible()

    # Take screenshot of dashboard
    page.screenshot(path="verification/accounting_dashboard.png")

    # 5. Navigate to Chart of Accounts
    page.get_by_text("Plano de Contas").click()
    expect(page.get_by_text("Estrutura hierárquica")).to_be_visible()
    page.screenshot(path="verification/chart_of_accounts.png")

    # Go back
    page.go_back()

    # 6. Navigate to DRE
    page.get_by_text("DRE Gerencial").click()
    expect(page.get_by_text("Demonstração do Resultado")).to_be_visible()
    page.screenshot(path="verification/dre.png")

    # Go back
    page.go_back()

    # 7. Navigate to Trial Balance
    page.get_by_text("Balancete de Verificação").click()
    expect(page.get_by_text("Listagem de saldos")).to_be_visible()
    page.screenshot(path="verification/trial_balance.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_accounting_module(page)
            print("Verification script finished successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
