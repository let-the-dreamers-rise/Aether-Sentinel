"""
Configuration settings for AI Risk Engine
"""
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AETHER SENTINEL AI Risk Engine"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Risk Engine Parameters
    RESERVE_RATIO_WEIGHT: float = 0.30
    VOLATILITY_WEIGHT: float = 0.25
    LIQUIDITY_WEIGHT: float = 0.25
    WITHDRAWAL_WEIGHT: float = 0.20
    
    # Risk Thresholds
    MODERATE_RISK_THRESHOLD: int = 60
    ELEVATED_RISK_THRESHOLD: int = 80
    CRITICAL_RISK_THRESHOLD: int = 90
    
    # Model Settings
    MODEL_PATH: str = "./models"
    CACHE_TTL_SECONDS: int = 60
    
    # Fail-safe
    FAIL_SAFE_RISK_SCORE: int = 50
    FAIL_SAFE_ACTION: str = "MONITOR"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
