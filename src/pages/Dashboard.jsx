import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, TrendingDown, Clock, PackageCheck, Wand2 } from 'lucide-react';
import { getItems, saveItems } from '../mockDb';
import { calculateRecommendation } from '../recommendationUtils';

const demoScenarioUpdates = {
  i1: { currentStock: 12, recent7dSalesTotal: 196 },
  i3: { currentStock: 1, recent7dSalesTotal: 42 },
  i5: { currentStock: 80, recent7dSalesTotal: 2100 },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [demoApplied, setDemoApplied] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setItems(getItems().filter((item) => item.active));
    };

    refresh();
    window.addEventListener('mock-db-updated', refresh);
    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('mock-db-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const { stats, urgentItems } = useMemo(() => {
    let lowStockItems = 0;
    let urgentOrderItems = 0;
    const urgentList = [];

    items.forEach((item) => {
      const recommendation = calculateRecommendation(item);

      if (item.currentStock <= item.safetyStock) {
        lowStockItems += 1;
      }

      if (recommendation.rawOrderQty > 0) {
        urgentOrderItems += 1;
        urgentList.push({ ...item, ...recommendation });
      }
    });

    urgentList.sort((left, right) => right.rawOrderQty - left.rawOrderQty);

    return {
      stats: {
        totalItems: items.length,
        lowStockItems,
        urgentOrderItems,
      },
      urgentItems: urgentList,
    };
  }, [items]);

  const handleCardClick = (filters) => {
    navigate('/recommendation', { state: filters });
  };

  const applyDemoScenario = () => {
    const updatedItems = getItems().map((item) => {
      const patch = demoScenarioUpdates[item.id];
      return patch ? { ...item, ...patch } : item;
    });

    saveItems(updatedItems);
    setDemoApplied(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="title-large" style={{ marginBottom: '0.5rem' }}>대시보드</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            오늘의 발주 위험 항목을 확인하고 필요한 추천 목록으로 바로 이동하세요.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {demoApplied && (
            <span style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>
              데모 수요 급증 시나리오 적용됨
            </span>
          )}
          <button onClick={applyDemoScenario} className="btn btn-outline">
            <Wand2 size={16} /> 데모 시나리오 실행
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div
          className="card"
          style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', margin: 0, cursor: 'pointer' }}
          onClick={() => handleCardClick({ onlyNeedingOrder: false, statusFilter: 'ALL' })}
        >
          <div style={{ padding: '1rem', background: 'var(--brand-light)', borderRadius: 'var(--radius-md)', color: 'var(--brand-primary)' }}>
            <PackageCheck size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>운영 중 상품</p>
            <p className="title-large">{stats.totalItems}</p>
          </div>
        </div>

        <div
          className="card"
          style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', margin: 0, cursor: 'pointer' }}
          onClick={() => handleCardClick({ onlyNeedingOrder: false, statusFilter: 'LOW_STOCK' })}
        >
          <div style={{ padding: '1rem', background: '#FFFBEB', borderRadius: 'var(--radius-md)', color: '#D97706' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>안전재고 이하 상품</p>
            <p className="title-large" style={{ color: '#D97706' }}>{stats.lowStockItems}</p>
          </div>
        </div>

        <div
          className="card"
          style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', margin: 0, cursor: 'pointer' }}
          onClick={() => handleCardClick({ onlyNeedingOrder: true, statusFilter: 'URGENT' })}
        >
          <div style={{ padding: '1rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--danger-text)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>오늘 발주 필요</p>
            <p className="title-large" style={{ color: 'var(--danger-text)' }}>{stats.urgentOrderItems}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="title-medium">긴급 발주 추천 요약</h2>
          <Link to="/recommendation" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
            전체 추천 보기
          </Link>
        </div>

        {urgentItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>현재 긴급 발주가 필요한 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>상품명</th>
                  <th>분류</th>
                  <th>현재 재고</th>
                  <th>안전재고</th>
                  <th>추천 발주량</th>
                </tr>
              </thead>
              <tbody>
                {urgentItems.slice(0, 5).map((item) => {
                  const isDanger = item.currentStock <= item.safetyStock * 0.5;

                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td>{item.category}</td>
                      <td>
                        <span style={{ fontWeight: 'bold', color: isDanger ? 'var(--danger-text)' : '#92400E' }}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td>{item.safetyStock} {item.unit}</td>
                      <td style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                        {item.recommendedOrderQty} {item.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
