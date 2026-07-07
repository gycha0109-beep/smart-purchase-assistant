import React, { useEffect, useState } from 'react';
import { getVendors, saveVendors } from '../mockDb';
import { Truck, Edit2, Check, X } from 'lucide-react';

export default function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setVendors(getVendors());
  }, []);

  const handleEdit = (vendor) => {
    setEditingId(vendor.id);
    setEditForm({ ...vendor });
  };

  const handleSave = () => {
    const updated = vendors.map((vendor) => (vendor.id === editingId ? editForm : vendor));
    setVendors(updated);
    saveVendors(updated);
    setEditingId(null);
  };

  const handleAddNew = () => {
    const newVendor = {
      id: `v${Date.now()}`,
      name: '신규 거래처',
      cutoffTime: '12:00',
      contact: '010-',
      notes: '',
    };
    const updated = [...vendors, newVendor];
    setVendors(updated);
    saveVendors(updated);
    handleEdit(newVendor);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="title-large">거래처 관리</h1>
        <button onClick={handleAddNew} className="btn btn-primary">
          <Truck size={18} /> 거래처 추가
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>거래처명</th>
              <th>발주 마감</th>
              <th>연락처</th>
              <th>메모</th>
              <th style={{ width: '150px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => {
              const isEditing = editingId === vendor.id;

              if (isEditing) {
                return (
                  <tr key={vendor.id} style={{ background: 'var(--brand-light)' }}>
                    <td><input className="form-input" style={{ padding: '0.4rem' }} value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></td>
                    <td><input type="time" className="form-input" style={{ padding: '0.4rem' }} value={editForm.cutoffTime} onChange={(event) => setEditForm({ ...editForm, cutoffTime: event.target.value })} /></td>
                    <td><input className="form-input" style={{ padding: '0.4rem' }} value={editForm.contact} onChange={(event) => setEditForm({ ...editForm, contact: event.target.value })} /></td>
                    <td><input className="form-input" style={{ padding: '0.4rem' }} value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleSave} className="btn" style={{ padding: '0.4rem 0.6rem', background: 'var(--success)', color: 'white' }}><Check size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.4rem 0.6rem' }}><X size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={vendor.id}>
                  <td style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{vendor.name}</td>
                  <td><span className="badge badge-warning">{vendor.cutoffTime}</span></td>
                  <td>{vendor.contact}</td>
                  <td><span style={{ color: 'var(--text-muted)' }}>{vendor.notes}</span></td>
                  <td>
                    <button onClick={() => handleEdit(vendor)} className="btn btn-outline" style={{ padding: '0.4rem 0.6rem' }}>
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
