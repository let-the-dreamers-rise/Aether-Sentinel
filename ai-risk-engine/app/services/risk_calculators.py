"""
Risk Calculation Components
Individual risk calculators for different risk factors
"""
import numpy as np
from typing import Dict
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class ReserveRatioRiskCalculator:
    """
    Calculate risk based on reserve ratio
    Weight: 30%
    """
    
    CRITICAL_THRESHOLD = 0.15  # 15%
    WARNING_THRESHOLD = 0.20   # 20%
    SAFE_THRESHOLD = 0.30      # 30%
    
    def calculate(self, reserve_ratio: float) -> Dict[str, float]:
        """
        Calculate reserve ratio risk score
        
        Args:
            reserve_ratio: Reserve ratio (0-1)
            
        Returns:
            Dict with score and confidence
        """
        try:
            # Inverse relationship: lower ratio = higher risk
            if reserve_ratio >= self.SAFE_THRESHOLD:
                risk_score = 0.0
            elif reserve_ratio <= self.CRITICAL_THRESHOLD:
                risk_score = 100.0
            else:
                # Linear interpolation between thresholds
                risk_score = 100 * (1 - (reserve_ratio - self.CRITICAL_THRESHOLD) / 
                                   (self.SAFE_THRESHOLD - self.CRITICAL_THRESHOLD))
            
            # Confidence based on how far from thresholds
            if reserve_ratio < self.CRITICAL_THRESHOLD or reserve_ratio > self.SAFE_THRESHOLD:
                confidence = 0.95
            else:
                confidence = 0.80
            
            logger.debug(f"Reserve ratio risk: {risk_score:.2f} (ratio: {reserve_ratio:.2%})")
            
            return {
                'score': risk_score,
                'confidence': confidence,
                'reasoning': self._get_reasoning(reserve_ratio, risk_score)
            }
            
        except Exception as e:
            logger.error(f"Reserve ratio calculation failed: {str(e)}")
            return {'score': 50.0, 'confidence': 0.5, 'reasoning': 'Calculation error'}
    
    def _get_reasoning(self, ratio: float, score: float) -> str:
        """Generate reasoning for the risk score"""
        if ratio < self.CRITICAL_THRESHOLD:
            return f"Critical: Reserve ratio {ratio:.1%} below safe threshold"
        elif ratio < self.WARNING_THRESHOLD:
            return f"Warning: Reserve ratio {ratio:.1%} approaching critical levels"
        elif ratio < self.SAFE_THRESHOLD:
            return f"Moderate: Reserve ratio {ratio:.1%} below optimal level"
        else:
            return f"Healthy: Reserve ratio {ratio:.1%} above safe threshold"


class VolatilityRiskCalculator:
    """
    Calculate risk based on market volatility
    Weight: 25%
    """
    
    def calculate(self, volatility_index: float, price_change: float) -> Dict[str, float]:
        """
        Calculate volatility risk score
        
        Args:
            volatility_index: Market volatility index (0-1)
            price_change: 24h price change (normalized)
            
        Returns:
            Dict with score and confidence
        """
        try:
            # Combine volatility index and price change
            volatility_component = volatility_index * 70  # 70% weight
            price_component = abs(price_change - 0.5) * 2 * 30  # 30% weight, normalized
            
            risk_score = min(volatility_component + price_component, 100.0)
            
            # Higher confidence when volatility is extreme
            confidence = 0.75 + (volatility_index * 0.20)
            
            logger.debug(f"Volatility risk: {risk_score:.2f} (vol: {volatility_index:.2f})")
            
            return {
                'score': risk_score,
                'confidence': confidence,
                'reasoning': self._get_reasoning(volatility_index, risk_score)
            }
            
        except Exception as e:
            logger.error(f"Volatility calculation failed: {str(e)}")
            return {'score': 50.0, 'confidence': 0.5, 'reasoning': 'Calculation error'}
    
    def _get_reasoning(self, volatility: float, score: float) -> str:
        """Generate reasoning for the risk score"""
        if volatility > 0.8:
            return f"High volatility detected: {volatility:.1%} - extreme market conditions"
        elif volatility > 0.6:
            return f"Elevated volatility: {volatility:.1%} - increased market uncertainty"
        elif volatility > 0.4:
            return f"Moderate volatility: {volatility:.1%} - normal market fluctuations"
        else:
            return f"Low volatility: {volatility:.1%} - stable market conditions"


