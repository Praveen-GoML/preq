PreQ Groq optimization patch
============================

Changes in copilot_service.py:
1. Adds process-local cooldowns for Groq models when TPD/OTPM limits are hit.
2. Parses Groq's 'try again in ...' message to avoid repeatedly calling an exhausted model.
3. Caps qwen/qwen3.8-27b max_tokens at 800 based on the supplied 1,000 OTPM error.
4. Retries JSON validation failures once without response_format and adds a JSON-only instruction.
5. Rejects empty, truncated, or invalid JSON responses before returning them to the SOW pipeline.
6. Reduces SOW chunk size from 5,200 to 4,200 characters and overlap from 450 to 250.
7. Reduces requested output tokens per SOW call (2,200 for multi-chunk; 2,800 for one chunk); Qwen is further capped at 800.

Important:
- This is a quota-aware optimization, not a way to bypass Groq limits.
- Cooldowns are process-local and reset if the backend restarts.
- If all configured models have exhausted quotas, analysis still fails transparently; no generic prerequisites are fabricated.
- A capped 800-token Qwen response can be insufficient for a large JSON result. The code rejects truncation and fails over; smaller chunks may be needed for that model.
- The source ZIP's test suite could not be executed in this environment because the 'groq' Python package is not installed. Python syntax compilation passed.
- This patch is based on the uploaded ZIP version of copilot_service.py. Merge it carefully if your local file has newer OpenRouter fallback code.

After extracting, compare/replace your current copilot_service.py, keep your local .env file, and install project requirements in your own virtual environment. Never copy secrets into source control or share the .env file.
