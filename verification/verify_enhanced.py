
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_accounting_enhancements(page: Page):
    # 1. Navigate to the app
    page.goto("http://localhost:5173")

    # Wait for loading
    page.wait_for_timeout(2000)

    # 2. Login as ADMIN (if needed)
    if page.url.endswith("/login"):
        page.get_by_placeholder("ID do Usuário").fill("1")
        page.get_by_placeholder("PIN").fill("1234")
        page.get_by_role("button", name="Entrar").click()
        page.wait_for_url("**/")

    # 3. Navigate to Accounting
    page.get_by_role("link", name="Contabilidade").click()

    # 4. Verify New Entry Button and Navigate
    new_entry_btn = page.get_by_role("button", name="Novo Lançamento")
    expect(new_entry_btn).to_be_visible()
    new_entry_btn.click()

    # 5. Verify Journal Entry Form
    expect(page.get_by_text("Novo Lançamento Contábil")).to_be_visible()
    page.screenshot(path="verification/journal_entry_form.png")

    # 6. Navigate to Chart of Accounts
    page.go_back()
    page.get_by_text("Plano de Contas").click()

    # 7. Verify New Account Button
    new_account_btn = page.get_by_role("button", name="Nova Conta")
    expect(new_account_btn).to_be_visible()
    new_account_btn.click()
    expect(page.get_by_text("Cadastrar Nova Conta")).to_be_visible()
    page.screenshot(path="verification/new_account_modal.png")

    # Close modal and go back
    page.get_by_role("button").first.click() # Close X
    page.go_back()

    # 8. Verify Reports with Date Filters
    page.get_by_text("DRE Gerencial").click()
    expect(page.get_by_text("Demonstração do Resultado")).to_be_visible()
    expect(page.get_by_text("até")).to_be_visible() # Date range text
    expect(page.get_by_role("button", name="Exportar")).to_be_visible()
    page.screenshot(path="verification/dre_filters.png")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_accounting_enhancements(page)
            print("Verification script finished successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error_enhanced.png")
        finally:
            browser.close()
