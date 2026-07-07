import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Filter, Search, ArrowUpDown } from 'lucide-react';
import { getItems, getVendors } from '../mockDb';
import { calculateRecommendation } from '../recommendationUtils';

const formatDaysCover = (daysCover) => (Number.isFinite(daysCover) ? `${daysCover.toFixed(1)}일` : '-');

const getReason = (item, recommendation) => {
  const daysCoverText = formatDaysCover(recommendation.daysCover);

  if (recommendation.recommendedOrderQty <= 0) {
    return Number.isFinite(recommendation.daysCover)
      ? `현재 재고가 예상 수요와 안전재고를 이미 충족하며, 약 ${daysCoverText} 버틸 수 있습니다.`
      : '현재 재고가 예상 수요와 안전재고를 이미 충족합니다.';
  }

  if (item.currentStock <= item.safetyStock * 0.5) {
    return Number.isFinite(recommendation.daysCover)
      ? `긴급: 현재 재고가 ${item.currentStock}${item.unit}로 안전재고보다 크게 부족하며, 약 ${daysCoverText} 내 소진될 수 있습니다.`
      : `긴급: 현재 재고가 ${item.currentStock}${item.unit}로 안전재고보다 크게 부족합니다.`;
  }

  if (item.currentStock <= item.safetyStock) {
    return Number.isFinite(recommendation.daysCover)
      ? `주의: 현재 재고가 안전재고 이하이고 약 ${daysCoverText} 버틸 수준입니다. 리드타임은 ${item.leadTimeDays}일입니다.`
      : `주의: 현재 재고가 안전재고 이하이며 리드타임은 ${item.leadTimeDays}일입니다.`;
  }

  return Number.isFinite(recommendation.daysCover)
    ? `리드타임 동안 예상 수요는 ${recommendation.expectedNeed.toFixed(1)}${item.unit}이며, 현재 재고는 약 ${daysCoverText} 버틸 수 있습니다.`
    : `리드타임 동안 예상 수요는 ${recommendation.expectedNeed.toFixed(1)}${item.unit}이며 목표 재고는 ${recommendation.targetStock.toFixed(1)}${item.unit}입니다.`;
};

