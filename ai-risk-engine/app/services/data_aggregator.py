"""
Data Aggregation Layer
Aggregates and preprocesses data from multiple sources
"""
import numpy as np
from typing import Dict, Any
from datetime import datetime, timedelta
import logging

from app.models.schemas import VaultState, MarketData

logger = logging.getLogger(__name__)

class DataAggregator:
    """Aggregates data from vault state and market sources"""
    
    def __init__(self):
        self.historical_data = []
        self.cache = {}
        
    def aggregate_features(
        self,
        vault_state: VaultState,
        market_data: MarketData
    ) -> Dict[str, float]:
        """
        Aggregate and normalize features for risk assessment
        
        Returns:
            Dictionary of normalized features
        """
        try:
            features = {
                # Vault metrics
                'reserve_ratio': vault_state.reserve_ratio / 100.0,  # Normalize to 0-1
                'total_deposits': self._normalize_amount(vault_state.total_deposits),
                'total_liabilities': self._normalize_amount(vault_state.total_liabilities),
                'recent_withdrawals': self._normalize_amount(vault_state.recent_withdrawals),
                
                # Market metrics
                'volatility_index': market_data.volatility_index / 100.0,
                'liquidity_score': market_data.liquidity_score / 100.0,
                'price_change_24h': self._normalize_price_change(market_data.price_change_24h),
                'volume_24h': self._normalize_amount(market_data.volume_24h),
                
                # Derived metrics
                'withdrawal_rate': self._calculate_withdrawal_rate(vault_state),
                'leverage_ratio': self._calculate_leverage_ratio(vault_state),
                'liquidity_risk': self._calculate_liquidity_risk(vault_state, market_data),
            }
            
            logger.info(f"Aggregated {len(features)} features")
            return features
            
        except Exception as e:
            logger.error(f"Feature aggregation failed: {str(e)}")
            raise ValueError(f"Failed to aggregate features: {str(e)}")
    
    def _normalize_amount(self, amount: float) -> float:
        """Normalize monetary amounts using log scale"""
        if amount <= 0:
            return 0.0
        # Log normalization for large amounts
        return min(np.log10(amount + 1) / 10.0, 1.0)
    
    def _normalize_price_change(self, change: float) -> float:
        """Normalize price change to 0-1 range"""
        # Sigmoid normalization for price changes
        return 1 / (1 + np.exp(-change / 10))
    
    def _calculate_withdrawal_rate(self, vault_state: VaultState) -> float:
        """Calculate withdrawal rate as percentage of deposits"""
        if vault_state.total_deposits == 0:
            return 0.0
        rate = vault_state.recent_withdrawals / vault_state.total_deposits
        return min(rate, 1.0)
    
    def _calculate_leverage_ratio(self, vault_state: VaultState) -> float:
        """Calculate leverage ratio"""
        if vault_state.total_deposits == 0:
            return 0.0
        ratio = vault_state.total_liabilities / vault_state.total_deposits
        return min(ratio / 10.0, 1.0)  # Normalize assuming max 10x leverage
    
    def _calculate_liquidity_risk(
        self,
        vault_state: VaultState,
        market_data: MarketData
    ) -> float:
        """Calculate combined liquidity risk score"""
        # Combine low liquidity score with high withdrawal rate
        liquidity_component = 1.0 - (market_data.liquidity_score / 100.0)
        withdrawal_component = self._calculate_withdrawal_rate(vault_state)
        
        return (liquidity_component + withdrawal_component) / 2.0
    
    def add_historical_data(self, features: Dict[str, float]):
        """Add data point to historical tracking"""
        self.historical_data.append({
            'timestamp': datetime.utcnow(),
            'features': features
        })
        
        # Keep only last 1000 data points
        if len(self.historical_data) > 1000:
            self.historical_data = self.historical_data[-1000:]
    
    def get_historical_stats(self) -> Dict[str, Any]:
        """Get statistics from historical data"""
        if not self.historical_data:
            return {}
        
        # Calculate moving averages and trends
        recent_data = self.historical_data[-100:]  # Last 100 points
        
        stats = {}
        if recent_data:
            feature_keys = recent_data[0]['features'].keys()
            for key in feature_keys:
                values = [d['features'][key] for d in recent_data]
                stats[f'{key}_mean'] = np.mean(values)
                stats[f'{key}_std'] = np.std(values)
                stats[f'{key}_trend'] = self._calculate_trend(values)
        
        return stats
    
    def _calculate_trend(self, values: list) -> float:
        """Calculate trend direction (-1 to 1)"""
        if len(values) < 2:
            return 0.0
        
        # Simple linear regression slope
        x = np.arange(len(values))
        slope = np.polyfit(x, values, 1)[0]
        
        # Normalize to -1 to 1
        return np.tanh(slope * 10)
