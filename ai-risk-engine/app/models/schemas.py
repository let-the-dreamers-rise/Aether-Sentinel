"""
Pydantic schemas for request/response models
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class VaultState(BaseModel):
    """Vault state data"""
    reserve_ratio: float = Field(..., ge=0, le=100, description="Reserve ratio in percentage")
    total_deposits: float = Field(..., ge=0, description="Total deposits in USD")
    total_liabilities: float = Field(..., ge=0, description="Total liabilities in USD")
    recent_withdrawals: float = Field(..., ge=0, description="Recent withdrawals in last 24h")
    timestamp: datetime

class MarketData(BaseModel):
    """Market data"""
    volatility_index: float = Field(..., ge=0, le=100, description="Market volatility index")
    liquidity_score: float = Field(..., ge=0, le=100, description="Liquidity score")
    price_change_24h: float = Field(..., description="Price change in last 24h (%)")
    volume_24h: float = Field(..., ge=0, description="Trading volume in last 24h")

class RiskAssessmentRequest(BaseModel):
    """Request for risk assessment"""
    vault_state: VaultState
    market_data: MarketData
    additional_context: Optional[Dict[str, Any]] = None

class RiskAssessmentResponse(BaseModel):
    """Response from risk assessment"""
    risk_score: int = Field(..., ge=0, le=100, description="Risk score (0-100)")
    recommended_action: str = Field(..., description="Recommended action: NONE, MONITOR, ADJUST, PAUSE")
    confidence: float = Field(..., ge=0, le=1, description="Confidence level (0-1)")
    reasoning: str = Field(..., description="Explanation of the risk assessment")
    timestamp: datetime
    components: Dict[str, float] = Field(..., description="Individual risk component scores")

class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    models_loaded: bool
    cache_status: str
