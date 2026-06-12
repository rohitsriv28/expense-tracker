import React from 'react';
import { X, RefreshCcw, Trash2, AlertTriangle } from 'lucide-react';
import { QueuedRequest } from '../../services/offlineSync';

export interface FailedSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  failedItems: QueuedRequest[];
  onRetry: () => void;
  onDiscard: () => void;
}

export default function FailedSyncModal({
  isOpen,
  onClose,
  failedItems,
  onRetry,
  onDiscard
}: FailedSyncModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Sync Failures</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
            The following offline changes failed to sync after multiple attempts. You can retry them or discard them.
          </p>
          <div className="space-y-3">
            {failedItems.map((item) => {
              const method = item.method.toUpperCase();
              let operation = 'Update';
              if (method === 'POST') operation = 'Create';
              if (method === 'DELETE') operation = 'Delete';
              
              const resource = item.url.split('/').filter(Boolean).pop() || 'Item';
              const name = resource.charAt(0).toUpperCase() + resource.slice(1);
              
              const amount = item.data?.amount ? `$${item.data.amount}` : '';
              const desc = item.data?.description || item.data?.name || item.url;
              
              return (
                <div key={item.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {operation} {name}
                    </span>
                    <span className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
                      Failed {item.retryCount}x
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 flex justify-between">
                    <span className="truncate mr-2">{desc}</span>
                    <span className="font-medium whitespace-nowrap">{amount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex gap-3 justify-end bg-gray-50 dark:bg-slate-800/50">
          <button
            onClick={() => { onDiscard(); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Discard All
          </button>
          <button
            onClick={() => { onRetry(); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry All
          </button>
        </div>
      </div>
    </div>
  );
}
