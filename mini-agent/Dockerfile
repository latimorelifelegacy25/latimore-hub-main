FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && playwright install --with-deps chromium
RUN useradd --create-home agent && mkdir /app/shots && chown -R agent:agent /app /root/.cache/ms-playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/browsers
RUN mv /root/.cache/ms-playwright /opt/browsers && chmod -R a+rX /opt/browsers
COPY --chown=agent:agent . .
USER agent
CMD ["python", "agent.py", "--help"]
