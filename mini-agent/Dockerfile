# Playwright's official Python image already ships Chromium + dependencies.
FROM mcr.microsoft.com/playwright/python:v1.49.0-jammy

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY agent.py tools.py bot.py providers.py memory.py sessions.py ./

# Pass your key at run time:  docker run -e OPENAI_API_KEY=sk-... mini-agent "task"
# For the Telegram bot:  docker run -e TELEGRAM_BOT_TOKEN=... -e TELEGRAM_ALLOWED_IDS=... mini-agent python bot.py
CMD ["python", "agent.py"]