export default function OrderRecommendation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm ?? '');
  const [selectedVendor, setSelectedVendor] = useState(location.state?.vendorId ?? 'ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyNeedingOrder, setOnlyNeedingOrder] = useState(location.state?.onlyNeedingOrder ?? true);
  const [statusFilter, setStatusFilter] = useState(location.state?.statusFilter ?? 'ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'urgency', direction: 'desc' });
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    const refresh = () => {
      setItems(getItems().filter((item) => item.active));
      setVendors(getVendors());
    };

    refresh();
    window.addEventListener('mock-db-updated', refresh);
    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('mock-db-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const vendorsById = useMemo(
    () => vendors.reduce((acc, vendor) => ({ ...acc, [vendor.id]: vendor }), {}),
    [vendors]
  );

  const categories = useMemo(() => ['ALL', ...new Set(items.map((item) => item.category))], [items]);

  const recommendedData = useMemo(
    () =>
      items.map((item) => {
        const recommendation = calculateRecommendation(item);
        const isDanger = item.currentStock <= item.safetyStock * 0.5;
        const isWarning = item.currentStock <= item.safetyStock;
        const status = isDanger ? 'URGENT' : isWarning ? 'LOW_STOCK' : 'OK';
        const urgencyScore = (isDanger ? 3 : isWarning ? 2 : 1) + (recommendation.recommendedOrderQty > 0 ? 0.5 : 0);

        return {
          ...item,
          ...recommendation,
          status,
          statusLabel: isDanger ? '긴급' : isWarning ? '주의' : '안정',
          urgencyScore,
          reason: getReason(item, recommendation),
        };
      }),
    [items]
  );

  const filteredAndSortedData = useMemo(() => {
    const filtered = recommendedData
      .filter((item) => (onlyNeedingOrder ? item.recommendedOrderQty > 0 : true))
      .filter((item) => (selectedVendor === 'ALL' ? true : item.vendorId === selectedVendor))
      .filter((item) => (selectedCategory === 'ALL' ? true : item.category === selectedCategory))
      .filter((item) => (statusFilter === 'ALL' ? true : item.status === statusFilter))
      .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return [...filtered].sort((left, right) => {
      if (sortConfig.key === 'urgency') {
        return sortConfig.direction === 'asc' ? left.urgencyScore - right.urgencyScore : right.urgencyScore - left.urgencyScore;
      }
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' ? left.name.localeCompare(right.name) : right.name.localeCompare(left.name);
      }
      if (sortConfig.key === 'recommendedQty') {
        return sortConfig.direction === 'asc' ? left.recommendedOrderQty - right.recommendedOrderQty : right.recommendedOrderQty - left.recommendedOrderQty;
      }
      return 0;
    });
  }, [onlyNeedingOrder, recommendedData, searchTerm, selectedCategory, selectedVendor, sortConfig, statusFilter]);

  const selectedDraftCount = useMemo(
    () => filteredAndSortedData.filter((item) => (selectedItems[item.id] ?? item.recommendedOrderQty) > 0).length,
    [filteredAndSortedData, selectedItems]
  );

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc';
    setSortConfig({ key, direction });
  };

  const handleSelect = (id, qty) => {
    const safeQty = Number.isNaN(qty) || qty < 0 ? 0 : qty;
    setSelectedItems((prev) => ({ ...prev, [id]: safeQty }));
  };

  const createDraft = () => {
    const draftItems = filteredAndSortedData
      .map((item) => ({
        ...item,
        orderQty: selectedItems[item.id] ?? item.recommendedOrderQty,
      }))
      .filter((item) => item.orderQty > 0);

    if (draftItems.length === 0) {
      window.alert('발주 수량이 0보다 큰 상품을 하나 이상 선택하세요.');
      return;
    }

    sessionStorage.setItem('current_po_draft', JSON.stringify(draftItems));
    navigate('/draft');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="title-large">발주 추천</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            기존 추천 로직은 유지하고, 계산 근거를 더 쉽게 확인할 수 있도록 표시합니다.
          </p>
        </div>
        <button onClick={createDraft} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
          <ShoppingCart size={20} /> 발주서 초안 만들기 ({selectedDraftCount})
        </button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px', display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0 0.75rem', background: 'white' }}>
            <Search size={20} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="상품명 검색"
              className="form-input"
              style={{ border: 'none', boxShadow: 'none' }}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={onlyNeedingOrder}
              onChange={(event) => setOnlyNeedingOrder(event.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            발주 필요 상품만 보기
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Filter size={16} /> 거래처
          </span>
          {[{ id: 'ALL', name: '전체 거래처' }, ...vendors].map((vendor) => (
            <button
              key={vendor.id}
              onClick={() => setSelectedVendor(vendor.id)}
              className={`btn ${selectedVendor === vendor.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '50px' }}
            >
              {vendor.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Filter size={16} /> 분류
          </span>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '50px' }}
            >
              {category === 'ALL' ? '전체 분류' : category}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { value: 'ALL', label: '전체 상태' },
            { value: 'URGENT', label: '긴급' },
            { value: 'LOW_STOCK', label: '재고 부족' },
            { value: 'OK', label: '안정' },
          ].map((entry) => (
            <button
              key={entry.value}
              onClick={() => setStatusFilter(entry.value)}
              className={`btn ${statusFilter === entry.value ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '50px' }}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        <table style={{ textAlign: 'center', verticalAlign: 'middle' }}>
          <thead>
            <tr>
              <th>
                <button className="btn" style={{ background: 'none', border: 'none', padding: 0, fontWeight: 600 }} onClick={() => handleSort('urgency')}>
                  상태 <ArrowUpDown size={14} />
                </button>
              </th>
              <th style={{ textAlign: 'left' }}>
                <button className="btn" style={{ background: 'none', border: 'none', padding: 0, fontWeight: 600 }} onClick={() => handleSort('name')}>
                  상품명 <ArrowUpDown size={14} />
                </button>
              </th>
              <th>최근 7일 판매</th>
              <th>일평균 판매</th>
              <th>예상 소진일수</th>
              <th>예상 필요량</th>
              <th>목표 재고</th>
              <th>현재 재고</th>
              <th>
                <button className="btn" style={{ background: 'none', border: 'none', padding: 0, fontWeight: 600, color: 'var(--brand-primary)' }} onClick={() => handleSort('recommendedQty')}>
                  추천 발주량 <ArrowUpDown size={14} />
                </button>
              </th>
              <th style={{ textAlign: 'left' }}>추천 사유</th>
              <th>발주 수량</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((item) => {
              const badgeBackground = item.status === 'URGENT' ? 'var(--danger-bg)' : item.status === 'LOW_STOCK' ? '#FFFBEB' : '#ECFDF5';
              const badgeColor = item.status === 'URGENT' ? 'var(--danger-text)' : item.status === 'LOW_STOCK' ? '#92400E' : '#065F46';
              const selectedQty = selectedItems[item.id];
              const inputQty = selectedQty ?? item.recommendedOrderQty;
              const isSelected = inputQty > 0;

              return (
                <tr key={item.id} style={{ backgroundColor: isSelected ? 'var(--brand-light)' : 'transparent' }}>
                  <td>
                    <span style={{ backgroundColor: badgeBackground, color: badgeColor, padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', width: '72px' }}>
                      {item.statusLabel}
                    </span>
                  </td>
                  <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                    {item.name}
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                      {vendorsById[item.vendorId]?.name || '-'}
                    </span>
                  </td>
                  <td>{item.recent7dSalesTotal}</td>
                  <td>{item.avgDailySales.toFixed(1)}</td>
                  <td>{formatDaysCover(item.daysCover)}</td>
                  <td>{item.expectedNeed.toFixed(1)}</td>
                  <td>{item.targetStock.toFixed(1)}</td>
                  <td style={{ fontWeight: 600 }}>{item.currentStock} {item.unit}</td>
                  <td style={{ color: 'var(--brand-primary)', fontWeight: 'bold', fontSize: '1rem' }}>{item.recommendedOrderQty} {item.unit}</td>
                  <td style={{ textAlign: 'left', minWidth: '320px', color: 'var(--text-secondary)' }}>{item.reason}</td>
                  <td style={{ width: '150px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: '84px', textAlign: 'center', padding: '0.4rem', borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-color)', fontWeight: 'bold' }}
                        value={inputQty}
                        onChange={(event) => handleSelect(item.id, Number(event.target.value))}
                        step={item.moq}
                        min="0"
                      />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.unit}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredAndSortedData.length === 0 && (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  현재 필터 조건에 맞는 상품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
