PreQ backend fix - SOW upload crash

Fixes included:
1. copilot_service.py no longer uses str.format() on a prompt containing literal JSON braces. It replaces only the {sow_content} token, preventing KeyError: '\n  "project"'.
2. main.py defines a module logger, preventing NameError: logger is not defined while handling upload failures.
3. The backend loads variables from a .env file via python-dotenv when available.
4. SOW text/file endpoints do not create a project when model analysis explicitly reports ANALYSIS_FAILED.
5. The prior fixes remain: no generic fallback prerequisites are injected into SOW extraction, and the tracker uses the seven supported categories.

Setup:
- Put GROQ_API_KEY=your_real_key in the backend project's .env file (same folder where uvicorn is started), OR set it in PowerShell before starting the backend:
  $env:GROQ_API_KEY="your_real_key"
- Never commit or share the actual API key.
- Restart: uvicorn main:app --reload
- Re-upload the SOW. The old failed project/checklist is not automatically deleted.

Validation performed:
- Python compilation passed for main.py, copilot_service.py, sow_prompt.py, models.py.
- Prompt replacement test passed with literal JSON braces in the template.
