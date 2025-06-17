import React, { useState, useEffect, useContext } from 'react';
import { CharacterContext } from '../App';

interface MarketOrder {
  order_id: number;
  type_id: number;
  type_name?: string;
  location_id: number;
  location_name?: string;
  volume_total: number;
  volume_remain: number;
  min_volume: number;
  price: number;
  is_buy_order: boolean;
  duration: number;
  issued: string;
  range: string;
}

interface WalletTransaction {
  transaction_id: number;
  date: string;
  type_id: number;
  type_name?: string;
  quantity: number;
  unit_price: number;
  client_id: number;
  client_name?: string;
  location_id: number;
  location_name?: string;
  is_buy: boolean;
  is_personal: boolean;
  journal_ref_id: number;
}

interface TradingMetrics {
  totalProfit: number;
  totalRevenue: number;
  totalExpenses: number;
  profitMargin: number;
  activeOrdersValue: number;
  successfulOrders: number;
  totalOrders: number;
  averageOrderValue: number;
  topTradingItems: Array<{
    typeId: number;
    typeName: string;
    volume: number;
    profit: number;
    profitMargin: number;
  }>;
}

const MarketAnalytics: React.FC = () => {
  const { activeCharacter, isAuthenticated } = useContext(CharacterContext);
  const [activeOrders, setActiveOrders] = useState<MarketOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<MarketOrder[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [metrics, setMetrics] = useState<TradingMetrics>({
    totalProfit: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    profitMargin: 0,
    activeOrdersValue: 0,
    successfulOrders: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topTradingItems: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'orders' | 'history' | 'transactions'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && activeCharacter) {
      loadMarketData();
    } else {
      setLoading(false);
    }
  }, [activeCharacter, isAuthenticated]);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch market data in parallel
      const [ordersResult, historyResult, transactionsResult] = await Promise.allSettled([
        window.electronAPI.esi.getCharacterMarketOrders(),
        window.electronAPI.esi.getCharacterMarketOrderHistory(),
        window.electronAPI.esi.getCharacterWalletTransactions()
      ]);

      // Process active orders
      if (ordersResult.status === 'fulfilled') {
        const orders = ordersResult.value.map((order: any) => ({
          ...order,
          type_name: `Item ${order.type_id}`, // Would be resolved from SDE
          location_name: `Location ${order.location_id}` // Would be resolved from location service
        }));
        setActiveOrders(orders);
      }

      // Process order history
      if (historyResult.status === 'fulfilled') {
        const history = historyResult.value.map((order: any) => ({
          ...order,
          type_name: `Item ${order.type_id}`,
          location_name: `Location ${order.location_id}`
        }));
        setOrderHistory(history);
      }

      // Process transactions
      if (transactionsResult.status === 'fulfilled') {
        const txns = transactionsResult.value.map((txn: any) => ({
          ...txn,
          type_name: `Item ${txn.type_id}`,
          client_name: `Client ${txn.client_id}`,
          location_name: `Location ${txn.location_id}`
        }));
        setTransactions(txns);
      }

      // Calculate metrics
      calculateTradingMetrics(
        ordersResult.status === 'fulfilled' ? ordersResult.value : [],
        historyResult.status === 'fulfilled' ? historyResult.value : [],
        transactionsResult.status === 'fulfilled' ? transactionsResult.value : []
      );

    } catch (error: any) {
      console.error('Failed to load market data:', error);
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTradingMetrics = (orders: any[], history: any[], txns: any[]) => {
    // Calculate basic metrics from transactions
    const buyTransactions = txns.filter(t => t.is_buy);
    const sellTransactions = txns.filter(t => !t.is_buy);
    
    const totalExpenses = buyTransactions.reduce((sum, t) => sum + (t.quantity * t.unit_price), 0);
    const totalRevenue = sellTransactions.reduce((sum, t) => sum + (t.quantity * t.unit_price), 0);
    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Calculate active orders value
    const activeOrdersValue = orders.reduce((sum, order) => {
      return sum + (order.volume_remain * order.price);
    }, 0);

    // Calculate successful vs total orders
    const successfulOrders = history.filter(order => order.state === 'fulfilled' || order.volume_remain === 0).length;
    const totalOrders = history.length;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? (totalRevenue + totalExpenses) / totalOrders : 0;

    // Calculate top trading items (simplified)
    const itemProfits = new Map<number, { typeName: string; volume: number; profit: number; revenue: number }>();
    
    txns.forEach(txn => {
      const existing = itemProfits.get(txn.type_id) || { 
        typeName: txn.type_name || `Item ${txn.type_id}`, 
        volume: 0, 
        profit: 0, 
        revenue: 0 
      };
      
      const value = txn.quantity * txn.unit_price;
      existing.volume += txn.quantity;
      
      if (txn.is_buy) {
        existing.profit -= value;
      } else {
        existing.profit += value;
        existing.revenue += value;
      }
      
      itemProfits.set(txn.type_id, existing);
    });

    const topTradingItems = Array.from(itemProfits.entries())
      .map(([typeId, data]) => ({
        typeId,
        typeName: data.typeName,
        volume: data.volume,
        profit: data.profit,
        profitMargin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    setMetrics({
      totalProfit,
      totalRevenue,
      totalExpenses,
      profitMargin,
      activeOrdersValue,
      successfulOrders,
      totalOrders,
      averageOrderValue,
      topTradingItems
    });
  };

  const formatISK = (amount: number): string => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)}B ISK`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ISK`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K ISK`;
    }
    return `${Math.round(amount).toLocaleString()} ISK`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Market Analytics</h1>
          <p className="text-body" style={{ marginTop: 'var(--space-lg)', opacity: 0.8 }}>
            Advanced market analysis and trading performance tracking
          </p>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <button 
              className="btn btn-primary"
              onClick={() => window.electronAPI.auth.start()}
            >
              Connect to EVE Online
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Market Analytics</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="loading-spinner"></div>
            <p className="text-body" style={{ marginTop: 'var(--space-md)' }}>
              Loading market data and calculating metrics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Market Analytics</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <p className="text-body" style={{ color: 'var(--danger-red)', marginBottom: 'var(--space-md)' }}>
              {error}
            </p>
            <button className="btn btn-primary" onClick={loadMarketData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="glass-panel" style={{ padding: 'var(--space-xl)' }}>
        {/* Header */}
        <div className="market-analytics-header" style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 className="text-hero">Market Analytics</h1>
          <p className="text-body" style={{ opacity: 0.8, marginBottom: 'var(--space-lg)' }}>
            Comprehensive trading analysis for {activeCharacter?.character_name}
          </p>

          {/* Tab Navigation */}
          <div className="tab-navigation" style={{
            display: 'flex',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-lg)'
          }}>
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'orders', name: 'Active Orders', icon: '📋' },
              { id: 'history', name: 'Order History', icon: '📜' },
              { id: 'transactions', name: 'Transactions', icon: '💱' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: selectedTab === tab.id ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${selectedTab === tab.id ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: '8px',
                  color: selectedTab === tab.id ? 'black' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)'
                }}
              >
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="overview-content">
            {/* Key Metrics Grid */}
            <div className="metrics-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-lg)',
              marginBottom: 'var(--space-xl)'
            }}>
              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: `2px solid ${metrics.totalProfit >= 0 ? 'var(--success-green)' : 'var(--danger-red)'}`
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Total Profit/Loss
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: metrics.totalProfit >= 0 ? 'var(--success-green)' : 'var(--danger-red)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {metrics.totalProfit >= 0 ? '+' : ''}{formatISK(metrics.totalProfit)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  {metrics.profitMargin.toFixed(1)}% margin
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--info-blue)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Total Revenue
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--info-blue)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {formatISK(metrics.totalRevenue)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  From {transactions.filter(t => !t.is_buy).length} sales
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--warning-orange)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Active Orders Value
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--warning-orange)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {formatISK(metrics.activeOrdersValue)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  {activeOrders.length} active orders
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--primary-cyan)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Order Success Rate
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--primary-cyan)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {metrics.totalOrders > 0 ? Math.round((metrics.successfulOrders / metrics.totalOrders) * 100) : 0}%
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  {metrics.successfulOrders} of {metrics.totalOrders} orders
                </div>
              </div>
            </div>

            {/* Top Trading Items */}
            <div className="top-items-section">
              <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
                🏆 Top Trading Items
              </h2>
              <div className="top-items-grid" style={{
                display: 'grid',
                gap: 'var(--space-md)'
              }}>
                {metrics.topTradingItems.length > 0 ? (
                  metrics.topTradingItems.map((item, index) => (
                    <div
                      key={item.typeId}
                      className="item-card"
                      style={{
                        padding: 'var(--space-md)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--primary-cyan)' }}>
                          #{index + 1} {item.typeName}
                        </h4>
                        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                          Volume: {item.volume.toLocaleString()} units
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: 'bold',
                          color: item.profit >= 0 ? 'var(--success-green)' : 'var(--danger-red)'
                        }}>
                          {item.profit >= 0 ? '+' : ''}{formatISK(item.profit)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {item.profitMargin.toFixed(1)}% margin
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--space-xl)', 
                    opacity: 0.7 
                  }}>
                    No trading data available yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Orders Tab */}
        {selectedTab === 'orders' && (
          <div className="orders-content">
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
              📋 Active Market Orders ({activeOrders.length})
            </h2>
            <div className="orders-table-container" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {activeOrders.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Item</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Type</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Price</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Volume</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Total Value</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Duration</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrders.map(order => (
                      <tr key={order.order_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{ fontWeight: 'bold' }}>{order.type_name}</div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>{order.location_name}</div>
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: order.is_buy_order ? 'var(--success-green)' : 'var(--danger-red)',
                            color: 'black'
                          }}>
                            {order.is_buy_order ? 'BUY' : 'SELL'}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                          {formatISK(order.price)}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                          {order.volume_remain.toLocaleString()} / {order.volume_total.toLocaleString()}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                          {formatISK(order.volume_remain * order.price)}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                          {order.duration} days
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                          {formatDate(order.issued)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--space-xl)', 
                  opacity: 0.7 
                }}>
                  No active market orders
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {selectedTab === 'transactions' && (
          <div className="transactions-content">
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
              💱 Recent Transactions ({transactions.length})
            </h2>
            <div className="transactions-table-container" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '8px',
              overflow: 'hidden',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              {transactions.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                    <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Item</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Type</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Quantity</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Unit Price</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 50).map(txn => (
                      <tr key={txn.transaction_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <td style={{ padding: 'var(--space-md)', fontSize: '12px' }}>
                          {formatDateTime(txn.date)}
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{ fontWeight: 'bold' }}>{txn.type_name}</div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>{txn.location_name}</div>
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: txn.is_buy ? 'var(--danger-red)' : 'var(--success-green)',
                            color: 'black'
                          }}>
                            {txn.is_buy ? 'BUY' : 'SELL'}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                          {txn.quantity.toLocaleString()}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                          {formatISK(txn.unit_price)}
                        </td>
                        <td style={{ 
                          padding: 'var(--space-md)', 
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: txn.is_buy ? 'var(--danger-red)' : 'var(--success-green)'
                        }}>
                          {txn.is_buy ? '-' : '+'}{formatISK(txn.quantity * txn.unit_price)}
                        </td>
                        <td style={{ padding: 'var(--space-md)', fontSize: '12px' }}>
                          {txn.client_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--space-xl)', 
                  opacity: 0.7 
                }}>
                  No transaction history available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order History Tab */}
        {selectedTab === 'history' && (
          <div className="history-content">
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
              📜 Order History ({orderHistory.length})
            </h2>
            <div className="history-table-container" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '8px',
              overflow: 'hidden',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              {orderHistory.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                    <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Item</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Type</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Price</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Volume</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>State</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderHistory.slice(0, 50).map(order => (
                      <tr key={order.order_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{ fontWeight: 'bold' }}>{order.type_name}</div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>{order.location_name}</div>
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: order.is_buy_order ? 'var(--success-green)' : 'var(--danger-red)',
                            color: 'black'
                          }}>
                            {order.is_buy_order ? 'BUY' : 'SELL'}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                          {formatISK(order.price)}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                          {order.volume_total.toLocaleString()}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '11px',
                            backgroundColor: order.volume_remain === 0 ? 'var(--success-green)' : 'var(--warning-orange)',
                            color: 'black'
                          }}>
                            {order.volume_remain === 0 ? 'Completed' : 'Partial'}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center', fontSize: '12px' }}>
                          {formatDate(order.issued)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--space-xl)', 
                  opacity: 0.7 
                }}>
                  No order history available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketAnalytics;