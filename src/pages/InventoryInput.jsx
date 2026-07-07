import React, { useEffect, useMemo, useState } from 'react';
import { Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { getItems, saveItems, getVendors } from '../mockDb';

export default function InventoryInput() {
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [draft, setDraft] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveMessageType, setSaveMessageType] = useState('success');

  useEffect(() => {
    const activeItems = getItems().filter((item) => item.active);
    setItems(activeItems);
    setVendors(getVendors());

    const nextDraft = {};
    activeItems.forEach((item) => {
      nextDraft[item.id] = {
        currentStock: item.currentStock,
        recent7dSalesTotal: item.recent7dSalesTotal,
      };
    });
    setDraft(nextDraft);
  }, []);

  const changedCount = useMemo(
    () =>
      items.filter((item) => {
        const row = draft[item.id];
        return row && (row.currentStock !== item.currentStock || row.recent7dSalesTotal !== item.recent7dSalesTotal);
      }).length,
    [draft, items]
  );

  const handleChange = (id, field, value) => {
    if (value === '') {
      setDraft((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: '' },
      }));
      setHasChanges(true);
      setSaveMessage('');
      return;
    }

    const numValue = Number(value);
    if (Number.isNaN(numValue) || numValue < 0) {
      return;
    }

    setDraft((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: numValue },
    }));
    setHasChanges(true);
    setSaveMessage('');
  };

  const handleBulkSave = () => {
    for (const row of Object.values(draft)) {
      if (row.currentStock === '' || row.recent7dSalesTotal === '' || row.currentStock < 0 || row.recent7dSalesTotal < 0) {
        setSaveMessageType('error');
        setSaveMessage('모든 재고와 판매량은 0 이상으로 입력한 뒤 저장하세요.');
        return;
      }
    }

    const updatedItems = getItems().map((item) => {
      if (!draft[item.id]) {
        return item;
      }

      return {
        ...item,
        currentStock: Number(draft[item.id].currentStock),
        recent7dSalesTotal: Number(draft[item.id].recent7dSalesTotal),
      };
    });

    saveItems(updatedItems);
    const activeItems = updatedItems.filter((item) => item.active);
    setItems(activeItems);
    setHasChanges(false);
    setSaveMessageType('success');
    setSaveMessage(`${changedCount || activeItems.length}개 상품 변경사항을 저장했습니다.`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="title-large">재고 입력</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            표에서 바로 현재 재고와 최근 7일 판매량을 빠르게 수정하세요.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {saveMessage && (
            <span
              style={{
                color: saveMessageType === 'success' ? 'var(--success)' : 'var(--danger-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle size={18} /> {saveMessage}
            </span>
          )}
          <button
            id="save-btn"
            onClick={handleBulkSave}
            className={`btn ${hasChanges ? 'btn-primary' : 'btn-outline'}`}
            disabled={!hasChanges}
            style={{ opacity: hasChanges ? 1 : 0.6 }}
          >
            <Save size={18} /> 전체 저장
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="alert-danger" style={{ backgroundColor: '#FFFBEB', color: '#B45309', borderLeft: '4px solid #F59E0B' }}>
          <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem', marginBottom: '-3px' }} />
          저장되지 않은 변경 행이 {changedCount}개 있습니다.
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          수정된 행은 초록색으로 표시되며, 저장 즉시 앱 전체 계산에 반영됩니다.
        </div>
        <div className="table-wrapper">
          <table style={{ textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>상품명</th>
                <th style={{ textAlign: 'left' }}>분류</th>
                <th>거래처</th>
                <th style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}>현재 재고</th>
                <th style={{ backgroundColor: '#F8FAFC' }}>최근 7일 판매량</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const vendor = vendors.find((entry) => entry.id === item.vendorId);
                const row = draft[item.id] || {};
                const isDanger = Number(row.currentStock) <= item.safetyStock;
                const isStockChanged = row.currentStock !== item.currentStock;
                const isSalesChanged = row.recent7dSalesTotal !== item.recent7dSalesTotal;

                return (
                  <tr key={item.id} style={{ backgroundColor: isStockChanged || isSalesChanged ? '#F0FDF4' : 'transparent' }}>
                    <td style={{ textAlign: 'left', fontWeight: 500 }}>{item.name}</td>
                    <td style={{ textAlign: 'left', color: 'var(--text-muted)' }}>{item.category}</td>
                    <td>{vendor?.name || '-'}</td>
                    <td style={{ backgroundColor: isStockChanged ? '#D1FAE5' : '#EFF6FF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <input
                          type="number"
                          className="form-input"
                          style={{
                            width: '100px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            borderColor: isDanger ? 'var(--danger)' : isStockChanged ? '#059669' : 'var(--border-color)',
                            color: isDanger ? 'var(--danger)' : isStockChanged ? '#047857' : 'inherit',
                          }}
                          value={row.currentStock ?? 0}
                          min="0"
                          onChange={(event) => handleChange(item.id, 'currentStock', event.target.value)}
                        />
                        <span style={{ color: 'var(--text-secondary)' }}>{item.unit}</span>
                      </div>
                    </td>
                    <td style={{ backgroundColor: isSalesChanged ? '#D1FAE5' : '#F8FAFC' }}>
                      <input
                        type="number"
                        className="form-input"
                        style={{
                          width: '110px',
                          textAlign: 'center',
                          borderColor: isSalesChanged ? '#059669' : 'var(--border-color)',
                          color: isSalesChanged ? '#047857' : 'inherit',
                          fontWeight: isSalesChanged ? 'bold' : 'normal',
                        }}
                        value={row.recent7dSalesTotal ?? 0}
                        min="0"
                        onChange={(event) => handleChange(item.id, 'recent7dSalesTotal', event.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
