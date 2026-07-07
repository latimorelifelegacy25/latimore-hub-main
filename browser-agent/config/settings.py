import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

class Settings:
    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL:   str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # Browser
    BROWSER_WIDTH:    int   = int(os.getenv("BROWSER_WIDTH", 1280))
    BROWSER_HEIGHT:   int   = int(os.getenv("BROWSER_HEIGHT", 800))
    BROWSER_HEADLESS: bool  = os.getenv("BROWSER_HEADLESS", "true").lower() == "true"

    # Server
    SERVER_HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT: int = int(os.getenv("SERVER_PORT", 7860))
    SECRET_KEY:  str = os.getenv("SECRET_KEY", "")

    # Agent
    MAX_CONCURRENT_AGENTS: int   = int(os.getenv("MAX_CONCURRENT_AGENTS", 3))
    SCREENSHOT_INTERVAL:   float = float(os.getenv("SCREENSHOT_INTERVAL", 0.8))

    # Logging
    LOG_LEVEL_NAME: str = os.getenv("LOG_LEVEL", "INFO").upper()
    LOG_DIR:        str = os.path.join(os.path.dirname(__file__), "..", "logs")
    RECORDINGS_DIR: str = os.path.join(os.path.dirname(__file__), "..", "recordings")

settings = Settings()
