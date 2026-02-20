import { AlertCircle } from 'lucide-react';
import Modal from '../../../common/Modal';
import Badge from '../../../common/Badge';

const ErrorDetailModal = ({ isOpen, onClose, errors = [] }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết lỗi" size="lg">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {errors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Không có lỗi</p>
          </div>
        ) : (
          errors.map((error, idx) => (
            <div key={idx} className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {error.maSo || `Lỗi #${idx + 1}`}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {error.message || error.error || 'Lỗi không xác định'}
                  </p>
                  {error.details && (
                    <details className="mt-2">
                      <summary className="text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-900">
                        Chi tiết kỹ thuật
                      </summary>
                      <pre className="mt-1 text-xs bg-white p-2 rounded border border-red-200 overflow-auto text-gray-700">
                        {typeof error.details === 'object'
                          ? JSON.stringify(error.details, null, 2)
                          : error.details}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Đóng
        </button>
      </div>
    </Modal>
  );
};

export default ErrorDetailModal;
