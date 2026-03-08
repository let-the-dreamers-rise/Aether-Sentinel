"""
AETHER SENTINEL AI Risk Engine
FastAPI application for real-time risk assessment
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from prometheus_client import make_asgi_app
import logging
from datetime import datetime

from app.models.schemas import RiskAssessmentRequest, RiskAssessmentResponse
from app.services.risk_engine import RiskEngine
from app.services.auth import verify_jwt_token
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AETHER SENTINEL AI Risk Engine",
    description="Real-time risk assessment for DeFi protocols",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Security
security = HTTPBearer()

# Initialize risk engine
risk_engine = RiskEngine()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting AETHER SENTINEL AI Risk Engine")
    await risk_engine.initialize()
    logger.info("Risk engine initialized successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AETHER SENTINEL AI Risk Engine")
    await risk_engine.cleanup()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AETHER SENTINEL AI Risk Engine",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health_status = await risk_engine.health_check()
    return {
        "status": "healthy" if health_status else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "details": health_status
    }

@app.post("/api/v1/assess-risk", response_model=RiskAssessmentResponse)
async def assess_risk(
    request: RiskAssessmentRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Assess risk based on vault state and market data
    
    Requires JWT authentication
    Returns risk score (0-100) with recommended action
    """
    try:
        # Verify JWT token
        token_data = verify_jwt_token(credentials.credentials)
        logger.info(f"Risk assessment requested by: {token_data.get('sub')}")
        
        # Perform risk assessment
        result = await risk_engine.assess_risk(request)
        
        logger.info(f"Risk assessment completed: score={result.risk_score}, action={result.recommended_action}")
        return result
        
    except ValueError as e:
        logger.error(f"Invalid request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Risk assessment failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Risk assessment failed"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