class LiquidityRiskCalculator:
    """
    Calculate risk based on liquidity conditions
    Weight: 25%
    """
    
    def calculate(self, liquidity_score: float, volume_24h: float) -> Dict[str, float]:
        """
        Calculate liquidity risk score
        
        Args:
            liquidity_score: Liquidity score (0-1, higher is better)
            volume_24h: 24h trading volume (normalized)
            
        Returns:
            Dict with score and confidence
        """
        try:
            # Inverse relationship: lower liquidity = higher risk
            liquidity_component = (1 - liquidity_score) * 70  # 70% weight
            volume_component = (1 - volume_24h) * 30  # 30% weight
            
            risk_score = min(liquidity_component + volume_component, 100.0)
            
            # Confidence based on liquidity level
            confidence = 0.70 + (liquidity_score * 0.25)
            
            logger.debug(f"Liquidity risk: {risk_score:.2f} (liquidity: {liquidity_score:.2f})")
            
            return {
                'score': risk_score,
                'confidence': confidence,
                'reasoning': self._get_reasoning(liquidity_score, risk_score)
            }
            
        except Exception as e:
            logger.error(f"Liquidity calculation failed: {str(e)}")
            return {'score': 50.0, 'confidence': 0.5, 'reasoning': 'Calculation error'}
    
    def _get_reasoning(self, liquidity: float, score: float) -> str:
        """Generate reasoning for the risk score"""
        if liquidity < 0.3:
            return f"Critical liquidity shortage: {liquidity:.1%} - high slippage risk"
        elif liquidity < 0.5:
            return f"Low liquidity: {liquidity:.1%} - potential execution issues"
        elif liquidity < 0.7:
            return f"Moderate liquidity: {liquidity:.1%} - acceptable conditions"
        else:
            return f"High liquidity: {liquidity:.1%} - optimal trading conditions"


class WithdrawalAnomalyCalculator:
    """
    Detect abnormal withdrawal patterns
    Weight: 20%
    """
    
    def calculate(
        self,
        withdrawal_rate: float,
        historical_mean: float = 0.05,
        historical_std: float = 0.02
    ) -> Dict[str, float]:
        """
        Calculate withdrawal anomaly risk score
        
        Args:
            withdrawal_rate: Current withdrawal rate (0-1)
            historical_mean: Historical average withdrawal rate
            historical_std: Historical standard deviation
            
        Returns:
            Dict with score and confidence
        """
        try:
            # Calculate z-score for anomaly detection
            if historical_std > 0:
                z_score = (withdrawal_rate - historical_mean) / historical_std
            else:
                z_score = 0
            
            # Convert z-score to risk score (0-100)
            # z > 3 is highly anomalous
            risk_score = min(abs(z_score) * 20, 100.0)
            
            # Confidence increases with deviation
            confidence = min(0.60 + (abs(z_score) * 0.10), 0.95)
            
            logger.debug(f"Withdrawal anomaly risk: {risk_score:.2f} (z-score: {z_score:.2f})")
            
            return {
                'score': risk_score,
                'confidence': confidence,
                'reasoning': self._get_reasoning(withdrawal_rate, z_score)
            }
            
        except Exception as e:
            logger.error(f"Withdrawal anomaly calculation failed: {str(e)}")
            return {'score': 50.0, 'confidence': 0.5, 'reasoning': 'Calculation error'}
    
    def _get_reasoning(self, rate: float, z_score: float) -> str:
        """Generate reasoning for the risk score"""
        if abs(z_score) > 3:
            return f"Highly abnormal withdrawal pattern detected: {rate:.1%} (z={z_score:.1f})"
        elif abs(z_score) > 2:
            return f"Unusual withdrawal activity: {rate:.1%} (z={z_score:.1f})"
        elif abs(z_score) > 1:
            return f"Slightly elevated withdrawals: {rate:.1%} (z={z_score:.1f})"
        else:
            return f"Normal withdrawal pattern: {rate:.1%}"
