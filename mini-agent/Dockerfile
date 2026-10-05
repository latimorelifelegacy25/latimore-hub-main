FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && playwright install --with-deps chromium
RUN useradd --create-home agent && mkdir /app/shots && mkdir -m 700 /app/memory_data && chown -R agent:agent /app /root/.cache/ms-playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/browsers
# Memory is OFF (it is opt-in everywhere); enable it only if you opt in (see README: -e MEMORY=1 -v mini-agent-memory:/app/memory_data).
ENV MEMORY=0 MEMORY_DB=/app/memory_data/memory.db
RUN mv /root/.cache/ms-playwright /opt/browsers && chmod -R a+rX /opt/browsers
COPY --chown=agent:agent . .
USER agent
CMD ["python", "agent.py", "--help"]
