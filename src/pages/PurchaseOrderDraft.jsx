import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ClipboardCopy, CheckCircle, Package, ArrowLeft, Send, Truck } from 'lucide-react';
import { getVendors } from '../mockDb';

const downloadCsv = (filename, rows) => {
  const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function PurchaseOrderDraft() {
  const navigate = useNavigate();
  const [draftItems, setDraftItems] = useState([]);
  const [vendorsMap, setVendorsMap] = useState({});
  const [activeModalVendor, setActiveModalVendor] = useState(null);
  const [copiedVendorId, setCopiedVendorId] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('current_po_draft');
    if (saved) {
      setDraftItems(JSON.parse(saved));
    }

    const map = {};
    getVendors().forEach((vendor) => {
      map[vendor.id] = vendor;
    });
    setVendorsMap(map);
  }, []);

  const groupedByVendor = useMemo(() => {
    const groups = {};

    draftItems.forEach((item) => {
      if (!groups[item.vendorId]) {
        groups[item.vendorId] = [];
      }
      groups[item.vendorId].push(item);
    });

    return groups;
  }, [draftItems]);

  const buildOrderMessage = (vendorId, items) => {
    const vendor = vendorsMap[vendorId];
    const lines = [
      `[발주 요청] ${vendor?.name || '거래처'}`,
      `발주일: ${new Date().toLocaleDateString('ko-KR')}`,
      `마감시간: ${vendor?.cutoffTime || '-'}`,
      '',
      ...items.map((item, index) => `${index + 1}. ${item.name} - ${item.orderQty} ${item.unit}`),
      '',
      '재고 가능 여부와 납기 일정을 확인 부탁드립니다.',
    ];

    return lines.join('\n');
  };

  const handleCopyClipboard = async (vendorId, items) => {
    await navigator.clipboard.writeText(buildOrderMessage(vendorId, items));
    setCopiedVendorId(vendorId);
    window.setTimeout(() => setCopiedVendorId(''), 2000);
  };

  const handleDownloadCsv = (vendorId, items) => {
    const vendor = vendorsMap[vendorId];
    const rows = [
      ['거래처', '마감시간', '상품명', '추천 발주량', '단위'].join(','),
      ...items.map((item) =>
        [vendor?.name || '거래처', vendor?.cutoffTime || '-', `"${item.name}"`, item.orderQty, item.unit].join(',')
      ),
    ].join('\n');

    downloadCsv(`발주서초안-${vendor?.name || '거래처'}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleFinalize = () => {
    if (!activeModalVendor) {
      return;
    }

    const remaining = draftItems.filter((item) => item.vendorId !== activeModalVendor);
    setDraftItems(remaining);
    sessionStorage.setItem('current_po_draft', JSON.stringify(remaining));
    setActiveModalVendor(null);

    if (remaining.length === 0) {
      navigate('/');
    }
  };

  if (draftItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <Package size={64} style={{ margin: '0 auto 1.5rem', color: 'var(--border-color)' }} />
        <h2 className="title-medium" style={{ marginBottom: '1rem' }}>진행 중인 발주서 초안이 없습니다</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          추천 페이지에서 발주할 상품을 먼저 선택한 뒤, 여기서 거래처별 발주 메시지 복사 또는 CSV 내보내기를 진행하세요.
        </p>
        <button onClick={() => navigate('/recommendation')} className="btn btn-primary">
          <ArrowLeft size={18} /> 발주 추천으로 이동
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="title-large">발주서 초안</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            선택한 상품을 거래처별로 묶어 발주 메시지를 복사하거나 CSV로 내보낼 수 있습니다.
          </p>
        </div>
      </div>

      {Object.entries(groupedByVendor).map(([vendorId, items]) => {
        const vendor = vendorsMap[vendorId];
        const totalQty = items.reduce((sum, item) => sum + item.orderQty, 0);

        return (
          <div key={vendorId} className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 className="title-medium" style={{ color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Truck size={20} /> {vendor?.name || '미등록 거래처'}
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  마감시간: <strong style={{ color: 'var(--danger-text)' }}>{vendor?.cutoffTime || '-'}</strong>
                  {' | '}연락처: {vendor?.contact || '-'}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  상품 {items.length}개, 총 발주 수량 {totalQty}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {copiedVendorId === vendorId && (
                  <span style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>복사됨</span>
                )}
                <button onClick={() => handleCopyClipboard(vendorId, items)} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                  <ClipboardCopy size={16} /> 발주 메시지 복사
                </button>
                <button onClick={() => handleDownloadCsv(vendorId, items)} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                  <Download size={16} /> CSV 내보내기
                </button>
                <button onClick={() => setActiveModalVendor(vendorId)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  <CheckCircle size={16} /> 처리 완료
                </button>
              </div>
            </div>

            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#F8FAFC' }}>번호</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#F8FAFC' }}>상품명</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#F8FAFC' }}>추천 발주량</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#F8FAFC' }}>단위</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--brand-primary)', fontSize: '1.05rem' }}>{item.orderQty}</td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {activeModalVendor && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', margin: '2rem' }}>
            <h3 className="title-medium" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Send size={20} color="var(--brand-primary)" /> 발주 처리 완료 확인
            </h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong>{vendorsMap[activeModalVendor]?.name}</strong> 거래처 발주를 처리 완료로 표시하고 현재 초안에서 제거할까요? 이 작업은 목업 초안 상태만 변경합니다.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setActiveModalVendor(null)}>취소</button>
              <button className="btn btn-primary" onClick={handleFinalize}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
