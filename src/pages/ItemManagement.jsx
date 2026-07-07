import React, { useEffect, useState } from 'react';
import { getItems, saveItems, getVendors } from '../mockDb';
import { PackagePlus, Edit2, Check, X, Search } from 'lucide-react';

export default function ItemManagement() {
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setItems(getItems());
    setVendors(getVendors());
  }, []);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSave = () => {
    if (editForm.currentStock < 0 || editForm.safetyStock < 0 || editForm.moq <= 0 || editForm.leadTimeDays < 0) {
      window.alert('숫자 입력값을 확인하세요. 재고와 안전재고는 0 이상, MOQ는 1 이상이어야 합니다.');
      return;
    }

    const updated = items.map((item) => (item.id === editingId ? editForm : item));
    setItems(updated);
    saveItems(updated);
    setEditingId(null);
  };

  const handleChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNew = () => {
    const newItem = {
      id: `i${Date.now()}`,
      name: '신규 상품',
      sku: 'NEW-001',
      category: '미분류',
      vendorId: vendors[0]?.id || '',
      currentStock: 0,
      safetyStock: 0,
      leadTimeDays: 0,
      moq: 1,
      unit: '개',
      recent7dSalesTotal: 0,
      active: true,
    };
    const updated = [newItem, ...items];
    setItems(updated);
    saveItems(updated);
    handleEdit(newItem);
  };

  const filteredItems = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <h1 className="title-large">상품 관리</h1>
        <button onClick={handleAddNew} className="btn btn-primary">
          <PackagePlus size={18} /> 상품 추가
        </button>
      </div>

      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Search size={20} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="상품명 또는 SKU 검색"
          className="form-input"
          style={{ border: 'none', boxShadow: 'none', padding: 0 }}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>상태</th>
              <th>SKU</th>
              <th>상품명</th>
              <th>분류</th>
              <th>거래처</th>
              <th>재고 / 안전재고</th>
              <th>리드타임</th>
              <th>MOQ</th>
              <th>단위</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const isEditing = editingId === item.id;
              const vendor = vendors.find((entry) => entry.id === item.vendorId);

              if (isEditing) {
                return (
                  <tr key={item.id} style={{ background: 'var(--brand-light)' }}>
                    <td>
                      <select className="form-input" value={String(editForm.active)} onChange={(event) => handleChange('active', event.target.value === 'true')} style={{ padding: '0.2rem' }}>
                        <option value="true">사용</option>
                        <option value="false">미사용</option>
                      </select>
                    </td>
                    <td><input className="form-input" style={{ width: '90px', padding: '0.2rem' }} value={editForm.sku} onChange={(event) => handleChange('sku', event.target.value)} /></td>
                    <td><input className="form-input" style={{ width: '140px', padding: '0.2rem' }} value={editForm.name} onChange={(event) => handleChange('name', event.target.value)} /></td>
                    <td><input className="form-input" style={{ width: '100px', padding: '0.2rem' }} value={editForm.category} onChange={(event) => handleChange('category', event.target.value)} /></td>
                    <td>
                      <select className="form-input" value={editForm.vendorId} onChange={(event) => handleChange('vendorId', event.target.value)} style={{ padding: '0.2rem' }}>
                        {vendors.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', width: '120px' }}>
                        <input type="number" className="form-input" style={{ padding: '0.2rem' }} value={editForm.currentStock} onChange={(event) => handleChange('currentStock', Number(event.target.value))} />
                        <input type="number" className="form-input" style={{ padding: '0.2rem' }} value={editForm.safetyStock} onChange={(event) => handleChange('safetyStock', Number(event.target.value))} />
                      </div>
                    </td>
                    <td><input type="number" className="form-input" style={{ width: '70px', padding: '0.2rem' }} value={editForm.leadTimeDays} onChange={(event) => handleChange('leadTimeDays', Number(event.target.value))} /></td>
                    <td><input type="number" className="form-input" style={{ width: '70px', padding: '0.2rem' }} value={editForm.moq} onChange={(event) => handleChange('moq', Number(event.target.value))} /></td>
                    <td><input className="form-input" style={{ width: '70px', padding: '0.2rem' }} value={editForm.unit} onChange={(event) => handleChange('unit', event.target.value)} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleSave} className="btn" style={{ padding: '0.2rem 0.5rem', background: 'var(--success)', color: 'white' }}><Check size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }}><X size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={item.id} style={{ opacity: item.active ? 1 : 0.5 }}>
                  <td><span className={`badge ${item.active ? 'badge-success' : 'badge-neutral'}`}>{item.active ? '사용' : '미사용'}</span></td>
                  <td><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.sku}</span></td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{vendor?.name || '-'}</td>
                  <td>{item.currentStock} / <span style={{ color: 'var(--text-muted)' }}>{item.safetyStock}</span></td>
                  <td>{item.leadTimeDays}일</td>
                  <td>{item.moq}</td>
                  <td>{item.unit}</td>
                  <td>
                    <button onClick={() => handleEdit(item)} className="btn btn-outline" style={{ padding: '0.4rem 0.6rem' }}>
                      <Edit2 size={16} /> 수정
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
