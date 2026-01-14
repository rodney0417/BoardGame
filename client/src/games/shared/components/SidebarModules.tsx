import React from 'react';
import { Button } from 'react-bootstrap';

export const SidebarSection: React.FC<{ title: string; children: React.ReactNode; isHost?: boolean }> = ({ title, children, isHost }) => (
  <div className="mb-4">
    <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
      <h6 className="text-muted small fw-bold m-0">{title}</h6>
      {isHost && <span className="badge bg-dark-subtle text-dark-emphasis border fw-normal" style={{ fontSize: '0.6rem' }}>房主控制</span>}
    </div>
    {children}
  </div>
);

export const SidebarStat: React.FC<{ label: string; value: string | number; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="d-flex align-items-center justify-content-between p-3 bg-white rounded-3 shadow-sm border mb-2">
    <span className="text-muted small fw-bold">{label}</span>
    <div className="d-flex align-items-center gap-2 bg-light px-3 py-1 rounded-pill border">
      {icon && <span style={{ fontSize: '1rem' }}>{icon}</span>}
      <span className="fw-bold text-dark small">{value}</span>
    </div>
  </div>
);

export const HostSettingControl: React.FC<{ 
  label: string; 
  options: number[]; 
  currentValue: number; 
  onSelect: (val: number) => void; 
  isHost: boolean;
  unit?: string;
}> = ({ label, options, currentValue, onSelect, isHost, unit = '' }) => (
  <div className="d-flex align-items-center justify-content-between mb-3">
    <span className="text-muted small fw-bold">{label}</span>
    <div className="d-flex gap-2">
      {options.map((val) => (
        <Button
          key={val}
          size="sm"
          variant={currentValue === val ? 'primary' : 'outline-secondary'}
          className={`${unit ? 'rounded-pill px-2' : 'rounded-circle p-0'} fw-bold`}
          style={{ width: unit ? 'auto' : '30px', height: unit ? 'auto' : '30px', minWidth: unit ? '45px' : '30px', cursor: isHost ? 'pointer' : 'default' }}
          onClick={() => isHost && onSelect(val)}
          disabled={!isHost && currentValue !== val}
        >
          {val}{unit}
        </Button>
      ))}
    </div>
  </div>
);
