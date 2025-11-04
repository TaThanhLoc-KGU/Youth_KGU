import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCw, AlertCircle, Info, AlertTriangle, Bug } from 'lucide-react';
import logsService from '../../services/logsService';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { formatDateTime, formatTime } from '../../utils/dateFormat';
import { toast } from 'react-toastify';

const LogDetail = ({ log, isOpen, onClose }) => {
  if (!log) return null;

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return 'bg-red-50 border-red-200';
      case 'WARN': return 'bg-yellow-50 border-yellow-200';
      case 'INFO': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết Log" size="lg">
      <div className="space-y-4">
        <div className={`p-4 border rounded-lg ${getLevelColor(log.level)}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600">Level</p>
              <Badge variant={log.level === 'ERROR' ? 'danger' : 'info'}>{log.level}</Badge>
            </div>
            <div>
              <p className="text-xs text-gray-600">Module</p>
              <p className="font-medium">{log.module || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Timestamp</p>
              <p className="text-sm">{formatDateTime(log.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">User</p>
              <p className="text-sm">{log.userName || 'System'}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">MESSAGE</p>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono text-gray-900 break-words">
            {log.message}
          </div>
        </div>

        {log.details && (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">DETAILS</p>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono text-gray-900 max-h-48 overflow-auto">
              {JSON.stringify(log.details, null, 2)}
            </div>
          </div>
        )}

        {log.stackTrace && (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">STACK TRACE</p>
            <div className="bg-red-50 p-3 rounded text-xs font-mono text-red-900 max-h-48 overflow-auto whitespace-pre-wrap break-words">
              {log.stackTrace}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const Logs = () => {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: logsData = [], isLoading, refetch } = useQuery(
    ['logs', search, levelFilter, moduleFilter, statusFilter],
    async () => {
      const params = {};
      if (levelFilter) params.level = levelFilter;
      if (moduleFilter) params.module = moduleFilter;
      if (statusFilter) params.status = statusFilter;

      return logsService.getAll({ ...params, size: 100 });
    },
    { keepPreviousData: true }
  );

  const { data: stats = {} } = useQuery('logs-stats', () => logsService.getStatistics());

  const filteredLogs = search
    ? logsData.filter(log =>
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.module.toLowerCase().includes(search.toLowerCase())
      )
    : logsData;

  const handleExport = async () => {
    try {
      const blob = await logsService.exportToCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Xuất logs thành công');
    } catch (error) {
      toast.error('Lỗi xuất logs');
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'WARN': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'DEBUG': return <Bug className="w-4 h-4 text-purple-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getLevelBadgeVariant = (level) => {
    switch (level) {
      case 'ERROR': return 'danger';
      case 'WARN': return 'warning';
      case 'DEBUG': return 'info';
      default: return 'success';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs hệ thống</h1>
          <p className="text-gray-600 mt-1">Xem và theo dõi nhật ký hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="outline" icon={RefreshCw} onClick={() => refetch()}>
            Làm mới
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Tổng Logs</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Errors (24h)</p>
            <p className="text-2xl font-bold text-red-600">{stats.errors24h || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Warnings (24h)</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.warnings24h || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-xs text-gray-600">Logs (hôm nay)</p>
            <p className="text-2xl font-bold text-blue-600">{stats.logsToday || 0}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <SearchInput
              placeholder="Tìm kiếm message..."
              value={search}
              onSearch={setSearch}
              className="md:col-span-2"
            />
            <Select
              options={[
                { value: '', label: 'Tất cả levels' },
                { value: 'ERROR', label: 'ERROR' },
                { value: 'WARN', label: 'WARN' },
                { value: 'INFO', label: 'INFO' },
                { value: 'DEBUG', label: 'DEBUG' },
              ]}
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            />
            <Select
              options={[
                { value: '', label: 'Tất cả modules' },
                { value: 'AUTH', label: 'AUTH' },
                { value: 'SYSTEM', label: 'SYSTEM' },
                { value: 'API', label: 'API' },
              ]}
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            />
            <Button variant="outline" onClick={() => {
              setSearch('');
              setLevelFilter('');
              setModuleFilter('');
            }}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs List */}
      <Card>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Đang tải...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Không có logs</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedLog(log);
                    setIsDetailOpen(true);
                  }}
                  className="p-4 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getLevelIcon(log.level)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getLevelBadgeVariant(log.level)}>
                          {log.level}
                        </Badge>
                        <span className="text-xs text-gray-600 font-medium">{log.module}</span>
                        <span className="text-xs text-gray-500">
                          {formatTime(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 truncate">{log.message}</p>
                      {log.userName && (
                        <p className="text-xs text-gray-600 mt-1">User: {log.userName}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <LogDetail log={selectedLog} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
    </div>
  );
};

export default Logs;
