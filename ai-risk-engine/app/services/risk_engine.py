"""
Main Risk Engine
Combines all risk calculators and ensemble models
"""
import numpy as np
from typing import Dict, Any
from datetime import datetime
import logging
import asyncio

from app.models.schemas import (
    RiskAssessmentRequest,
    RiskAssessmentResponse
)
from app.services.data_aggregator import DataAggregator
from app.services.risk_calculators import (
    ReserveRatioRiskCalculator,
    VolatilityRiskCalculator,
    LiquidityRiskCalculator,
    WithdrawalAnomalyCalculator
)
from app.core.config import settings

logger = logging.getLogger(__name__)

class RiskEngine:
    """Main risk assessment engine with ensemble models"""
    
    def __init__(self):
        self.data_aggregator = DataAggregator()
        self.reserve_calculator = ReserveRatioRiskCalculator()
        self.volatility_calculator = VolatilityRiskCalculator()
        self.liquidity_calculator = LiquidityRiskCalculator()
        self.withdrawal_calculator = WithdrawalAnomalyCalculator()
        
        # Model weights
        self.weights = {
            'reserve_ratio': settings.RESERVE_RATIO_WEIGHT,
            'volatility': settings.VOLATILITY_WEIGHT,
            'liquidity': settings.LIQUIDITY_WEIGHT,
            'withdrawal': settings.WITHDRAWAL_WEIGHT
        }
        
        # Ensemble models (placeholders - would load actual trained models)
        self.models_loaded = False
        self.cache = {}
        
    async def initialize(self):
        """Initialize the risk engine and load models"""
        try:
            logger.info("Initializing risk engine...")
            # In production, load actual ML models here
            # self.rf_model = load_model('random_forest.pkl')
            # self.lstm_model = load_model('lstm.h5')
            # self.gb_model = load_model('gradient_boosting.pkl')
            
            self.models_loaded = True
            logger.info("Risk engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize risk engine: {str(e)}")
            self.models_loaded = False
    
    async def cleanup(self):
        """Cleanup resources"""
        logger.info("Cleaning up risk engine resources")
        self.cache.clear()
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health status of the risk engine"""
        return {
            'models_loaded': self.models_loaded,
            'cache_size': len(self.cache),
            'calculators_active': True
        }
    
    async def assess_risk(
        self,
        request: RiskAssessmentRequest
    ) -> RiskAssessmentResponse:
        """
        Perform comprehensive risk assessment
        
        Args:
            request: Risk assessment request with vault and market data
            
        Returns:
            Risk assessment response with score and recommendations
        """
        try:
            # Aggregate features
            features = self.data_aggregator.aggregate_features(
                request.vault_state,
                request.market_data
            )
            
            # Calculate individual risk components
            components = await self._calculate_risk_components(features)
            
            # Calculate weighted ensemble score
            risk_score = self._calculate_ensemble_score(components)
            
            # Determine recommended action
            action = self._determine_action(risk_score)
            
            # Calculate overall confidence
            confidence = self._calculate_confidence(components)
            
            # Generate reasoning
            reasoning = self._generate_reasoning(components, risk_score)
            
            # Store in historical data
            self.data_aggregator.add_historical_data(features)
            
            response = RiskAssessmentResponse(
                risk_score=int(risk_score),
                recommended_action=action,
                confidence=confidence,
                reasoning=reasoning,
                timestamp=datetime.utcnow(),
                components={
                    'reserve_ratio': components['reserve_ratio']['score'],
                    'volatility': components['volatility']['score'],
                    'liquidity': components['liquidity']['score'],
                    'withdrawal_anomaly': components['withdrawal']['score']
                }
            )
            
            logger.info(f"Risk assessment completed: score={risk_score}, action={action}")
            return response
            
        except Exception as e:
            logger.error(f"Risk assessment failed: {str(e)}")
            # Return fail-safe response
            return self._fail_safe_response()
    
    async def _calculate_risk_components(
        self,
        features: Dict[str, float]
    ) -> Dict[str, Dict[str, Any]]:
        """Calculate all risk components"""
        
        # Calculate each component
        reserve_risk = self.reserve_calculator.calculate(
            features['reserve_ratio']
        )
        
        volatility_risk = self.volatility_calculator.calculate(
            features['volatility_index'],
            features['price_change_24h']
        )
        
        liquidity_risk = self.liquidity_calculator.calculate(
            features['liquidity_score'],
            features['volume_24h']
        )
        
        # Get historical stats for withdrawal anomaly detection
        historical_stats = self.data_aggregator.get_historical_stats()
        withdrawal_mean = historical_stats.get('withdrawal_rate_mean', 0.05)
        withdrawal_std = historical_stats.get('withdrawal_rate_std', 0.02)
        
        withdrawal_risk = self.withdrawal_calculator.calculate(
            features['withdrawal_rate'],
            withdrawal_mean,
            withdrawal_std
        )
        
        return {
            'reserve_ratio': reserve_risk,
            'volatility': volatility_risk,
            'liquidity': liquidity_risk,
            'withdrawal': withdrawal_risk
        }
    
    def _calculate_ensemble_score(
        self,
        components: Dict[str, Dict[str, Any]]
    ) -> float:
        """
        Calculate weighted ensemble score
        Simulates RF + LSTM + GB ensemble
        """
        # Weighted average of components
        weighted_score = (
            components['reserve_ratio']['score'] * self.weights['reserve_ratio'] +
            components['volatility']['score'] * self.weights['volatility'] +
            components['liquidity']['score'] * self.weights['liquidity'] +
            components['withdrawal']['score'] * self.weights['withdrawal']
        )
        
        # In production, would also run through ML models:
        # rf_score = self.rf_model.predict(features)
        # lstm_score = self.lstm_model.predict(features)
        # gb_score = self.gb_model.predict(features)
        # ensemble_score = (weighted_score + rf_score + lstm_score + gb_score) / 4
        
        return min(max(weighted_score, 0.0), 100.0)
    
    def _determine_action(self, risk_score: float) -> str:
        """Determine recommended action based on risk score"""
        if risk_score >= settings.CRITICAL_RISK_THRESHOLD:
            return "PAUSE"
        elif risk_score >= settings.ELEVATED_RISK_THRESHOLD:
            return "ADJUST"
        elif risk_score >= settings.MODERATE_RISK_THRESHOLD:
            return "MONITOR"
        else:
            return "NONE"
    
    def _calculate_confidence(
        self,
        components: Dict[str, Dict[str, Any]]
    ) -> float:
        """Calculate overall confidence from component confidences"""
        confidences = [comp['confidence'] for comp in components.values()]
        return float(np.mean(confidences))
    
    def _generate_reasoning(
        self,
        components: Dict[str, Dict[str, Any]],
        risk_score: float
    ) -> str:
        """Generate human-readable reasoning"""
        reasons = []
        
        # Add reasoning from each component
        for name, component in components.items():
            if component['score'] > 60:  # Only include significant risks
                reasons.append(f"{name.replace('_', ' ').title()}: {component['reasoning']}")
        
        if not reasons:
            return f"Overall risk score: {risk_score:.0f}/100 - All metrics within normal ranges"
        
        return f"Overall risk score: {risk_score:.0f}/100. " + "; ".join(reasons)
    
    def _fail_safe_response(self) -> RiskAssessmentResponse:
        """Return fail-safe response when assessment fails"""
        logger.warning("Returning fail-safe response")
        return RiskAssessmentResponse(
            risk_score=settings.FAIL_SAFE_RISK_SCORE,
            recommended_action=settings.FAIL_SAFE_ACTION,
            confidence=0.5,
            reasoning="Risk assessment failed - using fail-safe defaults",
            timestamp=datetime.utcnow(),
            components={
                'reserve_ratio': 50.0,
                'volatility': 50.0,
                'liquidity': 50.0,
                'withdrawal_anomaly': 50.0
            }
        )
