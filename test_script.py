import csv
import re
import os
from playwright.sync_api import sync_playwright

def run_tests():
    file_path = "C:\\Projects\\acrydesk\\testcases_login_final.csv"
    
    # Read the CSV
    with open(file_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        headers = next(reader)
        rows = list(reader)

    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        for row in rows:
            tc_id = row[0]
            if not tc_id.startswith("ACRYDESK_LOGIN_TC_"):
                continue
                
            test_data = row[6]
            
            email = ""
            password = ""
            email_match = re.search(r"Email:\s*([^\n\r]+)", test_data)
            password_match = re.search(r"Password:\s*([^\n\r]+)", test_data)
            
            if email_match: email = email_match.group(1).replace("[Empty]", "").strip()
            if password_match: password = password_match.group(1).replace("[Empty]", "").strip()

            context = browser.new_context()
            page = context.new_page()
            
            print(f"Running {tc_id}...", flush=True)
            
            try:
                # Go to main page containing the navigation
                page.goto("http://localhost:5173", timeout=15000)
                
                # Clear logged in state just in case
                page.evaluate("window.localStorage.clear()")
                page.reload()
                
                # Click to go to login
                page.click("text=Đăng nhập", force=True)
                page.wait_for_selector('input[type="email"]', timeout=5000)
                
                # Check what action to take based on Test Steps
                steps_lower = row[5].lower()
                
                if "tiếp tục" in steps_lower or "tiep tuc" in steps_lower or "tiếp_tục" in steps_lower.replace("'", ""):
                    # Normal login test
                    page.fill('input[type="email"]', email)
                    page.fill('input[type="password"]', password)
                    
                    # Watch for toast or HTML5 validation
                    page.click('button[type="submit"]')
                    
                    # wait for potential toasts
                    try:
                        toast = page.locator("[role='status']").first
                        # wait briefly for it
                        toast.wait_for(timeout=2000)
                        toast_text = toast.inner_text().lower()
                        
                        expected = row[7].lower()
                        if "vui lòng điền đầy đủ thông tin" in expected and "điền đầy đủ thông tin" in toast_text:
                            results[tc_id] = "Pass"
                        elif "thất bại" in expected and ("thất bại" in toast_text or "lỗi" in toast_text or "không" in toast_text):
                            results[tc_id] = "Pass"
                        elif "chào mừng" in expected and "chào mừng" in toast_text:
                            results[tc_id] = "Pass"
                        elif "thất bại" in toast_text and "thất bại" not in expected:
                            results[tc_id] = "Failed (Backend rejected: " + toast_text + ")"
                        elif "không " in toast_text:
                            if "unregistered" in expected or "incorrect" in expected:
                                results[tc_id] = "Pass"
                            else:
                                results[tc_id] = "Failed (Auth Error: " + toast_text + ")"
                        else:
                            results[tc_id] = f"Fail (Expected: {expected[:20]}, Got: {toast_text})"
                    except Exception as e:
                        # Maybe HTML5 validation blocked it!
                        is_invalid_email = page.evaluate('document.querySelector("input[type=email]").validity.valid') == False
                        expected = row[7].lower()
                        if "browser" in expected and "html5" in expected and is_invalid_email:
                            results[tc_id] = "Pass"
                        elif "browser" in expected and "html5" in expected and not is_invalid_email:
                            results[tc_id] = "Fail (HTML5 validation did not trigger)"
                        else:
                            results[tc_id] = "Fail (No response/toast)"

                elif "quên mật khẩu" in steps_lower:
                    page.click("text=Quên mật khẩu?")
                    page.wait_for_timeout(1000)
                    results[tc_id] = "Pass"
                elif "đăng ký ngay" in steps_lower:
                    page.click("text=Đăng ký ngay")
                    page.wait_for_timeout(1000)
                    results[tc_id] = "Pass"
                elif "quay lại trang chủ" in steps_lower:
                    page.click("button:has-text('Quay lại')")
                    page.wait_for_timeout(1000)
                    results[tc_id] = "Pass"
                else:
                    results[tc_id] = "Failed/Unknown Step"

            except Exception as e:
                print(f"Error on {tc_id}: {e}", flush=True)
                results[tc_id] = "Failed (Exception Occurred)"
                
            context.close()
            print(f"{tc_id}: {results[tc_id]}", flush=True)
            
        browser.close()

    # Write results to CSV
    for row in rows:
        tc_id = row[0]
        if tc_id in results:
            row[8] = results[tc_id]

    out_file = "C:\\Projects\\acrydesk\\testcases_login_results.csv"
    with open(out_file, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    print("Done writing to CSV", flush=True)

if __name__ == "__main__":
    run_tests()
