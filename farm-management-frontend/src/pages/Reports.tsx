import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);

      switch (reportType) {
        case 'sales':
          await generateSalesReport(start, end);
          break;
        case 'staff':
          await generateStaffReport(start, end);
          break;
        case 'financial':
          await generateFinancialReport(start, end);
          break;
        case 'crop':
          await generateCropReport(start, end);
          break;
        case 'task':
          await generateTaskReport(start, end);
          break;
        case 'inventory':
          await generateInventoryReport();
          break;
        case 'labour':
          await generateLabourReport(start, end);
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
    setLoading(false);
  };

  const generateSalesReport = async (start: Date, end: Date) => {
    const snapshot = await getDocs(collection(db, 'financial'));
    const sales = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((t: any) => {
        const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return t.type === 'income' && date >= start && date <= end;
      });

    setReportData({
      type: 'sales',
      totalSales: sales.reduce((sum, s: any) => sum + s.amount, 0),
      totalTransactions: sales.length,
      sales: sales.sort((a: any, b: any) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      })
    });
  };

  const generateStaffReport = async (start: Date, end: Date) => {
    const labourSnapshot = await getDocs(collection(db, 'labour'));
    const labourRecords = labourSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((r: any) => {
        const date = r.date?.toDate ? r.date.toDate() : new Date(r.date);
        return date >= start && date <= end;
      });

    setReportData({
      type: 'staff',
      totalRecords: labourRecords.length,
      totalHours: labourRecords.reduce((sum, r: any) => sum + (r.hoursWorked || 0), 0),
      totalCost: labourRecords.reduce((sum, r: any) => sum + (r.totalPay || 0), 0),
      records: labourRecords.sort((a: any, b: any) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      })
    });
  };

  const generateFinancialReport = async (start: Date, end: Date) => {
    const snapshot = await getDocs(collection(db, 'financial'));
    const transactions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((t: any) => {
        const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return date >= start && date <= end;
      });

    const income = transactions.filter((t: any) => t.type === 'income').reduce((sum, t: any) => sum + t.amount, 0);
    const expenses = transactions.filter((t: any) => t.type === 'expense').reduce((sum, t: any) => sum + t.amount, 0);

    setReportData({
      type: 'financial',
      income,
      expenses,
      profit: income - expenses,
      transactions
    });
  };

  const generateCropReport = async (start: Date, end: Date) => {
    const snapshot = await getDocs(collection(db, 'crops'));
    const crops = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((c: any) => {
        const plantingDate = new Date(c.plantingDate);
        return plantingDate >= start && plantingDate <= end;
      });

    setReportData({
      type: 'crop',
      totalCrops: crops.length,
      planted: crops.filter((c: any) => c.status === 'planted').length,
      growing: crops.filter((c: any) => c.status === 'growing').length,
      harvested: crops.filter((c: any) => c.status === 'harvested').length,
      expectedYield: crops.reduce((sum, c: any) => sum + (c.expectedYield || 0), 0),
      crops
    });
  };

  const generateTaskReport = async (start: Date, end: Date) => {
    const snapshot = await getDocs(collection(db, 'tasks'));
    const tasks = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((t: any) => {
        const dueDate = t.dueDate?.toDate();
        return dueDate >= start && dueDate <= end;
      });

    setReportData({
      type: 'task',
      totalTasks: tasks.length,
      completed: tasks.filter((t: any) => t.status === 'completed').length,
      pending: tasks.filter((t: any) => t.status === 'pending').length,
      overdue: tasks.filter((t: any) => t.status === 'overdue').length,
      totalLabourCost: tasks.reduce((sum, t: any) => sum + (t.actualCost || t.labourCost || 0), 0),
      tasks
    });
  };

  const generateInventoryReport = async () => {
    const snapshot = await getDocs(collection(db, 'inventory'));
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    setReportData({
      type: 'inventory',
      totalItems: items.length,
      lowStock: items.filter((i: any) => i.quantity <= i.minQuantity).length,
      totalValue: items.reduce((sum, i: any) => sum + (i.quantity * i.unitPrice), 0),
      items
    });
  };

  const generateLabourReport = async (start: Date, end: Date) => {
    const snapshot = await getDocs(collection(db, 'tasks'));
    const tasks = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((t: any) => t.status === 'completed');

    const totalHours = tasks.reduce((sum, t: any) => sum + (t.actualHours || 0), 0);
    const totalCost = tasks.reduce((sum, t: any) => sum + (t.actualCost || 0), 0);

    setReportData({
      type: 'labour',
      totalHours,
      totalCost,
      averageHourlyRate: totalHours > 0 ? totalCost / totalHours : 0,
      tasks
    });
  };

  const downloadReport = () => {
    let headers: string[] = [];
    let csvData: any[] = [];
    let footer = '';

    switch (reportType) {
      case 'sales':
        headers = ['Date', 'Item/Commodity', 'Quantity', 'Unit Price', 'Total Amount', 'Payment Status', 'Remarks'];
        csvData = reportData.sales.map((sale: any) => {
          const date = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
          return [date.toLocaleDateString(), sale.item || '', sale.quantity || '', sale.unitPrice || '', sale.amount, sale.paymentStatus || '', sale.description || ''];
        });
        footer = `"TOTAL",,,,"${reportData.totalSales.toFixed(2)}",,"${reportData.sales.filter((s: any) => s.paymentStatus === 'No').length} pending"`;
        break;

      case 'staff':
        headers = ['Date', 'Worker Name', 'Activity', 'Time In', 'Time Out', 'Hours', 'Amount Payable', 'Frequency', 'Remarks'];
        csvData = reportData.records.map((record: any) => {
          const date = record.date?.toDate ? record.date.toDate() : new Date(record.date);
          return [date.toLocaleDateString(), record.workerName, record.workType, record.timeIn || '-', record.timeOut || '-', record.hoursWorked?.toFixed(1) + 'h', (record.totalPay || 0).toFixed(2), record.frequency || '-', record.remarks || '-'];
        });
        footer = `"TOTAL",,,,,"${reportData.totalHours.toFixed(1)}h","$${reportData.totalCost.toFixed(2)}",,`;
        break;

      case 'financial':
        headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];
        csvData = reportData.transactions.map((t: any) => {
          const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
          return [date.toLocaleDateString(), t.type, t.category || '', t.amount, t.description || ''];
        });
        footer = `"TOTAL INCOME",,,"${reportData.income.toFixed(2)}",\n"TOTAL EXPENSES",,,"${reportData.expenses.toFixed(2)}",\n"NET PROFIT",,,"${reportData.profit.toFixed(2)}",`;
        break;

      case 'crop':
        headers = ['Crop Name', 'Field', 'Planting Date', 'Expected Yield', 'Status'];
        csvData = reportData.crops.map((c: any) => [
          c.name, c.fieldName || '', new Date(c.plantingDate).toLocaleDateString(), c.expectedYield || '', c.status
        ]);
        footer = `"TOTAL CROPS","${reportData.totalCrops}",,,\n"EXPECTED YIELD","${reportData.expectedYield}",,,`;
        break;

      case 'task':
        headers = ['Task', 'Assigned To', 'Due Date', 'Status', 'Labour Cost'];
        csvData = reportData.tasks.map((t: any) => [
          t.type, t.assignedTo || '', t.dueDate?.toDate().toLocaleDateString() || '', t.status, (t.actualCost || t.labourCost || 0).toFixed(2)
        ]);
        footer = `"TOTAL TASKS","${reportData.totalTasks}",,,\n"TOTAL LABOUR COST","$${reportData.totalLabourCost.toFixed(2)}",,,`;
        break;

      case 'inventory':
        headers = ['Item Name', 'Category', 'Quantity', 'Unit Price', 'Total Value', 'Status'];
        csvData = reportData.items.map((i: any) => [
          i.name, i.category, i.quantity, i.unitPrice, (i.quantity * i.unitPrice).toFixed(2), i.quantity <= i.minQuantity ? 'Low Stock' : 'In Stock'
        ]);
        footer = `"TOTAL ITEMS","${reportData.totalItems}",,,\n"TOTAL VALUE","$${reportData.totalValue.toFixed(2)}",,,`;
        break;

      case 'labour':
        headers = ['Task', 'Assigned To', 'Hours', 'Cost'];
        csvData = reportData.tasks.map((t: any) => [
          t.type, t.assignedTo || '', (t.actualHours || 0).toFixed(1), (t.actualCost || 0).toFixed(2)
        ]);
        footer = `"TOTAL",,,"${reportData.totalHours.toFixed(1)}h","$${reportData.totalCost.toFixed(2)}"`;
        break;
    }

    const csvContent = [
      headers.join(','),
      ...csvData.map((row: any) => row.map((cell: any) => `"${cell}"`).join(',')),
      '',
      footer
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Generate Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Type</option>
              <option value="sales">Daily Sales Report</option>
              <option value="staff">Daily Staff Report</option>
              <option value="financial">Financial Report</option>
              <option value="crop">Crop Report</option>
              <option value="task">Task Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="labour">Labour Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <button
          onClick={generateReport}
          disabled={!reportType || !dateRange.start || !dateRange.end || loading}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {reportData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold capitalize">{reportData.type} Report</h2>
            <button
              onClick={downloadReport}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>

          {reportData.type === 'financial' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">${reportData.income.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">${reportData.expenses.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-blue-600">${reportData.profit.toFixed(2)}</p>
              </div>
            </div>
          )}

          {reportData.type === 'crop' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Crops</p>
                <p className="text-2xl font-bold">{reportData.totalCrops}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Planted</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.planted}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Growing</p>
                <p className="text-2xl font-bold text-yellow-600">{reportData.growing}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Harvested</p>
                <p className="text-2xl font-bold text-green-600">{reportData.harvested}</p>
              </div>
            </div>
          )}

          {reportData.type === 'task' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{reportData.totalTasks}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{reportData.completed}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{reportData.pending}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{reportData.overdue}</p>
              </div>
            </div>
          )}

          {reportData.type === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{reportData.totalItems}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{reportData.lowStock}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">${reportData.totalValue.toFixed(2)}</p>
              </div>
            </div>
          )}

          {reportData.type === 'labour' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold">{reportData.totalHours.toFixed(1)}h</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-blue-600">${reportData.totalCost.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg Hourly Rate</p>
                <p className="text-2xl font-bold text-green-600">${reportData.averageHourlyRate.toFixed(2)}/h</p>
              </div>
            </div>
          )}

          {reportData.type === 'staff' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-blue-600">{reportData.totalRecords}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-purple-600">{reportData.totalHours.toFixed(1)}h</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-orange-600">${reportData.totalCost.toFixed(2)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time In</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Out</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Payable</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.records.map((record: any) => {
                      const date = record.date?.toDate ? record.date.toDate() : new Date(record.date);
                      return (
                        <tr key={record.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{date.toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.workerName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.workType}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.timeIn || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.timeOut || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.hoursWorked?.toFixed(1)}h</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">${(record.totalPay || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.frequency || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              record.remarks === 'Done' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {record.remarks || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">TOTAL</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{reportData.totalHours.toFixed(1)}h</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">${reportData.totalCost.toFixed(2)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {reportData.type === 'sales' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">${reportData.totalSales.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">{reportData.totalTransactions}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item/Commodity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.sales.map((sale: any) => {
                      const date = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
                      return (
                        <tr key={sale.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{date.toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{sale.item || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{sale.quantity || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">${sale.unitPrice?.toFixed(2) || '-'}</td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600">${sale.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              sale.paymentStatus === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {sale.paymentStatus || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{sale.description || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">TOTAL</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">${reportData.totalSales.toFixed(2)}</td>
                      <td colSpan={2} className="px-4 py-3 text-sm text-gray-600">
                        {reportData.sales.filter((s: any) => s.paymentStatus === 'No').length > 0 && 
                          `${reportData.sales.filter((s: any) => s.paymentStatus === 'No').length} pending`
                        }
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
