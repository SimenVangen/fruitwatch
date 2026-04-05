// src/components/dashboard/PriorityPanel.jsx
import React from 'react';
import FloatingPanel from './FloatingPanel';

export default function PriorityPanel({ priorities, onAction }) {
  const urgentItems = priorities.filter(p => p.priority === 'urgent');
  const attentionItems = priorities.filter(p => p.priority === 'attention');
  const monitorItems = priorities.filter(p => p.priority === 'monitor');

  return (
    <FloatingPanel 
      title="🚨 Today's Priorities" 
      position="top-right"
    >
      {/* Urgent Section */}
      {urgentItems.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ 
            color: '#DC2626', 
            fontWeight: 'bold', 
            fontSize: '0.8rem',
            marginBottom: '0.5rem'
          }}>
            🔥 URGENT ({urgentItems.length})
          </div>
          {urgentItems.map((item, index) => (
            <PriorityItem key={index} item={item} onAction={onAction} />
          ))}
        </div>
      )}

      {/* Attention Section */}
      {attentionItems.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ 
            color: '#D97706', 
            fontWeight: 'bold', 
            fontSize: '0.8rem',
            marginBottom: '0.5rem'
          }}>
            💧 ATTENTION NEEDED ({attentionItems.length})
          </div>
          {attentionItems.map((item, index) => (
            <PriorityItem key={index} item={item} onAction={onAction} />
          ))}
        </div>
      )}

      {/* Monitor Section */}
      {monitorItems.length > 0 && (
        <div>
          <div style={{ 
            color: '#059669', 
            fontWeight: 'bold', 
            fontSize: '0.8rem',
            marginBottom: '0.5rem'
          }}>
            👀 MONITOR ({monitorItems.length})
          </div>
          {monitorItems.map((item, index) => (
            <PriorityItem key={index} item={item} onAction={onAction} />
          ))}
        </div>
      )}
    </FloatingPanel>
  );
}

function PriorityItem({ item, onAction }) {
  return (
    <div style={{ 
      background: '#F9FAFB', 
      padding: '0.5rem', 
      borderRadius: '6px',
      marginBottom: '0.5rem',
      fontSize: '0.8rem'
    }}>
      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
        {item.title}
      </div>
      <div style={{ color: '#6B7280', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
        {item.description}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => onAction?.(item.action, item)}
          style={{
            background: '#10B981',
            color: 'white',
            border: 'none',
            padding: '0.25rem 0.75rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            cursor: 'pointer'
          }}
        >
          {item.actionLabel || 'View'}
        </button>
        {item.secondaryAction && (
          <button 
            onClick={() => onAction?.(item.secondaryAction, item)}
            style={{
              background: 'transparent',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              cursor: 'pointer'
            }}
          >
            Later
          </button>
        )}
      </div>
    </div>
  );
}